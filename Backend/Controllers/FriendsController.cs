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
    public class FriendsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FriendsController(AppDbContext context)
        {
            _context = context;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        // GET: api/friends?userId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetFriends([FromQuery] int? userId)
        {
            // Securely read from JWT claims
            int actualUserId = AuthenticatedUserId;

            // Find connections where user is sender or receiver and status is accepted
            var connections = await _context.Friendships
                .Where(fc => (fc.RequesterId == actualUserId || fc.AddresseeId == actualUserId) && fc.Status == "accepted")
                .ToListAsync();

            var friendIds = connections
                .Select(fc => fc.RequesterId == actualUserId ? fc.AddresseeId : fc.RequesterId)
                .ToList();

            var friends = await _context.Users
                .Include(u => u.Profile)
                .Where(u => friendIds.Contains(u.UserId))
                .ToListAsync();

            return friends;
        }

        // GET: api/friends/pending?userId=1
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingRequests([FromQuery] int? userId)
        {
            // Securely read from JWT claims
            int actualUserId = AuthenticatedUserId;

            // Pending requests where user is the recipient (incoming requests)
            var pendingConnections = await _context.Friendships
                .Where(fc => fc.AddresseeId == actualUserId && fc.Status == "pending")
                .ToListAsync();

            var senderIds = pendingConnections.Select(fc => fc.RequesterId).ToList();
            var senders = await _context.Users
                .Include(u => u.Profile)
                .Where(u => senderIds.Contains(u.UserId))
                .ToDictionaryAsync(u => u.UserId);

            var result = pendingConnections
                .Where(fc => senders.ContainsKey(fc.RequesterId))
                .Select(fc => new
                {
                    ConnectionId = fc.FriendshipId,
                    SenderId = fc.RequesterId,
                    SenderName = senders[fc.RequesterId].Name,
                    SenderEmail = senders[fc.RequesterId].Email,
                    SenderMobile = senders[fc.RequesterId].MobileNumber,
                    SenderPhoto = senders[fc.RequesterId].ProfilePhoto,
                    Status = fc.Status
                });

            return Ok(result);
        }

        // POST: api/friends/request
        [HttpPost("request")]
        public async Task<IActionResult> SendRequest([FromBody] FriendRequestDto dto)
        {
            // Securely bind sender from token
            int senderId = AuthenticatedUserId;

            var sender = await _context.Users.FindAsync(senderId);
            if (sender == null)
            {
                return NotFound(new { message = "Sender user not found." });
            }

            var recipient = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.RecipientEmail.ToLower());
            if (recipient == null)
            {
                return NotFound(new { message = "User with this email was not found." });
            }

            if (sender.UserId == recipient.UserId)
            {
                return BadRequest(new { message = "You cannot send a friend request to yourself." });
            }

            // Check if connection already exists
            var existingConnection = await _context.Friendships
                .FirstOrDefaultAsync(fc => 
                    (fc.RequesterId == sender.UserId && fc.AddresseeId == recipient.UserId) || 
                    (fc.RequesterId == recipient.UserId && fc.AddresseeId == sender.UserId));

            if (existingConnection != null)
            {
                if (existingConnection.Status == "accepted")
                {
                    return BadRequest(new { message = "You are already friends with this user." });
                }
                else
                {
                    return BadRequest(new { message = "A friend request between you and this user is already pending." });
                }
            }

            // Create new pending connection
            var newConnection = new Friendship
            {
                RequesterId = sender.UserId,
                AddresseeId = recipient.UserId,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(newConnection);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Friend request sent successfully!" });
        }

        // POST: api/friends/respond
        [HttpPost("respond")]
        public async Task<IActionResult> RespondRequest([FromBody] FriendResponseDto dto)
        {
            var connection = await _context.Friendships.FindAsync(dto.ConnectionId);
            if (connection == null)
            {
                return NotFound(new { message = "Friend request connection not found." });
            }

            // Enforce security: Only the recipient (AddresseeId) can accept/reject the request
            if (connection.AddresseeId != AuthenticatedUserId)
            {
                return Forbid();
            }

            if (dto.Accept)
            {
                connection.Status = "accepted";
                await _context.SaveChangesAsync();
                return Ok(new { message = "Friend request accepted." });
            }
            else
            {
                _context.Friendships.Remove(connection);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Friend request rejected." });
            }
        }

        // GET: api/friends/search?query=abc&page=1&pageSize=10
        [HttpGet("search")]
        public async Task<ActionResult<object>> SearchUsers([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            int currentUserId = AuthenticatedUserId;
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok(new { items = new List<object>(), totalCount = 0 });
            }

            query = query.Trim().ToLower();

            // Query users matching name, mobile number, or username
            // Exclude current user and the AI assistant (id = 999)
            var usersQuery = _context.Users
                .Include(u => u.Profile)
                .Where(u => u.UserId != currentUserId && u.UserId != 999 &&
                            (u.Username.ToLower().Contains(query) ||
                             u.MobileNumber.Contains(query) ||
                             (u.Profile != null && u.Profile.FullName != null && u.Profile.FullName.ToLower().Contains(query))));

            int totalCount = await usersQuery.CountAsync();

            var matchedUsers = await usersQuery
                .OrderBy(u => u.Username)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Fetch friendships for these matched users relative to the current user
            var userIds = matchedUsers.Select(u => u.UserId).ToList();
            var friendships = await _context.Friendships
                .Where(f => (f.RequesterId == currentUserId && userIds.Contains(f.AddresseeId)) ||
                            (f.AddresseeId == currentUserId && userIds.Contains(f.RequesterId)))
                .ToListAsync();

            var items = matchedUsers.Select(u =>
            {
                var friendship = friendships.FirstOrDefault(f => f.RequesterId == u.UserId || f.AddresseeId == u.UserId);
                string status = "none";
                int friendshipId = 0;

                if (friendship != null)
                {
                    friendshipId = friendship.FriendshipId;
                    if (friendship.Status == "accepted")
                    {
                        status = "accepted";
                    }
                    else if (friendship.Status == "pending")
                    {
                        status = friendship.RequesterId == currentUserId ? "pending_sent" : "pending_received";
                    }
                    else if (friendship.Status == "rejected")
                    {
                        status = "rejected";
                    }
                }

                return new
                {
                    id = u.UserId,
                    username = u.Username,
                    name = u.Name,
                    mobileNumber = u.MobileNumber,
                    email = u.Email,
                    profilePhoto = u.ProfilePhoto,
                    friendshipStatus = status,
                    friendshipId = friendshipId
                };
            }).ToList();

            return Ok(new { items, totalCount });
        }
    }

    public class FriendRequestDto
    {
        public string RecipientEmail { get; set; } = string.Empty;
    }

    public class FriendResponseDto
    {
        public int ConnectionId { get; set; }
        public bool Accept { get; set; }
    }
}
