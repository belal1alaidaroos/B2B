using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using B2BBackend.Models;
using B2BBackend.Services;

namespace B2BBackend.Controllers
{
    [ApiController]
    [Authorize]
    public abstract class BaseController : ControllerBase
    {
        protected readonly IUserService _userService;
        protected readonly IAuditService _auditService;

        protected BaseController(IUserService userService, IAuditService auditService)
        {
            _userService = userService;
            _auditService = auditService;
        }

        protected string? CurrentUserId => User.FindFirst("sub")?.Value;
        
        protected string? CurrentUserEmail => User.FindFirst("email")?.Value;

        protected async System.Threading.Tasks.Task<User?> GetCurrentUserAsync()
        {
            if (CurrentUserId != null)
            {
                return await _userService.GetByIdAsync(CurrentUserId);
            }
            return null;
        }

        protected async System.Threading.Tasks.Task LogAuditAsync(string action, string entityType, string? entityId = null, string? details = null, Dictionary<string, object>? changes = null)
        {
            await _auditService.LogAsync(action, entityType, entityId, CurrentUserId, details, changes);
        }

        protected IActionResult Success(object? data = null, string? message = null)
        {
            return Ok(new { success = true, data, message });
        }

        protected IActionResult Error(string message, int statusCode = 400)
        {
            return StatusCode(statusCode, new { success = false, message });
        }

        protected IActionResult NotFound(string message = "Resource not found")
        {
            return NotFound(new { success = false, message });
        }

        protected IActionResult Unauthorized(string message = "Unauthorized access")
        {
            return Unauthorized(new { success = false, message });
        }

        protected IActionResult Forbidden(string message = "Access forbidden")
        {
            return StatusCode(403, new { success = false, message });
        }
    }
}