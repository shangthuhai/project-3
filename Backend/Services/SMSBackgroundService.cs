using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace Backend.Services
{
    public class SMSBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SMSBackgroundService> _logger;

        public SMSBackgroundService(IServiceScopeFactory scopeFactory, ILogger<SMSBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SMS Background Scheduler Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessScheduledMessagesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing ProcessScheduledMessagesAsync.");
                }

                // Poll every 5 seconds
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }

            _logger.LogInformation("SMS Background Scheduler Service is stopping.");
        }

        private async Task ProcessScheduledMessagesAsync()
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                // Get all pending logs where scheduled time is in the past or now
                var pendingLogs = await context.SMSLogs
                    .Include(l => l.Message)
                    .Where(l => l.DeliveryStatus == "pending" && 
                                l.Message != null && 
                                l.Message.ScheduledAt != null && 
                                l.Message.ScheduledAt <= DateTime.UtcNow)
                    .ToListAsync();

                if (pendingLogs.Count > 0)
                {
                    _logger.LogInformation($"Found {pendingLogs.Count} scheduled message(s) ready to send.");

                    foreach (var log in pendingLogs)
                    {
                        log.DeliveryStatus = "delivered";
                        log.UpdatedAt = DateTime.UtcNow;
                        
                        _logger.LogInformation($"Scheduled Message ID {log.MessageId} to {log.Message?.ReceiverNumber} delivered successfully.");
                    }

                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
