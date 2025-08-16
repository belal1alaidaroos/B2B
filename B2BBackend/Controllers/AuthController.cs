using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using B2BBackend.Models;
using B2BBackend.Services;

namespace B2BBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;
        private readonly IAuditService _auditService;

        public AuthController(IAuthService authService, IUserService userService, IAuditService auditService)
        {
            _authService = authService;
            _userService = userService;
            _auditService = auditService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var token = await _authService.AuthenticateAsync(request.Email, request.Password);
                var user = await _userService.GetByEmailAsync(request.Email);
                
                await _auditService.LogAsync("login", "User", user?.Id, user?.Id, "User logged in successfully");
                
                return Ok(new { 
                    success = true, 
                    data = new { 
                        token, 
                        user = new { 
                            user.Id, 
                            user.Email, 
                            user.FullName, 
                            user.Roles, 
                            user.Permissions 
                        } 
                    } 
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                await _auditService.LogAsync("login_failed", "User", null, null, $"Failed login attempt for {request.Email}: {ex.Message}");
                return Unauthorized(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            // Debug logging
            Console.WriteLine($"[DEBUG] User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
            Console.WriteLine($"[DEBUG] User.Claims count: {User.Claims?.Count()}");
            foreach (var claim in User.Claims ?? Enumerable.Empty<System.Security.Claims.Claim>())
            {
                Console.WriteLine($"[DEBUG] Claim: {claim.Type} = {claim.Value}");
            }
            
                var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    Console.WriteLine($"[DEBUG] Extracted userId from claims: {userId}");
            
            if (userId == null)
            {
                Console.WriteLine("[DEBUG] No 'sub' claim found - returning Invalid token");
                return Unauthorized(new { success = false, message = "Invalid token" });
            }

            var user = await _userService.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            return Ok(new { 
                success = true, 
                data = new { 
                    user.Id, 
                    user.Email, 
                    user.FullName, 
                    user.FirstName, 
                    user.LastName, 
                    user.Status, 
                    user.Roles, 
                    user.Permissions, 
                    user.Language, 
                    user.TimeZone 
                } 
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirst("sub")?.Value;
            if (userId == null)
            {
                return Unauthorized(new { success = false, message = "Invalid token" });
            }

            var result = await _userService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            
            if (result)
            {
                await _auditService.LogAsync("password_changed", "User", userId, userId, "Password changed successfully");
                return Ok(new { success = true, message = "Password changed successfully" });
            }
            else
            {
                await _auditService.LogAsync("password_change_failed", "User", userId, userId, "Failed to change password - invalid current password");
                return BadRequest(new { success = false, message = "Current password is incorrect" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirst("sub")?.Value;
            await _auditService.LogAsync("logout", "User", userId, userId, "User logged out");
            
            return Ok(new { success = true, message = "Logged out successfully" });
        }

        [HttpPost("validate-token")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            return Ok(new { success = true, message = "Token is valid" });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}