using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using JobPortalApi.Data;
using JobPortalApi.Models;
using JobPortalApi.Services;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<AdminController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IFileStorageService _fileStorageService;

        public AdminController(
            ApplicationDbContext db,
            ILogger<AdminController> logger,
            UserManager<ApplicationUser> userManager,
            IFileStorageService fileStorageService)
        {
            _db = db;
            _logger = logger;
            _userManager = userManager;
            _fileStorageService = fileStorageService;
        }

        [HttpGet("jobseekers")]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        public async Task<ActionResult> GetJobSeekers()
        {
            try
            {
                var jobSeekers = await _userManager.GetUsersInRoleAsync("JobSeeker");
                
                var jobSeekerData = new List<object>();
                
                foreach (var user in jobSeekers)
                {
                    // Get application count for each job seeker
                    var applicationCount = await _db.JobApplications
                        .Where(ja => ja.ApplicantId == user.Id)
                        .CountAsync();

                    jobSeekerData.Add(new
                    {
                        id = user.Id,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        hasResume = !string.IsNullOrEmpty(user.Resume),
                        applicationCount = applicationCount
                    });
                }

                return Ok(jobSeekerData.OrderBy(js => ((dynamic)js).firstName));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving job seekers");
                return StatusCode(500, "An error occurred while retrieving job seekers");
            }
        }

        [HttpGet("jobseekers/{userId}/resume/download")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult> DownloadJobSeekerResume(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return NotFound("User not found");

                if (string.IsNullOrEmpty(user.Resume))
                    return NotFound("User has no resume");

                // Generate a temporary download token (valid for 5 minutes)
                var downloadToken = Guid.NewGuid().ToString();
                var tokenExpiry = DateTime.UtcNow.AddMinutes(5);
                
                // Store token in cache/memory
                DownloadTokenCache.AddToken(downloadToken, user.Resume, tokenExpiry);
                
                var downloadUrl = $"http://localhost:5000/api/files/download/{downloadToken}";
                
                return Ok(new { downloadUrl, fileName = Path.GetFileName(user.Resume) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading job seeker resume for user {UserId}", userId);
                return StatusCode(500, "An error occurred while downloading the resume");
            }
        }

        [HttpGet("jobs")]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        public async Task<ActionResult> GetAdminJobs()
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (adminId == null) return Unauthorized();

                var jobs = await _db.Jobs
                    .Where(j => j.PostedById == adminId)
                    .Select(j => new
                    {
                        j.Id,
                        j.Title,
                        j.CompanyName,
                        j.Location,
                        j.Salary,
                        j.JobType,
                        j.ExperienceLevel,
                        j.Status,
                        j.CreatedAt,
                        j.UpdatedAt,
                        ApplicationCount = _db.JobApplications.Count(ja => ja.JobId == j.Id)
                    })
                    .OrderByDescending(j => j.CreatedAt)
                    .ToListAsync();

                return Ok(jobs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin jobs");
                return StatusCode(500, "An error occurred while retrieving jobs");
            }
        }

        [HttpGet("jobs/{jobId}/applicants")]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult> GetJobApplicants(int jobId)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (adminId == null) return Unauthorized();

                // Verify the job belongs to the admin
                var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.PostedById == adminId);
                if (job == null)
                    return NotFound("Job not found or access denied");

                var applicants = await _db.JobApplications
                    .Where(ja => ja.JobId == jobId)
                    .Include(ja => ja.Applicant)
                    .Select(ja => new
                    {
                        applicationId = ja.Id,
                        jobSeekerId = ja.ApplicantId,
                        jobSeekerName = $"{ja.Applicant.FirstName} {ja.Applicant.LastName}",
                        jobSeekerEmail = ja.Applicant.Email,
                        hasResume = !string.IsNullOrEmpty(ja.Applicant.Resume),
                        resumeFileName = ja.Applicant.Resume,
                        appliedDate = ja.ApplicationDate,
                        status = ja.Status,
                        coverLetter = ja.CoverLetter
                    })
                    .OrderByDescending(a => a.appliedDate)
                    .ToListAsync();

                return Ok(applicants);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving job applicants for job {JobId}", jobId);
                return StatusCode(500, "An error occurred while retrieving applicants");
            }
        }
    }
}