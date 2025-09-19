using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalApi.Models;
using JobPortalApi.DTOs;
using JobPortalApi.Data;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/admin/jobs")]
    [Authorize(Roles = "Admin")]
    public class AdminJobsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<AdminJobsController> _logger;

        public AdminJobsController(ApplicationDbContext db, ILogger<AdminJobsController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<JobResponse>> CreateJob([FromBody] CreateJobRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found");

            var job = new Job
            {
                Title = request.Title,
                Description = request.Description,
                CompanyName = request.CompanyName,
                Location = request.Location,
                JobType = request.JobType,
                ExperienceLevel = request.ExperienceLevel,
                Salary = request.Salary,
                RequiredSkills = request.RequiredSkills,
                CreatedAt = DateTime.UtcNow,
                Status = JobStatus.Open,
                PostedById = userId
            };

            _db.Jobs.Add(job);
            await _db.SaveChangesAsync();

            // Load the recruiter for the response
            await _db.Entry(job).Reference(j => j.Recruiter).LoadAsync();
            
            var response = JobResponse.FromJob(job);

            return Ok(new { success = true, job = response });
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> DeleteJob(int id)
        {
            try
            {
                _logger.LogInformation($"Attempting to delete job with ID: {id}");

                var job = await _db.Jobs
                    .Include(j => j.Applications)
                    .FirstOrDefaultAsync(j => j.Id == id);

                if (job == null)
                {
                    _logger.LogWarning($"Job with ID {id} not found");
                    return NotFound(new { 
                        success = false, 
                        message = "Job not found",
                        details = new { searchedId = id }
                    });
                }

                // First remove all applications for this job
                if (job.Applications != null && job.Applications.Any())
                {
                    _db.JobApplications.RemoveRange(job.Applications);
                }

                // Then remove the job itself
                _db.Jobs.Remove(job);
                await _db.SaveChangesAsync();

                _logger.LogInformation($"Successfully deleted job with ID: {id}");
                return Ok(new { 
                    success = true, 
                    message = "Job has been permanently deleted" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while deleting job with ID: {id}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while processing your request",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("{jobId}/applications")]
        [ProducesResponseType(typeof(JobApplicationsListResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<JobApplicationsListResponse>> GetJobApplications(int jobId)
        {
            try
            {
                _logger.LogInformation($"Fetching applications for job ID: {jobId}");

                var job = await _db.Jobs
                    .Include(j => j.Applications)
                        .ThenInclude(a => a.Applicant)
                    .FirstOrDefaultAsync(j => j.Id == jobId);

                if (job == null)
                {
                    _logger.LogWarning($"Job with ID {jobId} not found");
                    return NotFound(new { 
                        success = false, 
                        message = "Job not found" 
                    });
                }

                var applications = job.Applications ?? new List<JobApplication>();
                var applicationResponses = applications
                    .Select(JobApplicationResponse.FromJobApplication)
                    .ToList();

                var response = new JobApplicationsListResponse
                {
                    JobId = job.Id,
                    JobTitle = job.Title,
                    CompanyName = job.CompanyName,
                    Applications = applicationResponses,
                    TotalCount = applicationResponses.Count
                };

                return Ok(new { 
                    success = true, 
                    data = response 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while fetching applications for job with ID: {jobId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while processing your request",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpPatch("{jobId}/status")]
        [ProducesResponseType(typeof(JobResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<JobResponse>> UpdateJobStatus(int jobId, [FromBody] UpdateJobStatusRequest request)
        {
            try
            {
                _logger.LogInformation($"Updating status for job ID: {jobId} to {request.Status}");

                var job = await _db.Jobs
                    .Include(j => j.Recruiter)
                    .FirstOrDefaultAsync(j => j.Id == jobId);

                if (job == null)
                {
                    return NotFound(new { 
                        success = false, 
                        message = "Job not found" 
                    });
                }

                // Update the status
                job.Status = request.Status;
                job.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                var response = JobResponse.FromJob(job);

                return Ok(new { 
                    success = true, 
                    job = response 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while updating status for job with ID: {jobId}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while processing your request",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpPatch("applications/{applicationId}/status")]
        [ProducesResponseType(typeof(JobApplicationResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<JobApplicationResponse>> UpdateApplicationStatus(
            int applicationId, 
            [FromBody] UpdateApplicationStatusRequest request)
        {
            try
            {
                _logger.LogInformation($"Updating status for application ID: {applicationId} to {request.Status}");

                var application = await _db.JobApplications
                    .Include(ja => ja.Job)
                    .Include(ja => ja.Applicant)
                    .FirstOrDefaultAsync(ja => ja.Id == applicationId);

                if (application == null)
                {
                    return NotFound(new { 
                        success = false, 
                        message = "Application not found" 
                    });
                }

                // Update the status and notes
                application.Status = request.Status;
                application.Notes = request.Notes;

                await _db.SaveChangesAsync();

                var response = JobApplicationResponse.FromJobApplication(application);

                return Ok(new { 
                    success = true, 
                    application = response 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while updating status for application with ID: {applicationId}");
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
