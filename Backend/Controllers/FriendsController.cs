using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FriendsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/friends?userId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetFriends([FromQuery] int userId)
        {
            // Find connections where user is sender or receiver and status is Accepted
            var connections = await _context.FriendConnections
                .Where(fc => (fc.UserId == userId || fc.FriendUserId == userId) && fc.Status == "Accepted")
                .ToListAsync();

            var friendIds = connections
                .Select(fc => fc.UserId == userId ? fc.FriendUserId : fc.UserId)
                .ToList();

            var friends = await _context.Users
                .Where(u => friendIds.Contains(u.Id))
                .ToListAsync();

            return friends;
        }

        // GET: api/friends/pending?userId=1
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingRequests([FromQuery] int userId)
        {
            // Pending requests where user is the recipient (incoming requests)
            var pendingConnections = await _context.FriendConnections
                .Where(fc => fc.FriendUserId == userId && fc.Status == "Pending")
                .ToListAsync();

            var senderIds = pendingConnections.Select(fc => fc.UserId).ToList();
            var senders = await _context.Users
                .Where(u => senderIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var result = pendingConnections
                .Where(fc => senders.ContainsKey(fc.UserId))
                .Select(fc => new
                {
                    ConnectionId = fc.Id,
                    SenderId = fc.UserId,
                    SenderName = senders[fc.UserId].Name,
                    SenderEmail = senders[fc.UserId].Email,
                    SenderMobile = senders[fc.UserId].MobileNumber,
                    SenderPhoto = senders[fc.UserId].ProfilePhoto,
                    Status = fc.Status
                });

            return Ok(result);
        }

        // POST: api/friends/request
        [HttpPost("request")]
        public async Task<IActionResult> SendRequest([FromBody] FriendRequestDto dto)
        {
            var sender = await _context.Users.FindAsync(dto.SenderId);
            if (sender == null)
            {
                return NotFound(new { message = "Sender user not found." });
            }

            var recipient = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.RecipientEmail.ToLower());
            if (recipient == null)
            {
                return NotFound(new { message = "User with this email was not found." });
            }

            if (sender.Id == recipient.Id)
            {
                return BadRequest(new { message = "You cannot send a friend request to yourself." });
            }

            // Check if connection already exists
            var existingConnection = await _context.FriendConnections
                .FirstOrDefaultAsync(fc => 
                    (fc.UserId == sender.Id && fc.FriendUserId == recipient.Id) || 
                    (fc.UserId == recipient.Id && fc.FriendUserId == sender.Id));

            if (existingConnection != null)
            {
                if (existingConnection.Status == "Accepted")
                {
                    return BadRequest(new { message = "You are already friends with this user." });
                }
                else
                {
                    return BadRequest(new { message = "A friend request between you and this user is already pending." });
                }
            }

            // Create new pending connection
            var newConnection = new FriendConnection
            {
                UserId = sender.Id,
                FriendUserId = recipient.Id,
                Status = "Pending"
            };

            _context.FriendConnections.Add(newConnection);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Friend request sent successfully!" });
        }

        // POST: api/friends/respond
        [HttpPost("respond")]
        public async Task<IActionResult> RespondRequest([FromBody] FriendResponseDto dto)
        {
            var connection = await _context.FriendConnections.FindAsync(dto.ConnectionId);
            if (connection == null)
            {
                return NotFound(new { message = "Friend request connection not found." });
            }

            if (dto.Accept)
            {
                connection.Status = "Accepted";
                await _context.SaveChangesAsync();
                return Ok(new { message = "Friend request accepted." });
            }
            else
            {
                _context.FriendConnections.Remove(connection);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Friend request rejected." });
            }
        }
    }

    public class FriendRequestDto
    {
        public int SenderId { get; set; }
        public string RecipientEmail { get; set; } = string.Empty;
    }

    public class FriendResponseDto
    {
        public int ConnectionId { get; set; }
        public bool Accept { get; set; }
    }
}
