using System.ComponentModel.DataAnnotations;

namespace B2BBackend.Models
{
    public class Lead : BaseEntity
    {
        [Required]
        public string CompanyName { get; set; } = string.Empty;
        
        public string? ContactPerson { get; set; }
        
        public string? ContactEmail { get; set; }
        
        public string? ContactPhone { get; set; }
        
        public string? JobTitle { get; set; }
        
        public string? Industry { get; set; }
        
        public string? CompanySize { get; set; }
        
        public string? Website { get; set; }
        
        public string? Country { get; set; }
        
        public string? City { get; set; }
        
        public string? Address { get; set; }
        
        public string Status { get; set; } = "new"; // new, contacted, qualified, proposal, negotiation, won, lost
        
        public string? Source { get; set; } // website, referral, cold_call, etc.
        
        public string? AssignedTo { get; set; } // User ID
        
        public decimal EstimatedValue { get; set; } = 0;
        
        public string? Currency { get; set; } = "AED";
        
        public DateTime? ExpectedCloseDate { get; set; }
        
        public int Priority { get; set; } = 3; // 1=High, 2=Medium, 3=Low
        
        public string? Requirements { get; set; }
        
        public string? Notes { get; set; }
        
        public string? Tags { get; set; } // JSON array
        
        public DateTime? LastContactDate { get; set; }
        
        public DateTime? NextFollowUpDate { get; set; }
        
        public int Score { get; set; } = 0; // Lead scoring
        
        public string? ConversionSource { get; set; }
        
        public string? ReferredBy { get; set; }
        
        public bool IsQualified { get; set; } = false;
        
        public DateTime? QualifiedDate { get; set; }
        
        public string? QualifiedBy { get; set; }
        
        public string? LostReason { get; set; }
        
        public DateTime? LostDate { get; set; }
        
        public string? WonReason { get; set; }
        
        public DateTime? WonDate { get; set; }
        
        // Additional fields for lead tracking
        public int TimeZoneOffset { get; set; } = 0;
        
        public string? PreferredContactMethod { get; set; } = "email";
        
        public string? PreferredContactTime { get; set; }
        
        public bool DoNotContact { get; set; } = false;
        
        public bool EmailOptOut { get; set; } = false;
        
        public bool SmsOptOut { get; set; } = false;
    }
}