using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalApi.Data;
using JobPortalApi.Models;
using Microsoft.AspNetCore.Identity;

namespace JobPortalApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<TestController> _logger;

        public TestController(
            ApplicationDbContext context, 
            UserManager<ApplicationUser> userManager,
            ILogger<TestController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet("database-test")]
        public async Task<IActionResult> TestDatabaseConnection()
        {
            try
            {
                _logger.LogInformation("Testing database connection...");
                // Test database connection
                bool canConnect = await _context.Database.CanConnectAsync();
                _logger.LogInformation($"Database connection test result: {canConnect}");
                
                // Get some basic stats
                var stats = new
                {
                    DatabaseConnection = canConnect,
                    UsersCount = await _context.Users.CountAsync(),
                    JobsCount = await _context.Jobs.CountAsync(),
                    ApplicationsCount = await _context.JobApplications.CountAsync()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest($"Database test failed: {ex.Message}");
            }
        }

        [HttpPost("create-test-data")]
        public async Task<IActionResult> CreateTestData()
        {
            try
            {
                // Create a test recruiter
                var recruiter = new ApplicationUser
                {
                    UserName = "testrecruiteeeer1@example.com",
                    Email = "testrecruiteeer1@example.com",
                    FirstName = "Teste",
                    LastName = "Recruiteeer",
                    UserType = UserType.Recruiter
                };

                var result = await _userManager.CreateAsync(recruiter, "Test@123");
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                // Create a test job
                var job = new Job
                {
                    Title = "Test Developer Position",
                    Description = "This is a test job posting",
                    Company = "Test Company",
                    Location = "Test Location",
                    Type = "Full-Time",
                    Salary = 750000,
                    PostedDate = DateTime.UtcNow,
                    IsActive = true,
                    RecruiterId = recruiter.Id
                };

                await _context.Jobs.AddAsync(job);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Test data created successfully", JobId = job.Id });
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to create test data: {ex.Message}");
            }
        }

        [HttpGet("jobs")]
        public async Task<IActionResult> GetJobs()
        {
            var jobs = await _context.Jobs
                .Include(j => j.Recruiter)
                .Select(j => new
                {
                    j.Id,
                    j.Title,
                    j.Company,
                    j.Location,
                    j.Salary,
                    RecruiterName = j.Recruiter.FirstName + " " + j.Recruiter.LastName,
                    j.PostedDate
                })
                .ToListAsync();

            return Ok(jobs);
        }
    }
}