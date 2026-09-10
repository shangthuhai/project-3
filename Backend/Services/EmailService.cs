using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpHost = _configuration["SmtpConfig:Host"];
            var smtpPortStr = _configuration["SmtpConfig:Port"];
            var username = _configuration["SmtpConfig:Username"];
            var password = _configuration["SmtpConfig:Password"];
            var fromEmail = _configuration["SmtpConfig:FromEmail"] ?? "noreply@chatflow.com";
            var fromName = _configuration["SmtpConfig:FromName"] ?? "ChatFlow App";

            int port = int.TryParse(smtpPortStr, out var parsedPort) ? parsedPort : 587;
            bool enableSsl = bool.TryParse(_configuration["SmtpConfig:EnableSsl"], out var parsedSsl) ? parsedSsl : true;

            // Log to console for development / tracking
            Console.WriteLine($"[EMAIL OTP] To: '{toEmail}' | Subject: '{subject}' | Body: '{body}'");
            _logger.LogInformation($"Sending OTP Email to '{toEmail}'...");

            // If SMTP credentials are configured, send real email
            if (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                try
                {
                    using var message = new MailMessage();
                    message.From = new MailAddress(fromEmail, fromName);
                    message.To.Add(new MailAddress(toEmail));
                    message.Subject = subject;
                    message.Body = body;
                    message.IsBodyHtml = false;

                    using var client = new SmtpClient(smtpHost, port);
                    client.Credentials = new NetworkCredential(username, password);
                    client.EnableSsl = enableSsl;

                    await client.SendMailAsync(message);
                    _logger.LogInformation($"Successfully sent OTP Email to {toEmail} via SMTP ({smtpHost}).");
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to send email via SMTP to {toEmail}. Fallback to simulated log.");
                    return false;
                }
            }

            _logger.LogInformation($"SMTP credentials not configured. OTP email simulated for '{toEmail}'.");
            return true;
        }
    }
}
