using System.ComponentModel.DataAnnotations;

namespace B2BBackend.Models
{
    public class Quote : BaseEntity
    {
        [Required]
        public string QuoteNumber { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string Status { get; set; } = "draft"; // draft, sent, approved, rejected, expired, accepted
        
        public string? LeadId { get; set; } // Reference to Lead
        
        public string? OpportunityId { get; set; } // Reference to Opportunity
        
        public string? AccountId { get; set; } // Reference to Account
        
        public string? ContactId { get; set; } // Reference to Contact
        
        public string? AssignedTo { get; set; } // User ID
        
        public string? CreatorUserId { get; set; } // User ID who created the quote
        
        // Pricing Information
        public decimal SubtotalAmount { get; set; } = 0;
        
        public decimal DiscountAmount { get; set; } = 0;
        
        public decimal DiscountPercentage { get; set; } = 0;
        
        public decimal TaxAmount { get; set; } = 0;
        
        public decimal TaxPercentage { get; set; } = 0;
        
        public decimal TotalAmount { get; set; } = 0;
        
        public string Currency { get; set; } = "AED";
        
        // Quote Details
        public DateTime? ValidUntil { get; set; }
        
        public DateTime? SentDate { get; set; }
        
        public DateTime? ApprovedDate { get; set; }
        
        public DateTime? RejectedDate { get; set; }
        
        public DateTime? AcceptedDate { get; set; }
        
        public string? RejectionReason { get; set; }
        
        public string? ApprovalNotes { get; set; }
        
        // Payment Terms
        public string? PaymentTerms { get; set; }
        
        public string? DeliveryTerms { get; set; }
        
        public int PaymentDays { get; set; } = 30;
        
        // Quote Line Items (stored as JSON)
        public string LineItems { get; set; } = "[]";
        
        // Attachments (stored as JSON array of file URLs)
        public string Attachments { get; set; } = "[]";
        
        // Terms and Conditions
        public string? TermsAndConditions { get; set; }
        
        public string? Notes { get; set; }
        
        public string? InternalNotes { get; set; }
        
        // Discount Approval
        public bool RequiresDiscountApproval { get; set; } = false;
        
        public string? DiscountApprovalStatus { get; set; } // pending, approved, rejected
        
        public string? DiscountApprovedBy { get; set; }
        
        public DateTime? DiscountApprovedDate { get; set; }
        
        public string? DiscountApprovalNotes { get; set; }
        
        public string? DiscountJustification { get; set; }
        
        public string? DiscountType { get; set; } // percentage, fixed_amount
        
        // Customer Information (copied at quote creation for historical purposes)
        public string? CustomerName { get; set; }
        
        public string? CustomerEmail { get; set; }
        
        public string? CustomerPhone { get; set; }
        
        public string? CustomerAddress { get; set; }
        
        public string? CustomerCountry { get; set; }
        
        public string? CustomerCity { get; set; }
        
        // Version Control
        public int Version { get; set; } = 1;
        
        public string? ParentQuoteId { get; set; } // For quote revisions
        
        public bool IsLatestVersion { get; set; } = true;
        
        // Tracking
        public DateTime? LastViewedDate { get; set; }
        
        public string? LastViewedBy { get; set; }
        
        public int ViewCount { get; set; } = 0;
        
        public bool IsTemplate { get; set; } = false;
        
        public string? TemplateCategory { get; set; }
        
        // Additional Metadata
        public string? Industry { get; set; }
        
        public string? ProjectType { get; set; }
        
        public string? Tags { get; set; } // JSON array
        
        public string? CustomFields { get; set; } // JSON object for additional custom fields
    }
}