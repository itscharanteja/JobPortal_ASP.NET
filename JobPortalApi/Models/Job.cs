using System.ComponentModel.DataAnnotations;

namespace JobPortalApi.Models
{
    public enum JobType
    {
        FullTime,
        PartTime,
        Contract,
        Internship,
        Temporary
    }

    public enum ExperienceLevel
    {
        EntryLevel,
        MidLevel,
        SeniorLevel,
        Director,
        Executive
    }

    public enum JobStatus
    {
        Open,
        Closed,
        OnHold,
        Cancelled,
        Filled
    }

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
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Location { get; set; } = string.Empty;

        [Required]
        public JobType JobType { get; set; }

        [Required]
        public ExperienceLevel ExperienceLevel { get; set; }

        [Required]
        public decimal Salary { get; set; }

        public List<string> RequiredSkills { get; set; } = new List<string>();

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public JobStatus Status { get; set; } = JobStatus.Open;

        public string PostedById { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual ApplicationUser? Recruiter { get; set; }
        public virtual ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    }
}