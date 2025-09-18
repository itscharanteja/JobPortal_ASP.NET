using System.ComponentModel.DataAnnotations;

namespace JobPortalApi.Models
{
    public class JobApplication
    {
        public int Id { get; set; }

        [Required]
        public int JobId { get; set; }
        public virtual Job Job { get; set; } = null!;

        [Required]
        public string ApplicantId { get; set; } = string.Empty;
        public virtual ApplicationUser Applicant { get; set; } = null!;

        public DateTime ApplicationDate { get; set; }
        
        public string? CoverLetter { get; set; }
        public string? ResumeUrl { get; set; }

        public ApplicationStatus Status { get; set; }
        public string? Notes { get; set; }
    }

    public enum ApplicationStatus
    {
        Submitted,
        UnderReview,
        Shortlisted,
        InterviewScheduled,
        Accepted,
        Rejected
    }
}