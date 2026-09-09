using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
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
        Task<(bool isMalicious, string explanation)> AnalyzeMessageModerationAsync(string content, string keyword);
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
        private readonly List<string> _apiKeys;
        private readonly List<string> _models;
        private readonly bool _enableLocalFallback;
        private readonly string _localBaseUrl;
        private readonly string _localModel;
        private readonly ILogger<AiService> _logger;

        public AiService(HttpClient httpClient, IConfiguration configuration, ILogger<AiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            
            _baseUrl = configuration["AiConfig:BaseUrl"]?.TrimEnd('/');

            // Load primary key & fallback keys
            string? primaryKey = configuration["AiConfig:ApiKey"];
            var fallbackKeys = configuration.GetSection("AiConfig:FallbackApiKeys").Get<string[]>() ?? Array.Empty<string>();

            _apiKeys = new List<string>();
            if (!string.IsNullOrWhiteSpace(primaryKey))
            {
                _apiKeys.Add(primaryKey.Trim());
            }
            foreach (var k in fallbackKeys)
            {
                if (!string.IsNullOrWhiteSpace(k) && !_apiKeys.Contains(k.Trim()))
                {
                    _apiKeys.Add(k.Trim());
                }
            }

            // Load primary model & fallback models
            string primaryModel = configuration["AiConfig:Model"] ?? "groq/compound-mini";
            var fallbackModels = configuration.GetSection("AiConfig:FallbackModels").Get<string[]>() ?? new[]
            {
                "groq/compound",
                "qwen/qwen3.6-27b",
                "openai/gpt-oss-120b"
            };

            _models = new List<string> { primaryModel.Trim() };
            foreach (var m in fallbackModels)
            {
                if (!string.IsNullOrWhiteSpace(m) && !_models.Contains(m.Trim()))
                {
                    _models.Add(m.Trim());
                }
            }

            // Local Fallback LLM configuration (e.g. Ollama / LM Studio running locally)
            _enableLocalFallback = configuration.GetValue<bool>("AiConfig:EnableLocalFallback", true);
            _localBaseUrl = configuration["AiConfig:LocalBaseUrl"] ?? "http://localhost:11434/v1";
            _localModel = configuration["AiConfig:LocalModel"] ?? "llama3.2";
        }

        private async Task<(bool Success, string ResponseBody, string UsedModel)> PostChatCompletionsWithFallbackAsync(
            Func<string, object> createRequestBodyFunc)
        {
            string cloudBaseUrl = string.IsNullOrWhiteSpace(_baseUrl) ? "https://api.openai.com/v1" : _baseUrl;
            string cloudUrl = $"{cloudBaseUrl}/chat/completions";

            // Stage 1: Try all Cloud API Keys and Cloud Models
            if (_apiKeys.Count > 0)
            {
                foreach (var apiKey in _apiKeys)
                {
                    foreach (var model in _models)
                    {
                        try
                        {
                            var requestBody = createRequestBodyFunc(model);
                            string jsonPayload = JsonSerializer.Serialize(requestBody);
                            _logger.LogInformation($"[AI Cloud Request Attempt] Model='{model}', KeyEnding='{GetMaskedKey(apiKey)}'");

                            using var request = new HttpRequestMessage(HttpMethod.Post, cloudUrl);
                            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                            request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                            var response = await _httpClient.SendAsync(request);

                            if (response.IsSuccessStatusCode)
                            {
                                string responseString = await response.Content.ReadAsStringAsync();
                                _logger.LogInformation($"[AI Cloud Request Success] Model='{model}', KeyEnding='{GetMaskedKey(apiKey)}'");
                                return (true, responseString, model);
                            }

                            string errorContent = await response.Content.ReadAsStringAsync();
                            _logger.LogWarning($"[AI Cloud Fallback] Model='{model}' KeyEnding='{GetMaskedKey(apiKey)}' failed (StatusCode={(int)response.StatusCode}). Response: {errorContent}. Retrying next available cloud model/key...");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, $"[AI Cloud Fallback] Model='{model}' KeyEnding='{GetMaskedKey(apiKey)}' threw exception. Retrying next available cloud model/key...");
                        }
                    }
                }
            }

            // Stage 2: Fallback to Local LLM Server (Ollama / LM Studio) if configured
            if (_enableLocalFallback && !string.IsNullOrWhiteSpace(_localBaseUrl))
            {
                try
                {
                    string localUrl = $"{_localBaseUrl.TrimEnd('/')}/chat/completions";
                    string localModel = string.IsNullOrWhiteSpace(_localModel) ? "llama3.2" : _localModel;
                    _logger.LogInformation($"[AI Local LLM Attempt] Endpoint='{localUrl}', Model='{localModel}'");

                    var requestBody = createRequestBodyFunc(localModel);
                    string jsonPayload = JsonSerializer.Serialize(requestBody);

                    using var request = new HttpRequestMessage(HttpMethod.Post, localUrl);
                    request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        string responseString = await response.Content.ReadAsStringAsync();
                        _logger.LogInformation($"[AI Local LLM Success] Model='{localModel}'");
                        return (true, responseString, localModel);
                    }

                    _logger.LogWarning($"[AI Local LLM Failed] Endpoint='{localUrl}' returned StatusCode={(int)response.StatusCode}.");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"[AI Local LLM Exception] Could not connect to Local LLM at '{_localBaseUrl}'.");
                }
            }

            _logger.LogError("[AI Error] All cloud models and local LLM endpoints failed to return a valid response.");
            return (false, "All cloud models and local LLM endpoints failed", string.Empty);
        }

        private string GetMaskedKey(string key)
        {
            if (string.IsNullOrEmpty(key) || key.Length <= 6) return "***";
            return key.Substring(key.Length - 4);
        }

        public async Task<string> GenerateSmsAsync(string prompt, string tone, string language = "en")
        {
            bool isVi = language.StartsWith("vi", StringComparison.OrdinalIgnoreCase);

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

            var (success, responseString, _) = await PostChatCompletionsWithFallbackAsync(model => new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = systemInstruction },
                    new { role = "user", content = prompt }
                },
                max_tokens = 150,
                temperature = 0.7
            });

            if (!success)
            {
                _logger.LogWarning("All AI APIs & Local LLMs failed for GenerateSms. Using Smart Offline Rule fallback.");
                return CleanOfflineSmsDraft(prompt, isVi);
            }

            try
            {
                using var doc = JsonDocument.Parse(responseString);
                if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var text = choices[0].GetProperty("message").GetProperty("content").GetString();
                    string cleanedText = StripThinkingProcess(text ?? string.Empty);
                    return cleanedText.Trim().Trim('"');
                }
                return CleanOfflineSmsDraft(prompt, isVi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception parsing AI response for GenerateSms");
                return CleanOfflineSmsDraft(prompt, isVi);
            }
        }

        public async Task<bool> ModerateContentAsync(string content)
        {
            // Fast local keyword moderation check first (< 1ms)
            bool isLocalSafe = LocalContentModerationCheck(content);
            if (!isLocalSafe)
            {
                _logger.LogInformation($"Content flagged as UNSAFE by local filter: '{content}'");
                return false;
            }

            // Messages passing local filter are approved instantly to ensure zero sending latency.
            return true;
        }

        private bool LocalContentModerationCheck(string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return true;

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

            var messagesList = new List<object>();
            string systemPrompt = isVi ?
                "Bạn là Trợ lý AI (Chatbot) thân thiện trong ứng dụng nhắn tin SMS. Hãy trả lời các câu hỏi hoặc trò chuyện tự nhiên với người dùng bằng tiếng Việt. Ràng buộc quan trọng: Trả lời ngắn gọn, súc tích, tối đa dưới 120 ký tự để phù hợp với định dạng tin nhắn SMS." :
                "You are a friendly AI Assistant (Chatbot) in an SMS messaging application. Please reply to questions or chat naturally with the user in English. Critical constraint: Keep replies short and concise, maximum 120 characters to fit the SMS message format.";

            messagesList.Add(new { role = "system", content = systemPrompt });

            foreach (var msg in history)
            {
                bool isAiSender = (msg.SenderId == 999);
                messagesList.Add(new { 
                    role = isAiSender ? "assistant" : "user", 
                    content = msg.Content 
                });
            }

            messagesList.Add(new { role = "user", content = userMessage });

            var (success, responseString, _) = await PostChatCompletionsWithFallbackAsync(model => new
            {
                model = model,
                messages = messagesList.ToArray(),
                max_tokens = 150,
                temperature = 0.7
            });

            if (!success)
            {
                _logger.LogWarning("All cloud and local AI endpoints failed for ChatWithAi. Triggering Smart Offline Engine.");
                return GetSmartOfflineChatResponse(userMessage, isVi);
            }

            try
            {
                using var doc = JsonDocument.Parse(responseString);
                if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var text = choices[0].GetProperty("message").GetProperty("content").GetString();
                    string cleanedText = StripThinkingProcess(text ?? string.Empty);
                    return cleanedText.Trim().Trim('"');
                }
                return GetSmartOfflineChatResponse(userMessage, isVi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception parsing AI Chat response");
                return GetSmartOfflineChatResponse(userMessage, isVi);
            }
        }

        public async Task<string> ChatWithAdminAsync(string userMessage, List<AdminChatMessage> history, string systemInstruction)
        {
            var messagesList = new List<object>();
            messagesList.Add(new { role = "system", content = systemInstruction });

            foreach (var msg in history)
            {
                messagesList.Add(new { role = msg.Role, content = msg.Content });
            }

            messagesList.Add(new { role = "user", content = userMessage });

            var (success, responseString, _) = await PostChatCompletionsWithFallbackAsync(model => new
            {
                model = model,
                messages = messagesList.ToArray(),
                max_tokens = 600,
                temperature = 0.7
            });

            if (!success)
            {
                return GetSmartOfflineChatResponse(userMessage, true);
            }

            try
            {
                using var doc = JsonDocument.Parse(responseString);
                if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var text = choices[0].GetProperty("message").GetProperty("content").GetString();
                    string cleanedText = StripThinkingProcess(text ?? string.Empty);
                    return cleanedText.Trim();
                }
                return GetSmartOfflineChatResponse(userMessage, true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception parsing AI Admin Chat response");
                return GetSmartOfflineChatResponse(userMessage, true);
            }
        }

        private string CleanOfflineSmsDraft(string prompt, bool isVi)
        {
            if (string.IsNullOrWhiteSpace(prompt)) return isVi ? "Xin chào bạn!" : "Hello there!";
            string trimmed = prompt.Trim();
            if (trimmed.Length > 120) trimmed = trimmed.Substring(0, 117) + "...";
            return trimmed;
        }

        private string GetSmartOfflineChatResponse(string userMessage, bool isVi)
        {
            string msg = (userMessage ?? "").ToLower().Trim();

            if (isVi)
            {
                if (msg.Contains("chào") || msg.Contains("hello") || msg.Contains("hi") || msg.Contains("alo"))
                {
                    return "Xin chào! Hiện tại máy chủ AI ngoại tuyến nhưng tôi vẫn sẵn sàng nhận tin nhắn của bạn.";
                }
                if (msg.Contains("cảm ơn") || msg.Contains("thanks") || msg.Contains("thank"))
                {
                    return "Không có gì! Rất vui được hỗ trợ bạn.";
                }
                if (msg.Contains("tên") || msg.Contains("bạn là ai") || msg.Contains("who"))
                {
                    return "Tôi là Trợ lý AI SMS. Hệ thống hiện đang chạy ở chế độ dự phòng ngoại tuyến.";
                }
                if (msg.Contains("mấy giờ") || msg.Contains("thời gian") || msg.Contains("ngày"))
                {
                    return $"Bây giờ là {DateTime.Now:HH:mm} ngày {DateTime.Now:dd/MM/yyyy}.";
                }
                return "Cảm ơn tin nhắn của bạn! Trợ lý AI đang tạm thời ngoại tuyến, tin nhắn của bạn đã được ghi nhận.";
            }
            else
            {
                if (msg.Contains("hello") || msg.Contains("hi") || msg.Contains("hey"))
                {
                    return "Hello! AI server is offline right now, but I received your message.";
                }
                if (msg.Contains("thank"))
                {
                    return "You are welcome! Happy to assist you.";
                }
                if (msg.Contains("time") || msg.Contains("date"))
                {
                    return $"Current local time is {DateTime.Now:HH:mm, MMM dd yyyy}.";
                }
                return "Thank you for your message! AI assistant is currently offline, your message has been recorded.";
            }
        }

        public async Task<(bool isMalicious, string explanation)> AnalyzeMessageModerationAsync(string content, string keyword)
        {
            string systemInstruction = 
                "Bạn là Chuyên gia Phân tích An toàn Nội dung AI. Nhiệm vụ của bạn là kiểm tra nội dung tin nhắn SMS có chứa từ khóa nhạy cảm/nghi vấn. " +
                "Hãy xác định xem đây là tin nhắn SPAM/LỪA ĐẢO/ĐỘC HẠI thực sự (MALICIOUS) hay là tin nhắn THÔNG THƯỜNG/HỢP PHÁP có chứa từ khóa đó theo ngữ cảnh (SAFE). " +
                "Trả về định dạng JSON duy nhất như sau: {\"status\": \"MALICIOUS\" hoặc \"SAFE\", \"reason\": \"Giải thích ngắn gọn 1 câu\"}";

            var (success, responseString, _) = await PostChatCompletionsWithFallbackAsync(model => new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = systemInstruction },
                    new { role = "user", content = $"Từ khóa phát hiện: [{keyword}]\nNội dung tin nhắn: [{content}]" }
                },
                max_tokens = 150,
                temperature = 0.2
            });

            if (success && !string.IsNullOrWhiteSpace(responseString))
            {
                try
                {
                    int jsonStart = responseString.IndexOf("{");
                    int jsonEnd = responseString.LastIndexOf("}");
                    if (jsonStart >= 0 && jsonEnd > jsonStart)
                    {
                        string jsonStr = responseString.Substring(jsonStart, jsonEnd - jsonStart + 1);
                        using var doc = JsonDocument.Parse(jsonStr);
                        string status = doc.RootElement.GetProperty("status").GetString() ?? "SAFE";
                        string reason = doc.RootElement.GetProperty("reason").GetString() ?? "Đã được kiểm tra bởi AI";
                        return (status.ToUpper() == "MALICIOUS", reason);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse AI moderation JSON result.");
                }
            }

            return (true, $"Tin nhắn chứa từ khóa nghi vấn: '{keyword}'");
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
