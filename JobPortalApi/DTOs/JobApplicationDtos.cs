using System.ComponentModel.DataAnnotations;
using JobPortalApi.Models;

namespace JobPortalApi.DTOs
{
    public class JobApplicationResponse
    {
        public int Id { get; set; }
        public int JobId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string ApplicantId { get; set; } = string.Empty;
        public string ApplicantName { get; set; } = string.Empty;
        public string ApplicantEmail { get; set; } = string.Empty;
        public DateTime ApplicationDate { get; set; }
        public string? CoverLetter { get; set; }
        public string? ResumeUrl { get; set; }
        public ApplicationStatus Status { get; set; }
        public string? Notes { get; set; }

        public static JobApplicationResponse FromJobApplication(JobApplication application)
        {
            return new JobApplicationResponse
            {
                Id = application.Id,
                JobId = application.JobId,
                JobTitle = application.Job?.Title ?? string.Empty,
                ApplicantId = application.ApplicantId,
                ApplicantName = $"{application.Applicant?.FirstName} {application.Applicant?.LastName}".Trim(),
                ApplicantEmail = application.Applicant?.Email ?? string.Empty,
                ApplicationDate = application.ApplicationDate,
                CoverLetter = application.CoverLetter,
                ResumeUrl = application.ResumeUrl,
                Status = application.Status,
                Notes = application.Notes
            };
        }
    }

    public class JobApplicationsListResponse
    {
        public int JobId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public List<JobApplicationResponse> Applications { get; set; } = new List<JobApplicationResponse>();
        public int TotalCount { get; set; }
    }

    public class CreateJobApplicationRequest
    {
        public string? CoverLetter { get; set; }
        public string? ResumeUrl { get; set; }
    }

    public class UpdateApplicationStatusRequest
    {
        [Required]
        public ApplicationStatus Status { get; set; }

        public string? Notes { get; set; }
    }
}