using Microsoft.AspNetCore.Mvc;
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
    public class ServicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServicesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/services?userId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetActivatedServices([FromQuery] int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var activations = await _context.UserServices
                .Include(s => s.Service)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.ActivatedAt)
                .Select(s => new
                {
                    Id = s.Id,
                    UserId = s.UserId,
                    ServiceId = s.ServiceId,
                    ServiceName = s.Service != null ? s.Service.ServiceName : string.Empty,
                    Description = s.Service != null ? s.Service.Description : string.Empty,
                    Price = s.Service != null ? s.Service.Price : 0m,
                    PaymentStatus = s.PaymentStatus,
                    ActivatedTime = s.ActivatedAt
                })
                .ToListAsync();

            return activations;
        }

        // POST: api/services/activate
        [HttpPost("activate")]
        public async Task<IActionResult> ActivateService([FromBody] ActivateServiceDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var service = await _context.Services.FirstOrDefaultAsync(s => s.ServiceName.ToLower() == dto.ServiceName.ToLower());
            if (service == null)
            {
                return BadRequest(new { message = "Invalid service name. Available: Joke, Current Affairs, Sports, News." });
            }

            // Check if already activated
            var alreadyActivated = await _context.UserServices
                .AnyAsync(s => s.UserId == dto.UserId && s.ServiceId == service.Id);

            if (alreadyActivated)
            {
                return BadRequest(new { message = $"The '{dto.ServiceName}' service is already active on your account." });
            }

            // Mock Credit Card validation
            if (string.IsNullOrWhiteSpace(dto.CardNumber) || dto.CardNumber.Replace(" ", "").Length != 16 || !dto.CardNumber.Replace(" ", "").All(char.IsDigit))
            {
                return BadRequest(new { message = "Invalid Credit Card number. Must be a 16-digit number." });
            }

            if (string.IsNullOrWhiteSpace(dto.Cvv) || dto.Cvv.Length != 3 || !dto.Cvv.All(char.IsDigit))
            {
                return BadRequest(new { message = "Invalid CVV. Must be a 3-digit number." });
            }

            var activation = new UserService
            {
                UserId = dto.UserId,
                ServiceId = service.Id,
                PaymentStatus = "paid",
                ActivatedAt = DateTime.UtcNow
            };

            _context.UserServices.Add(activation);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Service '{service.ServiceName}' activated successfully!",
                service = new
                {
                    activation.Id,
                    activation.UserId,
                    activation.ServiceId,
                    ServiceName = service.ServiceName,
                    service.Description,
                    service.Price,
                    activation.PaymentStatus,
                    ActivatedTime = activation.ActivatedAt
                }
            });
        }
    }

    public class ActivateServiceDto
    {
        public int UserId { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
    }
}
