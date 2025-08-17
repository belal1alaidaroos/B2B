using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using B2BBackend.Data;
using B2BBackend.Services;
using B2BBackend.Models;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Entity Framework with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
                        "Server=localhost;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;"));

// Configure CORS for frontend communication
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your-super-secret-jwt-key-change-this-in-production-123456789";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "B2BBackend";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "B2BFrontend";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            // Fix claim mapping issues
            NameClaimType = "name",
            RoleClaimType = "roles",
            ClockSkew = TimeSpan.Zero // Reduce clock skew tolerance
        };
        
        // Add token debugging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"[DEBUG] JWT Authentication Failed: {context.Exception?.Message}");
                return System.Threading.Tasks.Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"[DEBUG] JWT Token Validated Successfully");
                foreach (var claim in context.Principal?.Claims ?? Enumerable.Empty<Claim>())
                {
                    Console.WriteLine($"[DEBUG] Validated Claim: {claim.Type} = {claim.Value}");
                }
                return System.Threading.Tasks.Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"[DEBUG] JWT Challenge: {context.Error}, {context.ErrorDescription}");
                return System.Threading.Tasks.Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Register application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditService, AuditService>();

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "B2B Backend API", Version = "v1" });
    
    // Configure JWT authentication in Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "B2B Backend API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

// Initialize database and seed data
await InitializeDatabaseAsync(app);

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new { Status = "Healthy", Timestamp = DateTime.UtcNow });

app.Run();

// Database initialization method
static async System.Threading.Tasks.Task InitializeDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        // Apply database migrations for SQL Server
        await context.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully");
        
        // Check if admin user already exists
        var existingAdmin = await userService.GetByEmailAsync("admin@company.com");
        if (existingAdmin == null)
        {
            logger.LogInformation("Creating default admin user...");
            
            // Create admin user with proper password hashing
            var adminUser = new User
            {
                Id = "user_admin",
                Email = "admin@company.com",
                FullName = "System Administrator",
                FirstName = "System",
                LastName = "Administrator",
                Status = "active",
                Roles = "[\"role_admin\"]",
                Permissions = "[\"*\"]",
                Language = "en",
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await userService.CreateAsync(adminUser, "admin123");
            logger.LogInformation("Default admin user created: admin@company.com / admin123");
        }
        else
        {
            logger.LogInformation("Admin user already exists");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database");
    }
}
