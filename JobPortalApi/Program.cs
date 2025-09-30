using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Sqlite;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Azure.Storage.Blobs;
using JobPortalApi.Data;
using JobPortalApi.Models;
using JobPortalApi.Services;
using JobPortalApi.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add services to the container.
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers(options =>
{
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
}).AddJsonOptions(options => 
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Database Context
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
}
else if (builder.Environment.IsEnvironment("Test"))
{
    // Test environment will be configured by test setup
    // Don't add any database context here to avoid conflicts
}
else
{
    // Use InMemory database for production (for now)
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseInMemoryDatabase("JobPortalDb"));
}

// Add File Storage Service
if (builder.Environment.IsEnvironment("Test") || builder.Environment.IsDevelopment())
{
    // Use local file storage for tests and development
    builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
}
else
{
    // Check if Azure Storage is configured for production
    var connectionString = builder.Configuration["AzureStorage:ConnectionString"];
    if (!string.IsNullOrEmpty(connectionString))
    {
        // Use Azure Blob Storage if configured
        builder.Services.AddSingleton(x => new BlobServiceClient(connectionString));
        builder.Services.AddScoped<IFileStorageService>(provider => 
            new AzureBlobStorageService(
                provider.GetRequiredService<BlobServiceClient>(),
                provider.GetRequiredService<IConfiguration>(),
                provider.GetRequiredService<ILogger<AzureBlobStorageService>>()
            ));
    }
    else
    {
        // Fall back to database storage
        builder.Services.AddScoped<IFileStorageService, DatabaseFileStorageService>();
    }
}

// Add Identity with Role support
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredLength = 6;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure JWT
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("JwtConfig"));
builder.Services.AddScoped<IJwtService, JwtService>();

// Add JWT Authentication
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(jwt => {
    var jwtSecret = builder.Configuration["JwtConfig:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
    var key = Encoding.ASCII.GetBytes(jwtSecret);
    jwt.SaveToken = true;
    jwt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = builder.Configuration["JwtConfig:Issuer"],
        ValidAudience = builder.Configuration["JwtConfig:Audience"],
        RequireExpirationTime = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Initialize database (ensure it's created and seeded for InMemory or apply migrations for real DB)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    
    // Ensure database is created
    context.Database.EnsureCreated();
    
    // Seed roles and users
    Console.WriteLine("Starting database seeding...");
    SeedDataAsync(userManager, roleManager).Wait();
    Console.WriteLine("Database seeding completed.");
}

app.Run();

static async Task SeedDataAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
{
    Console.WriteLine("Seeding roles...");
    // Create roles
    var roles = new[] { "Admin", "Recruiter", "JobSeeker" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            Console.WriteLine($"Creating role: {role}");
            await roleManager.CreateAsync(new IdentityRole(role));
        }
        else
        {
            Console.WriteLine($"Role already exists: {role}");
        }
    }

    Console.WriteLine("Seeding admin user...");
    // Create admin user
    var adminEmail = "admin@jobportal.com";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        Console.WriteLine($"Creating admin user: {adminEmail}");
        var adminUser = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true,
            FirstName = "Admin",
            LastName = "User"
        };
        
        var result = await userManager.CreateAsync(adminUser, "Admin@123");
        if (result.Succeeded)
        {
            Console.WriteLine("Admin user created successfully");
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
        else
        {
            Console.WriteLine($"Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
    }
    else
    {
        Console.WriteLine("Admin user already exists");
    }

    Console.WriteLine("Seeding job seeker user...");
    // Create job seeker user
    var jobSeekerEmail = "jobseeker@example.com";
    if (await userManager.FindByEmailAsync(jobSeekerEmail) == null)
    {
        Console.WriteLine($"Creating job seeker user: {jobSeekerEmail}");
        var jobSeekerUser = new ApplicationUser
        {
            UserName = jobSeekerEmail,
            Email = jobSeekerEmail,
            EmailConfirmed = true,
            FirstName = "Charan Sri Teja",
            LastName = "Burra"
        };
        
        var result = await userManager.CreateAsync(jobSeekerUser, "Test@123");
        if (result.Succeeded)
        {
            Console.WriteLine("Job seeker user created successfully");
            await userManager.AddToRoleAsync(jobSeekerUser, "JobSeeker");
        }
        else
        {
            Console.WriteLine($"Failed to create job seeker user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
    }
    else
    {
        Console.WriteLine("Job seeker user already exists");
    }
}
