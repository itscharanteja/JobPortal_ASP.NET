using System.ComponentModel.DataAnnotations;
using JobPortalApi.Models;

namespace JobPortalApi.DTOs
{
    public class CreateJobRequest
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        public string Location { get; set; } = string.Empty;

        [Required]
        public decimal Salary { get; set; }

        [Required]
        public JobType JobType { get; set; }

        [Required]
        public ExperienceLevel ExperienceLevel { get; set; }

        public List<string> RequiredSkills { get; set; } = new List<string>();
    }

    public class JobResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal Salary { get; set; }
        public JobType JobType { get; set; }
        public ExperienceLevel ExperienceLevel { get; set; }
        public List<string> RequiredSkills { get; set; } = new List<string>();
        public string PostedById { get; set; } = string.Empty;
        public string PostedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public JobStatus Status { get; set; }

        public static JobResponse FromJob(Job job)
        {
            return new JobResponse
            {
                Id = job.Id,
                Title = job.Title,
                Description = job.Description,
                CompanyName = job.CompanyName,
                Location = job.Location,
                Salary = job.Salary,
                JobType = job.JobType,
                ExperienceLevel = job.ExperienceLevel,
                RequiredSkills = job.RequiredSkills,
                PostedById = job.PostedById,
                PostedByName = job.Recruiter?.FirstName + " " + job.Recruiter?.LastName,
                CreatedAt = job.CreatedAt,
                UpdatedAt = job.UpdatedAt,
                Status = job.Status
            };
        }
    }

    public class UpdateJobStatusRequest
    {
        [Required]
        public JobStatus Status { get; set; }
    }
}