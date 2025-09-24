using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using JobPortalApi.DTOs;
using JobPortalApi.Models;

namespace JobPortalApi.Tests;

public class AuthenticationTests : TestBase
{
    [Fact]
    public async Task Register_WithValidData_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        var uniqueEmail = $"user_{Guid.NewGuid():N}@example.com";
        var request = new RegisterRequest
        {
            Email = uniqueEmail,
            Password = "Test@123",
            ConfirmPassword = "Test@123",
            FirstName = "Test",
            LastName = "User",
            UserType = UserType.JobSeeker
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", request);
        response.EnsureSuccessStatusCode(); // Throws if not 2xx
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Token);
        Assert.Equal(uniqueEmail, result.User!.Email);
        Assert.Equal(request.FirstName, result.User!.FirstName);
        Assert.Equal(request.LastName, result.User!.LastName);
        Assert.Equal(UserType.JobSeeker, result.User!.UserType);
    }

    [Fact]
    public async Task Register_WithInvalidData_ShouldFail()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new RegisterRequest
        {
            Email = "invalid-email",
            Password = "weak",
            ConfirmPassword = "weak",
            FirstName = "",
            LastName = "",
            UserType = UserType.JobSeeker
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var email = $"login_{Guid.NewGuid():N}@example.com";
        var password = "Test@123";

        // Register user first
        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password,
            ConfirmPassword = password,
            FirstName = "Test",
            LastName = "User",
            UserType = UserType.JobSeeker
        });
        
        // Act
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });
        loginResponse.EnsureSuccessStatusCode(); // Throws if not 2xx
        var result = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        // Assert
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Token);
        Assert.Equal(email, result.User!.Email);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldFail()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", request);
        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}