using Microsoft.EntityFrameworkCore;
using B2BBackend.Models;

namespace B2BBackend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Main Entity Sets
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<Lead> Leads { get; set; }
        public DbSet<Quote> Quotes { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<Opportunity> Opportunities { get; set; }
        public DbSet<Communication> Communications { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<JobProfile> JobProfiles { get; set; }
        public DbSet<Country> Countries { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<Territory> Territories { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Nationality> Nationalities { get; set; }
        public DbSet<SkillLevel> SkillLevels { get; set; }
        public DbSet<CostComponent> CostComponents { get; set; }
        public DbSet<PricingRule> PricingRules { get; set; }
        public DbSet<Models.Task> Tasks { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<PriceRequest> PriceRequests { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<SalesMaterial> SalesMaterials { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<CustomerInteraction> CustomerInteractions { get; set; }
        public DbSet<CustomerResponseTemplate> CustomerResponseTemplates { get; set; }
        public DbSet<DiscountApprovalMatrix> DiscountApprovalMatrix { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure decimal precision for financial fields
            ConfigureDecimalPrecision(modelBuilder);

            // Configure indexes for better performance
            ConfigureIndexes(modelBuilder);

            // Configure default values and constraints
            ConfigureDefaults(modelBuilder);

            // Seed initial data
            SeedInitialData(modelBuilder);
        }

        private void ConfigureDecimalPrecision(ModelBuilder modelBuilder)
        {
            // Configure decimal properties with appropriate precision
            modelBuilder.Entity<Lead>()
                .Property(e => e.EstimatedValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Quote>()
                .Property(e => e.SubtotalAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Quote>()
                .Property(e => e.DiscountAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Quote>()
                .Property(e => e.DiscountPercentage)
                .HasPrecision(5, 2);
            modelBuilder.Entity<Quote>()
                .Property(e => e.TaxAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Quote>()
                .Property(e => e.TaxPercentage)
                .HasPrecision(5, 2);
            modelBuilder.Entity<Quote>()
                .Property(e => e.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Account>()
                .Property(e => e.AnnualRevenue)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Account>()
                .Property(e => e.CreditLimit)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Opportunity>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<JobProfile>()
                .Property(e => e.BaseRate)
                .HasPrecision(18, 2);
            modelBuilder.Entity<JobProfile>()
                .Property(e => e.MinRate)
                .HasPrecision(18, 2);
            modelBuilder.Entity<JobProfile>()
                .Property(e => e.MaxRate)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CostComponent>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<CostComponent>()
                .Property(e => e.Percentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<PricingRule>()
                .Property(e => e.Value)
                .HasPrecision(18, 2);
            modelBuilder.Entity<PricingRule>()
                .Property(e => e.Percentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<Contract>()
                .Property(e => e.ContractValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PriceRequest>()
                .Property(e => e.RequestedPrice)
                .HasPrecision(18, 2);
            modelBuilder.Entity<PriceRequest>()
                .Property(e => e.ApprovedPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<DiscountApprovalMatrix>()
                .Property(e => e.MinDiscount)
                .HasPrecision(5, 2);
            modelBuilder.Entity<DiscountApprovalMatrix>()
                .Property(e => e.MaxDiscount)
                .HasPrecision(5, 2);
            modelBuilder.Entity<DiscountApprovalMatrix>()
                .Property(e => e.MinOrderValue)
                .HasPrecision(18, 2);
            modelBuilder.Entity<DiscountApprovalMatrix>()
                .Property(e => e.MaxOrderValue)
                .HasPrecision(18, 2);
        }

        private void ConfigureIndexes(ModelBuilder modelBuilder)
        {
            // User indexes
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Status);

            // Lead indexes
            modelBuilder.Entity<Lead>()
                .HasIndex(l => l.Status);
            modelBuilder.Entity<Lead>()
                .HasIndex(l => l.AssignedTo);
            modelBuilder.Entity<Lead>()
                .HasIndex(l => l.CreatedAt);

            // Quote indexes
            modelBuilder.Entity<Quote>()
                .HasIndex(q => q.QuoteNumber)
                .IsUnique();
            modelBuilder.Entity<Quote>()
                .HasIndex(q => q.Status);
            modelBuilder.Entity<Quote>()
                .HasIndex(q => q.AssignedTo);
            modelBuilder.Entity<Quote>()
                .HasIndex(q => q.LeadId);

            // Account indexes
            modelBuilder.Entity<Account>()
                .HasIndex(a => a.Name);
            modelBuilder.Entity<Account>()
                .HasIndex(a => a.AssignedTo);
            modelBuilder.Entity<Account>()
                .HasIndex(a => a.Status);

            // Notification indexes
            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.RecipientUserId);
            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.IsRead);
            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.CreatedAt);

            // SystemSetting indexes
            modelBuilder.Entity<SystemSetting>()
                .HasIndex(s => s.Key)
                .IsUnique();
            modelBuilder.Entity<SystemSetting>()
                .HasIndex(s => s.Category);

            // Task indexes
            modelBuilder.Entity<Models.Task>()
                .HasIndex(t => t.AssignedTo);
            modelBuilder.Entity<Models.Task>()
                .HasIndex(t => t.Status);
            modelBuilder.Entity<Models.Task>()
                .HasIndex(t => t.DueDate);

            // AuditLog indexes
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.UserId);
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.EntityType);
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Timestamp);
        }

        private void ConfigureDefaults(ModelBuilder modelBuilder)
        {
            // Configure default values for CreatedAt and UpdatedAt
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(nameof(BaseEntity.CreatedAt))
                        .HasDefaultValueSql("datetime('now')");

                    modelBuilder.Entity(entityType.ClrType)
                        .Property(nameof(BaseEntity.UpdatedAt))
                        .HasDefaultValueSql("datetime('now')");
                }
            }
        }

        private void SeedInitialData(ModelBuilder modelBuilder)
        {
            // Seed default system settings
            modelBuilder.Entity<SystemSetting>().HasData(
                new SystemSetting
                {
                    Id = "sys_currency",
                    Key = "default_currency",
                    Value = "AED",
                    Description = "Default system currency",
                    Category = "general",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SystemSetting
                {
                    Id = "sys_timezone",
                    Key = "default_timezone",
                    Value = "Asia/Dubai",
                    Description = "Default system timezone",
                    Category = "general",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SystemSetting
                {
                    Id = "sys_language",
                    Key = "default_language",
                    Value = "en",
                    Description = "Default system language",
                    Category = "general",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );

            // Seed default roles
            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = "role_admin",
                    Name = "admin",
                    DisplayName = "Administrator",
                    Description = "Full system access",
                    Permissions = "[\"*\"]",
                    IsActive = true,
                    IsSystemRole = true,
                    Priority = 100,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Role
                {
                    Id = "role_user",
                    Name = "user",
                    DisplayName = "User",
                    Description = "Standard user access",
                    Permissions = "[\"read\", \"update_own\"]",
                    IsActive = true,
                    IsSystemRole = true,
                    Priority = 10,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Role
                {
                    Id = "role_manager",
                    Name = "manager",
                    DisplayName = "Manager", 
                    Description = "Manager level access",
                    Permissions = "[\"read\", \"create\", \"update\", \"delete_own\"]",
                    IsActive = true,
                    IsSystemRole = true,
                    Priority = 50,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );

            // Admin user is now created in Program.cs InitializeDatabaseAsync method
            // This ensures proper password hashing using UserService

            // Seed some basic countries
            modelBuilder.Entity<Country>().HasData(
                new Country
                {
                    Id = "country_ae",
                    Name = "United Arab Emirates",
                    Code = "AE",
                    Code3 = "ARE",
                    PhoneCode = "+971",
                    Currency = "AED",
                    CurrencyCode = "AED",
                    TimeZone = "Asia/Dubai",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Country
                {
                    Id = "country_us",
                    Name = "United States",
                    Code = "US",
                    Code3 = "USA",
                    PhoneCode = "+1",
                    Currency = "USD",
                    CurrencyCode = "USD",
                    TimeZone = "America/New_York",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Country
                {
                    Id = "country_sa",
                    Name = "Saudi Arabia",
                    Code = "SA",
                    Code3 = "SAU", 
                    PhoneCode = "+966",
                    Currency = "SAR",
                    CurrencyCode = "SAR",
                    TimeZone = "Asia/Riyadh",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );

            // Seed some basic job profiles to prevent empty table issues
            modelBuilder.Entity<JobProfile>().HasData(
                new JobProfile
                {
                    Id = "jp_software_dev",
                    Title = "Software Developer",
                    Description = "Full-stack software development",
                    Department = "IT",
                    Level = "Mid-Level",
                    RequiredSkills = "[\"C#\", \".NET\", \"React\", \"SQL\"]",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new JobProfile
                {
                    Id = "jp_project_mgr",
                    Title = "Project Manager",
                    Description = "Project management and coordination",
                    Department = "Operations",
                    Level = "Senior",
                    RequiredSkills = "[\"Project Management\", \"Agile\", \"Leadership\"]",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );

            // Seed some basic jobs to prevent empty table issues
            modelBuilder.Entity<Job>().HasData(
                new Job
                {
                    Id = "job_dev_001",
                    Title = "Senior Software Developer",
                    Description = "Lead development of B2B applications",
                    JobProfileId = "jp_software_dev",
                    Status = "open",
                    Priority = "high",
                    Department = "IT",
                    Location = "Dubai, UAE",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Job
                {
                    Id = "job_pm_001", 
                    Title = "Technical Project Manager",
                    Description = "Manage software development projects",
                    JobProfileId = "jp_project_mgr",
                    Status = "open",
                    Priority = "medium",
                    Department = "Operations", 
                    Location = "Remote",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries<BaseEntity>();

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}