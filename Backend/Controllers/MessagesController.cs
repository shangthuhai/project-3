using Microsoft.AspNetCore.Mvc;
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
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MessagesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/messages/history?userId=1&contactNumber=0912345678
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<Message>>> GetHistory([FromQuery] int userId, [FromQuery] string contactNumber)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Find if there is a registered user with this contact number
            var contactUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == contactNumber);

            List<Message> messages;

            if (contactUser != null)
            {
                // If they are registered, history is messages sent between userId and contactUser.Id
                messages = await _context.Messages
                    .Where(m =>
                        (m.SenderId == userId && m.ReceiverNumber == contactNumber) ||
                        (m.SenderId == contactUser.Id && m.ReceiverNumber == user.MobileNumber))
                    .OrderBy(m => m.SentTime)
                    .ToListAsync();
            }
            else
            {
                // If not registered, history is just messages sent by this user to this non-registered number
                messages = await _context.Messages
                    .Where(m => m.SenderId == userId && m.ReceiverNumber == contactNumber)
                    .OrderBy(m => m.SentTime)
                    .ToListAsync();
            }

            return messages;
        }

        // GET: api/messages/quota?userId=1&contactNumber=0912345678
        [HttpGet("quota")]
        public async Task<ActionResult<object>> GetQuota([FromQuery] int userId, [FromQuery] string contactNumber)
        {
            // Check if the contact number belongs to a friend
            var contactUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == contactNumber);
            bool isFriend = false;

            if (contactUser != null)
            {
                isFriend = await _context.FriendConnections.AnyAsync(fc => 
                    fc.Status == "accepted" && 
                    ((fc.UserId == userId && fc.FriendUserId == contactUser.Id) || 
                     (fc.UserId == contactUser.Id && fc.FriendUserId == userId)));
            }

            if (isFriend)
            {
                return Ok(new { isFriend = true, remaining = -1, limit = -1, sentCount = 0 });
            }

            // Count messages sent by this user to this specific non-friend number
            var sentCount = await _context.Messages
                .CountAsync(m => m.SenderId == userId && m.ReceiverNumber == contactNumber && !m.IsFreeFriendMsg);

            int limit = 5;
            int remaining = Math.Max(0, limit - sentCount);

            return Ok(new { isFriend = false, remaining, limit, sentCount });
        }

        // POST: api/messages
        [HttpPost]
        public async Task<ActionResult<Message>> SendMessage([FromBody] SendMessageDto dto)
        {
            var sender = await _context.Users.FindAsync(dto.SenderId);
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
            if (receiverUser != null)
            {
                // Check if they are friends
                isFriend = await _context.FriendConnections.AnyAsync(fc => 
                    fc.Status == "accepted" && 
                    ((fc.UserId == sender.Id && fc.FriendUserId == receiverUser.Id) || 
                     (fc.UserId == receiverUser.Id && fc.FriendUserId == sender.Id)));
            }

            if (!isFriend)
            {
                // Non-friend: enforce 5-message limit
                var sentCount = await _context.Messages
                    .CountAsync(m => m.SenderId == sender.Id && m.ReceiverNumber == dto.ReceiverNumber && !m.IsFreeFriendMsg);

                if (sentCount >= 5)
                {
                    return BadRequest(new { message = "You have reached the limit of 5 free messages for this number. Add them as a friend for unlimited free messaging." });
                }
            }

            var message = new Message
            {
                SenderId = sender.Id,
                ReceiverNumber = dto.ReceiverNumber,
                Content = dto.Content,
                SentTime = DateTime.UtcNow,
                IsFreeFriendMsg = isFriend
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(message);
        }
    }

    public class SendMessageDto
    {
        public int SenderId { get; set; }
        public string ReceiverNumber { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
