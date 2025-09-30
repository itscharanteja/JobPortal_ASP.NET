using System.ComponentModel.DataAnnotations;

namespace JobPortalApi.Models
{
    public class FileData
    {
        public int Id { get; set; }
        
        [Required]
        public required string FileName { get; set; }
        
        [Required]
        public required string ContentType { get; set; }
        
        [Required]
        public required byte[] Content { get; set; }
        
        [Required]
        public required string Container { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}