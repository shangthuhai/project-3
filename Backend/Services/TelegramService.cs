using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class TelegramService : ITelegramService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _botToken;
        private readonly string? _chatId;
        private readonly ILogger<TelegramService> _logger;

        public TelegramService(HttpClient httpClient, IConfiguration configuration, ILogger<TelegramService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _botToken = configuration["TelegramConfig:BotToken"];
            _chatId = configuration["TelegramConfig:ChatId"];
        }

        public async Task<bool> SendMessageAsync(string message)
        {
            if (string.IsNullOrWhiteSpace(_botToken) || string.IsNullOrWhiteSpace(_chatId))
            {
                _logger.LogWarning("Telegram is not configured correctly. Check BotToken and ChatId in appsettings.json.");
                return false;
            }

            try
            {
                var requestUrl = $"https://api.telegram.org/bot{_botToken}/sendMessage";
                var payload = new
                {
                    chat_id = _chatId,
                    text = message
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(requestUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Telegram notification sent successfully.");
                    return true;
                }
                else
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to send Telegram message. Status code: {response.StatusCode}, Response: {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message to Telegram.");
                return false;
            }
        }
    }
}
