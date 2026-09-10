using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Backend.Services;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;

        public AiController(IAiService aiService)
        {
            _aiService = aiService;
        }

        // POST: api/ai/generate
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateSms([FromBody] GenerateSmsRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Prompt))
            {
                return BadRequest(new { message = "Ý tưởng/yêu cầu tin nhắn không được để trống." });
            }

            string tone = string.IsNullOrWhiteSpace(dto.Tone) ? "polite" : dto.Tone;
            string lang = Request.Headers["Accept-Language"].ToString();
            if (string.IsNullOrEmpty(lang)) lang = "en";
            string result = await _aiService.GenerateSmsAsync(dto.Prompt, tone, lang);

            if (result.StartsWith("Lỗi:"))
            {
                return BadRequest(new { message = result });
            }

            return Ok(new { content = result });
        }
    }

    public class GenerateSmsRequestDto
    {
        public string Prompt { get; set; } = string.Empty;
        public string Tone { get; set; } = string.Empty;
    }
}
