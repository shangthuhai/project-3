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
        private readonly Dictionary<string, decimal> _prices = new()
        {
            { "Joke", 2.99m },
            { "Current Affairs", 4.99m },
            { "Sports", 3.99m },
            { "News", 4.99m }
        };

        public ServicesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/services?userId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceActivation>>> GetActivatedServices([FromQuery] int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var activations = await _context.ServiceActivations
                .Where(s => s.UserId == userId)
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

            if (!_prices.ContainsKey(dto.ServiceName))
            {
                return BadRequest(new { message = "Invalid service name. Available: Joke, Current Affairs, Sports, News." });
            }

            // Check if already activated
            var alreadyActivated = await _context.ServiceActivations
                .AnyAsync(s => s.UserId == dto.UserId && s.ServiceName == dto.ServiceName);

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

            var activation = new ServiceActivation
            {
                UserId = dto.UserId,
                ServiceName = dto.ServiceName,
                Price = _prices[dto.ServiceName],
                ActivatedTime = DateTime.UtcNow
            };

            _context.ServiceActivations.Add(activation);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Service '{dto.ServiceName}' activated successfully!", service = activation });
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
