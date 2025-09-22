using Microsoft.AspNetCore.Http;
using JobPortalApi.Data;
using Microsoft.EntityFrameworkCore;

namespace JobPortalApi.Services
{
    public class DatabaseFileStorageService : IFileStorageService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DatabaseFileStorageService> _logger;

        public class FileData
        {
            public int Id { get; set; }
            public required string FileName { get; set; }
            public required string ContentType { get; set; }
            public required byte[] Content { get; set; }
            public required string Container { get; set; }
        }

        public DatabaseFileStorageService(
            ApplicationDbContext context,
            ILogger<DatabaseFileStorageService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string containerName)
        {
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);

            var fileData = new FileData
            {
                FileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}",
                ContentType = file.ContentType,
                Content = memoryStream.ToArray(),
                Container = containerName
            };

            _context.Set<FileData>().Add(fileData);
            await _context.SaveChangesAsync();

            return fileData.FileName;
        }

        public async Task DeleteFileAsync(string fileUrl, string containerName)
        {
            var file = await _context.Set<FileData>()
                .FirstOrDefaultAsync(f => f.FileName == fileUrl && f.Container == containerName);

            if (file != null)
            {
                _context.Set<FileData>().Remove(file);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<string> GetFileUrlWithSasToken(string blobPath, string containerName)
        {
            var file = await _context.Set<FileData>()
                .FirstOrDefaultAsync(f => f.FileName == blobPath && f.Container == containerName);

            if (file == null)
            {
                throw new FileNotFoundException($"File {blobPath} not found in container {containerName}");
            }

            // For database storage, we'll return a URL to an API endpoint that can serve the file
            var baseUrl = "api/files"; // You'll need to implement this endpoint
            return $"{baseUrl}/{containerName}/{file.FileName}";
        }
    }
}