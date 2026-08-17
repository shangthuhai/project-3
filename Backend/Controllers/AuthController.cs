using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System;
using System.Threading.Tasks;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes("SuperSecretSecureKey123456789012345");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] 
                { 
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Name, user.Username)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = "smschat",
                Audience = "smschat",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
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
                PasswordHash = dto.Password, // plain text for testing compatibility
                Email = dto.Email,
                MobileNumber = dto.MobileNumber,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync(); // Generates UserId

            // Create associated profile details
            var newProfile = new Profile
            {
                UserId = newUser.UserId,
                FullName = dto.Name,
                ProfilePhoto = defaultAvatar,
                Gender = "Male",
                WorkStatus = "Employed",
                MaritalStatus = "Single"
            };
            _context.Profiles.Add(newProfile);

            // Create associated user quota (5 messages limit)
            var newQuota = new UserQuota
            {
                UserId = newUser.UserId,
                FreeMessagesLeft = 5,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserQuotas.Add(newQuota);

            await _context.SaveChangesAsync();

            // Load the profile and quota for returned user payload
            newUser.Profile = newProfile;
            newUser.Quota = newQuota;

            // Generate JWT Token
            newUser.Token = GenerateJwtToken(newUser);

            return Ok(newUser);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Username and Password are required." });
            }

            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Quota)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());

            if (user == null || user.PasswordHash != dto.Password)
            {
                return Unauthorized(new { message = "Invalid Username or Password." });
            }

            if (!user.IsActive)
            {
                return BadRequest(new { message = "This account is currently inactive. Please contact support." });
            }

            // Check if 2FA is enabled
            if (user.TwoFactorEnabled)
            {
                string code = Random.Shared.Next(100000, 999999).ToString();
                user.TwoFactorCode = code;
                user.TwoFactorExpiry = DateTime.UtcNow.AddMinutes(5);
                await _context.SaveChangesAsync();

                // Console output for simulation/retrieval
                Console.WriteLine($"[2FA OTP] Generated login code for user '{user.Username}': {code} (Sent to {user.Email})");

                return Ok(new { requires2Fa = true, username = user.Username, email = user.Email });
            }

            // Generate JWT Token
            user.Token = GenerateJwtToken(user);

            return Ok(user);
        }

        // POST: api/auth/verify-2fa
        [HttpPost("verify-2fa")]
        public async Task<IActionResult> Verify2Fa([FromBody] Verify2FaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Code))
            {
                return BadRequest(new { message = "Username and OTP code are required." });
            }

            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Quota)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (user.TwoFactorCode != dto.Code || user.TwoFactorExpiry == null || user.TwoFactorExpiry < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Invalid or expired OTP code." });
            }

            // Reset OTP fields
            user.TwoFactorCode = null;
            user.TwoFactorExpiry = null;
            await _context.SaveChangesAsync();

            // Generate JWT Token
            user.Token = GenerateJwtToken(user);

            return Ok(user);
        }
    }

    public class Verify2FaDto
    {
        public string Username { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
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
