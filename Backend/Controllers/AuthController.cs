using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || 
                string.IsNullOrWhiteSpace(dto.Password) || 
                string.IsNullOrWhiteSpace(dto.Email) || 
                string.IsNullOrWhiteSpace(dto.MobileNumber) ||
                string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "All required fields must be filled." });
            }

            if (dto.Password != dto.ConfirmPassword)
            {
                return BadRequest(new { message = "Passwords do not match." });
            }

            if (dto.MobileNumber.Length != 10 || !dto.MobileNumber.All(char.IsDigit))
            {
                return BadRequest(new { message = "Mobile number must be exactly 10 digits." });
            }

            // Check if username already exists
            var usernameTaken = await _context.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower());
            if (usernameTaken)
            {
                return BadRequest(new { message = "Username is already taken." });
            }

            // Check if mobile number already exists
            var mobileTaken = await _context.Users.AnyAsync(u => u.MobileNumber == dto.MobileNumber);
            if (mobileTaken)
            {
                return BadRequest(new { message = "THIS MOBILE NUMBER had been registered already" });
            }

            // Generate user initials for default SVG avatar
            string initials = "";
            var nameParts = dto.Name.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (nameParts.Length > 0)
            {
                initials += nameParts[0][0];
                if (nameParts.Length > 1) initials += nameParts[^1][0];
            }
            else
            {
                initials = "US";
            }
            initials = initials.ToUpper();

            var defaultAvatar = $"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%232481cc\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">{initials}</text></svg>";

            var newUser = new User
            {
                Username = dto.Username,
                PasswordHash = dto.Password,
                Email = dto.Email,
                MobileNumber = dto.MobileNumber,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            _context.Profiles.Add(new Profile
            {
                UserId = newUser.Id,
                FullName = dto.Name,
                ProfilePhoto = defaultAvatar,
                Gender = "Male",
                WorkStatus = "Employed",
                MaritalStatus = "Single"
            });

            await _context.SaveChangesAsync();

            var createdUser = await _context.Users
                .Include(u => u.Profile)
                .FirstAsync(u => u.Id == newUser.Id);

            return Ok(ToUserResponse(createdUser));
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Username and Password are required." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
            if (user == null || user.PasswordHash != dto.Password)
            {
                return Unauthorized(new { message = "Invalid Username or Password." });
            }

            user = await _context.Users.Include(u => u.Profile).FirstAsync(u => u.Id == user.Id);
            return Ok(ToUserResponse(user));
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

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
