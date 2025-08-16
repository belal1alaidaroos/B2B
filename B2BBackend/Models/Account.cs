using System.ComponentModel.DataAnnotations;

namespace B2BBackend.Models
{
    public class Account : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? CompanyCode { get; set; }
        
        public string? Industry { get; set; }
        
        public string? Type { get; set; } = "customer"; // customer, prospect, partner, supplier
        
        public string? Website { get; set; }
        
        public string? Phone { get; set; }
        
        public string? Email { get; set; }
        
        public string? Fax { get; set; }
        
        // Address Information
        public string? BillingAddress { get; set; }
        
        public string? BillingCity { get; set; }
        
        public string? BillingState { get; set; }
        
        public string? BillingCountry { get; set; }
        
        public string? BillingPostalCode { get; set; }
        
        public string? ShippingAddress { get; set; }
        
        public string? ShippingCity { get; set; }
        
        public string? ShippingState { get; set; }
        
        public string? ShippingCountry { get; set; }
        
        public string? ShippingPostalCode { get; set; }
        
        // Business Information
        public string? TaxId { get; set; }
        
        public string? RegistrationNumber { get; set; }
        
        public string? VatNumber { get; set; }
        
        public string? CompanySize { get; set; }
        
        public decimal AnnualRevenue { get; set; } = 0;
        
        public int NumberOfEmployees { get; set; } = 0;
        
        // Financial Information
        public string? Currency { get; set; } = "AED";
        
        public string? PaymentTerms { get; set; }
        
        public decimal CreditLimit { get; set; } = 0;
        
        public string? PaymentMethod { get; set; }
        
        // Relationship Management
        public string? AssignedTo { get; set; } // User ID - Account Manager
        
        public string? ParentAccountId { get; set; }
        
        public string? Territory { get; set; }
        
        public string? Branch { get; set; }
        
        public string Status { get; set; } = "active"; // active, inactive, suspended
        
        public int Priority { get; set; } = 3; // 1=High, 2=Medium, 3=Low
        
        // Additional Information
        public string? Description { get; set; }
        
        public string? Notes { get; set; }
        
        public string? Tags { get; set; } // JSON array
        
        public string? SocialMediaLinks { get; set; } // JSON object
        
        public DateTime? LastContactDate { get; set; }
        
        public DateTime? NextReviewDate { get; set; }
        
        // Contract Information
        public DateTime? ContractStartDate { get; set; }
        
        public DateTime? ContractEndDate { get; set; }
        
        public string? ContractType { get; set; }
        
        public string? ServiceLevel { get; set; }
        
        // Marketing
        public bool DoNotEmail { get; set; } = false;
        
        public bool DoNotCall { get; set; } = false;
        
        public bool DoNotMail { get; set; } = false;
        
        public string? PreferredContactMethod { get; set; } = "email";
        
        // Custom Fields
        public string? CustomFields { get; set; } // JSON object
    }
}