using System.Security.Claims;
using JobPortalApi.Controllers;
using JobPortalApi.Data;
using JobPortalApi.Models;
using JobPortalApi.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace JobPortalApi.Tests.Controllers
{
    public class DashboardControllerTests
    {
        private readonly Mock<ILogger<DashboardController>> _loggerMock;
        private readonly ApplicationDbContext _context;
        private readonly DashboardController _controller;

        public DashboardControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestJobPortalDb_" + Guid.NewGuid())
                .Options;
            _context = new ApplicationDbContext(options);

            // Setup logger mock
            _loggerMock = new Mock<ILogger<DashboardController>>();

            // Create controller instance
            _controller = new DashboardController(_context, _loggerMock.Object);
        }

        private void SetupUserContext(string userId, string[] roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        private async Task SeedTestData()
        {
            // Create test users
            var jobSeeker = new ApplicationUser { Id = "jobseeker1", Email = "jobseeker@test.com" };
            var recruiter = new ApplicationUser { Id = "recruiter1", Email = "recruiter@test.com" };

            // Create test jobs
            var job1 = new Job
            {
                Id = 1,
                Title = "Software Developer",
                CompanyName = "Tech Corp",
                PostedById = recruiter.Id,
                Status = JobStatus.Open
            };

            var job2 = new Job
            {
                Id = 2,
                Title = "Senior Developer",
                CompanyName = "Tech Corp",
                PostedById = recruiter.Id,
                Status = JobStatus.Open
            };

            // Create test applications
            var application1 = new JobApplication
            {
                Id = 1,
                JobId = 1,
                ApplicantId = jobSeeker.Id,
                ApplicationDate = DateTime.UtcNow.AddDays(-5),
                Status = ApplicationStatus.UnderReview
            };

            var application2 = new JobApplication
            {
                Id = 2,
                JobId = 2,
                ApplicantId = jobSeeker.Id,
                ApplicationDate = DateTime.UtcNow.AddDays(-2),
                Status = ApplicationStatus.Shortlisted
            };

            await _context.Users.AddRangeAsync(jobSeeker, recruiter);
            await _context.Jobs.AddRangeAsync(job1, job2);
            await _context.JobApplications.AddRangeAsync(application1, application2);
            await _context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetDashboardStats_AsJobSeeker_ReturnsCorrectStats()
        {
            // Arrange
            await SeedTestData();
            SetupUserContext("jobseeker1", new[] { "JobSeeker" });

            // Act
            var result = await _controller.GetDashboardStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var stats = Assert.IsType<DashboardStatsDTO>(okResult.Value);
            
            Assert.Equal(2, stats.TotalJobsApplied);
            Assert.Equal(1, stats.JobsUnderReview);
            Assert.Equal(1, stats.JobsShortlisted);
            Assert.Equal(0, stats.JobsRejected);
            Assert.Equal(2, stats.RecentActivities.Count());
        }

        [Fact]
        public async Task GetDashboardStats_AsRecruiter_ReturnsCorrectStats()
        {
            // Arrange
            await SeedTestData();
            SetupUserContext("recruiter1", new[] { "Recruiter" });

            // Act
            var result = await _controller.GetDashboardStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var stats = Assert.IsType<DashboardStatsDTO>(okResult.Value);
            
            Assert.Equal(2, stats.TotalJobsPosted);
            Assert.Equal(2, stats.TotalActiveJobs);
            Assert.Equal(2, stats.RecentActivities.Count());
        }

        [Fact]
        public async Task GetDashboardStats_AsAdmin_ReturnsAllStats()
        {
            // Arrange
            await SeedTestData();
            SetupUserContext("admin1", new[] { "Admin" });

            // Act
            var result = await _controller.GetDashboardStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var stats = Assert.IsType<DashboardStatsDTO>(okResult.Value);
            
            Assert.Equal(2, stats.TotalJobsPosted);
            Assert.Equal(2, stats.TotalActiveJobs);
            Assert.Equal(2, stats.TotalJobsApplied);
            Assert.Equal(1, stats.JobsUnderReview);
            Assert.Equal(1, stats.JobsShortlisted);
            Assert.Equal(0, stats.JobsRejected);
            Assert.Equal(2, stats.RecentActivities.Count());
        }

        [Fact]
        public async Task GetDashboardStats_WithNoUser_ReturnsBadRequest()
        {
            // Arrange
            await SeedTestData();
            // Set up empty claims identity
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
            };

            // Act
            var result = await _controller.GetDashboardStats();

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("User ID not found", badRequestResult.Value);
        }

        [Fact]
        public async Task GetDashboardStats_WithEmptyDatabase_ReturnsEmptyStats()
        {
            // Arrange
            SetupUserContext("jobseeker1", new[] { "JobSeeker" });

            // Act
            var result = await _controller.GetDashboardStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var stats = Assert.IsType<DashboardStatsDTO>(okResult.Value);
            
            Assert.Equal(0, stats.TotalJobsApplied);
            Assert.Equal(0, stats.JobsUnderReview);
            Assert.Equal(0, stats.JobsShortlisted);
            Assert.Equal(0, stats.JobsRejected);
            Assert.Empty(stats.RecentActivities);
        }
    }
}
