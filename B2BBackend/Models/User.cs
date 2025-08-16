using System.ComponentModel.DataAnnotations;

namespace B2BBackend.Models
{
    public class User : BaseEntity
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        public string? FirstName { get; set; }
        
        public string? LastName { get; set; }
        
        public string? ProfilePicture { get; set; }
        
        public string? Phone { get; set; }
        
        public string Status { get; set; } = "active"; // active, inactive, suspended
        
        public string? Position { get; set; }
        
        public string? Department { get; set; }
        
        public string? Branch { get; set; }
        
        public string? Territory { get; set; }
        
        public string? Country { get; set; }
        
        public string? City { get; set; }
        
        public string? Address { get; set; }
        
        public string? Nationality { get; set; }
        
        public DateTime? DateOfBirth { get; set; }
        
        public DateTime? HireDate { get; set; }
        
        public DateTime? LastLogin { get; set; }
        
        // Authentication
        public string PasswordHash { get; set; } = string.Empty;
        
        public string? PasswordSalt { get; set; }
        
        public DateTime? PasswordChangedAt { get; set; }
        
        public bool MustChangePassword { get; set; } = false;
        
        // Roles - stored as JSON array or comma-separated IDs
        public string Roles { get; set; } = "[]";
        
        // Permissions
        public string Permissions { get; set; } = "[]";
        
        // Additional properties
        public string? TimeZone { get; set; }
        
        public string? Language { get; set; } = "en";
        
        public string? Notes { get; set; }
        
        public bool IsEmailVerified { get; set; } = false;
        
        public bool IsPhoneVerified { get; set; } = false;
        
        public bool TwoFactorEnabled { get; set; } = false;
        
        public string? TwoFactorSecret { get; set; }
        
        public DateTime? LockedUntil { get; set; }
        
        public int FailedLoginAttempts { get; set; } = 0;
    }
}