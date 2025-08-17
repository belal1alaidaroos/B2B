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
                var query = GetEntityQuery(entityType);
                if (query == null)
                {
                    return NotFound($"Entity type '{entityType}' not found");
                }
                
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
                // Handle each entity type specifically to maintain type safety
                return entityType.ToLower() switch
                {
                    "notification" => await FilterNotifications(request),
                    _ => await FilterGeneric(entityType, request)
                };
            }
            catch (Exception ex)
            {
                return Error($"Failed to filter {entityType}: {ex.Message}");
            }
        }

        private async Task<IActionResult> FilterNotifications(FilterRequest request)
        {
            var query = _context.Notifications.AsQueryable();

            // Apply filters specific to Notification entity
            if (request.Filters != null && request.Filters.Any())
            {
                foreach (var filter in request.Filters)
                {
                    switch (filter.Property.ToLower())
                    {
                        case "isread":
                            if (bool.TryParse(filter.Value, out bool isRead))
                            {
                                query = query.Where(n => n.IsRead == isRead);
                            }
                            break;
                        case "recipientuserid":
                            query = query.Where(n => n.RecipientUserId == filter.Value);
                            break;
                        case "type":
                            query = query.Where(n => n.Type == filter.Value);
                            break;
                        case "priority":
                            query = query.Where(n => n.Priority == filter.Value);
                            break;
                    }
                }
            }

            // Apply sorting
            if (!string.IsNullOrEmpty(request.SortBy))
            {
                switch (request.SortBy.ToLower())
                {
                    case "createdat":
                    case "created_date":
                        query = request.SortDirection?.ToLower() == "desc" 
                            ? query.OrderByDescending(n => n.CreatedAt)
                            : query.OrderBy(n => n.CreatedAt);
                        break;
                    case "updatedat":
                        query = request.SortDirection?.ToLower() == "desc" 
                            ? query.OrderByDescending(n => n.UpdatedAt)
                            : query.OrderBy(n => n.UpdatedAt);
                        break;
                    default:
                        query = query.OrderByDescending(n => n.CreatedAt); // Default sort
                        break;
                }
            }
            else
            {
                query = query.OrderByDescending(n => n.CreatedAt); // Default sort
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

        private async Task<IActionResult> FilterGeneric(string entityType, FilterRequest request)
        {
            var query = GetEntityQuery(entityType);
            if (query == null)
            {
                return NotFound($"Entity type '{entityType}' not found");
            }

            // For now, just return all items without filtering for other entities
            // This can be expanded later for other entity types
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

                AddEntityToContext(entityType, entity);
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
                var query = GetEntityQuery(entityType);
                if (query == null)
                {
                    return NotFound($"Entity type '{entityType}' not found");
                }
                var entity = await FindEntityById(query, id);
                
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
                var query = GetEntityQuery(entityType);
                if (query == null)
                {
                    return NotFound($"Entity type '{entityType}' not found");
                }
                var entity = await FindEntityById(query, id);
                
                if (entity == null)
                {
                    return NotFound($"{entityType} with ID '{id}' not found");
                }

                RemoveEntityFromContext(entityType, entity);
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
                var query = GetEntityQuery(entityType);
                if (query == null)
                {
                    return NotFound($"Entity type '{entityType}' not found");
                }
                var entity = await FindEntityById(query, id);
                
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
        private IQueryable<object>? GetEntityQuery(string entityType)
        {
            return entityType.ToLower() switch
            {
                "user" => _context.Users.Cast<object>(),
                "lead" => _context.Leads.Cast<object>(),
                "quote" => _context.Quotes.Cast<object>(),
                "account" => _context.Accounts.Cast<object>(),
                "contact" => _context.Contacts.Cast<object>(),
                "opportunity" => _context.Opportunities.Cast<object>(),
                "communication" => _context.Communications.Cast<object>(),
                "role" => _context.Roles.Cast<object>(),
                "job" => _context.Jobs.Cast<object>(),
                "jobprofile" => _context.JobProfiles.Cast<object>(),
                "country" => _context.Countries.Cast<object>(),
                "city" => _context.Cities.Cast<object>(),
                "territory" => _context.Territories.Cast<object>(),
                "branch" => _context.Branches.Cast<object>(),
                "department" => _context.Departments.Cast<object>(),
                "nationality" => _context.Nationalities.Cast<object>(),
                "skilllevel" => _context.SkillLevels.Cast<object>(),
                "costcomponent" => _context.CostComponents.Cast<object>(),
                "pricingrule" => _context.PricingRules.Cast<object>(),
                "task" => _context.Tasks.Cast<object>(),
                "notification" => _context.Notifications.Cast<object>(),
                "systemsetting" => _context.SystemSettings.Cast<object>(),
                "pricerequest" => _context.PriceRequests.Cast<object>(),
                "contract" => _context.Contracts.Cast<object>(),
                "salesmaterial" => _context.SalesMaterials.Cast<object>(),
                "auditlog" => _context.AuditLogs.Cast<object>(),
                "customerinteraction" => _context.CustomerInteractions.Cast<object>(),
                "customerresponsetemplate" => _context.CustomerResponseTemplates.Cast<object>(),
                "discountapprovalmatrix" => _context.DiscountApprovalMatrix.Cast<object>(),
                _ => null
            };
        }

        private void AddEntityToContext(string entityType, object entity)
        {
            switch (entityType.ToLower())
            {
                case "user": _context.Users.Add((User)entity); break;
                case "lead": _context.Leads.Add((Lead)entity); break;
                case "quote": _context.Quotes.Add((Quote)entity); break;
                case "account": _context.Accounts.Add((Account)entity); break;
                case "contact": _context.Contacts.Add((Contact)entity); break;
                case "opportunity": _context.Opportunities.Add((Opportunity)entity); break;
                case "communication": _context.Communications.Add((Communication)entity); break;
                case "role": _context.Roles.Add((Role)entity); break;
                case "job": _context.Jobs.Add((Job)entity); break;
                case "jobprofile": _context.JobProfiles.Add((JobProfile)entity); break;
                case "country": _context.Countries.Add((Country)entity); break;
                case "city": _context.Cities.Add((City)entity); break;
                case "territory": _context.Territories.Add((Territory)entity); break;
                case "branch": _context.Branches.Add((Branch)entity); break;
                case "department": _context.Departments.Add((Department)entity); break;
                case "nationality": _context.Nationalities.Add((Nationality)entity); break;
                case "skilllevel": _context.SkillLevels.Add((SkillLevel)entity); break;
                case "costcomponent": _context.CostComponents.Add((CostComponent)entity); break;
                case "pricingrule": _context.PricingRules.Add((PricingRule)entity); break;
                case "task": _context.Tasks.Add((Models.Task)entity); break;
                case "notification": _context.Notifications.Add((Notification)entity); break;
                case "systemsetting": _context.SystemSettings.Add((SystemSetting)entity); break;
                case "pricerequest": _context.PriceRequests.Add((PriceRequest)entity); break;
                case "contract": _context.Contracts.Add((Contract)entity); break;
                case "salesmaterial": _context.SalesMaterials.Add((SalesMaterial)entity); break;
                case "auditlog": _context.AuditLogs.Add((AuditLog)entity); break;
                case "customerinteraction": _context.CustomerInteractions.Add((CustomerInteraction)entity); break;
                case "customerresponsetemplate": _context.CustomerResponseTemplates.Add((CustomerResponseTemplate)entity); break;
                case "discountapprovalmatrix": _context.DiscountApprovalMatrix.Add((DiscountApprovalMatrix)entity); break;
            }
        }

        private void RemoveEntityFromContext(string entityType, object entity)
        {
            switch (entityType.ToLower())
            {
                case "user": _context.Users.Remove((User)entity); break;
                case "lead": _context.Leads.Remove((Lead)entity); break;
                case "quote": _context.Quotes.Remove((Quote)entity); break;
                case "account": _context.Accounts.Remove((Account)entity); break;
                case "contact": _context.Contacts.Remove((Contact)entity); break;
                case "opportunity": _context.Opportunities.Remove((Opportunity)entity); break;
                case "communication": _context.Communications.Remove((Communication)entity); break;
                case "role": _context.Roles.Remove((Role)entity); break;
                case "job": _context.Jobs.Remove((Job)entity); break;
                case "jobprofile": _context.JobProfiles.Remove((JobProfile)entity); break;
                case "country": _context.Countries.Remove((Country)entity); break;
                case "city": _context.Cities.Remove((City)entity); break;
                case "territory": _context.Territories.Remove((Territory)entity); break;
                case "branch": _context.Branches.Remove((Branch)entity); break;
                case "department": _context.Departments.Remove((Department)entity); break;
                case "nationality": _context.Nationalities.Remove((Nationality)entity); break;
                case "skilllevel": _context.SkillLevels.Remove((SkillLevel)entity); break;
                case "costcomponent": _context.CostComponents.Remove((CostComponent)entity); break;
                case "pricingrule": _context.PricingRules.Remove((PricingRule)entity); break;
                case "task": _context.Tasks.Remove((Models.Task)entity); break;
                case "notification": _context.Notifications.Remove((Notification)entity); break;
                case "systemsetting": _context.SystemSettings.Remove((SystemSetting)entity); break;
                case "pricerequest": _context.PriceRequests.Remove((PriceRequest)entity); break;
                case "contract": _context.Contracts.Remove((Contract)entity); break;
                case "salesmaterial": _context.SalesMaterials.Remove((SalesMaterial)entity); break;
                case "auditlog": _context.AuditLogs.Remove((AuditLog)entity); break;
                case "customerinteraction": _context.CustomerInteractions.Remove((CustomerInteraction)entity); break;
                case "customerresponsetemplate": _context.CustomerResponseTemplates.Remove((CustomerResponseTemplate)entity); break;
                case "discountapprovalmatrix": _context.DiscountApprovalMatrix.Remove((DiscountApprovalMatrix)entity); break;
            }
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

        private async Task<object?> FindEntityById(IQueryable<object> query, string id)
        {
            return await query.FirstOrDefaultAsync(e => EF.Property<string>(e, "Id") == id);
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