using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using JobPortalApi.Data;
using JobPortalApi.Models;
using JobPortalApi.DTOs;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<JobsController> _logger;

        public JobsController(ApplicationDbContext db, ILogger<JobsController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PaginatedResponse<JobResponse>), 200)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<PaginatedResponse<JobResponse>>> GetJobs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] JobType? jobType = null,
            [FromQuery] ExperienceLevel? experienceLevel = null,
            [FromQuery] string? location = null,
            [FromQuery] decimal? minSalary = null,
            [FromQuery] decimal? maxSalary = null,
            [FromQuery] JobStatus? status = JobStatus.Open,
            [FromQuery] string? requiredSkill = null,
            [FromQuery] int? postedWithinDays = null,
            [FromQuery] string sortBy = "newest",
            [FromQuery] bool sortDescending = true)
        {
            try
            {
                var query = _db.Jobs
                    .Include(j => j.Recruiter)
                    .AsQueryable();  // Removed Status filter to see all jobs

                // Apply filters
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    searchTerm = searchTerm.ToLower();
                    query = query.Where(j => 
                        j.Title.ToLower().Contains(searchTerm) ||
                        j.Description.ToLower().Contains(searchTerm) ||
                        j.CompanyName.ToLower().Contains(searchTerm));
                }

                if (jobType.HasValue)
                {
                    query = query.Where(j => j.JobType == jobType.Value);
                }

                if (experienceLevel.HasValue)
                {
                    query = query.Where(j => j.ExperienceLevel == experienceLevel.Value);
                }

                if (!string.IsNullOrWhiteSpace(location))
                {
                    location = location.ToLower();
                    query = query.Where(j => j.Location.ToLower().Contains(location));
                }

                if (minSalary.HasValue)
                {
                    query = query.Where(j => j.Salary >= minSalary.Value);
                }

                if (maxSalary.HasValue)
                {
                    query = query.Where(j => j.Salary <= maxSalary.Value);
                }

                if (status.HasValue)
                {
                    query = query.Where(j => j.Status == status.Value);
                }

                if (!string.IsNullOrWhiteSpace(requiredSkill))
                {
                    requiredSkill = requiredSkill.ToLower();
                    query = query.Where(j => j.RequiredSkills.Any(skill => 
                        skill.ToLower().Contains(requiredSkill)));
                }

                if (postedWithinDays.HasValue)
                {
                    var cutoffDate = DateTime.UtcNow.AddDays(-postedWithinDays.Value);
                    query = query.Where(j => j.CreatedAt >= cutoffDate);
                }

                // Apply sorting
                query = sortBy.ToLower() switch
                {
                    "salary" => sortDescending 
                        ? query.OrderByDescending(j => j.Salary)
                        : query.OrderBy(j => j.Salary),
                    "company" => sortDescending
                        ? query.OrderByDescending(j => j.CompanyName)
                        : query.OrderBy(j => j.CompanyName),
                    "location" => sortDescending
                        ? query.OrderByDescending(j => j.Location)
                        : query.OrderBy(j => j.Location),
                    "title" => sortDescending
                        ? query.OrderByDescending(j => j.Title)
                        : query.OrderBy(j => j.Title),
                    _ => sortDescending  // "newest" is default
                        ? query.OrderByDescending(j => j.CreatedAt)
                        : query.OrderBy(j => j.CreatedAt)
                };

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply pagination
                var items = await query
                    .OrderByDescending(j => j.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(j => JobResponse.FromJob(j))
                    .ToListAsync();

                var response = new PaginatedResponse<JobResponse>
                {
                    Items = items,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving jobs list");
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving jobs" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(JobResponse), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<JobResponse>> GetJobById(int id)
        {
            try
            {
                var job = await _db.Jobs
                    .Include(j => j.Recruiter)
                    .FirstOrDefaultAsync(j => j.Id == id);

                if (job == null)
                {
                    return NotFound(new { success = false, message = "Job not found" });
                }

                return Ok(new { success = true, data = JobResponse.FromJob(job) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving job with ID {JobId}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving the job" });
            }
        }

        [HttpPost]
        [Authorize]
        [ProducesResponseType(typeof(JobResponse), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<JobResponse>> CreateJob([FromBody] CreateJobRequest request)
        {
            try
            {
                // Check model validation
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .Select(x => new { 
                            Field = x.Key, 
                            Errors = x.Value?.Errors.Select(e => e.ErrorMessage) ?? new List<string>()
                        });
                    
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed", 
                        errors = errors 
                    });
                }

                // Get the current user ID from the JWT token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var job = new Job
                {
                    Title = request.Title,
                    Description = request.Description,
                    CompanyName = request.CompanyName,  
                    Location = request.Location,
                    Salary = request.Salary,
                    JobType = request.JobType,
                    ExperienceLevel = request.ExperienceLevel,
                    RequiredSkills = request.RequiredSkills,
                    PostedById = userIdClaim.Value,
                    Status = JobStatus.Open,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Jobs.Add(job);
                await _db.SaveChangesAsync();

                // Reload the job with recruiter information
                var createdJob = await _db.Jobs
                    .Include(j => j.Recruiter)
                    .FirstOrDefaultAsync(j => j.Id == job.Id);

                return CreatedAtAction(
                    nameof(GetJobById),
                    new { id = job.Id },
                    new { success = true, data = JobResponse.FromJob(createdJob!) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating job");
                return StatusCode(500, new { success = false, message = "An error occurred while creating the job" });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(JobResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<JobResponse>> UpdateJob(int id, [FromBody] UpdateJobRequest request)
        {
            try
            {
                // Get the current user ID from the JWT token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id);
                if (job == null)
                {
                    return NotFound(new { success = false, message = "Job not found" });
                }

                // Check if the user is the owner of the job or an admin
                var isOwner = job.PostedById == userIdClaim.Value;
                var isAdmin = User.IsInRole("Admin");

                if (!isOwner && !isAdmin)
                {
                    return Forbid();
                }

                // Update job properties (only update non-null values)
                if (!string.IsNullOrWhiteSpace(request.Title))
                    job.Title = request.Title;
                
                if (!string.IsNullOrWhiteSpace(request.Description))
                    job.Description = request.Description;
                
                if (!string.IsNullOrWhiteSpace(request.CompanyName))
                    job.CompanyName = request.CompanyName;
                
                if (!string.IsNullOrWhiteSpace(request.Location))
                    job.Location = request.Location;
                
                if (request.Salary.HasValue)
                    job.Salary = request.Salary.Value;
                
                if (request.JobType.HasValue)
                    job.JobType = request.JobType.Value;
                
                if (request.ExperienceLevel.HasValue)
                    job.ExperienceLevel = request.ExperienceLevel.Value;
                
                if (request.RequiredSkills != null)
                    job.RequiredSkills = request.RequiredSkills;
                
                if (request.Status.HasValue)
                    job.Status = request.Status.Value;

                job.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                // Reload the job with recruiter information
                var updatedJob = await _db.Jobs
                    .Include(j => j.Recruiter)
                    .FirstOrDefaultAsync(j => j.Id == job.Id);

                return Ok(new { success = true, data = JobResponse.FromJob(updatedJob!) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating job with ID {JobId}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while updating the job" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<ActionResult> DeleteJob(int id)
        {
            try
            {
                // Get the current user ID from the JWT token
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id);
                if (job == null)
                {
                    return NotFound(new { success = false, message = "Job not found" });
                }

                // Check if the user is the owner of the job or an admin
                var isOwner = job.PostedById == userIdClaim.Value;
                var isAdmin = User.IsInRole("Admin");

                if (!isOwner && !isAdmin)
                {
                    return Forbid();
                }

                _db.Jobs.Remove(job);
                await _db.SaveChangesAsync();

                return Ok(new { success = true, message = "Job deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting job with ID {JobId}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while deleting the job" });
            }
        }
    }
}