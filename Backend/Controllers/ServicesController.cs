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
    public class ServicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServicesController(AppDbContext context)
        {
            _context = context;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        // GET: api/services?userId=1
        [HttpGet]
        public async Task<ActionResult<object>> GetActivatedServices([FromQuery] int? userId)
        {
            // Securely read from JWT claims
            int actualUserId = AuthenticatedUserId;

            var user = await _context.Users.FindAsync(actualUserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Project User_Services and Services into flat layout compatible with old ServiceActivation payload
            var activations = await _context.UserServices
                .Include(us => us.Service)
                .Where(us => us.UserId == actualUserId && us.PaymentStatus == "paid")
                .Select(us => new {
                    Id = us.SubscriptionId,
                    UserId = us.UserId,
                    ServiceName = us.Service != null ? us.Service.ServiceName : string.Empty,
                    Price = us.Service != null ? us.Service.Price : 0m,
                    ActivatedTime = us.ActivatedAt
                })
                .ToListAsync();

            return activations;
        }

        // POST: api/services/request-otp
        [HttpPost("request-otp")]
        public async Task<IActionResult> RequestOtp()
        {
            int userId = AuthenticatedUserId;
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            string code = Random.Shared.Next(100000, 999999).ToString();
            user.TwoFactorCode = code;
            user.TwoFactorExpiry = DateTime.UtcNow.AddMinutes(5);
            await _context.SaveChangesAsync();

            Console.WriteLine($"[2FA OTP] Generated VAS payment code for user '{user.Username}': {code} (Sent to {user.Email})");

            return Ok(new { message = "OTP has been sent to your email.", email = user.Email });
        }

        // POST: api/services/activate
        [HttpPost("activate")]
        public async Task<IActionResult> ActivateService([FromBody] ActivateServiceDto dto)
        {
            // Securely bind userId from token
            int userId = AuthenticatedUserId;

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Check 2FA security
            if (user.TwoFactorEnabled)
            {
                if (string.IsNullOrWhiteSpace(dto.OtpCode))
                {
                    return BadRequest(new { requiresOtp = true, message = "OTP code is required to complete this VAS payment." });
                }

                if (user.TwoFactorCode != dto.OtpCode || user.TwoFactorExpiry == null || user.TwoFactorExpiry < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Invalid or expired OTP code." });
                }

                // Clear OTP after successful check
                user.TwoFactorCode = null;
                user.TwoFactorExpiry = null;
                await _context.SaveChangesAsync();
            }

            // Get service from the database Services table
            var service = await _context.Services.FirstOrDefaultAsync(s => s.ServiceName == dto.ServiceName && s.IsActive);
            if (service == null)
            {
                return BadRequest(new { message = $"Service '{dto.ServiceName}' is not available or inactive." });
            }

            // Check if already activated
            var alreadyActivated = await _context.UserServices
                .AnyAsync(s => s.UserId == userId && s.ServiceId == service.ServiceId && s.PaymentStatus == "paid");

            if (alreadyActivated)
            {
                return BadRequest(new { message = $"The '{dto.ServiceName}' service is already active on your account." });
            }

            // Mock Credit Card validation
            string cleanCard = (dto.CardNumber ?? "").Replace(" ", "");
            if (string.IsNullOrWhiteSpace(dto.CardNumber) || cleanCard.Length != 16 || !cleanCard.All(char.IsDigit))
            {
                return BadRequest(new { message = "Invalid Credit Card number. Must be a 16-digit number." });
            }

            if (string.IsNullOrWhiteSpace(dto.Cvv) || dto.Cvv.Length != 3 || !dto.Cvv.All(char.IsDigit))
            {
                return BadRequest(new { message = "Invalid CVV. Must be a 3-digit number." });
            }

            // 1. Create Subscription in User_Services
            var subscription = new UserService
            {
                UserId = userId,
                ServiceId = service.ServiceId,
                PaymentStatus = "paid",
                ActivatedAt = DateTime.UtcNow
            };
            _context.UserServices.Add(subscription);
            await _context.SaveChangesAsync(); // Generate SubscriptionId

            // 2. Create Billing Record in Transactions
            string cardLast4 = cleanCard.Substring(12);
            var transaction = new Transaction
            {
                UserId = userId,
                SubscriptionId = subscription.SubscriptionId,
                Amount = service.Price,
                CardLast4 = cardLast4,
                TransactionStatus = "success",
                CreatedAt = DateTime.UtcNow
            };
            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Return flat structure compatible with frontend
            var activationResult = new {
                Id = subscription.SubscriptionId,
                UserId = subscription.UserId,
                ServiceName = service.ServiceName,
                Price = service.Price,
                ActivatedTime = subscription.ActivatedAt
            };

            return Ok(new { message = $"Service '{dto.ServiceName}' activated successfully!", service = activationResult });
        }
    }

    public class ActivateServiceDto
    {
        public string ServiceName { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
        public string? OtpCode { get; set; }
    }
}
