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
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        // GET: api/analytics/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            int userId = AuthenticatedUserId;

            // Fetch user quota limit
            var quota = await _context.UserQuotas.FirstOrDefaultAsync(q => q.UserId == userId);
            int freeLeft = quota?.FreeMessagesLeft ?? 5;

            // Total messages sent by this user
            var userMessages = _context.Messages.Where(m => m.SenderId == userId);
            int totalSent = await userMessages.CountAsync();

            // Status breakdown via SMS Logs
            var logsQuery = _context.SMSLogs.Include(l => l.Message).Where(l => l.Message != null && l.Message.SenderId == userId);
            
            int deliveredCount = await logsQuery.CountAsync(l => l.DeliveryStatus == "delivered" || l.DeliveryStatus == "sent");
            int failedCount = await logsQuery.CountAsync(l => l.DeliveryStatus == "failed");
            int pendingCount = await logsQuery.CountAsync(l => l.DeliveryStatus == "pending");

            // Daily chart data (last 7 days)
            var startDate = DateTime.UtcNow.Date.AddDays(-6);
            var messagesLast7Days = await userMessages
                .Where(m => m.SentAt >= startDate)
                .ToListAsync();

            var dailyStats = new List<object>();
            for (int i = 0; i < 7; i++)
            {
                var targetDate = startDate.AddDays(i);
                var formattedDate = targetDate.ToString("yyyy-MM-dd");
                
                // Count messages sent on this day (comparing dates in UTC)
                int count = messagesLast7Days.Count(m => m.SentAt.Date == targetDate.Date);
                
                dailyStats.Add(new { date = formattedDate, count });
            }

            return Ok(new
            {
                totalSent,
                deliveredCount,
                failedCount,
                pendingCount,
                freeLeft,
                dailyStats
            });
        }
    }
}
