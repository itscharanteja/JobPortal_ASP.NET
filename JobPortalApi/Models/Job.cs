using System.ComponentModel.DataAnnotations;

namespace JobPortalApi.Models
{
    public class Job
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Company { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Location { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required]
        public decimal Salary { get; set; }

        public DateTime PostedDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public bool IsActive { get; set; }

        // Navigation properties
        public string? RecruiterId { get; set; }
        public virtual ApplicationUser? Recruiter { get; set; }
        public virtual ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    }
}