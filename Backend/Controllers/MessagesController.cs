using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<Backend.Hubs.ChatHub> _hubContext;

        public MessagesController(AppDbContext context, IAiService aiService, Microsoft.AspNetCore.SignalR.IHubContext<Backend.Hubs.ChatHub> hubContext)
        {
            _context = context;
            _aiService = aiService;
            _hubContext = hubContext;
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

        // GET: api/messages/conversations
        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<object>>> GetConversations()
        {
            int currentUserId = AuthenticatedUserId;
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null)
            {
                return NotFound(new { message = "User not found" });
            }
            string currentUserMobile = currentUser.MobileNumber;

            // Get messages involving current user
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId || m.ReceiverNumber == currentUserMobile)
                .ToListAsync();

            // Group by the other party's mobile number
            var conversations = messages
                .GroupBy(m => {
                    if (m.SenderId == currentUserId)
                    {
                        return m.ReceiverNumber;
                    }
                    else
                    {
                        return m.Sender?.MobileNumber ?? "";
                    }
                })
                .Where(g => !string.IsNullOrEmpty(g.Key) && g.Key != currentUserMobile && g.Key != "9999999999") // Exclude self and AI
                .Select(g => {
                    var lastMsg = g.OrderByDescending(m => m.SentAt).ThenByDescending(m => m.MessageId).First();
                    return new {
                        MobileNumber = g.Key,
                        LastMessage = lastMsg
                    };
                })
                .ToList();

            var result = new List<object>();

            foreach (var conv in conversations)
            {
                var otherMobile = conv.MobileNumber;
                var lastMsg = conv.LastMessage;

                // Check if other party is a registered user
                var registeredUser = await _context.Users
                    .Include(u => u.Profile)
                    .FirstOrDefaultAsync(u => u.MobileNumber == otherMobile);

                // Check if in contacts
                var contact = await _context.Contacts
                    .FirstOrDefaultAsync(c => c.UserId == currentUserId && c.ContactNumber == otherMobile);

                // Check friendship status
                bool isFriend = false;
                if (registeredUser != null)
                {
                    isFriend = await _context.Friendships.AnyAsync(fc =>
                        fc.Status == "accepted" &&
                        ((fc.RequesterId == currentUserId && fc.AddresseeId == registeredUser.UserId) ||
                         (fc.RequesterId == registeredUser.UserId && fc.AddresseeId == currentUserId)));
                }

                string name = otherMobile;
                if (contact != null)
                {
                    name = $"{contact.FirstName} {contact.LastName}".Trim();
                }
                else if (registeredUser != null && !string.IsNullOrEmpty(registeredUser.Name))
                {
                    name = registeredUser.Name;
                }
                else if (registeredUser != null)
                {
                    name = registeredUser.Username;
                }

                string avatar = "";
                if (registeredUser != null && !string.IsNullOrEmpty(registeredUser.ProfilePhoto))
                {
                    avatar = registeredUser.ProfilePhoto;
                }
                else
                {
                    string initials = "";
                    if (contact != null)
                    {
                        initials = $"{(contact.FirstName.Length > 0 ? contact.FirstName[0].ToString() : "")}{(contact.LastName.Length > 0 ? contact.LastName[0].ToString() : "")}";
                    }
                    else if (registeredUser != null)
                    {
                        initials = registeredUser.Username.Length > 0 ? registeredUser.Username[0].ToString().ToUpper() : "";
                    }
                    else
                    {
                        initials = "?";
                    }
                    avatar = $"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%237f91a4\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">{Uri.EscapeDataString(initials)}</text></svg>";
                }

                result.Add(new
                {
                    contactNumber = otherMobile,
                    name = name,
                    avatar = avatar,
                    isFriend = isFriend,
                    lastMessageContent = lastMsg.Content,
                    lastMessageTime = DateTime.SpecifyKind(lastMsg.SentAt, DateTimeKind.Utc),
                    isRegistered = registeredUser != null,
                    userId = registeredUser?.UserId
                });
            }

            var sortedResult = result
                .OrderByDescending(r => ((dynamic)r).lastMessageTime)
                .ToList();

            return Ok(sortedResult);
        }

        // GET: api/messages/history?userId=1&contactNumber=0912345678&limit=20&before=2026-08-26T04:12:35.000Z
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<Message>>> GetHistory(
            [FromQuery] int? userId, 
            [FromQuery] string contactNumber, 
            [FromQuery] int limit = 20, 
            [FromQuery] DateTime? before = null)
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

            var query = _context.Messages.AsQueryable();

            if (contactUser != null)
            {
                // If they are registered, history is messages sent between actualUserId and contactUser.UserId
                query = query.Where(m => 
                    (m.SenderId == actualUserId && (m.ReceiverNumber == contactNumber || m.ReceiverId == contactUser.UserId)) ||
                    (m.SenderId == contactUser.UserId && (m.ReceiverNumber == user.MobileNumber || m.ReceiverId == actualUserId)));
            }
            else
            {
                // If not registered, history is just messages sent by this user to this non-registered number
                query = query.Where(m => m.SenderId == actualUserId && m.ReceiverNumber == contactNumber);
            }

            if (before.HasValue)
            {
                query = query.Where(m => m.SentAt < before.Value);
            }

            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .ThenByDescending(m => m.MessageId)
                .Take(limit)
                .ToListAsync();

            messages.Reverse();
            foreach (var m in messages)
            {
                m.SentAt = DateTime.SpecifyKind(m.SentAt, DateTimeKind.Utc);
                if (m.ScheduledAt.HasValue)
                {
                    m.ScheduledAt = DateTime.SpecifyKind(m.ScheduledAt.Value, DateTimeKind.Utc);
                }
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
            string friendshipStatus = "none";
            int friendshipId = 0;
            string email = "";

            if (contactUser != null)
            {
                email = contactUser.Email;
                var friendship = await _context.Friendships.FirstOrDefaultAsync(fc => 
                    (fc.RequesterId == actualUserId && fc.AddresseeId == contactUser.UserId) || 
                    (fc.RequesterId == contactUser.UserId && fc.AddresseeId == actualUserId));

                if (friendship != null)
                {
                    friendshipId = friendship.FriendshipId;
                    if (friendship.Status == "accepted")
                    {
                        isFriend = true;
                        friendshipStatus = "accepted";
                    }
                    else if (friendship.Status == "pending")
                    {
                        friendshipStatus = friendship.RequesterId == actualUserId ? "pending_sent" : "pending_received";
                    }
                    else if (friendship.Status == "rejected")
                    {
                        friendshipStatus = "rejected";
                    }
                }
            }

            // Check block status
            bool iHaveBlocked = false;
            int blockId = 0;
            var myBlock = await _context.Blocklists.FirstOrDefaultAsync(b => b.UserId == actualUserId && b.BlockedNumber == contactNumber);
            if (myBlock != null)
            {
                iHaveBlocked = true;
                blockId = myBlock.BlockId;
            }

            var sender = await _context.Users.FindAsync(actualUserId);
            bool iAmBlocked = false;
            if (contactUser != null && sender != null)
            {
                iAmBlocked = await _context.Blocklists.AnyAsync(b => b.UserId == contactUser.UserId && b.BlockedNumber == sender.MobileNumber);
            }

            if (isFriend)
            {
                return Ok(new { isFriend = true, remaining = -1, limit = -1, sentCount = 0, friendshipStatus = "accepted", friendshipId, email, contactUserId = contactUser?.UserId ?? 0, iHaveBlocked, iAmBlocked, blockId });
            }

            // Per-stranger Quota check (limit from User_Quotas table, remaining calculated dynamically)
            var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == actualUserId);
            int limit = quota?.FreeMessagesLeft ?? 5;

            // Count stranger messages (IsFreeFriendMsg == false) sent by actualUserId to contactNumber
            int sentCount = await _context.Messages.CountAsync(m => 
                m.SenderId == actualUserId && 
                m.ReceiverNumber == contactNumber && 
                !m.IsFreeFriendMsg);

            int remaining = Math.Max(0, limit - sentCount);

            return Ok(new { isFriend = false, remaining, limit, sentCount, friendshipStatus, friendshipId, email, contactUserId = contactUser?.UserId ?? 0, iHaveBlocked, iAmBlocked, blockId });
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
                string lang = Request.Headers["Accept-Language"].ToString();
                if (string.IsNullOrEmpty(lang)) lang = "en";
                string aiReply = await _aiService.ChatWithAiAsync(dto.Content, history, lang);

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

                // Push AI response via SignalR
                await _hubContext.Clients.User(sender.UserId.ToString()).SendAsync("ReceiveMessage", new {
                    id = aiMessage.MessageId,
                    senderId = aiMessage.SenderId,
                    senderMobileNumber = "9999999999",
                    receiverId = aiMessage.ReceiverId,
                    receiverNumber = aiMessage.ReceiverNumber,
                    content = aiMessage.Content,
                    isFreeFriendMsg = aiMessage.IsFreeFriendMsg,
                    scheduledAt = aiMessage.ScheduledAt,
                    sentTime = aiMessage.SentAt
                });

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

                bool iBlockedReceiver = await _context.Blocklists.AnyAsync(b => b.UserId == sender.UserId && b.BlockedNumber == dto.ReceiverNumber);
                if (iBlockedReceiver)
                {
                    return BadRequest(new { message = "You have blocked this contact. Please unblock first." });
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

            DateTime? scheduledUtc = null;
            if (dto.ScheduledAt.HasValue)
            {
                var dt = dto.ScheduledAt.Value;
                scheduledUtc = dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime();
            }

            bool isScheduled = scheduledUtc.HasValue && scheduledUtc.Value > DateTime.UtcNow;

            // --- MODERATION & SPAM DETECTION PIPELINE ---
            string spamStatus = "normal";
            string? moderationReason = null;
            DateTime? delayUntil = null;

            // 1. Repetitive Spam Detection Check (Identical content sent >= 3 times in last 2 minutes)
            string normalizedContent = dto.Content.Trim().ToLower();
            var recentTwoMinCutoff = DateTime.UtcNow.AddMinutes(-2);
            int recentIdenticalCount = await _context.Messages.CountAsync(m =>
                m.SenderId == sender.UserId &&
                m.SentAt >= recentTwoMinCutoff &&
                m.Content.ToLower().Trim() == normalizedContent);

            if (recentIdenticalCount >= 2)
            {
                spamStatus = "suspected_spam";
                moderationReason = "Cảnh báo spam: Người dùng gửi nội dung lặp lại bất thường trong thời gian ngắn.";
            }

            // 2. Sensitive Keyword Screening & AI Intent Analysis
            var activeKeywords = await _context.KeywordRules.Where(k => k.IsActive).ToListAsync();
            var matchedRule = activeKeywords.FirstOrDefault(k => 
                normalizedContent.Contains(k.Keyword.ToLower()));

            if (matchedRule != null)
            {
                // Call AI for contextual intent analysis
                var (isMalicious, aiExplanation) = await _aiService.AnalyzeMessageModerationAsync(dto.Content, matchedRule.Keyword);

                if (matchedRule.Action == "block" || (isMalicious && matchedRule.Category == "Scam"))
                {
                    return BadRequest(new { message = $"Tin nhắn bị hệ thống kiểm duyệt chặn: Từ khóa '{matchedRule.Keyword}' ({aiExplanation})" });
                }
                else if (matchedRule.Action == "delay")
                {
                    spamStatus = "delayed";
                    delayUntil = DateTime.UtcNow.AddMinutes(5);
                    moderationReason = $"Tạm hoãn gửi 5 phút theo quy định từ khóa [{matchedRule.Keyword}]. Phân tích AI: {aiExplanation}";
                }
                else
                {
                    spamStatus = "sensitive_flagged";
                    moderationReason = $"Đã đánh nhãn vi phạm từ khóa [{matchedRule.Keyword}]. Phân tích AI: {aiExplanation}";
                }
            }

            if (!isFriend)
            {
                // Retrieve user's stranger SMS limit
                var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == sender.UserId);
                int limit = quota?.FreeMessagesLeft ?? 5;

                // Count how many stranger messages the sender has already sent to this specific number
                int sentCount = await _context.Messages.CountAsync(m => 
                    m.SenderId == sender.UserId && 
                    m.ReceiverNumber == dto.ReceiverNumber && 
                    !m.IsFreeFriendMsg);

                if (sentCount >= limit)
                {
                    return BadRequest(new { message = $"Bạn đã dùng hết {limit} tin nhắn miễn phí cho số điện thoại người lạ này. Vui lòng kết bạn để nhắn tin không giới hạn." });
                }
            }

            var message = new Message
            {
                SenderId = sender.UserId,
                ReceiverNumber = dto.ReceiverNumber,
                ReceiverId = receiverId,
                Content = dto.Content,
                SentAt = DateTime.UtcNow,
                IsFreeFriendMsg = isFriend,
                ScheduledAt = isScheduled ? scheduledUtc : null,
                SpamStatus = spamStatus,
                ModerationReason = moderationReason,
                DelayUntil = delayUntil
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

            // Push message via SignalR if receiver is a registered user
            if (receiverId.HasValue && !isScheduled)
            {
                await _hubContext.Clients.User(receiverId.Value.ToString()).SendAsync("ReceiveMessage", new {
                    id = message.MessageId,
                    senderId = message.SenderId,
                    senderMobileNumber = sender.MobileNumber,
                    receiverId = message.ReceiverId,
                    receiverNumber = message.ReceiverNumber,
                    content = message.Content,
                    isFreeFriendMsg = message.IsFreeFriendMsg,
                    scheduledAt = message.ScheduledAt,
                    sentTime = message.SentAt
                });
            }

            message.SentAt = DateTime.SpecifyKind(message.SentAt, DateTimeKind.Utc);
            if (message.ScheduledAt.HasValue)
            {
                message.ScheduledAt = DateTime.SpecifyKind(message.ScheduledAt.Value, DateTimeKind.Utc);
            }

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

            DateTime? scheduledUtc = null;
            if (dto.ScheduledAt.HasValue)
            {
                var dt = dto.ScheduledAt.Value;
                scheduledUtc = dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime();
            }

            bool isScheduled = scheduledUtc.HasValue && scheduledUtc.Value > DateTime.UtcNow;

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
                    int limit = quota?.FreeMessagesLeft ?? 5;

                    int strangerSentCount = await _context.Messages.CountAsync(m => 
                        m.SenderId == sender.UserId && 
                        m.ReceiverNumber == number && 
                        !m.IsFreeFriendMsg);

                    if (strangerSentCount >= limit)
                    {
                        failedCount++;
                        details.Add($"{number}: Out of free message quota");
                        continue;
                    }
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
                    ScheduledAt = isScheduled ? scheduledUtc : null
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

                // Push bulk message via SignalR if receiver is a registered user
                if (receiverId.HasValue && !isScheduled)
                {
                    await _hubContext.Clients.User(receiverId.Value.ToString()).SendAsync("ReceiveMessage", new {
                        id = message.MessageId,
                        senderId = message.SenderId,
                        senderMobileNumber = sender.MobileNumber,
                        receiverId = message.ReceiverId,
                        receiverNumber = message.ReceiverNumber,
                        content = message.Content,
                        isFreeFriendMsg = message.IsFreeFriendMsg,
                        scheduledAt = message.ScheduledAt,
                        sentTime = message.SentAt
                    });
                }

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
