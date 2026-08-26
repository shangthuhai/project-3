using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Backend.Models;

namespace Backend.Services
{
    public interface IAiService
    {
        Task<string> GenerateSmsAsync(string prompt, string tone, string language = "en");
        Task<bool> ModerateContentAsync(string content);
        Task<string> ChatWithAiAsync(string userMessage, List<Message> history, string language = "en");
        Task<string> ChatWithAdminAsync(string userMessage, List<AdminChatMessage> history, string systemInstruction);
    }

    public class AdminChatMessage
    {
        [System.Text.Json.Serialization.JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty; // user, assistant

        [System.Text.Json.Serialization.JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _baseUrl;
        private readonly string? _apiKey;
        private readonly string _model;
        private readonly ILogger<AiService> _logger;

        public AiService(HttpClient httpClient, IConfiguration configuration, ILogger<AiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            
            _baseUrl = configuration["AiConfig:BaseUrl"]?.TrimEnd('/');
            _apiKey = configuration["AiConfig:ApiKey"];
            _model = configuration["AiConfig:Model"] ?? "llama-3.3-70b-versatile";
        }

        public async Task<string> GenerateSmsAsync(string prompt, string tone, string language = "en")
        {
            bool isVi = language.StartsWith("vi", StringComparison.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return isVi ? "Lỗi: API Key chưa được cấu hình. Vui lòng thêm ApiKey vào mục AiConfig trong file appsettings.json của Backend." : "Error: API Key is not configured. Please add ApiKey to the AiConfig section in appsettings.json.";
            }

            string baseUrl = string.IsNullOrWhiteSpace(_baseUrl) ? "https://api.openai.com/v1" : _baseUrl;

            string toneDescription = isVi ? (tone.ToLower() switch
            {
                "formal" => "Trang trọng, lịch sự, chuẩn mực công sở",
                "funny" => "Hài hước, vui nhộn, thân mật, dí dỏm",
                "polite" => "Lịch sự, tôn trọng, nhẹ nhàng",
                "intimate" => "Thân mật, gần gũi, ấm áp",
                _ => "Tự nhiên, lịch sự"
            }) : (tone.ToLower() switch
            {
                "formal" => "Formal, polite, professional office standard",
                "funny" => "Humorous, fun, intimate, witty",
                "polite" => "Polite, respectful, gentle",
                "intimate" => "Intimate, close, warm",
                _ => "Natural, polite"
            });

            string systemInstruction = isVi ? (
                "Bạn là trợ lý soạn thảo tin nhắn SMS chuyên nghiệp bằng tiếng Việt. Nhiệm vụ của bạn là biên tập ý tưởng, chủ đề hoặc bản nháp thô của người dùng thành một tin nhắn hoàn chỉnh, trôi chảy để gửi cho người khác. " +
                "ĐẶC BIỆT LƯU Ý: Hãy giữ nguyên bản chất của yêu cầu. Nếu người dùng muốn hỏi, hãy giữ là câu hỏi. Nếu người dùng muốn thông báo, hãy giữ là thông báo. TUYỆT ĐỐI KHÔNG biến đổi ý nghĩa. " +
                "Lưu ý ngữ cảnh: Người dùng có thể nhập tiếng Việt không dấu (ví dụ: 'doi no' nghĩa là 'đòi nợ', 'di an' nghĩa là 'đi ăn'). Hãy tự động suy luận ngữ cảnh và khôi phục dấu tiếng Việt chính xác nhất trước khi biên tập tin nhắn. " +
                "RÀNG BUỘC CỰC KỲ QUAN TRỌNG: Độ dài của tin nhắn phải từ 10 đến tối đa 120 ký tự (kể cả dấu câu và khoảng trắng). Không được vượt quá 120 ký tự trong bất kỳ trường hợp nào. " +
                $"Định dạng văn phong yêu cầu: {toneDescription}. " +
                "Chỉ trả về DUY NHẤT nội dung tin nhắn cần gửi, không bao gồm bất kỳ lời dẫn giải, giải thích, lưu ý hay dấu nháy kép nào bao quanh tin nhắn."
            ) : (
                "You are a professional SMS drafting assistant in English. Your task is to edit the user's ideas, themes, or raw drafts into a complete, smooth SMS message to be sent to others. " +
                "SPECIAL NOTE: Keep the nature of the request. If the user wants to ask, keep it a question. If the user wants to notify, keep it a notification. ABSOLUTELY DO NOT change the meaning. " +
                "CRITICAL CONSTRAINT: The message length must be between 10 and a maximum of 120 characters (including punctuation and spaces). Do not exceed 120 characters under any circumstances. " +
                $"Required tone: {toneDescription}. " +
                "Only return the EXACT message content to be sent, without any introductions, explanations, notes, or surrounding quotation marks."
            );

            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = systemInstruction },
                    new { role = "user", content = prompt }
                },
                max_tokens = 150,
                temperature = 0.7
            };

            try
            {
                string jsonPayload = JsonSerializer.Serialize(requestBody);
                _logger.LogInformation($"[AI GenerateSms Request]: {jsonPayload}");
                var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                
                string url = $"{baseUrl}/chat/completions";
                var response = await _httpClient.PostAsync(url, requestContent);

                if (!response.IsSuccessStatusCode)
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"AI API error: Status={response.StatusCode}, Body={errorContent}");
                    return isVi ? "Lỗi: Không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau." : "Error: Cannot connect to AI service. Please try again later.";
                }

                string responseString = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("AI API response string: {Response}", responseString);
                using var doc = JsonDocument.Parse(responseString);
                
                if (doc.RootElement.TryGetProperty("choices", out var choices) && 
                    choices.GetArrayLength() > 0)
                {
                    var text = choices[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    string cleanedText = text ?? string.Empty;
                    cleanedText = StripThinkingProcess(cleanedText);
                    return cleanedText.Trim().Trim('"');
                }

                return isVi ? "Lỗi: Mô hình không trả về kết quả." : "Error: The model did not return any result.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while calling AI API");
                return isVi ? "Lỗi: Đã xảy ra lỗi hệ thống khi kết nối với AI." : "Error: A system error occurred while connecting to AI.";
            }
        }

        public async Task<bool> ModerateContentAsync(string content)
        {
            // Fallback: Nếu không có API Key, sử dụng bộ lọc từ khóa cục bộ
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                _logger.LogWarning("AI API Key is not configured. Falling back to local content moderation check.");
                return LocalContentModerationCheck(content);
            }

            string baseUrl = string.IsNullOrWhiteSpace(_baseUrl) ? "https://api.openai.com/v1" : _baseUrl;

            string systemInstruction =
                "Bạn là một hệ thống kiểm duyệt nội dung tin nhắn tự động. " +
                "Hãy phân tích tin nhắn sau xem có chứa nội dung rác (spam), lừa đảo (phishing), ngôn từ thù hận, chửi thề tục tĩu, quấy rối hoặc nội dung độc hại hay không. " +
                "Hãy trả về đúng một từ duy nhất: \"SAFE\" nếu tin nhắn hoàn toàn an toàn và lành mạnh, hoặc \"UNSAFE\" nếu tin nhắn vi phạm các tiêu chuẩn trên. " +
                "Không trả về thêm bất kỳ từ nào khác.";

            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = systemInstruction },
                    new { role = "user", content = $"Tin nhắn cần kiểm tra: \"{content}\"" }
                },
                max_tokens = 100,
                temperature = 0.0
            };

            try
            {
                string jsonPayload = JsonSerializer.Serialize(requestBody);
                _logger.LogInformation($"[AI ModerateContent Request]: {jsonPayload}");
                var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

                string url = $"{baseUrl}/chat/completions";
                var response = await _httpClient.PostAsync(url, requestContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"AI API moderation check failed with status: {response.StatusCode}. Falling back to local check.");
                    return LocalContentModerationCheck(content);
                }

                string responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                
                if (doc.RootElement.TryGetProperty("choices", out var choices) && 
                    choices.GetArrayLength() > 0)
                {
                    var text = choices[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    string result = (text ?? string.Empty).Trim();
                    result = StripThinkingProcess(result).ToUpper();
                    
                    if (result.Contains("UNSAFE"))
                    {
                        _logger.LogInformation($"Content flagged as UNSAFE by AI: '{content}'");
                        return false;
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception during content moderation check. Falling back to local check.");
                return LocalContentModerationCheck(content);
            }
        }

        private bool LocalContentModerationCheck(string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return true;

            // Bộ lọc từ khóa thô sơ của Việt Nam làm dự phòng
            var blacklistedKeywords = new[] 
            { 
                "đm", "đéo", "đ.m", "vcl", "clm", "chịch", "lừa đảo", "trúng thưởng", 
                "nhận quà miễn phí", "nạp tiền nhận", "hack nick", "mạo danh", 
                "web đen", "cờ bạc", "lô đề", "đánh bạc"
            };

            foreach (var keyword in blacklistedKeywords)
            {
                if (content.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation($"Content flagged as UNSAFE by local filter (keyword match '{keyword}'): '{content}'");
                    return false;
                }
            }

            return true;
        }

        public async Task<string> ChatWithAiAsync(string userMessage, List<Message> history, string language = "en")
        {
            bool isVi = language.StartsWith("vi", StringComparison.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return isVi ? "Lỗi: API Key chưa được cấu hình." : "Error: API Key is not configured.";
            }

            string baseUrl = string.IsNullOrWhiteSpace(_baseUrl) ? "https://api.openai.com/v1" : _baseUrl;

            var messagesList = new List<object>();
            string systemPrompt = isVi ?
                "Bạn là Trợ lý AI (Chatbot) thân thiện trong ứng dụng nhắn tin SMS. Hãy trả lời các câu hỏi hoặc trò chuyện tự nhiên với người dùng bằng tiếng Việt. Ràng buộc quan trọng: Trả lời ngắn gọn, súc tích, tối đa dưới 120 ký tự để phù hợp với định dạng tin nhắn SMS." :
                "You are a friendly AI Assistant (Chatbot) in an SMS messaging application. Please reply to questions or chat naturally with the user in English. Critical constraint: Keep replies short and concise, maximum 120 characters to fit the SMS message format.";

            messagesList.Add(new { 
                role = "system", 
                content = systemPrompt 
            });

            foreach (var msg in history)
            {
                bool isAiSender = (msg.SenderId == 999);
                messagesList.Add(new { 
                    role = isAiSender ? "assistant" : "user", 
                    content = msg.Content 
                });
            }

            messagesList.Add(new { role = "user", content = userMessage });

            var requestBody = new
            {
                model = _model,
                messages = messagesList.ToArray(),
                max_tokens = 150,
                temperature = 0.7
            };

            try
            {
                string jsonPayload = JsonSerializer.Serialize(requestBody);
                _logger.LogInformation($"[AI ChatWithAi Request]: {jsonPayload}");
                var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                
                string url = $"{baseUrl}/chat/completions";
                var response = await _httpClient.PostAsync(url, requestContent);

                if (!response.IsSuccessStatusCode)
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"AI Chat API error: Status={response.StatusCode}, Body={errorContent}");
                    return isVi ? "Xin lỗi, mình đang gặp trục trặc kỹ thuật và không thể trả lời lúc này." : "Sorry, I am experiencing technical difficulties and cannot reply right now.";
                }

                string responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                
                if (doc.RootElement.TryGetProperty("choices", out var choices) && 
                    choices.GetArrayLength() > 0)
                {
                    var text = choices[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    string cleanedText = text ?? string.Empty;
                    cleanedText = StripThinkingProcess(cleanedText);
                    return cleanedText.Trim().Trim('"');
                }

                return isVi ? "Mình chưa rõ ý bạn lắm." : "I am not quite sure what you mean.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while calling AI Chat API");
                return isVi ? "Lỗi hệ thống không thể xử lý câu trả lời." : "System error, unable to process the reply.";
            }
        }

        public async Task<string> ChatWithAdminAsync(string userMessage, List<AdminChatMessage> history, string systemInstruction)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return "Lỗi: API Key chưa được cấu hình.";
            }

            string baseUrl = string.IsNullOrWhiteSpace(_baseUrl) ? "https://api.openai.com/v1" : _baseUrl;

            var messagesList = new List<object>();
            messagesList.Add(new { 
                role = "system", 
                content = systemInstruction 
            });

            foreach (var msg in history)
            {
                messagesList.Add(new { 
                    role = msg.Role, 
                    content = msg.Content 
                });
            }

            messagesList.Add(new { role = "user", content = userMessage });

            var requestBody = new
            {
                model = _model,
                messages = messagesList.ToArray(),
                max_tokens = 600,
                temperature = 0.7
            };

            try
            {
                string jsonPayload = JsonSerializer.Serialize(requestBody);
                _logger.LogInformation($"[AI Admin Chat Request]: {jsonPayload}");
                var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                
                string url = $"{baseUrl}/chat/completions";
                var response = await _httpClient.PostAsync(url, requestContent);

                if (!response.IsSuccessStatusCode)
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"AI Admin Chat API error: Status={response.StatusCode}, Body={errorContent}");
                    return "Xin lỗi, mình đang gặp trục trặc kỹ thuật khi kết nối dịch vụ AI.";
                }

                string responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                
                if (doc.RootElement.TryGetProperty("choices", out var choices) && 
                    choices.GetArrayLength() > 0)
                {
                    var text = choices[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    string cleanedText = text ?? string.Empty;
                    cleanedText = StripThinkingProcess(cleanedText);
                    return cleanedText.Trim();
                }

                return "Lỗi: Dịch vụ AI không trả về kết quả.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while calling AI Admin Chat API");
                return "Lỗi: Không thể kết nối với AI (Lỗi hệ thống).";
            }
        }

        private string StripThinkingProcess(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;

            int thinkStart = text.IndexOf("<think>", StringComparison.OrdinalIgnoreCase);
            int thinkEnd = text.IndexOf("</think>", StringComparison.OrdinalIgnoreCase);

            if (thinkStart >= 0 && thinkEnd > thinkStart)
            {
                return text.Substring(thinkEnd + 8).Trim();
            }
            else if (thinkStart >= 0)
            {
                return string.Empty;
            }

            return text;
        }
    }
}
