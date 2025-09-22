using System;
using System.IO;
using System.Threading.Tasks;
using System.Security.Claims;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using JobPortalApi.Data;
using JobPortalApi.Models;
using JobPortalApi.Services;
using JobPortalApi.DTOs;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/jobseeker")]
    [Authorize(Roles = "JobSeeker")]
    public class JobSeekerController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<JobSeekerController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IFileStorageService _fileStorageService;

        public JobSeekerController(
            ApplicationDbContext db,
            ILogger<JobSeekerController> logger,
            UserManager<ApplicationUser> userManager,
            IFileStorageService fileStorageService)
        {
            _db = db;
            _logger = logger;
            _userManager = userManager;
            _fileStorageService = fileStorageService;
        }

        [HttpPost("resume")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> UploadResume(IFormFile file)
        {
            try
            {
                _logger.LogInformation($"User attempting to upload resume. IsAuthenticated: {User.Identity?.IsAuthenticated}");
                _logger.LogInformation($"User claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}: {c.Value}"))}");
                _logger.LogInformation($"User roles: {string.Join(", ", User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value))}");
                _logger.LogInformation($"File info - Name: {file?.FileName}, Length: {file?.Length}, Content Type: {file?.ContentType}");

                if (file == null || file.Length == 0)
                    return BadRequest("Please provide a resume file");

                // Validate file type
                var allowedTypes = new[] { "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
                if (!allowedTypes.Contains(file.ContentType))
                    return BadRequest("Only PDF and Word documents are allowed");

                // Get current user
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return NotFound("User not found");

                // Delete existing resume if present
                if (!string.IsNullOrEmpty(user.Resume))
                {
                    await _fileStorageService.DeleteFileAsync(user.Resume, "resumes");
                }

                // Upload file
                var blobName = await _fileStorageService.UploadFileAsync(file, "resumes");

                // Update user's resume field
                user.Resume = blobName;
                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                    return StatusCode(500, "Failed to update user profile");

                return Ok(new { message = "Resume uploaded successfully", fileName = blobName });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading resume: {ErrorMessage}, Stack trace: {StackTrace}", ex.Message, ex.StackTrace);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {ErrorMessage}, Stack trace: {StackTrace}", 
                        ex.InnerException.Message, ex.InnerException.StackTrace);
                }
                return StatusCode(500, $"An error occurred while uploading the resume: {ex.Message}");
            }
        }

        [HttpPost("{jobId}/apply")]
        [ProducesResponseType(typeof(JobApplicationResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<JobApplicationResponse>> ApplyForJob(int jobId, [FromBody] CreateJobApplicationRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // Check if user has uploaded a resume
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || string.IsNullOrEmpty(user.Resume))
                {
                    return BadRequest("Please upload your resume before applying for jobs");
                }

                // Check if job exists
                var job = await _db.Jobs
                    .FirstOrDefaultAsync(j => j.Id == jobId);

                if (job == null)
                {
                    return NotFound("Job not found");
                }

                if (job.Status != JobStatus.Open)
                {
                    return BadRequest("This job is no longer accepting applications");
                }

                // Check if user has already applied
                var existingApplication = await _db.JobApplications
                    .FirstOrDefaultAsync(a => a.JobId == jobId && a.ApplicantId == userId);

                if (existingApplication != null)
                {
                    return BadRequest("You have already applied for this job");
                }

                var application = new JobApplication
                {
                    JobId = jobId,
                    ApplicantId = userId,
                    ApplicationDate = DateTime.UtcNow,
                    CoverLetter = request.CoverLetter,
                    ResumeUrl = user.Resume,  // Add the resume URL from user profile
                    Status = ApplicationStatus.Submitted
                };

                _db.JobApplications.Add(application);
                await _db.SaveChangesAsync();

                // Load related data for response
                await _db.Entry(application)
                    .Reference(a => a.Job)
                    .LoadAsync();
                await _db.Entry(application)
                    .Reference(a => a.Applicant)
                    .LoadAsync();

                var response = JobApplicationResponse.FromJobApplication(application);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying for job");
                return StatusCode(500, "An error occurred while applying for the job");
            }
        }

        [HttpGet("my-applications")]
        [ProducesResponseType(typeof(PaginatedResponse<JobApplicationResponse>), 200)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<PaginatedResponse<JobApplicationResponse>>> GetMyApplications(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] ApplicationStatus? status = null)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { success = false, message = "User ID not found" });
                }

                var query = _db.JobApplications
                    .Include(ja => ja.Job)
                    .Include(ja => ja.Applicant)
                    .Where(ja => ja.ApplicantId == userId)
                    .AsQueryable();

                // Apply status filter if provided
                if (status.HasValue)
                {
                    query = query.Where(ja => ja.Status == status.Value);
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply pagination and create response DTOs
                var applications = await query
                    .OrderByDescending(ja => ja.ApplicationDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(ja => JobApplicationResponse.FromJobApplication(ja))
                    .ToListAsync();

                var response = new PaginatedResponse<JobApplicationResponse>
                {
                    Items = applications,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving user's applications");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while processing your request",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}