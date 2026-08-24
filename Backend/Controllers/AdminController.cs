using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;

        public AdminController(AppDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        // GET: api/admin/dashboard/stats
        [HttpGet("dashboard/stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // Total users (excluding chatbot assistant ID 999)
            int totalUsers = await _context.Users.CountAsync(u => u.UserId != 999);

            // Total messages (excluding AI messages sent/received)
            int totalMessages = await _context.Messages.CountAsync(m => m.SenderId != 999);

            // Total revenue from successful transactions
            decimal totalRevenue = await _context.Transactions
                .Where(t => t.TransactionStatus == "success")
                .SumAsync(t => t.Amount);

            // Active paid services subscriptions
            int activeServicesCount = await _context.UserServices
                .CountAsync(us => us.PaymentStatus == "paid");

            // AI interactions count (messages where sender or receiver is AI)
            int aiInteractionsCount = await _context.Messages
                .CountAsync(m => m.SenderId == 999 || m.ReceiverId == 999);

            // Messages breakdown by status
            var logs = await _context.SMSLogs.ToListAsync();
            int deliveredCount = logs.Count(l => l.DeliveryStatus == "delivered" || l.DeliveryStatus == "sent");
            int failedCount = logs.Count(l => l.DeliveryStatus == "failed");
            int pendingCount = logs.Count(l => l.DeliveryStatus == "pending");

            // Daily chart volume for the last 7 days
            var startDate = DateTime.UtcNow.Date.AddDays(-6);
            var messagesLast7Days = await _context.Messages
                .Where(m => m.SentAt >= startDate && m.SenderId != 999)
                .ToListAsync();

            var dailyStats = new List<object>();
            for (int i = 0; i < 7; i++)
            {
                var targetDate = startDate.AddDays(i);
                var formattedDate = targetDate.ToString("yyyy-MM-dd");
                int count = messagesLast7Days.Count(m => m.SentAt.Date == targetDate.Date);
                dailyStats.Add(new { date = formattedDate, count });
            }

            return Ok(new
            {
                totalUsers,
                totalMessages,
                totalRevenue,
                activeServicesCount,
                aiInteractionsCount,
                deliveredCount,
                failedCount,
                pendingCount,
                dailyStats
            });
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Quota)
                .Where(u => u.UserId != 999) // Exclude virtual chatbot helper
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(users);
        }

        // PUT: api/admin/users/{id}/status
        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            user.IsActive = dto.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"User status updated to {(dto.IsActive ? "active" : "inactive")}." });
        }

        // PUT: api/admin/users/{id}/quota
        [HttpPut("users/{id}/quota")]
        public async Task<IActionResult> UpdateUserQuota(int id, [FromBody] UpdateUserQuotaDto dto)
        {
            var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == id);
            if (quota == null)
            {
                // Create quota record if it doesn't exist
                quota = new UserQuota
                {
                    UserId = id,
                    FreeMessagesLeft = dto.FreeMessagesLeft,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.UserQuotas.Add(quota);
            }
            else
            {
                quota.FreeMessagesLeft = dto.FreeMessagesLeft;
                quota.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"User quota updated to {dto.FreeMessagesLeft}." });
        }

        // GET: api/admin/transactions
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions()
        {
            var transactions = await _context.Transactions
                .Include(t => t.User)
                .ThenInclude(u => u!.Profile)
                .Include(t => t.Subscription)
                .ThenInclude(s => s!.Service)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var result = transactions.Select(t => new
            {
                transactionId = t.TransactionId,
                userId = t.UserId,
                username = t.User?.Username ?? "N/A",
                userFullName = t.User?.Profile?.FullName ?? "N/A",
                serviceName = t.Subscription?.Service?.ServiceName ?? "Paid Service",
                amount = t.Amount,
                cardLast4 = t.CardLast4,
                transactionStatus = t.TransactionStatus,
                createdAt = t.CreatedAt
            });

            return Ok(result);
        }

        // GET: api/admin/sms-logs
        [HttpGet("sms-logs")]
        public async Task<IActionResult> GetSmsLogs()
        {
            var smsLogs = await _context.SMSLogs
                .Include(l => l.Message)
                .ThenInclude(m => m!.Sender)
                .ThenInclude(u => u!.Profile)
                .OrderByDescending(l => l.UpdatedAt)
                .ToListAsync();

            var result = smsLogs.Select(l => new
            {
                logId = l.LogId,
                messageId = l.MessageId,
                senderUsername = l.Message?.Sender?.Username ?? "System",
                senderName = l.Message?.Sender?.Profile?.FullName ?? "System",
                receiverNumber = l.Message?.ReceiverNumber ?? "N/A",
                content = l.Message?.Content ?? "N/A",
                isFreeFriendMsg = l.Message?.IsFreeFriendMsg ?? false,
                scheduledAt = l.Message?.ScheduledAt,
                sentTime = l.Message?.SentAt ?? l.UpdatedAt,
                deliveryStatus = l.DeliveryStatus,
                gatewayStatusCode = l.GatewayStatusCode
            });

            return Ok(result);
        }

        // POST: api/admin/templates
        [HttpPost("templates")]
        public async Task<IActionResult> CreateSystemTemplate([FromBody] CreateSystemTemplateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Body))
            {
                return BadRequest(new { message = "Title and Body are required." });
            }

            var template = new SMSTemplate
            {
                UserId = null, // null represents system template
                Title = dto.Title.Trim(),
                Body = dto.Body.Trim()
            };

            _context.SMSTemplates.Add(template);
            await _context.SaveChangesAsync();

            return Ok(template);
        }

        // DELETE: api/admin/templates/{id}
        [HttpDelete("templates/{id}")]
        public async Task<IActionResult> DeleteSystemTemplate(int id)
        {
            var template = await _context.SMSTemplates.FindAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found." });
            }

            // Allow delete only if it's a system template (or any template managed by admin)
            _context.SMSTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return Ok(new { message = "System template deleted successfully." });
        }

        // POST: api/admin/ai-chat
        [HttpPost("ai-chat")]
        public async Task<IActionResult> AdminAiChat([FromBody] AdminAiChatRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Message))
            {
                return BadRequest(new { message = "Message cannot be empty." });
            }

            // 1. Gather live system metrics for context
            int totalUsers = await _context.Users.CountAsync(u => u.UserId != 999);
            int totalMessages = await _context.Messages.CountAsync(m => m.SenderId != 999);
            decimal totalRevenue = await _context.Transactions
                .Where(t => t.TransactionStatus == "success")
                .SumAsync(t => t.Amount);
            int activeServicesCount = await _context.UserServices
                .CountAsync(us => us.PaymentStatus == "paid");
            int aiInteractionsCount = await _context.Messages
                .CountAsync(m => m.SenderId == 999 || m.ReceiverId == 999);

            var logs = await _context.SMSLogs.ToListAsync();
            int deliveredCount = logs.Count(l => l.DeliveryStatus == "delivered" || l.DeliveryStatus == "sent");
            int failedCount = logs.Count(l => l.DeliveryStatus == "failed");
            int pendingCount = logs.Count(l => l.DeliveryStatus == "pending");

            // Get system templates title listing
            var templates = await _context.SMSTemplates
                .Where(t => t.UserId == null)
                .Select(t => t.Title)
                .ToListAsync();
            string templatesList = string.Join(", ", templates);

            // 2. Format a system instruction loaded with live stats
            string systemInstruction = 
                "Bạn là Admin Copilot, một Trợ lý AI thông minh tích hợp trong trang quản trị của hệ thống Online SMS Hub. " +
                "Nhiệm vụ của bạn là giải đáp thắc mắc, phân tích dữ liệu hệ thống, và hỗ trợ soạn thảo mẫu tin nhắn SMS chuyên nghiệp. " +
                "Hãy phản hồi bằng tiếng Việt trôi chảy, chuyên nghiệp, hỗ trợ giải trình chi tiết (không giới hạn 120 ký tự như người dùng).\n\n" +
                "LƯU Ý CỰC KỲ QUAN TRỌNG: TUYỆT ĐỐI KHÔNG ĐƯỢC sử dụng định dạng Markdown (như dấu sao kép **, bảng biểu |...|, tiêu đề #, v.v.). Hãy viết câu trả lời hoàn toàn bằng văn bản thuần túy (plain text), sử dụng dấu xuống dòng tự nhiên và các ký tự unicode thân thiện (như biểu tượng cảm xúc hoặc dấu gạch đầu dòng •) để định dạng và trình bày thông tin dễ nhìn.\n\n" +
                "DƯỚI ĐÂY LÀ THÔNG SỐ HỆ THỐNG THỜI GIAN THỰC ĐỂ BẠN TRẢ LỜI CÂU HỎI:\n" +
                $"- Tổng số người dùng đăng ký: {totalUsers} người dùng.\n" +
                $"- Tổng số tin nhắn đã gửi (standard): {totalMessages} tin nhắn.\n" +
                $"- Doanh thu lũy kế: ${totalRevenue:F2} USD.\n" +
                $"- Số lượng đăng ký gói cước premium đang hoạt động: {activeServicesCount} gói cước.\n" +
                $"- Lượng tương tác với chatbot AI của người dùng: {aiInteractionsCount} cuộc hội thoại.\n" +
                $"- Số tin nhắn gửi thành công (Delivered): {deliveredCount} SMS.\n" +
                $"- Số tin nhắn đang chờ (Pending): {pendingCount} SMS.\n" +
                $"- Số tin nhắn gửi thất bại (Failed): {failedCount} SMS.\n" +
                $"- Danh sách các mẫu tin nhắn hệ thống hiện có: {templatesList}.\n\n" +
                "Hãy tự tin trả lời chính xác các số liệu này khi quản trị viên hỏi. " +
                "Nếu quản trị viên nhờ soạn mẫu tin nhắn mới (Ví dụ: thông báo bảo trì, tin nhắn chúc mừng, đòi nợ), hãy soạn nội dung SMS thật tối ưu, ngắn gọn, súc tích (thường dưới 120-160 ký tự cho phù hợp tiêu chuẩn SMS) và khuyên họ thêm vào phần Mẫu Hệ Thống.";

            // 3. Call AI Service
            string aiResponse = await _aiService.ChatWithAdminAsync(dto.Message, dto.History ?? new List<AdminChatMessage>(), systemInstruction);

            return Ok(new { content = aiResponse });
        }
    }

    public class AdminAiChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
        public List<AdminChatMessage>? History { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool IsActive { get; set; }
    }

    public class UpdateUserQuotaDto
    {
        public int FreeMessagesLeft { get; set; }
    }

    public class CreateSystemTemplateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }
}
