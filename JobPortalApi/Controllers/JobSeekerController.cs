using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalApi.Data;
using JobPortalApi.DTOs;
using JobPortalApi.Models;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/jobs")]
    [Authorize(Roles = "JobSeeker")]
    public class JobSeekerController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<JobSeekerController> _logger;

        public JobSeekerController(ApplicationDbContext db, ILogger<JobSeekerController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpPost("{jobId}/apply")]
        [ProducesResponseType(typeof(JobApplicationResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<JobApplicationResponse>> ApplyForJob(int jobId, [FromBody] CreateJobApplicationRequest request)
        {
            try
            {
                _logger.LogInformation($"Processing job application for job ID: {jobId}");

                // Get the current user's ID
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { success = false, message = "User ID not found" });
                }

                // Check if job exists and is open
                var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == jobId);
                if (job == null)
                {
                    return NotFound(new { success = false, message = "Job not found" });
                }

                if (job.Status != JobStatus.Open)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "This job is not accepting applications" 
                    });
                }

                // Check if user has already applied
                var existingApplication = await _db.JobApplications
                    .FirstOrDefaultAsync(ja => ja.JobId == jobId && ja.ApplicantId == userId);

                if (existingApplication != null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "You have already applied for this job" 
                    });
                }

                // Create new application
                var application = new JobApplication
                {
                    JobId = jobId,
                    ApplicantId = userId,
                    CoverLetter = request.CoverLetter,
                    ResumeUrl = request.ResumeUrl,
                    ApplicationDate = DateTime.UtcNow,
                    Status = ApplicationStatus.Submitted
                };

                _db.JobApplications.Add(application);
                await _db.SaveChangesAsync();

                // Load related data for response
                await _db.Entry(application).Reference(a => a.Job).LoadAsync();
                await _db.Entry(application).Reference(a => a.Applicant).LoadAsync();

                var response = JobApplicationResponse.FromJobApplication(application);

                return Ok(new { success = true, application = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while applying for job with ID: {jobId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while processing your request",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
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