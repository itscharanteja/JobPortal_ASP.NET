using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Http;

namespace JobPortalApi.Services
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(IFormFile file, string containerName);
        Task DeleteFileAsync(string fileUrl, string containerName);
        Task<string> GetFileUrlWithSasToken(string blobPath, string containerName);
    }

    public class AzureBlobStorageService : IFileStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly ILogger<AzureBlobStorageService> _logger;
        private readonly string _storageAccountName;
        private readonly string _storageAccountKey;

        public AzureBlobStorageService(
            BlobServiceClient blobServiceClient,
            IConfiguration configuration,
            ILogger<AzureBlobStorageService> logger)
        {
            _blobServiceClient = blobServiceClient;
            _logger = logger;
            
            // Get storage account credentials from configuration
            _storageAccountName = configuration["AzureStorage:AccountName"] 
                ?? throw new ArgumentNullException("AzureStorage:AccountName", "Storage account name is not configured");
            _storageAccountKey = configuration["AzureStorage:AccountKey"] 
                ?? throw new ArgumentNullException("AzureStorage:AccountKey", "Storage account key is not configured");
        }

        public async Task<string> UploadFileAsync(IFormFile file, string containerName)
        {
            try
            {
                _logger.LogInformation($"Attempting to upload file. Name: {file.FileName}, Size: {file.Length}, Container: {containerName}");
                
                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                _logger.LogInformation($"Getting container client for: {containerName}");
                
                var exists = await containerClient.ExistsAsync();
                _logger.LogInformation($"Container exists: {exists.Value}");
                
                if (!exists.Value)
                {
                    _logger.LogInformation("Creating container...");
                    await containerClient.CreateAsync();
                }

                // Create a unique file name
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                _logger.LogInformation($"Generated blob name: {fileName}");
                
                var blobClient = containerClient.GetBlobClient(fileName);
                _logger.LogInformation($"Blob URI: {blobClient.Uri}");

                // Open the file and upload its data
                using var stream = file.OpenReadStream();
                _logger.LogInformation("Starting file upload...");
                
                await blobClient.UploadAsync(stream, new BlobHttpHeaders
                {
                    ContentType = file.ContentType
                });
                
                _logger.LogInformation("File upload completed successfully");
                
                // Return URL with SAS token
                return await GetFileUrlWithSasToken(fileName, containerName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to blob storage: {ErrorMessage}", ex.Message);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {ErrorMessage}", ex.InnerException.Message);
                }
                throw;
            }
        }

        public async Task DeleteFileAsync(string fileUrl, string containerName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                var uri = new Uri(fileUrl);
                var fileName = Path.GetFileName(uri.LocalPath);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                await blobClient.DeleteIfExistsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file from blob storage");
                throw;
            }
        }

        public async Task<string> GetFileUrlWithSasToken(string blobPath, string containerName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                var blobClient = containerClient.GetBlobClient(blobPath);
                
                // Verify that the blob exists
                var exists = await blobClient.ExistsAsync();
                if (!exists)
                {
                    throw new FileNotFoundException($"File {blobPath} not found in container {containerName}");
                }

                // Create a SAS token that's valid for 24 hours
                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = containerName,
                    BlobName = blobPath,
                    Resource = "b", // b for blob
                    StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5), // Allow for clock skew
                    ExpiresOn = DateTimeOffset.UtcNow.AddHours(24)
                };

                // Set read permissions
                sasBuilder.SetPermissions(BlobSasPermissions.Read);

                // Create storage credential using account name and key
                var storageSharedKeyCredential = new Azure.Storage.StorageSharedKeyCredential(
                    _storageAccountName,
                    _storageAccountKey
                );

                // Generate the SAS token using the shared key credential
                var sasToken = sasBuilder.ToSasQueryParameters(storageSharedKeyCredential).ToString();

                // Combine the blob URL with the SAS token
                return $"{blobClient.Uri}?{sasToken}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating SAS token for blob");
                throw;
            }
        }
    }
}