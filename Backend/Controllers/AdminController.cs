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

            // Spam & Keyword Moderation stats
            int totalSpamDetected = await _context.Messages.CountAsync(m => m.SpamStatus == "suspected_spam");
            int totalKeywordFlags = await _context.Messages.CountAsync(m => m.SpamStatus == "sensitive_flagged" || m.SpamStatus == "delayed");
            int totalBlockedMessages = await _context.Messages.CountAsync(m => m.SpamStatus == "blocked");

            // Daily chart volume for the last 15 days
            var startDate = DateTime.UtcNow.Date.AddDays(-14);
            var messagesLast15Days = await _context.Messages
                .Where(m => m.SentAt >= startDate && m.SenderId != 999)
                .ToListAsync();

            var dailyStats = new List<object>();
            for (int i = 0; i < 15; i++)
            {
                var targetDate = startDate.AddDays(i);
                var formattedDate = targetDate.ToString("yyyy-MM-dd");
                var dayMsgs = messagesLast15Days.Where(m => m.SentAt.Date == targetDate.Date).ToList();
                int count = dayMsgs.Count;
                int spamOnDay = dayMsgs.Count(m => m.SpamStatus != "normal");
                dailyStats.Add(new { date = formattedDate, count, spamCount = spamOnDay });
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
                totalSpamDetected,
                totalKeywordFlags,
                totalBlockedMessages,
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
        public async Task<IActionResult> GetSmsLogs(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] string? type = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.SMSLogs
                .Include(l => l.Message)
                .ThenInclude(m => m!.Sender)
                .ThenInclude(u => u!.Profile)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(l =>
                    l.LogId.ToString().Contains(s) ||
                    (l.Message != null && (
                        (l.Message.Sender != null && l.Message.Sender.Username.ToLower().Contains(s)) ||
                        (l.Message.Sender != null && l.Message.Sender.Profile != null && l.Message.Sender.Profile.FullName != null && l.Message.Sender.Profile.FullName.ToLower().Contains(s)) ||
                        l.Message.ReceiverNumber.ToLower().Contains(s) ||
                        l.Message.Content.ToLower().Contains(s)
                    )) ||
                    (l.GatewayStatusCode != null && l.GatewayStatusCode.ToLower().Contains(s))
                );
            }

            if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
            {
                string stat = status.Trim().ToLower();
                if (stat == "delivered" || stat == "sent")
                {
                    query = query.Where(l => l.DeliveryStatus == "delivered" || l.DeliveryStatus == "sent");
                }
                else
                {
                    query = query.Where(l => l.DeliveryStatus.ToLower() == stat);
                }
            }

            if (!string.IsNullOrWhiteSpace(type) && type.ToLower() != "all")
            {
                string t = type.Trim().ToLower();
                if (t == "friend")
                {
                    query = query.Where(l => l.Message != null && l.Message.IsFreeFriendMsg == true);
                }
                else if (t == "normal")
                {
                    query = query.Where(l => l.Message == null || l.Message.IsFreeFriendMsg == false);
                }
            }

            int totalCount = await query.CountAsync();
            var smsLogs = await query
                .OrderByDescending(l => l.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = smsLogs.Select(l => new
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

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
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

        // GET: api/admin/keywords
        [HttpGet("keywords")]
        public async Task<IActionResult> GetKeywords()
        {
            var rules = await _context.KeywordRules.OrderByDescending(k => k.CreatedAt).ToListAsync();
            return Ok(rules);
        }

        // POST: api/admin/keywords
        [HttpPost("keywords")]
        public async Task<IActionResult> CreateKeyword([FromBody] CreateKeywordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Keyword))
                return BadRequest(new { message = "Keyword cannot be empty." });

            var existing = await _context.KeywordRules.FirstOrDefaultAsync(k => k.Keyword.ToLower() == dto.Keyword.Trim().ToLower());
            if (existing != null)
                return BadRequest(new { message = "Keyword already exists in rule list." });

            var rule = new KeywordRule
            {
                Keyword = dto.Keyword.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Sensitive" : dto.Category.Trim(),
                Action = string.IsNullOrWhiteSpace(dto.Action) ? "flag" : dto.Action.Trim().ToLower(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.KeywordRules.Add(rule);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Keyword '{rule.Keyword}' added successfully.", rule });
        }

        // PUT: api/admin/keywords/{id}/toggle
        [HttpPut("keywords/{id}/toggle")]
        public async Task<IActionResult> ToggleKeyword(int id)
        {
            var rule = await _context.KeywordRules.FindAsync(id);
            if (rule == null) return NotFound(new { message = "Keyword rule not found." });

            rule.IsActive = !rule.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Keyword rule status updated to {(rule.IsActive ? "Active" : "Inactive")}.", rule });
        }

        // DELETE: api/admin/keywords/{id}
        [HttpDelete("keywords/{id}")]
        public async Task<IActionResult> DeleteKeyword(int id)
        {
            var rule = await _context.KeywordRules.FindAsync(id);
            if (rule == null) return NotFound(new { message = "Keyword rule not found." });

            _context.KeywordRules.Remove(rule);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Keyword rule deleted successfully." });
        }

        // GET: api/admin/moderation/logs
        [HttpGet("moderation/logs")]
        public async Task<IActionResult> GetModerationLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var query = _context.Messages
                .Include(m => m.Sender)
                .ThenInclude(u => u!.Profile)
                .Where(m => m.SpamStatus != "normal" || m.ModerationReason != null)
                .OrderByDescending(m => m.SentAt);

            int totalItems = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).Select(m => new {
                messageId = m.MessageId,
                senderId = m.SenderId,
                senderUsername = m.Sender != null ? m.Sender.Username : "Unknown",
                receiverNumber = m.ReceiverNumber,
                content = m.Content,
                sentAt = m.SentAt,
                spamStatus = m.SpamStatus,
                moderationReason = m.ModerationReason,
                delayUntil = m.DelayUntil,
                isApproved = m.IsApproved
            }).ToListAsync();

            return Ok(new { totalItems, page, pageSize, items });
        }

        // POST: api/admin/seed-15days-data
        [HttpPost("seed-15days-data")]
        public async Task<IActionResult> Seed15DaysData()
        {
            var rnd = new Random();

            // 1. Defined pool of 10 real users to ensure all accounts exist in database
            var seedUserConfigs = new[]
            {
                new { Username = "alice", Mobile = "0987654321", Email = "alice@example.com", Name = "Alice Vance", Avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
                new { Username = "bob", Mobile = "0912345678", Email = "bob@example.com", Name = "Bob Stone", Avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
                new { Username = "charlie", Mobile = "0901234567", Email = "charlie@example.com", Name = "Charlie Davis", Avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
                new { Username = "david", Mobile = "0944444444", Email = "david@example.com", Name = "David Miller", Avatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
                new { Username = "emma", Mobile = "0955555555", Email = "emma@example.com", Name = "Emma Watson", Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
                new { Username = "frank", Mobile = "0966666666", Email = "frank@example.com", Name = "Frank Wright", Avatar = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
                new { Username = "grace", Mobile = "0977777777", Email = "grace@example.com", Name = "Grace Hopper", Avatar = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
                new { Username = "henry", Mobile = "0988888888", Email = "henry@example.com", Name = "Henry Ford", Avatar = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" },
                new { Username = "isabella", Mobile = "0999999999", Email = "isabella@example.com", Name = "Isabella Rossi", Avatar = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150" },
                new { Username = "jack", Mobile = "0933333333", Email = "jack@example.com", Name = "Jack Sparrow", Avatar = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150" }
            };

            List<User> realUsers = new List<User>();

            foreach (var cfg in seedUserConfigs)
            {
                var existingUser = await _context.Users
                    .Include(u => u.Profile)
                    .Include(u => u.Quota)
                    .FirstOrDefaultAsync(u => u.Username == cfg.Username || u.MobileNumber == cfg.Mobile);

                if (existingUser == null)
                {
                    var newUser = new User
                    {
                        Username = cfg.Username,
                        PasswordHash = "password123",
                        MobileNumber = cfg.Mobile,
                        Email = cfg.Email,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-30)
                    };
                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

                    var newProfile = new Profile
                    {
                        UserId = newUser.UserId,
                        FullName = cfg.Name,
                        Gender = cfg.Username.EndsWith("a") || cfg.Username == "emma" ? "Female" : "Male",
                        ProfilePhoto = cfg.Avatar,
                        Address = "Hanoi, Vietnam",
                        WorkStatus = "Employed"
                    };
                    _context.Profiles.Add(newProfile);

                    var newQuota = new UserQuota
                    {
                        UserId = newUser.UserId,
                        FreeMessagesLeft = 10,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.UserQuotas.Add(newQuota);

                    await _context.SaveChangesAsync();
                    realUsers.Add(newUser);
                }
                else
                {
                    realUsers.Add(existingUser);
                }
            }

            // 1b. Dynamically generate 5 BRAND NEW real users with profiles on each seed call
            string[] firstNames = new[] { "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Đặng", "Bùi", "Đỗ" };
            string[] middleNames = new[] { "Văn", "Thị", "Quốc", "Thành", "Minh", "Đức", "Ngọc", "Thu", "Gia", "Hữu" };
            string[] lastNames = new[] { "Anh", "Mai", "Nam", "Bảo", "Hà", "Hùng", "Trang", "Linh", "Dũng", "Phương" };
            string[] avatarPool = new[]
            {
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
                "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            };

            for (int u = 0; u < 5; u++)
            {
                int numSuffix = rnd.Next(1000, 9999);
                string uName = $"user_{numSuffix}";
                string mobile = $"09{rnd.Next(10000000, 99999999)}";
                string fullName = $"{firstNames[rnd.Next(firstNames.Length)]} {middleNames[rnd.Next(middleNames.Length)]} {lastNames[rnd.Next(lastNames.Length)]}";

                var newU = new User
                {
                    Username = uName,
                    PasswordHash = "password123",
                    MobileNumber = mobile,
                    Email = $"{uName}@smschat.com",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(15, 60))
                };
                _context.Users.Add(newU);
                await _context.SaveChangesAsync();

                _context.Profiles.Add(new Profile
                {
                    UserId = newU.UserId,
                    FullName = fullName,
                    Gender = u % 2 == 0 ? "Male" : "Female",
                    ProfilePhoto = avatarPool[rnd.Next(avatarPool.Length)],
                    Address = "Hanoi, Vietnam",
                    WorkStatus = "Employed"
                });

                _context.UserQuotas.Add(new UserQuota
                {
                    UserId = newU.UserId,
                    FreeMessagesLeft = 10,
                    UpdatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                realUsers.Add(newU);
            }

            // 2. Ensure Accepted Friendships and Contacts between all real users
            for (int i = 0; i < realUsers.Count; i++)
            {
                for (int j = i + 1; j < realUsers.Count; j++)
                {
                    var u1 = realUsers[i];
                    var u2 = realUsers[j];

                    // Friendship check
                    bool friendExists = await _context.Friendships.AnyAsync(f =>
                        (f.RequesterId == u1.UserId && f.AddresseeId == u2.UserId) ||
                        (f.RequesterId == u2.UserId && f.AddresseeId == u1.UserId));

                    if (!friendExists)
                    {
                        _context.Friendships.Add(new Friendship
                        {
                            RequesterId = u1.UserId,
                            AddresseeId = u2.UserId,
                            Status = "accepted",
                            CreatedAt = DateTime.UtcNow.AddDays(-20)
                        });
                    }

                    // Contact entries check
                    bool c1Exists = await _context.Contacts.AnyAsync(c => c.UserId == u1.UserId && c.ContactNumber == u2.MobileNumber);
                    if (!c1Exists)
                    {
                        _context.Contacts.Add(new Contact
                        {
                            UserId = u1.UserId,
                            FirstName = u2.Profile?.FullName ?? u2.Username,
                            LastName = "",
                            ContactNumber = u2.MobileNumber
                        });
                    }

                    bool c2Exists = await _context.Contacts.AnyAsync(c => c.UserId == u2.UserId && c.ContactNumber == u1.MobileNumber);
                    if (!c2Exists)
                    {
                        _context.Contacts.Add(new Contact
                        {
                            UserId = u2.UserId,
                            FirstName = u1.Profile?.FullName ?? u1.Username,
                            LastName = "",
                            ContactNumber = u1.MobileNumber
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();

            // 3. Messages pool
            string[] normalMessages = new[]
            {
                "Chào bạn! Công việc hôm nay thế nào rồi?",
                "Tối nay bạn rảnh không, chúng mình đi cafe nhé?",
                "Mình đã gửi báo cáo dự án qua email rồi nha.",
                "Cảm ơn bạn nhiều nhé, tin nhắn rất hữu ích!",
                "Nhớ duyệt lịch hẹn chiều nay giúp mình.",
                "Hệ thống Online SMS Hub dùng ổn phết nhỉ!",
                "Bạn kiểm tra giúp mình file đính kèm xem được chưa.",
                "Dự án của nhóm làm tới đâu rồi bạn ơi?",
                "Cuối tuần này nhóm mình có đi đá bóng không?",
                "Gửi giúp mình tài liệu cuộc họp sáng nay nhé."
            };

            string[] spamMessages = new[]
            {
                "hello hello hello",
                "hello! nhận ngay phần thưởng 100k",
                "Cơ hội đầu tư sinh lời 500% inbox gấp!",
                "Nhận khoản vay ưu đãi lãi suất 0% liên hệ ngay",
                "Lừa đảo cờ bạc bóng đá nạp rút nhanh chóng"
            };

            string[] sensitiveMessages = new[]
            {
                "Vui lòng hoàn thành nghĩa vụ thanh toán khoản nợ tháng này.",
                "Thông báo nhắc nợ cước viễn thông hợp đồng số 1029.",
                "Chuyển tiền gấp hỗ trợ tài chính cho sự cố khẩn cấp.",
                "Nhận thông báo khuyến mãi khủng nhân dịp sinh nhật."
            };

            List<Message> newMessages = new List<Message>();
            List<SMSLog> newLogs = new List<SMSLog>();
            List<Transaction> newTransactions = new List<Transaction>();

            DateTime now = DateTime.UtcNow;

            for (int dayOffset = 14; dayOffset >= 0; dayOffset--)
            {
                DateTime dayDate = now.Date.AddDays(-dayOffset);
                int dailyMessageCount = rnd.Next(500, 750); // ~500-750 messages per day (~9,000+ total)

                for (int k = 0; k < dailyMessageCount; k++)
                {
                    int hour = rnd.Next(7, 23);
                    int min = rnd.Next(0, 60);
                    int sec = rnd.Next(0, 60);
                    DateTime msgTime = dayDate.AddHours(hour).AddMinutes(min).AddSeconds(sec);

                    // Pick 2 distinct real users
                    var sender = realUsers[rnd.Next(realUsers.Count)];
                    User receiver;
                    do
                    {
                        receiver = realUsers[rnd.Next(realUsers.Count)];
                    } while (receiver.UserId == sender.UserId);

                    int msgTypeRand = rnd.Next(100);
                    string content;
                    string spamStatus = "normal";
                    string? modReason = null;

                    if (msgTypeRand < 85)
                    {
                        content = normalMessages[rnd.Next(normalMessages.Length)];
                    }
                    else if (msgTypeRand < 92)
                    {
                        content = spamMessages[rnd.Next(spamMessages.Length)];
                        spamStatus = "suspected_spam";
                        modReason = "Phát hiện tần suất trùng lặp bất thường";
                    }
                    else
                    {
                        content = sensitiveMessages[rnd.Next(sensitiveMessages.Length)];
                        if (content.Contains("nợ") || content.Contains("khuyến mãi"))
                        {
                            spamStatus = "sensitive_flagged";
                            modReason = "Đánh nhãn từ khóa nhạy cảm theo quy định";
                        }
                        else
                        {
                            spamStatus = "blocked";
                            modReason = "Chặn tự động do vi phạm quy tắc từ khóa cấm";
                        }
                    }

                    var msg = new Message
                    {
                        SenderId = sender.UserId,
                        ReceiverId = receiver.UserId,
                        ReceiverNumber = receiver.MobileNumber,
                        Content = content,
                        SentAt = msgTime,
                        IsFreeFriendMsg = true, // Since all real users are friends!
                        SpamStatus = spamStatus,
                        ModerationReason = modReason
                    };
                    newMessages.Add(msg);
                }

                // Add transactions
                int txCount = rnd.Next(2, 5);
                for (int t = 0; t < txCount; t++)
                {
                    var sender = realUsers[rnd.Next(realUsers.Count)];
                    newTransactions.Add(new Transaction
                    {
                        UserId = sender.UserId,
                        SubscriptionId = rnd.Next(1, 4),
                        Amount = rnd.Next(2, 6) + 0.99m,
                        CardLast4 = rnd.Next(1000, 9999).ToString(),
                        TransactionStatus = "success",
                        CreatedAt = dayDate.AddHours(rnd.Next(8, 20)).AddMinutes(rnd.Next(0, 60))
                    });
                }
            }

            _context.Messages.AddRange(newMessages);
            await _context.SaveChangesAsync();

            // Create SMS logs
            foreach (var m in newMessages)
            {
                int statusRand = rnd.Next(100);
                string deliveryStatus = statusRand < 88 ? "delivered" : (statusRand < 95 ? "failed" : "pending");
                newLogs.Add(new SMSLog
                {
                    MessageId = m.MessageId,
                    GatewayStatusCode = deliveryStatus == "delivered" ? "200_OK" : (deliveryStatus == "failed" ? "500_GATEWAY_ERR" : "100_PENDING"),
                    DeliveryStatus = deliveryStatus,
                    UpdatedAt = m.SentAt
                });
            }

            _context.SMSLogs.AddRange(newLogs);
            _context.Transactions.AddRange(newTransactions);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Thành công! Đã sinh {realUsers.Count} tài khoản thật (đã kết bạn với nhau) và khởi tạo {newMessages.Count} tin nhắn mẫu cho 15 ngày liên tiếp.",
                totalRealUsers = realUsers.Count,
                totalMessagesAdded = newMessages.Count,
                totalLogsAdded = newLogs.Count,
                totalTransactionsAdded = newTransactions.Count
            });
        }

        // POST: api/admin/create-stranger-users
        [HttpPost("create-stranger-users")]
        public async Task<IActionResult> CreateStrangerUsers()
        {
            var rnd = new Random();
            string[] firstNames = new[] { "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Đặng", "Bùi", "Đỗ", "Nông", "Đinh" };
            string[] middleNames = new[] { "Văn", "Thị", "Quốc", "Thành", "Minh", "Đức", "Ngọc", "Thu", "Gia", "Hữu", "Khánh", "Phương" };
            string[] lastNames = new[] { "Anh", "Mai", "Nam", "Bảo", "Hà", "Hùng", "Trang", "Linh", "Dũng", "Phương", "Tuấn", "Hương" };
            string[] avatarPool = new[]
            {
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
                "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
            };

            List<object> createdList = new List<object>();

            for (int i = 0; i < 5; i++)
            {
                int numSuffix = rnd.Next(1000, 9999);
                string username = $"stranger_{numSuffix}";
                string mobile = $"09{rnd.Next(10000000, 99999999)}";
                string fullName = $"{firstNames[rnd.Next(firstNames.Length)]} {middleNames[rnd.Next(middleNames.Length)]} {lastNames[rnd.Next(lastNames.Length)]} (Người Lạ)";

                while (await _context.Users.AnyAsync(u => u.Username == username || u.MobileNumber == mobile))
                {
                    numSuffix = rnd.Next(1000, 9999);
                    username = $"stranger_{numSuffix}";
                    mobile = $"09{rnd.Next(10000000, 99999999)}";
                }

                var user = new User
                {
                    Username = username,
                    PasswordHash = "password123",
                    MobileNumber = mobile,
                    Email = $"{username}@smschat.com",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var profile = new Profile
                {
                    UserId = user.UserId,
                    FullName = fullName,
                    Gender = i % 2 == 0 ? "Male" : "Female",
                    ProfilePhoto = avatarPool[rnd.Next(avatarPool.Length)],
                    Address = "Vietnam",
                    WorkStatus = "Self-Employed"
                };
                _context.Profiles.Add(profile);

                var quota = new UserQuota
                {
                    UserId = user.UserId,
                    FreeMessagesLeft = 5,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.UserQuotas.Add(quota);

                await _context.SaveChangesAsync();

                createdList.Add(new
                {
                    userId = user.UserId,
                    username = user.Username,
                    mobileNumber = user.MobileNumber,
                    fullName = profile.FullName
                });
            }

            return Ok(new
            {
                message = "Thành công! Đã tạo 5 tài khoản thật mới CHƯA KẾT BẠN (Người lạ).",
                users = createdList
            });
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

    public class CreateKeywordDto
    {
        public string Keyword { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Action { get; set; }
    }
}
