using System.ComponentModel.DataAnnotations;

namespace B2BBackend.Models
{
    // Contact Model
    public class Contact : BaseEntity
    {
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        public string? FirstName { get; set; }
        
        public string? LastName { get; set; }
        
        public string? Email { get; set; }
        
        public string? Phone { get; set; }
        
        public string? Mobile { get; set; }
        
        public string? JobTitle { get; set; }
        
        public string? Department { get; set; }
        
        public string? AccountId { get; set; }
        
        public string? Address { get; set; }
        
        public string? City { get; set; }
        
        public string? Country { get; set; }
        
        public bool IsPrimary { get; set; } = false;
        
        public string Status { get; set; } = "active";
        
        public string? Notes { get; set; }
        
        public DateTime? LastContactDate { get; set; }
        
        public string? PreferredContactMethod { get; set; } = "email";
        
        public bool DoNotContact { get; set; } = false;
    }

    // Role Model
    public class Role : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string DisplayName { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Permissions { get; set; } = "[]"; // JSON array of permission IDs
        
        public bool IsActive { get; set; } = true;
        
        public bool IsSystemRole { get; set; } = false;
        
        public int Priority { get; set; } = 0;
    }

    // Permission Model
    public class Permission : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string DisplayName { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Category { get; set; } = "general";
        
        public string Action { get; set; } = "read"; // create, read, update, delete
        
        public string Resource { get; set; } = "*";
        
        public bool IsActive { get; set; } = true;
    }

    // Opportunity Model
    public class Opportunity : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? LeadId { get; set; }
        
        public string? AccountId { get; set; }
        
        public string? ContactId { get; set; }
        
        public string Stage { get; set; } = "prospecting";
        
        public decimal Amount { get; set; } = 0;
        
        public string Currency { get; set; } = "AED";
        
        public DateTime? CloseDate { get; set; }
        
        public int Probability { get; set; } = 0;
        
        public string? AssignedTo { get; set; }
        
        public string Status { get; set; } = "open";
        
        public string? Source { get; set; }
        
        public string? Campaign { get; set; }
        
        public string? Notes { get; set; }
        
        public DateTime? LastActivityDate { get; set; }
        
        public DateTime? NextActivityDate { get; set; }
    }

    // Communication Model
    public class Communication : BaseEntity
    {
        [Required]
        public string Type { get; set; } = "email"; // email, call, meeting, sms, note
        
        [Required]
        public string Subject { get; set; } = string.Empty;
        
        public string? Body { get; set; }
        
        public string? FromEmail { get; set; }
        
        public string? ToEmail { get; set; }
        
        public string? CcEmail { get; set; }
        
        public string? BccEmail { get; set; }
        
        public string? LeadId { get; set; }
        
        public string? AccountId { get; set; }
        
        public string? ContactId { get; set; }
        
        public string? OpportunityId { get; set; }
        
        public string? UserId { get; set; }
        
        public string Status { get; set; } = "sent";
        
        public DateTime? ScheduledDate { get; set; }
        
        public DateTime? SentDate { get; set; }
        
        public DateTime? DeliveredDate { get; set; }
        
        public DateTime? OpenedDate { get; set; }
        
        public DateTime? ClickedDate { get; set; }
        
        public string? Attachments { get; set; } // JSON array
        
        public string? Tags { get; set; } // JSON array
        
        public string? Notes { get; set; }
        
        public int Duration { get; set; } = 0; // For calls/meetings in minutes
        
        public string? Location { get; set; } // For meetings
        
        public string? MeetingUrl { get; set; } // For online meetings
        
        public string? Participants { get; set; } // JSON array for meetings
    }

    // Job Model
    public class Job : BaseEntity
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? Code { get; set; }
        
        public string? Category { get; set; }
        
        public string? Department { get; set; }
        
        public string Status { get; set; } = "active";
        
        public decimal? BaseSalary { get; set; }
        
        public decimal? MinSalary { get; set; }
        
        public decimal? MaxSalary { get; set; }
        
        public string? Currency { get; set; } = "AED";
        
        public string? Requirements { get; set; }
        
        public string? Benefits { get; set; }
        
        public int? ExperienceYears { get; set; }
        
        public string? EducationLevel { get; set; }
        
        public string? Skills { get; set; } // JSON array
        
        public bool IsActive { get; set; } = true;
    }

    // JobProfile Model
    public class JobProfile : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? JobId { get; set; }
        
        public string? Category { get; set; }
        
        public string? SkillLevel { get; set; }
        
        public decimal BaseRate { get; set; } = 0;
        
        public string Currency { get; set; } = "AED";
        
        public string RateType { get; set; } = "monthly"; // hourly, daily, monthly, yearly
        
        public decimal? MinRate { get; set; }
        
        public decimal? MaxRate { get; set; }
        
        public string? RequiredSkills { get; set; } // JSON array
        
        public string? OptionalSkills { get; set; } // JSON array
        
        public int? MinExperience { get; set; }
        
        public int? MaxExperience { get; set; }
        
        public string? EducationRequirements { get; set; }
        
        public string? Certifications { get; set; } // JSON array
        
        public bool IsActive { get; set; } = true;
        
        public string? Notes { get; set; }
    }

    // Country Model
    public class Country : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Code { get; set; } = string.Empty; // ISO country code
        
        public string? Code3 { get; set; } // ISO 3-letter country code
        
        public string? PhoneCode { get; set; }
        
        public string? Currency { get; set; }
        
        public string? CurrencyCode { get; set; }
        
        public string? TimeZone { get; set; }
        
        public string? Region { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public int? SortOrder { get; set; }
    }

    // City Model
    public class City : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Code { get; set; }
        
        [Required]
        public string CountryId { get; set; } = string.Empty;
        
        public string? TerritoryId { get; set; }
        
        public string? State { get; set; }
        
        public string? Region { get; set; }
        
        public string? TimeZone { get; set; }
        
        public decimal? Latitude { get; set; }
        
        public decimal? Longitude { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public int? SortOrder { get; set; }
    }

    // Territory Model
    public class Territory : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Code { get; set; }
        
        public string? Description { get; set; }
        
        public string? CountryId { get; set; }
        
        public string? Region { get; set; }
        
        public string? ManagerId { get; set; } // User ID
        
        public bool IsActive { get; set; } = true;
        
        public int? SortOrder { get; set; }
        
        public string? Notes { get; set; }
    }

    // Branch Model
    public class Branch : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Code { get; set; }
        
        public string? Description { get; set; }
        
        public string? Address { get; set; }
        
        public string? CityId { get; set; }
        
        public string? CountryId { get; set; }
        
        public string? TerritoryId { get; set; }
        
        public string? Phone { get; set; }
        
        public string? Email { get; set; }
        
        public string? ManagerId { get; set; } // User ID
        
        public bool IsActive { get; set; } = true;
        
        public bool IsHeadOffice { get; set; } = false;
        
        public string? TimeZone { get; set; }
        
        public string? WorkingHours { get; set; } // JSON object
        
        public int? SortOrder { get; set; }
    }

    // Department Model
    public class Department : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Code { get; set; }
        
        public string? Description { get; set; }
        
        public string? ParentDepartmentId { get; set; }
        
        public string? ManagerId { get; set; } // User ID
        
        public string? BranchId { get; set; }
        
        public decimal? Budget { get; set; }
        
        public string? Currency { get; set; } = "AED";
        
        public bool IsActive { get; set; } = true;
        
        public int? SortOrder { get; set; }
        
        public string? CostCenter { get; set; }
        
        public string? Notes { get; set; }
    }

    // Nationality Model
    public class Nationality : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Code { get; set; }
        
        public string? CountryId { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public int? SortOrder { get; set; }
    }

    // SkillLevel Model
    public class SkillLevel : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public int Level { get; set; } = 1; // 1=Beginner, 2=Intermediate, 3=Advanced, 4=Expert
        
        public decimal? Multiplier { get; set; } = 1.0m; // Rate multiplier for this skill level
        
        public bool IsActive { get; set; } = true;
        
        public int? SortOrder { get; set; }
        
        public string? Requirements { get; set; }
        
        public int? MinExperienceYears { get; set; }
    }

    // CostComponent Model
    public class CostComponent : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Type { get; set; } = "fixed"; // fixed, variable, percentage
        
        public decimal Amount { get; set; } = 0;
        
        public decimal? Percentage { get; set; }
        
        public string Currency { get; set; } = "AED";
        
        public string? ApplicableToJobProfiles { get; set; } // JSON array of job profile IDs
        
        public string? ApplicableToNationalities { get; set; } // JSON array of nationality IDs
        
        public string? ApplicableToCities { get; set; } // JSON array of city IDs
        
        public bool IsActive { get; set; } = true;
        
        public string? Category { get; set; }
        
        public int? SortOrder { get; set; }
        
        public string? Formula { get; set; } // For complex calculations
        
        public string? Notes { get; set; }
    }

    // PricingRule Model
    public class PricingRule : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Type { get; set; } = "markup"; // markup, discount, fixed_price, formula
        
        public decimal? Value { get; set; }
        
        public decimal? Percentage { get; set; }
        
        public string? Conditions { get; set; } // JSON object for rule conditions
        
        public string? ApplicableToJobProfiles { get; set; } // JSON array
        
        public string? ApplicableToNationalities { get; set; } // JSON array
        
        public string? ApplicableToCities { get; set; } // JSON array
        
        public string? ApplicableToSkillLevels { get; set; } // JSON array
        
        public bool IsActive { get; set; } = true;
        
        public int Priority { get; set; } = 0; // Higher priority rules are applied first
        
        public DateTime? ValidFrom { get; set; }
        
        public DateTime? ValidTo { get; set; }
        
        public string? Formula { get; set; } // For complex pricing formulas
        
        public string? Notes { get; set; }
    }

    // Task Model
    public class Task : BaseEntity
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Status { get; set; } = "pending"; // pending, in_progress, completed, cancelled
        
        public string Priority { get; set; } = "medium"; // low, medium, high, urgent
        
        public string? AssignedTo { get; set; } // User ID
        
        public string? AssignedBy { get; set; } // User ID
        
        public DateTime? DueDate { get; set; }
        
        public DateTime? StartDate { get; set; }
        
        public DateTime? CompletedDate { get; set; }
        
        public string? LeadId { get; set; }
        
        public string? AccountId { get; set; }
        
        public string? OpportunityId { get; set; }
        
        public string? ContactId { get; set; }
        
        public string? QuoteId { get; set; }
        
        public string Type { get; set; } = "general"; // call, email, meeting, follow_up, general
        
        public string? Category { get; set; }
        
        public int? EstimatedHours { get; set; }
        
        public int? ActualHours { get; set; }
        
        public string? Notes { get; set; }
        
        public string? Tags { get; set; } // JSON array
        
        public string? Attachments { get; set; } // JSON array
        
        public bool IsRecurring { get; set; } = false;
        
        public string? RecurrencePattern { get; set; } // JSON object
    }

    // Notification Model
    public class Notification : BaseEntity
    {
        [Required]
        public string RecipientUserId { get; set; } = string.Empty;
        
        public string? SenderUserId { get; set; }
        
        [Required]
        public string Type { get; set; } = "info"; // info, warning, error, success, discount_request, discount_approved, etc.
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public string? Data { get; set; } // JSON object with notification-specific data
        
        public string Priority { get; set; } = "medium"; // low, medium, high
        
        public bool IsRead { get; set; } = false;
        
        public DateTime? ReadAt { get; set; }
        
        public string? ActionUrl { get; set; }
        
        public string? ActionText { get; set; }
        
        public bool RequiresAction { get; set; } = false;
        
        public DateTime? ExpiresAt { get; set; }
        
        public string? Category { get; set; }
        
        public string? RelatedEntityType { get; set; } // Quote, Lead, etc.
        
        public string? RelatedEntityId { get; set; }
    }

    // SystemSetting Model
    public class SystemSetting : BaseEntity
    {
        [Required]
        public string Key { get; set; } = string.Empty;
        
        [Required]
        public string Value { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Type { get; set; } = "string"; // string, number, boolean, json
        
        public string Category { get; set; } = "general";
        
        public bool IsPublic { get; set; } = false; // Can be accessed by frontend
        
        public bool IsReadOnly { get; set; } = false;
        
        public string? DefaultValue { get; set; }
        
        public string? ValidationRules { get; set; } // JSON object
        
        public int? SortOrder { get; set; }
    }

    // PriceRequest Model
    public class PriceRequest : BaseEntity
    {
        [Required]
        public string RequestNumber { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? LeadId { get; set; }
        
        public string? OpportunityId { get; set; }
        
        public string? RequestedBy { get; set; } // User ID
        
        public string? AssignedToFinance { get; set; } // User ID
        
        public string Status { get; set; } = "pending"; // pending, under_review, approved, rejected
        
        public string Priority { get; set; } = "medium";
        
        public DateTime? RequestedDate { get; set; }
        
        public DateTime? RequiredByDate { get; set; }
        
        public DateTime? ResponseDate { get; set; }
        
        public string? JobProfileId { get; set; }
        
        public int Quantity { get; set; } = 1;
        
        public decimal? RequestedPrice { get; set; }
        
        public decimal? ApprovedPrice { get; set; }
        
        public string Currency { get; set; } = "AED";
        
        public string? Justification { get; set; }
        
        public string? NotesFromFinance { get; set; }
        
        public string? Requirements { get; set; }
        
        public string? Attachments { get; set; } // JSON array
        
        public string? Tags { get; set; } // JSON array
        
        public string? FinanceResponse { get; set; } // JSON object with detailed response
    }

    // Contract Model
    public class Contract : BaseEntity
    {
        [Required]
        public string ContractNumber { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? AccountId { get; set; }
        
        public string? ContactId { get; set; }
        
        public string? QuoteId { get; set; }
        
        public string? OpportunityId { get; set; }
        
        public string Status { get; set; } = "draft"; // draft, active, expired, terminated, completed
        
        public string Type { get; set; } = "service"; // service, product, maintenance, etc.
        
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        public decimal ContractValue { get; set; } = 0;
        
        public string Currency { get; set; } = "AED";
        
        public string? PaymentTerms { get; set; }
        
        public string? DeliveryTerms { get; set; }
        
        public string? TermsAndConditions { get; set; }
        
        public string? OwnerUserId { get; set; }
        
        public string? CustomerSignedBy { get; set; }
        
        public DateTime? CustomerSignedDate { get; set; }
        
        public string? CompanySignedBy { get; set; }
        
        public DateTime? CompanySignedDate { get; set; }
        
        public string? DocumentUrl { get; set; }
        
        public string? Attachments { get; set; } // JSON array
        
        public string? Notes { get; set; }
        
        public DateTime? RenewalDate { get; set; }
        
        public bool AutoRenewal { get; set; } = false;
        
        public int? RenewalPeriodMonths { get; set; }
        
        public string? RenewalTerms { get; set; }
    }

    // SalesMaterial Model
    public class SalesMaterial : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Type { get; set; } = "document"; // document, video, image, presentation, etc.
        
        public string? Category { get; set; }
        
        public string? FileUrl { get; set; }
        
        public string? FileName { get; set; }
        
        public string? MimeType { get; set; }
        
        public long? FileSize { get; set; }
        
        public string? Version { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public bool IsPublic { get; set; } = false;
        
        public string? Tags { get; set; } // JSON array
        
        public string? UploadedBy { get; set; } // User ID
        
        public DateTime? LastDownloaded { get; set; }
        
        public int DownloadCount { get; set; } = 0;
        
        public string? AccessLevel { get; set; } = "internal"; // public, internal, restricted
        
        public string? AllowedRoles { get; set; } // JSON array of role IDs
        
        public string? Notes { get; set; }
        
        public DateTime? ExpiryDate { get; set; }
    }

    // AuditLog Model
    public class AuditLog : BaseEntity
    {
        [Required]
        public string Action { get; set; } = string.Empty; // create, update, delete, login, logout, etc.
        
        [Required]
        public string EntityType { get; set; } = string.Empty; // User, Lead, Quote, etc.
        
        public string? EntityId { get; set; }
        
        public string? UserId { get; set; }
        
        public string? UserName { get; set; }
        
        public string? UserEmail { get; set; }
        
        public string? IpAddress { get; set; }
        
        public string? UserAgent { get; set; }
        
        public string? Changes { get; set; } // JSON object with before/after values
        
        public string? Details { get; set; }
        
        public string? Category { get; set; }
        
        public string? Severity { get; set; } = "info"; // info, warning, error, critical
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public string? SessionId { get; set; }
        
        public string? RequestId { get; set; }
        
        public bool IsSuccessful { get; set; } = true;
        
        public string? ErrorMessage { get; set; }
        
        public string? AdditionalData { get; set; } // JSON object for extra metadata
    }

    // CustomerInteraction Model
    public class CustomerInteraction : BaseEntity
    {
        [Required]
        public string Type { get; set; } = "call"; // call, email, meeting, chat, support_ticket
        
        [Required]
        public string Subject { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? CustomerId { get; set; } // Account ID
        
        public string? ContactId { get; set; }
        
        public string? LeadId { get; set; }
        
        public string? OpportunityId { get; set; }
        
        public string? StaffUserId { get; set; }
        
        public string Direction { get; set; } = "outbound"; // inbound, outbound
        
        public string Status { get; set; } = "completed"; // scheduled, completed, cancelled, no_answer
        
        public DateTime? InteractionDate { get; set; }
        
        public int? Duration { get; set; } // in minutes
        
        public string? Outcome { get; set; }
        
        public string? NextAction { get; set; }
        
        public DateTime? NextActionDate { get; set; }
        
        public string? Notes { get; set; }
        
        public string? Attachments { get; set; } // JSON array
        
        public string? Tags { get; set; } // JSON array
        
        public int? Rating { get; set; } // 1-5 customer satisfaction rating
        
        public string? Feedback { get; set; } // Customer feedback
        
        public string? Channel { get; set; } // phone, email, whatsapp, etc.
        
        public bool RequiresFollowUp { get; set; } = false;
        
        public string? FollowUpAssignedTo { get; set; } // User ID
    }

    // CustomerResponseTemplate Model
    public class CustomerResponseTemplate : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Type { get; set; } = "email"; // email, sms, chat
        
        public string? Category { get; set; }
        
        public string? Subject { get; set; }
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public string? Variables { get; set; } // JSON array of available variables
        
        public bool IsActive { get; set; } = true;
        
        public new string? CreatedBy { get; set; } // User ID
        
        public int UsageCount { get; set; } = 0;
        
        public DateTime? LastUsed { get; set; }
        
        public string? Tags { get; set; } // JSON array
        
        public string? AccessLevel { get; set; } = "all"; // all, department, user
        
        public string? AllowedUsers { get; set; } // JSON array of user IDs
        
        public string? AllowedDepartments { get; set; } // JSON array of department IDs
    }

    // DiscountApprovalMatrix Model
    public class DiscountApprovalMatrix : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string DiscountType { get; set; } = "percentage"; // percentage, fixed_amount
        
        public decimal MinDiscount { get; set; } = 0;
        
        public decimal MaxDiscount { get; set; } = 100;
        
        public decimal? MinOrderValue { get; set; }
        
        public decimal? MaxOrderValue { get; set; }
        
        public string? RequiredRoleId { get; set; } // Role ID that can approve this discount level
        
        public string? ApproverUserIds { get; set; } // JSON array of specific user IDs who can approve
        
        public bool RequiresJustification { get; set; } = true;
        
        public bool IsActive { get; set; } = true;
        
        public int Priority { get; set; } = 0; // Higher priority rules are checked first
        
        public string? Conditions { get; set; } // JSON object for additional conditions
        
        public string? ApplicableToProducts { get; set; } // JSON array of product/service IDs
        
        public string? ApplicableToCustomers { get; set; } // JSON array of customer IDs
        
        public string? Notes { get; set; }
    }
}