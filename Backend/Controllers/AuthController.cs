using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using System;
using System.Threading.Tasks;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FirebaseAdmin.Auth;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITelegramService _telegramService;
        private readonly IEmailService _emailService;
        private readonly IRegisterOtpService _registerOtpService;
        private readonly IForgotPasswordOtpService _forgotPasswordOtpService;

        public AuthController(
            AppDbContext context, 
            ITelegramService telegramService, 
            IEmailService emailService,
            IRegisterOtpService registerOtpService,
            IForgotPasswordOtpService forgotPasswordOtpService)
        {
            _context = context;
            _telegramService = telegramService;
            _emailService = emailService;
            _registerOtpService = registerOtpService;
            _forgotPasswordOtpService = forgotPasswordOtpService;
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

        // POST: api/auth/send-register-otp
        [HttpPost("send-register-otp")]
        public async Task<IActionResult> SendRegisterOtp([FromBody] SendRegisterOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            var trimmedEmail = dto.Email.Trim();

            // Check if email already exists
            var emailTaken = await _context.Users.AnyAsync(u => u.Email.ToLower() == trimmedEmail.ToLower());
            if (emailTaken)
            {
                return BadRequest(new { message = "Email này đã được đăng ký tài khoản." });
            }

            var code = _registerOtpService.GenerateOtp(trimmedEmail);

            await _emailService.SendEmailAsync(
                trimmedEmail,
                "Mã xác thực OTP Đăng ký - ChatFlow",
                $"Xin chào,\n\nMã xác nhận OTP đăng ký tài khoản ChatFlow của bạn là: {code}\nMã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với ai."
            );

            return Ok(new { message = "Mã OTP đã được gửi về email của bạn.", email = trimmedEmail });
        }

        // POST: api/auth/send-forgot-password-otp
        [HttpPost("send-forgot-password-otp")]
        public async Task<IActionResult> SendForgotPasswordOtp([FromBody] SendForgotPasswordOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            var trimmedEmail = dto.Email.Trim().ToLower();

            // Check if user exists with this email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == trimmedEmail);
            if (user == null)
            {
                return BadRequest(new { message = "Địa chỉ Email này chưa được đăng ký tài khoản trong hệ thống." });
            }

            var code = _forgotPasswordOtpService.GenerateOtp(trimmedEmail);

            await _emailService.SendEmailAsync(
                trimmedEmail,
                "Mã xác thực OTP Khôi phục mật khẩu - ChatFlow",
                $"Xin chào {user.Username},\n\nMã OTP đặt lại mật khẩu tài khoản ChatFlow của bạn là: {code}\nMã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với ai."
            );

            return Ok(new { message = "Mã OTP khôi phục mật khẩu đã được gửi về email của bạn.", email = trimmedEmail });
        }

        // POST: api/auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.OtpCode) ||
                string.IsNullOrWhiteSpace(dto.NewPassword) ||
                string.IsNullOrWhiteSpace(dto.ConfirmNewPassword))
            {
                return BadRequest(new { message = "Tất cả các trường bao gồm Email, Mã OTP và Mật khẩu mới phải được điền đầy đủ." });
            }

            if (dto.NewPassword != dto.ConfirmNewPassword)
            {
                return BadRequest(new { message = "Mật khẩu mới và xác nhận mật khẩu không trùng khớp." });
            }

            if (dto.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Mật khẩu mới phải có từ 6 ký tự trở lên." });
            }

            var trimmedEmail = dto.Email.Trim().ToLower();

            // Verify OTP
            var isValidOtp = _forgotPasswordOtpService.ValidateOtp(trimmedEmail, dto.OtpCode);
            if (!isValidOtp)
            {
                return BadRequest(new { message = "Mã OTP khôi phục mật khẩu không hợp lệ hoặc đã hết hạn." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == trimmedEmail);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

            user.PasswordHash = dto.NewPassword;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới." });
        }


        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || 
                string.IsNullOrWhiteSpace(dto.Password) || 
                string.IsNullOrWhiteSpace(dto.Email) || 
                string.IsNullOrWhiteSpace(dto.MobileNumber) ||
                string.IsNullOrWhiteSpace(dto.Name) ||
                string.IsNullOrWhiteSpace(dto.EmailOtpCode))
            {
                return BadRequest(new { message = "Tất cả các trường bao gồm Mã OTP Email phải được điền đầy đủ." });
            }

            if (dto.Password != dto.ConfirmPassword)
            {
                return BadRequest(new { message = "Passwords do not match." });
            }

            if (dto.MobileNumber.Length != 10 || !dto.MobileNumber.All(char.IsDigit))
            {
                return BadRequest(new { message = "Mobile number must be exactly 10 digits." });
            }

            var trimmedEmail = dto.Email.Trim();

            // Verify Email OTP Code
            var isOtpValid = _registerOtpService.ValidateOtp(trimmedEmail, dto.EmailOtpCode);
            if (!isOtpValid)
            {
                return BadRequest(new { message = "Mã OTP email không hợp lệ hoặc đã hết hạn." });
            }

            // Check if email already exists
            var emailTaken = await _context.Users.AnyAsync(u => u.Email.ToLower() == trimmedEmail.ToLower());
            if (emailTaken)
            {
                return BadRequest(new { message = "Email này đã được đăng ký tài khoản." });
            }

            // Check if username already exists
            var usernameTaken = await _context.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.Trim().ToLower());
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
                Username = dto.Username.Trim(),
                PasswordHash = dto.Password, // plain text for testing compatibility
                Email = trimmedEmail,
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

            var input = dto.Username.Trim().ToLower();

            // 1. Check if user is a standard User (Match by Username OR Email)
            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Quota)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == input || u.Email.ToLower() == input);

            if (user != null)
            {
                if (user.PasswordHash != dto.Password)
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

                    // Send OTP code via Email Service
                    await _emailService.SendEmailAsync(
                        user.Email,
                        "Mã xác nhận đăng nhập (2FA) - ChatFlow",
                        $"Xin chào {user.Username},\n\nMã xác nhận đăng nhập (OTP 2FA) của bạn là: {code}\nMã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với ai."
                    );

                    return Ok(new { requires2Fa = true, username = user.Username, email = user.Email });
                }

                // Generate JWT Token
                user.Token = GenerateJwtToken(user);

                return Ok(user);
            }

            // 2. Check if user is an Admin
            var admin = await _context.Admins
                .FirstOrDefaultAsync(a => a.Username.ToLower() == dto.Username.ToLower());

            if (admin != null)
            {
                if (admin.PasswordHash != dto.Password)
                {
                    return Unauthorized(new { message = "Invalid Username or Password." });
                }

                admin.Token = GenerateJwtTokenForAdmin(admin);

                return Ok(admin);
            }

            return Unauthorized(new { message = "Invalid Username or Password." });
        }

        // POST: api/auth/google
        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.IdToken))
                return BadRequest(new { message = "Google ID token is required." });

            string? email = null;
            string? displayName = null;
            string? photoUrl = null;

            if (FirebaseAuth.DefaultInstance != null)
            {
                try
                {
                    var decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(dto.IdToken);
                    email = decodedToken.Claims.TryGetValue("email", out var emailClaim) ? emailClaim?.ToString() : null;
                    displayName = decodedToken.Claims.TryGetValue("name", out var nameClaim) ? nameClaim?.ToString() : null;
                    photoUrl = decodedToken.Claims.TryGetValue("picture", out var pictureClaim) ? pictureClaim?.ToString() : null;
                }
                catch (Exception)
                {
                    // Fallback to JWT handler if Firebase Admin SDK verification fails
                }
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                try
                {
                    var handler = new JwtSecurityTokenHandler();
                    if (handler.CanReadToken(dto.IdToken))
                    {
                        var jsonToken = handler.ReadJwtToken(dto.IdToken);
                        email = jsonToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == "email_address")?.Value;
                        displayName = jsonToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value;
                        photoUrl = jsonToken.Claims.FirstOrDefault(c => c.Type == "picture")?.Value;
                    }
                }
                catch (Exception)
                {
                    // Ignore fallback errors and check result below
                }
            }

            if (string.IsNullOrWhiteSpace(email))
                return Unauthorized(new { message = "Google token is invalid or does not contain a valid email." });

            if (string.IsNullOrWhiteSpace(displayName))
                displayName = email.Split('@')[0];

            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Quota)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

            if (user == null)
            {
                var baseUsername = new string(email.Split('@')[0].ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
                if (string.IsNullOrWhiteSpace(baseUsername)) baseUsername = "googleuser";
                var username = baseUsername;
                var suffix = 1;
                while (await _context.Users.AnyAsync(u => u.Username == username))
                    username = $"{baseUsername}{suffix++}";

                var mobile = $"9{Math.Abs(email.GetHashCode()) % 1000000000:000000000}";
                while (await _context.Users.AnyAsync(u => u.MobileNumber == mobile))
                    mobile = $"9{Random.Shared.Next(0, 1000000000):000000000}";

                user = new User
                {
                    Username = username,
                    PasswordHash = Guid.NewGuid().ToString("N"),
                    Email = email,
                    MobileNumber = mobile,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Profile = new Profile
                    {
                        FullName = string.IsNullOrWhiteSpace(displayName) ? username : displayName,
                        ProfilePhoto = photoUrl,
                        Gender = "Male",
                        WorkStatus = "Employed",
                        MaritalStatus = "Single"
                    },
                    Quota = new UserQuota { FreeMessagesLeft = 5, UpdatedAt = DateTime.UtcNow }
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            if (!user.IsActive)
                return BadRequest(new { message = "This account is currently inactive. Please contact support." });

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

        private string GenerateJwtTokenForAdmin(Admin admin)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes("SuperSecretSecureKey123456789012345");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] 
                { 
                    new Claim(ClaimTypes.NameIdentifier, admin.AdminId.ToString()),
                    new Claim(ClaimTypes.Name, admin.Username),
                    new Claim(ClaimTypes.Role, "Admin")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = "smschat",
                Audience = "smschat",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // POST: api/auth/admin/login
        [HttpPost("admin/login")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Username and Password are required." });
            }

            var admin = await _context.Admins
                .FirstOrDefaultAsync(a => a.Username.ToLower() == dto.Username.ToLower());

            if (admin == null || admin.PasswordHash != dto.Password)
            {
                return Unauthorized(new { message = "Invalid Admin Username or Password." });
            }

            admin.Token = GenerateJwtTokenForAdmin(admin);

            return Ok(admin);
        }
    }

    public class SendRegisterOtpDto
    {
        public string Email { get; set; } = string.Empty;
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
        public string EmailOtpCode { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class GoogleLoginDto
    {
        public string IdToken { get; set; } = string.Empty;
    }

    public class SendForgotPasswordOtpDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}

