using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using B2BBackend.Data;
using B2BBackend.Models;

namespace B2BBackend.Services
{
    // Authentication Service Implementation
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, IUserService userService)
        {
            _context = context;
            _configuration = configuration;
            _userService = userService;
        }

        public async Task<string> AuthenticateAsync(string email, string password)
        {
            var user = await _userService.GetByEmailAsync(email);
            if (user == null || !await _userService.VerifyPasswordAsync(user, password))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            if (user.Status != "active")
            {
                throw new UnauthorizedAccessException("Account is not active");
            }

            // Update last login
            user.LastLogin = DateTime.UtcNow;
            user.FailedLoginAttempts = 0;
            await _context.SaveChangesAsync();

            return GenerateJwtToken(user);
        }

        public async Task<User?> GetCurrentUserAsync(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwt = tokenHandler.ReadJwtToken(token);
                var userId = jwt.Claims.FirstOrDefault(x => x.Type == "sub")?.Value;
                
                if (userId != null)
                {
                    return await _userService.GetByIdAsync(userId);
                }
            }
            catch
            {
                // Token is invalid
            }
            
            return null;
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "your-super-secret-jwt-key-change-this-in-production-123456789");

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "B2BBackend",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "B2BFrontend",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<User?> GetUserByIdAsync(string userId)
        {
            return await _userService.GetByIdAsync(userId);
        }

        public string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "your-super-secret-jwt-key-change-this-in-production-123456789");
            
            var claims = new List<Claim>
            {
                new Claim("sub", user.Id),
                new Claim("email", user.Email),
                new Claim("name", user.FullName),
                new Claim("roles", user.Roles),
                new Claim("permissions", user.Permissions)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // 7 days expiry
                Issuer = _configuration["Jwt:Issuer"] ?? "B2BBackend",
                Audience = _configuration["Jwt:Audience"] ?? "B2BFrontend",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }

    // User Service Implementation
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<User> CreateAsync(User user, string password)
        {
            // Hash the password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
            user.PasswordChangedAt = DateTime.UtcNow;
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public async System.Threading.Tasks.Task<bool> VerifyPasswordAsync(User user, string password)
        {
            return await System.Threading.Tasks.Task.FromResult(BCrypt.Net.BCrypt.Verify(password, user.PasswordHash));
        }

        public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            var user = await GetByIdAsync(userId);
            if (user == null || !await VerifyPasswordAsync(user, currentPassword))
            {
                return false;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.PasswordChangedAt = DateTime.UtcNow;
            await UpdateAsync(user);
            return true;
        }

        public async Task<IEnumerable<User>> GetUsersByRoleAsync(string roleId)
        {
            return await _context.Users
                .Where(u => u.Roles.Contains(roleId))
                .ToListAsync();
        }
    }

    // Email Service Implementation (Mock for now)
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body, string? cc = null, string? bcc = null)
        {
            // Mock implementation - log the email details
            _logger.LogInformation($"Sending email to: {to}, Subject: {subject}");
            _logger.LogInformation($"Body: {body}");
            
            // In a real implementation, you would integrate with an email service like SendGrid, AWS SES, etc.
            await System.Threading.Tasks.Task.Delay(100); // Simulate email sending delay
            
            return true;
        }

        public async Task<bool> SendEmailWithAttachmentsAsync(string to, string subject, string body, IEnumerable<string> attachmentPaths)
        {
            _logger.LogInformation($"Sending email with attachments to: {to}, Subject: {subject}");
            _logger.LogInformation($"Attachments: {string.Join(", ", attachmentPaths)}");
            
            await System.Threading.Tasks.Task.Delay(100);
            return true;
        }

        public async Task<bool> SendTemplateEmailAsync(string to, string templateId, Dictionary<string, string> variables)
        {
            _logger.LogInformation($"Sending template email {templateId} to: {to}");
            _logger.LogInformation($"Variables: {JsonSerializer.Serialize(variables)}");
            
            await System.Threading.Tasks.Task.Delay(100);
            return true;
        }
    }

    // File Upload Service Implementation
    public class FileUploadService : IFileUploadService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileUploadService> _logger;

        public FileUploadService(IWebHostEnvironment environment, ILogger<FileUploadService> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string? folder = null)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file provided");

            var uploadsPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", folder ?? "files");
            
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/{folder ?? "files"}/{fileName}";
            _logger.LogInformation($"File uploaded: {fileUrl}");
            
            return fileUrl;
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            try
            {
                var filePath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, fileUrl.TrimStart('/'));
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file: {fileUrl}");
            }
            
            return false;
        }

        public async Task<byte[]> GetFileAsync(string fileUrl)
        {
            var filePath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, fileUrl.TrimStart('/'));
            if (File.Exists(filePath))
            {
                return await File.ReadAllBytesAsync(filePath);
            }
            throw new FileNotFoundException("File not found");
        }

        public async Task<string> GetFileContentTypeAsync(string fileUrl)
        {
            var extension = Path.GetExtension(fileUrl).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                _ => "application/octet-stream"
            };
        }

        public string GetFileUrl(string fileName)
        {
            return $"/uploads/files/{fileName}";
        }
    }

    // Notification Service Implementation
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;

        public NotificationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return notification;
        }

        public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(string userId, bool unreadOnly = false)
        {
            var query = _context.Notifications.Where(n => n.RecipientUserId == userId);
            
            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }
            
            return await query.OrderByDescending(n => n.CreatedAt).ToListAsync();
        }

        public async Task<bool> MarkAsReadAsync(string notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientUserId == userId);
            
            if (notification != null)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return true;
            }
            
            return false;
        }

        public async Task<bool> MarkAllAsReadAsync(string userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.RecipientUserId == userId && !n.IsRead)
                .ToListAsync();
            
            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.RecipientUserId == userId && !n.IsRead);
        }

        public async Task<bool> DeleteNotificationAsync(string notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientUserId == userId);
            
            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
                return true;
            }
            
            return false;
        }
    }

    // Audit Service Implementation
    public class AuditService : IAuditService
    {
        private readonly ApplicationDbContext _context;

        public AuditService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async System.Threading.Tasks.Task LogAsync(string action, string entityType, string? entityId, string? userId, string? details = null, Dictionary<string, object>? changes = null)
        {
            var auditLog = new AuditLog
            {
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                UserId = userId,
                Details = details,
                Changes = changes != null ? JsonSerializer.Serialize(changes) : null,
                Timestamp = DateTime.UtcNow,
                IsSuccessful = true
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsAsync(string? entityType = null, string? entityId = null, string? userId = null, int page = 1, int pageSize = 50)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(a => a.EntityType == entityType);

            if (!string.IsNullOrEmpty(entityId))
                query = query.Where(a => a.EntityId == entityId);

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(a => a.UserId == userId);

            return await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}