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
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Profile)
                .ToListAsync();

            return users.Select(ToUserResponse).ToList();
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
        public async Task<ActionResult<object>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }
            return ToUserResponse(user);
        }

        // PUT: api/users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, UpdateUserDto user)
        {
            if (id != user.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            var dbUser = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (dbUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            dbUser.Email = user.Email;
            dbUser.MobileNumber = user.MobileNumber;

            dbUser.Profile ??= new Profile { UserId = dbUser.Id };
            dbUser.Profile.FullName = user.Name;
            dbUser.Profile.Gender = user.Gender;
            dbUser.Profile.Dob = user.Dob;
            dbUser.Profile.Address = user.Address;
            dbUser.Profile.MaritalStatus = user.MaritalStatus;
            dbUser.Profile.Hobbies = user.Hobbies;
            dbUser.Profile.Likes = user.Likes;
            dbUser.Profile.Dislikes = user.Dislikes;
            dbUser.Profile.Cuisines = user.Cuisines;
            dbUser.Profile.Sports = user.Sports;
            dbUser.Profile.ProfilePhoto = user.ProfilePhoto;
            dbUser.Profile.Qualification = user.Qualification;
            dbUser.Profile.School = user.School;
            dbUser.Profile.College = user.College;
            dbUser.Profile.WorkStatus = user.WorkStatus;
            dbUser.Profile.Organization = user.Organization;
            dbUser.Profile.Designation = user.Designation;

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

            return Ok(ToUserResponse(dbUser));
        }

        private static object ToUserResponse(User user)
        {
            return new
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                MobileNumber = user.MobileNumber,
                CreatedAt = user.CreatedAt,
                Name = user.Profile?.FullName ?? string.Empty,
                Gender = user.Profile?.Gender ?? string.Empty,
                Dob = user.Profile?.Dob,
                Address = user.Profile?.Address ?? string.Empty,
                MaritalStatus = user.Profile?.MaritalStatus ?? string.Empty,
                Hobbies = user.Profile?.Hobbies ?? string.Empty,
                Likes = user.Profile?.Likes ?? string.Empty,
                Dislikes = user.Profile?.Dislikes ?? string.Empty,
                Cuisines = user.Profile?.Cuisines ?? string.Empty,
                Sports = user.Profile?.Sports ?? string.Empty,
                ProfilePhoto = user.Profile?.ProfilePhoto ?? string.Empty,
                Qualification = user.Profile?.Qualification ?? string.Empty,
                School = user.Profile?.School ?? string.Empty,
                College = user.Profile?.College ?? string.Empty,
                WorkStatus = user.Profile?.WorkStatus ?? string.Empty,
                Organization = user.Profile?.Organization ?? string.Empty,
                Designation = user.Profile?.Designation ?? string.Empty
            };
        }
    }

    public class UpdateUserDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public DateTime? Dob { get; set; }
        public string Address { get; set; } = string.Empty;
        public string MaritalStatus { get; set; } = string.Empty;
        public string Hobbies { get; set; } = string.Empty;
        public string Likes { get; set; } = string.Empty;
        public string Dislikes { get; set; } = string.Empty;
        public string Cuisines { get; set; } = string.Empty;
        public string Sports { get; set; } = string.Empty;
        public string ProfilePhoto { get; set; } = string.Empty;
        public string Qualification { get; set; } = string.Empty;
        public string School { get; set; } = string.Empty;
        public string College { get; set; } = string.Empty;
        public string WorkStatus { get; set; } = string.Empty;
        public string Organization { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
    }
}
