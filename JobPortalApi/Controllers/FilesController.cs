using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FilesController> _logger;

        public FilesController(IWebHostEnvironment environment, ILogger<FilesController> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        [HttpGet("{containerName}/{fileName}")]
        [Authorize] // Require authentication to access files
        public async Task<IActionResult> GetFile(string containerName, string fileName)
        {
            try
            {
                var filePath = Path.Combine(_environment.ContentRootPath, "Uploads", containerName, fileName);
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound("File not found");
                }

                // Get the file content type
                var provider = new FileExtensionContentTypeProvider();
                if (!provider.TryGetContentType(filePath, out var contentType))
                {
                    contentType = "application/octet-stream";
                }

                // Read the file and return it
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving file: {containerName}/{fileName}", containerName, fileName);
                return StatusCode(500, "An error occurred while retrieving the file");
            }
        }

        [HttpGet("download/{token}")]
        [AllowAnonymous] // Allow anonymous access with valid token
        public async Task<IActionResult> DownloadWithToken(string token)
        {
            try
            {
                var filePath = JobPortalApi.Services.DownloadTokenCache.GetFilePath(token);
                
                if (filePath == null)
                {
                    return NotFound("Invalid or expired download token");
                }

                var fullPath = Path.Combine(_environment.ContentRootPath, "Uploads", "resumes", filePath);
                
                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound("File not found");
                }

                // Get the file content type
                var provider = new FileExtensionContentTypeProvider();
                if (!provider.TryGetContentType(fullPath, out var contentType))
                {
                    contentType = "application/octet-stream";
                }

                // Read the file and return it
                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
                
                return File(fileBytes, contentType, Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving file with token: {token}", token);
                return StatusCode(500, "An error occurred while retrieving the file");
            }
        }
    }
}