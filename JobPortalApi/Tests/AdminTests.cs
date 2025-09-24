using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using JobPortalApi.DTOs;
using JobPortalApi.Models;

namespace JobPortalApi.Tests;

public class AdminTests : TestBase
{
    private async Task<string> GetAdminToken()
    {
        var client = _factory.CreateClient();
        var uniqueEmail = $"admin_{Guid.NewGuid():N}@test.com";
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = uniqueEmail,
            Password = "Admin@123",
            ConfirmPassword = "Admin@123",
            FirstName = "Admin",
            LastName = "User",
            UserType = UserType.Admin
        });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        if (result == null || !result.Success || string.IsNullOrEmpty(result.Token))
            throw new Exception($"Failed to get admin token. Response: {result?.Message}");
        return result.Token;
    }

    private async Task<string> GetJobSeekerToken()
    {
        var client = _factory.CreateClient();
        var uniqueEmail = $"jobseeker_{Guid.NewGuid():N}@test.com";
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = uniqueEmail,
            Password = "Test@123",
            ConfirmPassword = "Test@123",
            FirstName = "Job",
            LastName = "Seeker",
            UserType = UserType.JobSeeker
        });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        if (result == null || !result.Success || string.IsNullOrEmpty(result.Token))
            throw new Exception($"Failed to get job seeker token. Response: {result?.Message}");
        return result.Token;
    }

    private async Task UploadResumeForJobSeeker(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes("%PDF-1.4 fake pdf content"));
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/pdf");
        content.Add(fileContent, "file", "resume.pdf");
        
        var response = await client.PostAsync("/api/jobseeker/resume", content);
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ViewAllApplications_ShouldReturnAllData()
    {
        // Arrange
        var client = _factory.CreateClient();
        var adminToken = await GetAdminToken();
        var jobSeekerToken = await GetJobSeekerToken();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        // Create a test job
        var job = new Job
        {
            Title = "Test Job",
            Description = "Test Description",
            CompanyName = "Test Company",
            Location = "Test Location",
            JobType = JobType.FullTime,
            Status = JobStatus.Open
        };
        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        // Upload resume for job seeker first
        var jobSeekerClient = _factory.CreateClient();
        await UploadResumeForJobSeeker(jobSeekerClient, jobSeekerToken);
        
        // Create a test application
        jobSeekerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jobSeekerToken);
        await jobSeekerClient.PostAsJsonAsync($"/api/jobseeker/{job.Id}/apply", new CreateJobApplicationRequest
        {
            CoverLetter = "Test cover letter"
        });

        // Act
        var response = await client.GetAsync($"/api/admin/jobs/{job.Id}/applications");
        response.EnsureSuccessStatusCode();
        
        var responseText = await response.Content.ReadAsStringAsync();
        
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var responseWrapper = JsonSerializer.Deserialize<JsonElement>(responseText, jsonOptions);
        var dataElement = responseWrapper.GetProperty("data");
        var result = JsonSerializer.Deserialize<JobApplicationsListResponse>(dataElement.GetRawText(), jsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(job.Id, result.JobId);
    }

    [Fact]
    public async Task UpdateApplicationStatus_ValidTransition_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        var adminToken = await GetAdminToken();
        var jobSeekerToken = await GetJobSeekerToken();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        // Create job and application
        var job = new Job
        {
            Title = "Test Job",
            Description = "Test Description",
            CompanyName = "Test Company",
            Location = "Test Location",
            JobType = JobType.FullTime,
            Status = JobStatus.Open
        };
        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        var jobSeekerClient = _factory.CreateClient();
        await UploadResumeForJobSeeker(jobSeekerClient, jobSeekerToken);
        
        jobSeekerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jobSeekerToken);
        var applicationResponse = await jobSeekerClient.PostAsJsonAsync($"/api/jobseeker/{job.Id}/apply", new CreateJobApplicationRequest
        {
            CoverLetter = "Test cover letter"
        });
        applicationResponse.EnsureSuccessStatusCode();
        var application = await applicationResponse.Content.ReadFromJsonAsync<JobApplicationResponse>();

        // Act
        var updateRequest = new UpdateApplicationStatusRequest
        {
            Status = ApplicationStatus.UnderReview,
            Notes = "Application under review"
        };
        var response = await client.PatchAsJsonAsync($"/api/admin/jobs/applications/{application!.Id}/status", updateRequest);
        response.EnsureSuccessStatusCode();
        
        var responseText = await response.Content.ReadAsStringAsync();
        
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var responseWrapper = JsonSerializer.Deserialize<JsonElement>(responseText, jsonOptions);
        var applicationElement = responseWrapper.GetProperty("application");
        var result = JsonSerializer.Deserialize<JobApplicationResponse>(applicationElement.GetRawText(), jsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.Equal(ApplicationStatus.UnderReview, result.Status);
        Assert.Equal(updateRequest.Notes, result.Notes);
    }

    [Fact]
    public async Task NonAdmin_AccessingAdminEndpoints_ShouldBeDenied()
    {
        // Arrange
        var client = _factory.CreateClient();
        var jobSeekerToken = await GetJobSeekerToken();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jobSeekerToken);

        // Create a test job first
        var job = new Job
        {
            Title = "Test Job",
            Description = "Test Description",
            CompanyName = "Test Company",
            Location = "Test Location",
            JobType = JobType.FullTime,
            Status = JobStatus.Open
        };
        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        // Act
        var response = await client.GetAsync($"/api/admin/jobs/{job.Id}/applications");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}