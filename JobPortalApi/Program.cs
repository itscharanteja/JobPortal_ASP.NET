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
    // Use a different database provider for production, e.g., SQL Server or PostgreSQL
    // For now, let's assume SQLite for simplicity or use InMemory for testing if needed
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseInMemoryDatabase("JobPortalDb")); // Example for non-development environments
}

// Add File Storage Service
if (builder.Environment.IsEnvironment("Test") || builder.Environment.IsDevelopment())
{
    // Use local file storage for tests and development
    builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
}
else
{
    // Add Azure Blob Storage for production environments
    var connectionString = builder.Configuration["AzureStorage:ConnectionString"];
    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException("Azure Storage connection string is required for production environment.");
    }
    
    builder.Services.AddSingleton(x => new BlobServiceClient(connectionString));
    builder.Services.AddScoped<IFileStorageService>(provider => 
        new AzureBlobStorageService(
            provider.GetRequiredService<BlobServiceClient>(),
            provider.GetRequiredService<IConfiguration>(),
            provider.GetRequiredService<ILogger<AzureBlobStorageService>>()
        ));
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

app.Run();
