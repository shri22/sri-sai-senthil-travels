using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using S3T.Api.Data;
using S3T.Api.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddHttpClient<S3T.Api.Services.IDistanceService, S3T.Api.Services.GoogleDistanceService>();
builder.Services.AddHttpClient<S3T.Api.Services.INotificationService, S3T.Api.Services.WhatsAppNotificationService>();

// 2. Configure JWT Authentication
var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "a_very_long_and_secure_secret_key_12345");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("PartnerOrAdmin", policy => policy.RequireRole("Partner", "Admin"));
});

// 3. Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=s3t.db";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString.Contains("Server=") || connectionString.Contains("Host="))
    {
        options.UseSqlServer(connectionString);
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});

// 3. Add CORS for our Next.js Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Your frontend URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-migrate/create database for demo
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    
    // Seed diverse fleet if not present
    var adminUser = db.Users.FirstOrDefault(u => u.Email == "admin@s3t.com");
    if (adminUser == null)
    {
        db.Users.Add(new User { Email = "admin@s3t.com", Name = "System Admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), Role = "Admin", Status = "Active" });
    }
    else 
    {
        adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");
        adminUser.Status = "Active";
        adminUser.Role = "Admin";
    }
    var partnerUser = db.Users.FirstOrDefault(u => u.Email == "partner@alpha.com");
    if (partnerUser == null)
    {
        db.Users.Add(new User { Email = "partner@alpha.com", Name = "Alpha Travels Partner", PasswordHash = BCrypt.Net.BCrypt.HashPassword("partner123"), Role = "Partner", Status = "Active", Phone = "+91 99999 88888" });
    }
    else 
    {
        partnerUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("partner123");
        partnerUser.Status = "Active";
        partnerUser.Role = "Partner";
    }
    db.SaveChanges();

    if (!db.Vehicles.Any())
    {
        // S3T Fleet
        db.Vehicles.Add(new Vehicle { Name = "S3T Luxury Volvo B11R", Number = "TN 01 AB 1234", Type = "Bus", HasAc = true, Capacity = 36, BasePrice = 18000, PricePerKm = 45, Company = "Sri Sai Senthil Travels", AverageRating = 4.9 });
        db.Vehicles.Add(new Vehicle { Name = "S3T Heritage Force Traveller", Number = "TN 01 AB 5678", Type = "Van", HasAc = true, Capacity = 12, BasePrice = 8000, PricePerKm = 25, Company = "Sri Sai Senthil Travels", AverageRating = 4.7 });
        
        // Partner Fleet
        db.Vehicles.Add(new Vehicle { Name = "Alpha SUV (Innova Crystal)", Number = "TN 02 CD 1111", Type = "Car", HasAc = true, Capacity = 7, BasePrice = 5000, PricePerKm = 18, Company = "Alpha Travels Partner", AverageRating = 4.5 });
        db.Vehicles.Add(new Vehicle { Name = "Beta Mini Bus (Non-AC)", Number = "TN 03 EF 2222", Type = "Mini Bus", HasAc = false, Capacity = 22, BasePrice = 9000, PricePerKm = 30, Company = "Alpha Travels Partner", AverageRating = 4.2 });
        
        db.SaveChanges();
    }

    if (!db.SystemConfigs.Any())
    {
        db.SystemConfigs.AddRange(new List<SystemConfig> {
            new SystemConfig { Key = "CustomerAdvancePercentage", Value = "30", Description = "Default advance percentage for customers" },
            new SystemConfig { Key = "CommissionPercentage", Value = "15", Description = "S3T platform fee from partners" },
            new SystemConfig { Key = "DriverBataPerDay", Value = "500", Description = "Standard driver allowance" },
            new SystemConfig { Key = "CashPaymentsEnabled", Value = "true", Description = "Allow partners to accept cash" },
            new SystemConfig { Key = "BaseTollEstimate", Value = "200", Description = "Estimated toll for calculation" },
            new SystemConfig { Key = "PermitCost", Value = "1500", Description = "Standard state permit cost" },
            new SystemConfig { Key = "DieselPrice", Value = "95", Description = "Market price per liter for calculation" }
        });
        db.SaveChanges();
    }
}

// 4. Pipeline (Always show Swagger for this demo)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "S3T API V1");
    c.RoutePrefix = "swagger"; // Swagger UI will be at /swagger
});

app.UseCors("NextJsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<S3T.Api.Hubs.TrackingHub>("/hubs/tracking");

app.Run();
