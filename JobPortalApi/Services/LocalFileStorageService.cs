using Microsoft.AspNetCore.Http;

namespace JobPortalApi.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<LocalFileStorageService> _logger;

        public LocalFileStorageService(
            IWebHostEnvironment environment,
            ILogger<LocalFileStorageService> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string containerName)
        {
            var uploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", containerName);
            Directory.CreateDirectory(uploadPath); // Ensure directory exists

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return fileName;
        }

        public Task DeleteFileAsync(string fileUrl, string containerName)
        {
            var filePath = Path.Combine(_environment.ContentRootPath, "Uploads", containerName, fileUrl);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return Task.CompletedTask;
        }

        public Task<string> GetFileUrlWithSasToken(string blobPath, string containerName)
        {
            // For local storage, we'll return a full URL to access the file through a local endpoint
            var baseUrl = "http://localhost:5000/api/files"; // Full URL for browser access
            return Task.FromResult($"{baseUrl}/{containerName}/{blobPath}");
        }
    }
}