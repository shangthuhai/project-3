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

            var contact = await _context.Contacts.FindAsync(dto.ContactId);
            if (contact == null)
            {
                return NotFound(new { message = "Contact not found." });
            }

            if (contact.UserId != userId)
            {
                return BadRequest(new { message = "Contact does not belong to your contact list." });
            }

            // Check if already in group
            bool exists = await _context.ContactGroupMembers
                .AnyAsync(m => m.GroupId == id && m.ContactId == dto.ContactId);

            if (exists)
            {
                return BadRequest(new { message = "Contact is already a member of this group." });
            }

            var member = new ContactGroupMember
            {
                GroupId = id,
                ContactId = dto.ContactId
            };

            _context.ContactGroupMembers.Add(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contact added to group successfully.", contact });
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
        public int ContactId { get; set; }
    }
}
