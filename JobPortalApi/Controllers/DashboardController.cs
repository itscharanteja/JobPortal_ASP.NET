using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalApi.Data;
using JobPortalApi.Models;
using JobPortalApi.DTOs;
using System.Security.Claims;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(
            ApplicationDbContext db,
            ILogger<DashboardController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var userId = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return BadRequest("User ID not found");

                var userRoles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
                var isJobSeeker = userRoles.Contains("JobSeeker");
                var isRecruiter = userRoles.Contains("Recruiter");
                var isAdmin = userRoles.Contains("Admin");

                var stats = new DashboardStatsDTO
                {
                    ApplicationsByStatus = new Dictionary<string, int>(),
                    RecentActivities = new List<RecentActivityDTO>()
                };

                if (isJobSeeker)
                {
                    // Get job seeker statistics
                    var applications = await _db.JobApplications
                        .Where(ja => ja.ApplicantId == userId)
                        .ToListAsync();

                    stats.TotalJobsApplied = applications.Count;
                    stats.JobsUnderReview = applications.Count(a => a.Status == ApplicationStatus.UnderReview);
                    stats.JobsShortlisted = applications.Count(a => a.Status == ApplicationStatus.Shortlisted);
                    stats.JobsRejected = applications.Count(a => a.Status == ApplicationStatus.Rejected);

                    // Get application counts by status
                    stats.ApplicationsByStatus = applications
                        .GroupBy(a => a.Status.ToString())
                        .ToDictionary(g => g.Key, g => g.Count());

                    // Get recent activities
                    stats.RecentActivities = await _db.JobApplications
                        .Where(ja => ja.ApplicantId == userId)
                        .OrderByDescending(ja => ja.ApplicationDate)
                        .Take(5)
                        .Select(ja => new RecentActivityDTO
                        {
                            ActivityType = "Applied",
                            Description = $"Applied for {ja.Job.Title}",
                            Timestamp = ja.ApplicationDate,
                            JobTitle = ja.Job.Title,
                            CompanyName = ja.Job.CompanyName
                        })
                        .ToListAsync();
                }

                if (isRecruiter)
                {
                    // Get recruiter statistics
                    var postedJobs = await _db.Jobs
                        .Where(j => j.PostedById == userId)
                        .ToListAsync();

                    stats.TotalJobsPosted = postedJobs.Count;
                    stats.TotalActiveJobs = postedJobs.Count(j => j.Status == JobStatus.Open);

                    // Get application counts for posted jobs
                    var applications = await _db.JobApplications
                        .Where(ja => postedJobs.Select(j => j.Id).Contains(ja.JobId))
                        .ToListAsync();

                    stats.ApplicationsByStatus = applications
                        .GroupBy(a => a.Status.ToString())
                        .ToDictionary(g => g.Key, g => g.Count());

                    // Get recent activities for posted jobs
                    stats.RecentActivities = await _db.JobApplications
                        .Where(ja => postedJobs.Select(j => j.Id).Contains(ja.JobId))
                        .OrderByDescending(ja => ja.ApplicationDate)
                        .Take(5)
                        .Select(ja => new RecentActivityDTO
                        {
                            ActivityType = "NewApplication",
                            Description = $"New application for {ja.Job.Title}",
                            Timestamp = ja.ApplicationDate,
                            JobTitle = ja.Job.Title,
                            CompanyName = ja.Job.CompanyName
                        })
                        .ToListAsync();
                }

                if (isAdmin)
                {
                    // Get admin statistics
                    stats.TotalJobsPosted = await _db.Jobs.CountAsync();
                    stats.TotalActiveJobs = await _db.Jobs.CountAsync(j => j.Status == JobStatus.Open);

                    var allApplications = await _db.JobApplications.ToListAsync();
                    stats.TotalJobsApplied = allApplications.Count;
                    stats.JobsUnderReview = allApplications.Count(a => a.Status == ApplicationStatus.UnderReview);
                    stats.JobsShortlisted = allApplications.Count(a => a.Status == ApplicationStatus.Shortlisted);
                    stats.JobsRejected = allApplications.Count(a => a.Status == ApplicationStatus.Rejected);

                    // Get application counts by status
                    stats.ApplicationsByStatus = allApplications
                        .GroupBy(a => a.Status.ToString())
                        .ToDictionary(g => g.Key, g => g.Count());

                    // Get recent activities
                    stats.RecentActivities = await _db.JobApplications
                        .OrderByDescending(ja => ja.ApplicationDate)
                        .Take(5)
                        .Select(ja => new RecentActivityDTO
                        {
                            ActivityType = "NewApplication",
                            Description = $"New application for {ja.Job.Title}",
                            Timestamp = ja.ApplicationDate,
                            JobTitle = ja.Job.Title,
                            CompanyName = ja.Job.CompanyName
                        })
                        .ToListAsync();
                }

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                return StatusCode(500, "An error occurred while getting dashboard statistics");
            }
        }
    }
}