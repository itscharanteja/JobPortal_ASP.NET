using Microsoft.AspNetCore.Identity;

namespace JobPortalApi.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Resume { get; set; }  // URL to stored resume
        public UserType UserType { get; set; }
        
        // Navigation properties
        public virtual ICollection<Job> PostedJobs { get; set; } = new List<Job>();
        public virtual ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    }

    public enum UserType
    {
        JobSeeker,
        Recruiter,
        Admin
    }
}