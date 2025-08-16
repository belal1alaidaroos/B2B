using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using B2BBackend.Data;
using B2BBackend.Models;
using B2BBackend.Services;

namespace B2BBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntityController : BaseController
    {
        private readonly ApplicationDbContext _context;

        public EntityController(ApplicationDbContext context, IUserService userService, IAuditService auditService) 
            : base(userService, auditService)
        {
            _context = context;
        }

        // Generic list method for all entities
        [HttpGet("{entityType}")]
        public async Task<IActionResult> List(string entityType, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? filter = null)
        {
            try
            {
                var dbSet = GetDbSet(entityType);
                if (dbSet == null)
                {
                    return NotFound($"Entity type '{entityType}' not found");
                }

                var query = dbSet.AsQueryable();
                
                // Apply filtering if provided
                if (!string.IsNullOrEmpty(filter))
                {
                    query = ApplyFilter(query, filter, entityType);
                }

                var totalCount = await query.CountAsync();
                var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                return Success(new { 
                    items, 
                    totalCount, 
                    page, 
                    pageSize, 
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize) 
                });
            }
            catch (Exception ex)
            {
                return Error($"Failed to list {entityType}: {ex.Message}");
            }
        }

        // Filter method for complex queries
        [HttpPost("{entityType}/filter")]
        public async Task<IActionResult> Filter(string entityType, [FromBody] FilterRequest request)
        {
            try
            {
                var dbSet = GetDbSet(entityType);
                if (dbSet == null)
                {
                    return NotFound($"Entity type '{entityType}' not found");
                }

                var query = dbSet.AsQueryable();
                
                // Apply filters from the request
                if (request.Filters != null && request.Filters.Any())
                {
                    foreach (var filter in request.Filters)
                    {
                        query = ApplyPropertyFilter(query, filter.Property, filter.Value, filter.Operator ?? "equals");
                    }
                }

                // Apply sorting
                if (!string.IsNullOrEmpty(request.SortBy))
                {
                    query = ApplySort(query, request.SortBy, request.SortDirection ?? "asc");
                }

                var totalCount = await query.CountAsync();
                var items = await query.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToListAsync();

                return Success(new { 
                    items, 
                    totalCount, 
                    page = request.Page, 
                    pageSize = request.PageSize, 
                    totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize) 
                });
            }
            catch (Exception ex)
            {
                return Error($"Failed to filter {entityType}: {ex.Message}");
            }
        }

        // Create method
        [HttpPost("{entityType}")]
        public async Task<IActionResult> Create(string entityType, [FromBody] JsonElement data)
        {
            try
            {
                var entity = CreateEntityFromJson(entityType, data);
                if (entity == null)
                {
                    return BadRequest($"Failed to create entity of type '{entityType}'");
                }

                // Set audit fields
                if (entity is BaseEntity baseEntity)
                {
                    baseEntity.CreatedBy = CurrentUserId;
                    baseEntity.UpdatedBy = CurrentUserId;
                    baseEntity.CreatedAt = DateTime.UtcNow;
                    baseEntity.UpdatedAt = DateTime.UtcNow;
                }

                var dbSet = GetDbSet(entityType);
                dbSet.Add(entity);
                await _context.SaveChangesAsync();

                await LogAuditAsync("create", entityType, entity.GetType().GetProperty("Id")?.GetValue(entity)?.ToString(), $"Created {entityType}");

                return Success(entity, $"{entityType} created successfully");
            }
            catch (Exception ex)
            {
                return Error($"Failed to create {entityType}: {ex.Message}");
            }
        }

        // Update method
        [HttpPut("{entityType}/{id}")]
        public async Task<IActionResult> Update(string entityType, string id, [FromBody] JsonElement data)
        {
            try
            {
                var dbSet = GetDbSet(entityType);
                var entity = await FindEntityById(dbSet, id);
                
                if (entity == null)
                {
                    return NotFound($"{entityType} with ID '{id}' not found");
                }

                // Store original values for audit
                var originalValues = GetEntityValues(entity);

                // Update entity properties
                UpdateEntityFromJson(entity, data);

                // Set audit fields
                if (entity is BaseEntity baseEntity)
                {
                    baseEntity.UpdatedBy = CurrentUserId;
                    baseEntity.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                var updatedValues = GetEntityValues(entity);
                var changes = GetChanges(originalValues, updatedValues);

                await LogAuditAsync("update", entityType, id, $"Updated {entityType}", changes);

                return Success(entity, $"{entityType} updated successfully");
            }
            catch (Exception ex)
            {
                return Error($"Failed to update {entityType}: {ex.Message}");
            }
        }

        // Delete method
        [HttpDelete("{entityType}/{id}")]
        public async Task<IActionResult> Delete(string entityType, string id)
        {
            try
            {
                var dbSet = GetDbSet(entityType);
                var entity = await FindEntityById(dbSet, id);
                
                if (entity == null)
                {
                    return NotFound($"{entityType} with ID '{id}' not found");
                }

                dbSet.Remove(entity);
                await _context.SaveChangesAsync();

                await LogAuditAsync("delete", entityType, id, $"Deleted {entityType}");

                return Success(null, $"{entityType} deleted successfully");
            }
            catch (Exception ex)
            {
                return Error($"Failed to delete {entityType}: {ex.Message}");
            }
        }

        // Get by ID method
        [HttpGet("{entityType}/{id}")]
        public async Task<IActionResult> GetById(string entityType, string id)
        {
            try
            {
                var dbSet = GetDbSet(entityType);
                var entity = await FindEntityById(dbSet, id);
                
                if (entity == null)
                {
                    return NotFound($"{entityType} with ID '{id}' not found");
                }

                return Success(entity);
            }
            catch (Exception ex)
            {
                return Error($"Failed to get {entityType}: {ex.Message}");
            }
        }

        // Helper methods
        private DbSet<object>? GetDbSet(string entityType)
        {
            return entityType.ToLower() switch
            {
                "user" => _context.Users.Cast<object>().AsQueryable() as DbSet<object>,
                "lead" => _context.Leads.Cast<object>().AsQueryable() as DbSet<object>,
                "quote" => _context.Quotes.Cast<object>().AsQueryable() as DbSet<object>,
                "account" => _context.Accounts.Cast<object>().AsQueryable() as DbSet<object>,
                "contact" => _context.Contacts.Cast<object>().AsQueryable() as DbSet<object>,
                "opportunity" => _context.Opportunities.Cast<object>().AsQueryable() as DbSet<object>,
                "communication" => _context.Communications.Cast<object>().AsQueryable() as DbSet<object>,
                "role" => _context.Roles.Cast<object>().AsQueryable() as DbSet<object>,
                "job" => _context.Jobs.Cast<object>().AsQueryable() as DbSet<object>,
                "jobprofile" => _context.JobProfiles.Cast<object>().AsQueryable() as DbSet<object>,
                "country" => _context.Countries.Cast<object>().AsQueryable() as DbSet<object>,
                "city" => _context.Cities.Cast<object>().AsQueryable() as DbSet<object>,
                "territory" => _context.Territories.Cast<object>().AsQueryable() as DbSet<object>,
                "branch" => _context.Branches.Cast<object>().AsQueryable() as DbSet<object>,
                "department" => _context.Departments.Cast<object>().AsQueryable() as DbSet<object>,
                "nationality" => _context.Nationalities.Cast<object>().AsQueryable() as DbSet<object>,
                "skilllevel" => _context.SkillLevels.Cast<object>().AsQueryable() as DbSet<object>,
                "costcomponent" => _context.CostComponents.Cast<object>().AsQueryable() as DbSet<object>,
                "pricingrule" => _context.PricingRules.Cast<object>().AsQueryable() as DbSet<object>,
                "task" => _context.Tasks.Cast<object>().AsQueryable() as DbSet<object>,
                "notification" => _context.Notifications.Cast<object>().AsQueryable() as DbSet<object>,
                "systemsetting" => _context.SystemSettings.Cast<object>().AsQueryable() as DbSet<object>,
                "pricerequest" => _context.PriceRequests.Cast<object>().AsQueryable() as DbSet<object>,
                "contract" => _context.Contracts.Cast<object>().AsQueryable() as DbSet<object>,
                "salesmaterial" => _context.SalesMaterials.Cast<object>().AsQueryable() as DbSet<object>,
                "auditlog" => _context.AuditLogs.Cast<object>().AsQueryable() as DbSet<object>,
                "customerinteraction" => _context.CustomerInteractions.Cast<object>().AsQueryable() as DbSet<object>,
                "customerresponsetemplate" => _context.CustomerResponseTemplates.Cast<object>().AsQueryable() as DbSet<object>,
                "discountapprovalmatrix" => _context.DiscountApprovalMatrix.Cast<object>().AsQueryable() as DbSet<object>,
                _ => null
            };
        }

        private IQueryable<object> ApplyFilter(IQueryable<object> query, string filter, string entityType)
        {
            // Basic string filtering - in a real implementation, you'd want more sophisticated filtering
            // This is a simplified example
            if (entityType.ToLower() == "user")
            {
                return query.Cast<User>().Where(u => 
                    u.FullName.Contains(filter) || 
                    u.Email.Contains(filter) ||
                    u.Status.Contains(filter)
                ).Cast<object>();
            }
            // Add more entity-specific filters as needed
            
            return query;
        }

        private IQueryable<object> ApplyPropertyFilter(IQueryable<object> query, string property, string value, string operatorType)
        {
            // This would need to be implemented based on the specific property types and operators
            // For now, return the original query
            return query;
        }

        private IQueryable<object> ApplySort(IQueryable<object> query, string sortBy, string direction)
        {
            // Basic sorting implementation
            return query;
        }

        private object? CreateEntityFromJson(string entityType, JsonElement data)
        {
            var json = data.GetRawText();
            
            return entityType.ToLower() switch
            {
                "user" => JsonSerializer.Deserialize<User>(json),
                "lead" => JsonSerializer.Deserialize<Lead>(json),
                "quote" => JsonSerializer.Deserialize<Quote>(json),
                "account" => JsonSerializer.Deserialize<Account>(json),
                "contact" => JsonSerializer.Deserialize<Contact>(json),
                "opportunity" => JsonSerializer.Deserialize<Opportunity>(json),
                "communication" => JsonSerializer.Deserialize<Communication>(json),
                "role" => JsonSerializer.Deserialize<Role>(json),
                "job" => JsonSerializer.Deserialize<Job>(json),
                "jobprofile" => JsonSerializer.Deserialize<JobProfile>(json),
                "country" => JsonSerializer.Deserialize<Country>(json),
                "city" => JsonSerializer.Deserialize<City>(json),
                "territory" => JsonSerializer.Deserialize<Territory>(json),
                "branch" => JsonSerializer.Deserialize<Branch>(json),
                "department" => JsonSerializer.Deserialize<Department>(json),
                "nationality" => JsonSerializer.Deserialize<Nationality>(json),
                "skilllevel" => JsonSerializer.Deserialize<SkillLevel>(json),
                "costcomponent" => JsonSerializer.Deserialize<CostComponent>(json),
                "pricingrule" => JsonSerializer.Deserialize<PricingRule>(json),
                "task" => JsonSerializer.Deserialize<Models.Task>(json),
                "notification" => JsonSerializer.Deserialize<Notification>(json),
                "systemsetting" => JsonSerializer.Deserialize<SystemSetting>(json),
                "pricerequest" => JsonSerializer.Deserialize<PriceRequest>(json),
                "contract" => JsonSerializer.Deserialize<Contract>(json),
                "salesmaterial" => JsonSerializer.Deserialize<SalesMaterial>(json),
                "customerinteraction" => JsonSerializer.Deserialize<CustomerInteraction>(json),
                "customerresponsetemplate" => JsonSerializer.Deserialize<CustomerResponseTemplate>(json),
                "discountapprovalmatrix" => JsonSerializer.Deserialize<DiscountApprovalMatrix>(json),
                _ => null
            };
        }

        private void UpdateEntityFromJson(object entity, JsonElement data)
        {
            var json = data.GetRawText();
            var updatedEntity = JsonSerializer.Deserialize(json, entity.GetType());
            
            // Copy properties from updatedEntity to entity
            var properties = entity.GetType().GetProperties();
            foreach (var property in properties)
            {
                if (property.CanWrite && property.Name != "Id" && property.Name != "CreatedAt" && property.Name != "CreatedBy")
                {
                    var value = property.GetValue(updatedEntity);
                    property.SetValue(entity, value);
                }
            }
        }

        private async Task<object?> FindEntityById(DbSet<object> dbSet, string id)
        {
            return await dbSet.FirstOrDefaultAsync(e => EF.Property<string>(e, "Id") == id);
        }

        private Dictionary<string, object?> GetEntityValues(object entity)
        {
            var values = new Dictionary<string, object?>();
            var properties = entity.GetType().GetProperties();
            
            foreach (var property in properties)
            {
                values[property.Name] = property.GetValue(entity);
            }
            
            return values;
        }

        private Dictionary<string, object> GetChanges(Dictionary<string, object?> original, Dictionary<string, object?> updated)
        {
            var changes = new Dictionary<string, object>();
            
            foreach (var key in updated.Keys)
            {
                if (!original.ContainsKey(key) || !Equals(original[key], updated[key]))
                {
                    changes[key] = new { from = original.GetValueOrDefault(key), to = updated[key] };
                }
            }
            
            return changes;
        }
    }

    public class FilterRequest
    {
        public List<FilterItem>? Filters { get; set; }
        public string? SortBy { get; set; }
        public string? SortDirection { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    public class FilterItem
    {
        public string Property { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Operator { get; set; } = "equals";
    }
}