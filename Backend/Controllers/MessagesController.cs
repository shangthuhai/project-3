using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
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

        public MessagesController(AppDbContext context)
        {
            _context = context;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

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

            // Check if receiver is a registered user
            var receiverUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == dto.ReceiverNumber);
            bool isFriend = false;
            int? receiverId = null;

            if (receiverUser != null)
            {
                receiverId = receiverUser.UserId;
                // Check if they are friends
                isFriend = await _context.Friendships.AnyAsync(fc => 
                    fc.Status == "accepted" && 
                    ((fc.RequesterId == sender.UserId && fc.AddresseeId == receiverUser.UserId) || 
                     (fc.RequesterId == receiverUser.UserId && fc.AddresseeId == sender.UserId)));
            }

            if (!isFriend)
            {
                // Enforce global quota limit
                var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == sender.UserId);
                if (quota == null || quota.FreeMessagesLeft <= 0)
                {
                    return BadRequest(new { message = "You have reached your limit of 5 free messages for non-friends. Add them as a friend for unlimited free messaging." });
                }

                // Decrement free messages left
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
                IsFreeFriendMsg = isFriend
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync(); // Generates message_id

            // Record log in SMS_Logs table
            var log = new SMSLog
            {
                MessageId = message.MessageId,
                GatewayStatusCode = "200_OK",
                DeliveryStatus = "delivered",
                UpdatedAt = DateTime.UtcNow
            };
            _context.SMSLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(message);
        }
    }

    public class SendMessageDto
    {
        public string ReceiverNumber { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
