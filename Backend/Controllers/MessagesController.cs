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
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;

        public MessagesController(AppDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        private static readonly System.Collections.Concurrent.ConcurrentDictionary<(int SenderId, string ReceiverNumber), DateTime> _typingState = new();

        public class TypingRequest
        {
            public string ReceiverNumber { get; set; } = string.Empty;
        }

        // POST: api/messages/typing
        [HttpPost("typing")]
        public IActionResult ReportTyping([FromBody] TypingRequest request)
        {
            int senderId = AuthenticatedUserId;
            if (senderId == 0 || string.IsNullOrEmpty(request.ReceiverNumber))
            {
                return BadRequest();
            }

            _typingState[(senderId, request.ReceiverNumber)] = DateTime.UtcNow;
            return Ok();
        }

        // GET: api/messages/typing-status?contactNumber=0987654321
        [HttpGet("typing-status")]
        public async Task<ActionResult<object>> GetTypingStatus([FromQuery] string contactNumber)
        {
            int currentUserId = AuthenticatedUserId;
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null || string.IsNullOrEmpty(contactNumber))
            {
                return BadRequest();
            }

            var contactUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == contactNumber);
            if (contactUser == null)
            {
                return Ok(new { isTyping = false });
            }

            if (_typingState.TryGetValue((contactUser.UserId, currentUser.MobileNumber), out var lastTyped))
            {
                bool isTyping = (DateTime.UtcNow - lastTyped).TotalSeconds < 5;
                return Ok(new { isTyping });
            }

            return Ok(new { isTyping = false });
        }

        // GET: api/messages/history?userId=1&contactNumber=0912345678
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<Message>>> GetHistory([FromQuery] int? userId, [FromQuery] string contactNumber)
        {
            // Securely read from JWT claims
            int actualUserId = AuthenticatedUserId;

            var user = await _context.Users.FindAsync(actualUserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Find if there is a registered user with this contact number
            var contactUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == contactNumber);

            List<Message> messages;

            if (contactUser != null)
            {
                // If they are registered, history is messages sent between actualUserId and contactUser.UserId
                messages = await _context.Messages
                    .Where(m => 
                        (m.SenderId == actualUserId && (m.ReceiverNumber == contactNumber || m.ReceiverId == contactUser.UserId)) ||
                        (m.SenderId == contactUser.UserId && (m.ReceiverNumber == user.MobileNumber || m.ReceiverId == actualUserId)))
                    .OrderBy(m => m.SentAt)
                    .ToListAsync();
            }
            else
            {
                // If not registered, history is just messages sent by this user to this non-registered number
                messages = await _context.Messages
                    .Where(m => m.SenderId == actualUserId && m.ReceiverNumber == contactNumber)
                    .OrderBy(m => m.SentAt)
                    .ToListAsync();
            }

            return messages;
        }

        // GET: api/messages/quota?userId=1&contactNumber=0912345678
        [HttpGet("quota")]
        public async Task<ActionResult<object>> GetQuota([FromQuery] int? userId, [FromQuery] string contactNumber)
        {
            // Securely read from JWT claims
            int actualUserId = AuthenticatedUserId;

            // Check if the contact number belongs to a friend
            var contactUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == contactNumber);
            bool isFriend = false;

            if (contactUser != null)
            {
                isFriend = await _context.Friendships.AnyAsync(fc => 
                    fc.Status == "accepted" && 
                    ((fc.RequesterId == actualUserId && fc.AddresseeId == contactUser.UserId) || 
                     (fc.RequesterId == contactUser.UserId && fc.AddresseeId == actualUserId)));
            }

            if (isFriend)
            {
                return Ok(new { isFriend = true, remaining = -1, limit = -1, sentCount = 0 });
            }

            // Global Quota check from UserQuotas table
            var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == actualUserId);
            int remaining = quota?.FreeMessagesLeft ?? 0;
            int limit = 5;
            int sentCount = limit - remaining;

            return Ok(new { isFriend = false, remaining, limit, sentCount });
        }

        // POST: api/messages
        [HttpPost]
        public async Task<ActionResult<Message>> SendMessage([FromBody] SendMessageDto dto)
        {
            // Securely read sender from JWT claims instead of body parameters
            int senderId = AuthenticatedUserId;

            var sender = await _context.Users.FindAsync(senderId);
            if (sender == null)
            {
                return NotFound(new { message = "Sender user not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.ReceiverNumber) || dto.ReceiverNumber.Length != 10 || !dto.ReceiverNumber.All(char.IsDigit))
            {
                return BadRequest(new { message = "Receiver number must be exactly 10 digits." });
            }

            if (string.IsNullOrEmpty(dto.Content))
            {
                return BadRequest(new { message = "Message content cannot be empty." });
            }

            if (dto.Content.Length > 120)
            {
                return BadRequest(new { message = "Message content must not exceed 120 characters." });
            }

            // AI Content Moderation Check
            bool isSafe = await _aiService.ModerateContentAsync(dto.Content);
            if (!isSafe)
            {
                return BadRequest(new { message = "Nội dung tin nhắn vi phạm tiêu chuẩn cộng đồng và không thể gửi đi" });
            }

            // Intercept message sent to AI Chatbot
            if (dto.ReceiverNumber == "9999999999")
            {
                // Fetch conversation history
                var history = await _context.Messages
                    .Where(m => (m.SenderId == sender.UserId && m.ReceiverNumber == "9999999999") ||
                                (m.SenderId == 999 && m.ReceiverId == sender.UserId))
                    .OrderByDescending(m => m.SentAt)
                    .Take(10)
                    .ToListAsync();
                history.Reverse();

                var userMessage = new Message
                {
                    SenderId = sender.UserId,
                    ReceiverNumber = dto.ReceiverNumber,
                    ReceiverId = 999,
                    Content = dto.Content,
                    SentAt = DateTime.UtcNow,
                    IsFreeFriendMsg = true
                };
                _context.Messages.Add(userMessage);
                await _context.SaveChangesAsync();

                var userLog = new SMSLog
                {
                    MessageId = userMessage.MessageId,
                    GatewayStatusCode = "200_OK",
                    DeliveryStatus = "delivered",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SMSLogs.Add(userLog);
                await _context.SaveChangesAsync();

                // Call AI Chat
                string aiReply = await _aiService.ChatWithAiAsync(dto.Content, history);

                var aiMessage = new Message
                {
                    SenderId = 999,
                    ReceiverNumber = sender.MobileNumber,
                    ReceiverId = sender.UserId,
                    Content = aiReply,
                    SentAt = DateTime.UtcNow.AddSeconds(1),
                    IsFreeFriendMsg = true
                };
                _context.Messages.Add(aiMessage);
                await _context.SaveChangesAsync();

                var aiLog = new SMSLog
                {
                    MessageId = aiMessage.MessageId,
                    GatewayStatusCode = "200_OK",
                    DeliveryStatus = "delivered",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SMSLogs.Add(aiLog);
                await _context.SaveChangesAsync();

                return Ok(userMessage);
            }

            // Check if receiver is a registered user
            var receiverUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == dto.ReceiverNumber);
            bool isFriend = false;
            int? receiverId = null;

            if (receiverUser != null)
            {
                receiverId = receiverUser.UserId;
                
                // 1. Check if blocked
                bool isBlocked = await _context.Blocklists.AnyAsync(b => b.UserId == receiverUser.UserId && b.BlockedNumber == sender.MobileNumber);
                if (isBlocked)
                {
                    return BadRequest(new { message = "You have been blocked by this user." });
                }

                // Check if they are friends
                isFriend = await _context.Friendships.AnyAsync(fc => 
                    fc.Status == "accepted" && 
                    ((fc.RequesterId == sender.UserId && fc.AddresseeId == receiverUser.UserId) || 
                     (fc.RequesterId == receiverUser.UserId && fc.AddresseeId == sender.UserId)));

                // 2. Check if privacy setting allows only friends
                if (receiverUser.OnlyReceiveFromFriends && !isFriend)
                {
                    return BadRequest(new { message = "This user only accepts messages from friends." });
                }
            }

            bool isScheduled = dto.ScheduledAt.HasValue && dto.ScheduledAt.Value > DateTime.UtcNow;

            if (!isFriend)
            {
                // Enforce global quota limit
                var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == sender.UserId);
                if (quota == null || quota.FreeMessagesLeft <= 0)
                {
                    return BadRequest(new { message = "You have reached your limit of 5 free messages for non-friends. Add them as a friend for unlimited free messaging." });
                }

                // Decrement free messages left (scheduled messages also occupy quota)
                quota.FreeMessagesLeft--;
                quota.UpdatedAt = DateTime.UtcNow;
            }

            var message = new Message
            {
                SenderId = sender.UserId,
                ReceiverNumber = dto.ReceiverNumber,
                ReceiverId = receiverId,
                Content = dto.Content,
                SentAt = DateTime.UtcNow,
                IsFreeFriendMsg = isFriend,
                ScheduledAt = isScheduled ? dto.ScheduledAt : null
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync(); // Generates message_id

            // Record log in SMS_Logs table
            var log = new SMSLog
            {
                MessageId = message.MessageId,
                GatewayStatusCode = "200_OK",
                DeliveryStatus = isScheduled ? "pending" : "delivered",
                UpdatedAt = DateTime.UtcNow
            };
            _context.SMSLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(message);
        }

        // POST: api/messages/bulk
        [HttpPost("bulk")]
        public async Task<IActionResult> SendBulkMessage([FromBody] BulkMessageDto dto)
        {
            int senderId = AuthenticatedUserId;
            var sender = await _context.Users.FindAsync(senderId);
            if (sender == null) return NotFound(new { message = "Sender user not found." });

            var group = await _context.ContactGroups.FindAsync(dto.GroupId);
            if (group == null) return NotFound(new { message = "Group not found." });
            if (group.UserId != senderId) return Forbid();

            if (string.IsNullOrEmpty(dto.Content)) return BadRequest(new { message = "Content cannot be empty." });
            if (dto.Content.Length > 120) return BadRequest(new { message = "Content must not exceed 120 characters." });

            // AI Content Moderation Check
            bool isSafe = await _aiService.ModerateContentAsync(dto.Content);
            if (!isSafe)
            {
                return BadRequest(new { message = "Nội dung tin nhắn vi phạm tiêu chuẩn cộng đồng và không thể gửi đi" });
            }

            var members = await _context.ContactGroupMembers
                .Include(m => m.Contact)
                .Where(m => m.GroupId == dto.GroupId)
                .ToListAsync();

            if (members.Count == 0)
            {
                return BadRequest(new { message = "The selected group is empty." });
            }

            int sentCount = 0;
            int failedCount = 0;
            var details = new List<string>();

            bool isScheduled = dto.ScheduledAt.HasValue && dto.ScheduledAt.Value > DateTime.UtcNow;

            foreach (var member in members)
            {
                if (member.Contact == null) continue;
                string number = member.Contact.ContactNumber;

                // Check receiver details
                var receiverUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == number);
                bool isFriend = false;
                int? receiverId = null;

                if (receiverUser != null)
                {
                    receiverId = receiverUser.UserId;

                    // 1. Blocklist check
                    bool isBlocked = await _context.Blocklists.AnyAsync(b => b.UserId == receiverUser.UserId && b.BlockedNumber == sender.MobileNumber);
                    if (isBlocked)
                    {
                        failedCount++;
                        details.Add($"{number}: Blocked by receiver");
                        continue;
                    }

                    // Friendship check
                    isFriend = await _context.Friendships.AnyAsync(fc => 
                        fc.Status == "accepted" && 
                        ((fc.RequesterId == sender.UserId && fc.AddresseeId == receiverUser.UserId) || 
                         (fc.RequesterId == receiverUser.UserId && fc.AddresseeId == sender.UserId)));

                    // 2. Friends privacy check
                    if (receiverUser.OnlyReceiveFromFriends && !isFriend)
                    {
                        failedCount++;
                        details.Add($"{number}: Privacy settings restrict stranger messages");
                        continue;
                    }
                }

                // 3. Quota check
                if (!isFriend)
                {
                    var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == sender.UserId);
                    if (quota == null || quota.FreeMessagesLeft <= 0)
                    {
                        failedCount++;
                        details.Add($"{number}: Out of free message quota");
                        continue;
                    }

                    quota.FreeMessagesLeft--;
                    quota.UpdatedAt = DateTime.UtcNow;
                }

                // Create message
                var message = new Message
                {
                    SenderId = sender.UserId,
                    ReceiverNumber = number,
                    ReceiverId = receiverId,
                    Content = dto.Content,
                    SentAt = DateTime.UtcNow,
                    IsFreeFriendMsg = isFriend,
                    ScheduledAt = isScheduled ? dto.ScheduledAt : null
                };

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                // Add log
                var log = new SMSLog
                {
                    MessageId = message.MessageId,
                    GatewayStatusCode = "200_OK",
                    DeliveryStatus = isScheduled ? "pending" : "delivered",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SMSLogs.Add(log);
                await _context.SaveChangesAsync();

                sentCount++;
                details.Add($"{number}: Successfully {(isScheduled ? "scheduled" : "sent")}");
            }

            return Ok(new
            {
                message = $"Processed group send. Sent: {sentCount}, Failed: {failedCount}.",
                total = members.Count,
                sent = sentCount,
                failed = failedCount,
                details
            });
        }
    }

    public class SendMessageDto
    {
        public string ReceiverNumber { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime? ScheduledAt { get; set; }
    }

    public class BulkMessageDto
    {
        public int GroupId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime? ScheduledAt { get; set; }
    }
}
