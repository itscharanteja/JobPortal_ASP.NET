using System;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.InMemory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.AspNetCore.Identity;
using JobPortalApi.Data;
using JobPortalApi.Models;

namespace JobPortalApi.Tests;

public class TestBase : IDisposable
{
    protected readonly WebApplicationFactory<Program> _factory;
    protected readonly ApplicationDbContext _context;

    public TestBase()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                // Set the environment to Test to avoid production configuration
                builder.UseEnvironment("Test");
                
                builder.ConfigureServices(services =>
                {
                    // Remove all existing DbContext registrations
                    var descriptors = services.Where(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                             d.ServiceType == typeof(ApplicationDbContext)
                    ).ToArray();
                    
                    foreach (var descriptor in descriptors)
                    {
                        services.Remove(descriptor);
                    }
                    
                    // Remove Azure Blob Storage services if they exist
                    var azureServices = services.Where(
                        d => d.ServiceType.Name.Contains("BlobServiceClient")
                    ).ToArray();
                    
                    foreach (var descriptor in azureServices)
                    {
                        services.Remove(descriptor);
                    }

                    // Add in-memory database for tests
                    // Use a unique database name for each test to avoid cross-contamination
                    var dbName = $"TestDatabase_{Guid.NewGuid()}";
                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        options.UseInMemoryDatabase(dbName);
                    });
                    
                    // Replace System.Text.Json with Newtonsoft.Json for tests to avoid PipeWriter issue
                    services.AddControllers().AddNewtonsoftJson(options =>
                    {
                        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.DefaultContractResolver
                        {
                            NamingStrategy = new Newtonsoft.Json.Serialization.CamelCaseNamingStrategy()
                        };
                    });
                });
            });

        // Get db context
        var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Ensure database is created
        _context.Database.EnsureCreated();
        
        // Seed roles for testing
        SeedRolesAsync().Wait();
    }
    
    private async Task SeedRolesAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        
        // Create standard roles if they don't exist
        var roles = new[] { "JobSeeker", "Recruiter", "Admin" };
        
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }
    
    public void Dispose()
    {
        _context?.Dispose();
        _factory?.Dispose();
        GC.SuppressFinalize(this);
    }
}
