using B2BBackend.Models;

namespace B2BBackend.Services
{
    // Authentication Service Interface
    public interface IAuthService
    {
        Task<string> AuthenticateAsync(string email, string password);
        Task<User?> GetCurrentUserAsync(string token);
        Task<bool> ValidateTokenAsync(string token);
        Task<User?> GetUserByIdAsync(string userId);
        string GenerateJwtToken(User user);
    }

    // User Service Interface
    public interface IUserService
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(string id);
        Task<IEnumerable<User>> GetAllAsync();
        Task<User> CreateAsync(User user, string password);
        Task<User> UpdateAsync(User user);
        Task<bool> DeleteAsync(string id);
        Task<bool> VerifyPasswordAsync(User user, string password);
        Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        Task<IEnumerable<User>> GetUsersByRoleAsync(string roleId);
    }

    // Email Service Interface
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string body, string? cc = null, string? bcc = null);
        Task<bool> SendEmailWithAttachmentsAsync(string to, string subject, string body, IEnumerable<string> attachmentPaths);
        Task<bool> SendTemplateEmailAsync(string to, string templateId, Dictionary<string, string> variables);
    }

    // File Upload Service Interface
    public interface IFileUploadService
    {
        Task<string> UploadFileAsync(IFormFile file, string? folder = null);
        Task<bool> DeleteFileAsync(string fileUrl);
        Task<byte[]> GetFileAsync(string fileUrl);
        Task<string> GetFileContentTypeAsync(string fileUrl);
        string GetFileUrl(string fileName);
    }

    // Notification Service Interface
    public interface INotificationService
    {
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task<IEnumerable<Notification>> GetUserNotificationsAsync(string userId, bool unreadOnly = false);
        Task<bool> MarkAsReadAsync(string notificationId, string userId);
        Task<bool> MarkAllAsReadAsync(string userId);
        Task<int> GetUnreadCountAsync(string userId);
        Task<bool> DeleteNotificationAsync(string notificationId, string userId);
    }

    // Audit Service Interface
    public interface IAuditService
    {
        System.Threading.Tasks.Task LogAsync(string action, string entityType, string? entityId, string? userId, string? details = null, Dictionary<string, object>? changes = null);
        System.Threading.Tasks.Task<IEnumerable<AuditLog>> GetAuditLogsAsync(string? entityType = null, string? entityId = null, string? userId = null, int page = 1, int pageSize = 50);
    }
}