using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        // GET: api/users
        [HttpGet]
        [AllowAnonymous] // Allowed anonymously for the landing page demo switcher list
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.Include(u => u.Profile).ToListAsync();
        }

        // GET: api/users/check-username?username=xyz
        [HttpGet("check-username")]
        [AllowAnonymous] // Allow checking username availability during registration
        public async Task<IActionResult> CheckUsername([FromQuery] string username)
        {
            if (string.IsNullOrWhiteSpace(username)) return BadRequest(new { message = "Username cannot be empty." });
            var exists = await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower());
            return Ok(new { available = !exists });
        }

        // GET: api/users/check-mobile?mobile=0987654321
        [HttpGet("check-mobile")]
        [AllowAnonymous] // Allow checking SĐT during registration
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
            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.UserId == id);
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
            if (id != user.UserId)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            // Secure validation: Only allow user to update their own profile details
            if (id != AuthenticatedUserId)
            {
                return Forbid();
            }

            var dbUser = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.UserId == id);
            if (dbUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Update details via the flat properties (which forwards to dbUser.Profile)
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
                if (!await _context.Users.AnyAsync(e => e.UserId == id))
                {
                    return NotFound();
                }
                throw;
            }

            return Ok(dbUser);
        }
    }
}
