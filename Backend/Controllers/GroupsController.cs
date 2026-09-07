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
    public class GroupsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GroupsController(AppDbContext context)
        {
            _context = context;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        // GET: api/groups
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContactGroup>>> GetGroups()
        {
            int userId = AuthenticatedUserId;
            var groups = await _context.ContactGroups
                .Where(g => g.UserId == userId)
                .OrderBy(g => g.Name)
                .ToListAsync();

            return Ok(groups);
        }

        // POST: api/groups
        [HttpPost]
        public async Task<ActionResult<ContactGroup>> CreateGroup([FromBody] CreateGroupDto dto)
        {
            int userId = AuthenticatedUserId;

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Group name is required." });
            }

            var group = new ContactGroup
            {
                UserId = userId,
                Name = dto.Name.Trim()
            };

            _context.ContactGroups.Add(group);
            await _context.SaveChangesAsync();

            return Ok(group);
        }

        // DELETE: api/groups/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGroup(int id)
        {
            int userId = AuthenticatedUserId;

            var group = await _context.ContactGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = "Group not found." });
            }

            if (group.UserId != userId)
            {
                return Forbid();
            }

            // Remove all memberships first
            var members = await _context.ContactGroupMembers
                .Where(m => m.GroupId == id)
                .ToListAsync();
            _context.ContactGroupMembers.RemoveRange(members);

            // Remove group
            _context.ContactGroups.Remove(group);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Group deleted successfully." });
        }

        // GET: api/groups/{id}/members
        [HttpGet("{id}/members")]
        public async Task<ActionResult<IEnumerable<Contact>>> GetGroupMembers(int id)
        {
            int userId = AuthenticatedUserId;

            var group = await _context.ContactGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = "Group not found." });
            }

            if (group.UserId != userId)
            {
                return Forbid();
            }

            var members = await _context.ContactGroupMembers
                .Include(m => m.Contact)
                .Where(m => m.GroupId == id)
                .Select(m => m.Contact)
                .ToListAsync();

            return Ok(members);
        }

        // POST: api/groups/{id}/members
        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMember(int id, [FromBody] AddGroupMemberDto dto)
        {
            int userId = AuthenticatedUserId;

            var group = await _context.ContactGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = "Group not found." });
            }

            if (group.UserId != userId)
            {
                return Forbid();
            }

            Contact? contactTarget = null;

            if (dto.ContactId.HasValue && dto.ContactId.Value > 0)
            {
                contactTarget = await _context.Contacts.FindAsync(dto.ContactId.Value);
                if (contactTarget == null)
                {
                    return NotFound(new { message = "Contact not found." });
                }
                if (contactTarget.UserId != userId)
                {
                    return BadRequest(new { message = "Contact does not belong to your contact list." });
                }
            }
            else if (dto.FriendUserId.HasValue && dto.FriendUserId.Value > 0)
            {
                var friendUser = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.UserId == dto.FriendUserId.Value);
                if (friendUser == null)
                {
                    return NotFound(new { message = "Friend user not found." });
                }

                // Find existing contact or create one
                contactTarget = await _context.Contacts.FirstOrDefaultAsync(c => c.UserId == userId && c.ContactNumber == friendUser.MobileNumber);
                if (contactTarget == null)
                {
                    string fullName = friendUser.Name ?? friendUser.Username;
                    var nameParts = fullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                    string fName = nameParts.Length > 0 ? nameParts[0] : friendUser.Username;
                    string lName = nameParts.Length > 1 ? nameParts[1] : "";

                    contactTarget = new Contact
                    {
                        UserId = userId,
                        FirstName = fName,
                        LastName = string.IsNullOrEmpty(lName) ? "(Friend)" : lName,
                        ContactNumber = friendUser.MobileNumber
                    };
                    _context.Contacts.Add(contactTarget);
                    await _context.SaveChangesAsync();
                }
            }
            else if (!string.IsNullOrWhiteSpace(dto.ContactNumber))
            {
                string phone = dto.ContactNumber.Trim();
                if (phone.Length != 10 || !phone.All(char.IsDigit))
                {
                    return BadRequest(new { message = "Contact number must be exactly 10 digits." });
                }

                contactTarget = await _context.Contacts.FirstOrDefaultAsync(c => c.UserId == userId && c.ContactNumber == phone);
                if (contactTarget == null)
                {
                    contactTarget = new Contact
                    {
                        UserId = userId,
                        FirstName = string.IsNullOrWhiteSpace(dto.FirstName) ? "Contact" : dto.FirstName.Trim(),
                        LastName = dto.LastName?.Trim() ?? "",
                        ContactNumber = phone
                    };
                    _context.Contacts.Add(contactTarget);
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                return BadRequest(new { message = "Please select a contact/friend or enter a contact number." });
            }

            // Check if already in group
            bool exists = await _context.ContactGroupMembers
                .AnyAsync(m => m.GroupId == id && m.ContactId == contactTarget.ContactId);

            if (exists)
            {
                return BadRequest(new { message = "Contact is already a member of this group." });
            }

            var member = new ContactGroupMember
            {
                GroupId = id,
                ContactId = contactTarget.ContactId
            };

            _context.ContactGroupMembers.Add(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contact added to group successfully.", contact = contactTarget });
        }

        // DELETE: api/groups/{id}/members/{contactId}
        [HttpDelete("{id}/members/{contactId}")]
        public async Task<IActionResult> RemoveMember(int id, int contactId)
        {
            int userId = AuthenticatedUserId;

            var group = await _context.ContactGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = "Group not found." });
            }

            if (group.UserId != userId)
            {
                return Forbid();
            }

            var member = await _context.ContactGroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == id && m.ContactId == contactId);

            if (member == null)
            {
                return NotFound(new { message = "Contact is not a member of this group." });
            }

            _context.ContactGroupMembers.Remove(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contact removed from group successfully." });
        }
    }

    public class CreateGroupDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class AddGroupMemberDto
    {
        public int? ContactId { get; set; }
        public int? FriendUserId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ContactNumber { get; set; }
    }
}
