using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // GET: api/users/check-username?username=xyz
        [HttpGet("check-username")]
        public async Task<IActionResult> CheckUsername([FromQuery] string username)
        {
            if (string.IsNullOrWhiteSpace(username)) return BadRequest(new { message = "Username cannot be empty." });
            var exists = await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower());
            return Ok(new { available = !exists });
        }

        // GET: api/users/check-mobile?mobile=0987654321
        [HttpGet("check-mobile")]
        public async Task<IActionResult> CheckMobile([FromQuery] string mobile)
        {
            if (string.IsNullOrWhiteSpace(mobile)) return BadRequest(new { message = "Mobile number cannot be empty." });
            var exists = await _context.Users.AnyAsync(u => u.MobileNumber == mobile);
            return Ok(new { available = !exists });
        }

        // GET: api/users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }
            return user;
        }

        // PUT: api/users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            var dbUser = await _context.Users.FindAsync(id);
            if (dbUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Update details
            dbUser.Name = user.Name;
            dbUser.Gender = user.Gender;
            dbUser.Dob = user.Dob;
            dbUser.Address = user.Address;
            dbUser.MaritalStatus = user.MaritalStatus;
            dbUser.Hobbies = user.Hobbies;
            dbUser.Likes = user.Likes;
            dbUser.Dislikes = user.Dislikes;
            dbUser.Cuisines = user.Cuisines;
            dbUser.Sports = user.Sports;
            dbUser.ProfilePhoto = user.ProfilePhoto;
            
            dbUser.Qualification = user.Qualification;
            dbUser.School = user.School;
            dbUser.College = user.College;
            dbUser.WorkStatus = user.WorkStatus;
            dbUser.Organization = user.Organization;
            dbUser.Designation = user.Designation;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Users.AnyAsync(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return Ok(dbUser);
        }
    }
}
