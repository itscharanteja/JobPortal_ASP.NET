using Microsoft.AspNetCore.Mvc;
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
    }
}