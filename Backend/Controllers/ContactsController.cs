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
    public class ContactsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContactsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/contacts?userId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Contact>>> GetContacts([FromQuery] int userId)
        {
            return await _context.Contacts
                .Where(c => c.UserId == userId)
                .ToListAsync();
        }

        // POST: api/contacts
        [HttpPost]
        public async Task<ActionResult<Contact>> PostContact(Contact contact)
        {
            if (string.IsNullOrWhiteSpace(contact.ContactNumber) || contact.ContactNumber.Length != 10 || !contact.ContactNumber.All(char.IsDigit))
            {
                return BadRequest(new { message = "Contact number must be exactly 10 digits." });
            }

            // Check if contact already exists for this user
            var exists = await _context.Contacts.AnyAsync(c => c.UserId == contact.UserId && c.ContactNumber == contact.ContactNumber);
            if (exists)
            {
                return BadRequest(new { message = "This contact number is already in your contact list." });
            }

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetContacts), new { userId = contact.UserId }, contact);
        }

        // DELETE: api/contacts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contact = await _context.Contacts.FindAsync(id);
            if (contact == null)
            {
                return NotFound(new { message = "Contact not found" });
            }

            _context.Contacts.Remove(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contact deleted successfully" });
        }
    }
}
