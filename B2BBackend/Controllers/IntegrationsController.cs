using Microsoft.AspNetCore.Mvc;
using B2BBackend.Services;

namespace B2BBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IntegrationsController : BaseController
    {
        private readonly IEmailService _emailService;
        private readonly IFileUploadService _fileUploadService;
        private readonly INotificationService _notificationService;

        public IntegrationsController(
            IEmailService emailService, 
            IFileUploadService fileUploadService, 
            INotificationService notificationService,
            IUserService userService, 
            IAuditService auditService) 
            : base(userService, auditService)
        {
            _emailService = emailService;
            _fileUploadService = fileUploadService;
            _notificationService = notificationService;
        }

        // Core Integration Endpoints

        // InvokeLLM - Mock AI/LLM integration
        [HttpPost("core/invoke-llm")]
        public async Task<IActionResult> InvokeLLM([FromBody] LLMRequest request)
        {
            try
            {
                // Mock LLM response - in real implementation, integrate with OpenAI, Azure AI, etc.
                var response = new
                {
                    response = $"AI Response to: {request.Prompt}",
                    model = request.Model ?? "gpt-3.5-turbo",
                    usage = new { prompt_tokens = 10, completion_tokens = 20, total_tokens = 30 }
                };

                await LogAuditAsync("llm_invoke", "Integration", null, $"LLM invoked with prompt: {request.Prompt}");

                return Success(response);
            }
            catch (Exception ex)
            {
                return Error($"Failed to invoke LLM: {ex.Message}");
            }
        }

        // SendEmail - Email integration
        [HttpPost("core/send-email")]
        public async Task<IActionResult> SendEmail([FromBody] SendEmailRequest request)
        {
            try
            {
                var result = await _emailService.SendEmailAsync(
                    request.To, 
                    request.Subject, 
                    request.Body, 
                    request.Cc, 
                    request.Bcc
                );

                await LogAuditAsync("email_sent", "Integration", null, $"Email sent to: {request.To}");

                return Success(new { sent = result, message_id = Guid.NewGuid().ToString() });
            }
            catch (Exception ex)
            {
                return Error($"Failed to send email: {ex.Message}");
            }
        }

        // UploadFile - File upload integration
        [HttpPost("core/upload-file")]
        public async Task<IActionResult> UploadFile([FromForm] UploadFileRequest request)
        {
            try
            {
                if (request.File == null || request.File.Length == 0)
                {
                    return Error("No file provided");
                }

                var fileUrl = await _fileUploadService.UploadFileAsync(request.File, request.Folder);

                await LogAuditAsync("file_uploaded", "Integration", null, $"File uploaded: {request.File.FileName}");

                return Success(new 
                { 
                    file_url = fileUrl,
                    file_name = request.File.FileName,
                    file_size = request.File.Length,
                    content_type = request.File.ContentType
                });
            }
            catch (Exception ex)
            {
                return Error($"Failed to upload file: {ex.Message}");
            }
        }

        // GenerateImage - Mock image generation
        [HttpPost("core/generate-image")]
        public async Task<IActionResult> GenerateImage([FromBody] GenerateImageRequest request)
        {
            try
            {
                // Mock image generation - in real implementation, integrate with DALL-E, Midjourney, etc.
                var imageUrl = $"/images/generated/{Guid.NewGuid()}.png";
                
                await LogAuditAsync("image_generated", "Integration", null, $"Image generated with prompt: {request.Prompt}");

                return Success(new 
                { 
                    image_url = imageUrl,
                    prompt = request.Prompt,
                    style = request.Style ?? "default"
                });
            }
            catch (Exception ex)
            {
                return Error($"Failed to generate image: {ex.Message}");
            }
        }

        // ExtractDataFromUploadedFile - Mock data extraction from files
        [HttpPost("core/extract-data")]
        public async Task<IActionResult> ExtractDataFromUploadedFile([FromBody] ExtractDataRequest request)
        {
            try
            {
                // Mock data extraction - in real implementation, integrate with OCR services, document AI, etc.
                var extractedData = new
                {
                    text = "Extracted text content from the document...",
                    entities = new[]
                    {
                        new { type = "person", value = "John Doe", confidence = 0.95 },
                        new { type = "date", value = "2024-01-15", confidence = 0.90 },
                        new { type = "amount", value = "1000.00", confidence = 0.85 }
                    },
                    metadata = new
                    {
                        file_type = "pdf",
                        pages = 2,
                        language = "en"
                    }
                };

                await LogAuditAsync("data_extracted", "Integration", null, $"Data extracted from file: {request.FileUrl}");

                return Success(extractedData);
            }
            catch (Exception ex)
            {
                return Error($"Failed to extract data: {ex.Message}");
            }
        }

        // Download file endpoint
        [HttpGet("files/download")]
        public async Task<IActionResult> DownloadFile([FromQuery] string fileUrl)
        {
            try
            {
                var fileBytes = await _fileUploadService.GetFileAsync(fileUrl);
                var contentType = await _fileUploadService.GetFileContentTypeAsync(fileUrl);
                var fileName = Path.GetFileName(fileUrl);

                return File(fileBytes, contentType, fileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found");
            }
            catch (Exception ex)
            {
                return Error($"Failed to download file: {ex.Message}");
            }
        }

        // Delete file endpoint
        [HttpDelete("files")]
        public async Task<IActionResult> DeleteFile([FromQuery] string fileUrl)
        {
            try
            {
                var result = await _fileUploadService.DeleteFileAsync(fileUrl);
                
                if (result)
                {
                    await LogAuditAsync("file_deleted", "Integration", null, $"File deleted: {fileUrl}");
                    return Success(null, "File deleted successfully");
                }
                else
                {
                    return NotFound("File not found");
                }
            }
            catch (Exception ex)
            {
                return Error($"Failed to delete file: {ex.Message}");
            }
        }

        // Send template email
        [HttpPost("core/send-template-email")]
        public async Task<IActionResult> SendTemplateEmail([FromBody] SendTemplateEmailRequest request)
        {
            try
            {
                var result = await _emailService.SendTemplateEmailAsync(
                    request.To, 
                    request.TemplateId, 
                    request.Variables
                );

                await LogAuditAsync("template_email_sent", "Integration", null, $"Template email sent to: {request.To}");

                return Success(new { sent = result, template_id = request.TemplateId });
            }
            catch (Exception ex)
            {
                return Error($"Failed to send template email: {ex.Message}");
            }
        }

        // Notification endpoints
        [HttpPost("notifications")]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request)
        {
            try
            {
                var notification = new Models.Notification
                {
                    RecipientUserId = request.RecipientUserId,
                    SenderUserId = CurrentUserId,
                    Type = request.Type,
                    Title = request.Title,
                    Message = request.Message,
                    Data = request.Data,
                    Priority = request.Priority ?? "medium",
                    ActionUrl = request.ActionUrl,
                    RequiresAction = request.RequiresAction
                };

                var result = await _notificationService.CreateNotificationAsync(notification);

                await LogAuditAsync("notification_created", "Notification", result.Id, $"Notification sent to: {request.RecipientUserId}");

                return Success(result);
            }
            catch (Exception ex)
            {
                return Error($"Failed to create notification: {ex.Message}");
            }
        }
    }

    // Request DTOs
    public class LLMRequest
    {
        public string Prompt { get; set; } = string.Empty;
        public string? Model { get; set; }
        public int? MaxTokens { get; set; }
        public double? Temperature { get; set; }
    }

    public class SendEmailRequest
    {
        public string To { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? Cc { get; set; }
        public string? Bcc { get; set; }
    }

    public class UploadFileRequest
    {
        public IFormFile File { get; set; } = null!;
        public string? Folder { get; set; }
    }

    public class GenerateImageRequest
    {
        public string Prompt { get; set; } = string.Empty;
        public string? Style { get; set; }
        public string? Size { get; set; }
    }

    public class ExtractDataRequest
    {
        public string FileUrl { get; set; } = string.Empty;
        public string? ExtractionType { get; set; }
    }

    public class SendTemplateEmailRequest
    {
        public string To { get; set; } = string.Empty;
        public string TemplateId { get; set; } = string.Empty;
        public Dictionary<string, string> Variables { get; set; } = new();
    }

    public class CreateNotificationRequest
    {
        public string RecipientUserId { get; set; } = string.Empty;
        public string Type { get; set; } = "info";
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Data { get; set; }
        public string? Priority { get; set; }
        public string? ActionUrl { get; set; }
        public bool RequiresAction { get; set; } = false;
    }
}