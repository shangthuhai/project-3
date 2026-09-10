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
    public class TemplatesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TemplatesController(AppDbContext context)
        {
            _context = context;
        }

        private int AuthenticatedUserId => 
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        // GET: api/templates
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SMSTemplate>>> GetTemplates()
        {
            int userId = AuthenticatedUserId;
            // Get system templates (UserId == null) and current user's custom templates
            var templates = await _context.SMSTemplates
                .Where(t => t.UserId == null || t.UserId == userId)
                .OrderBy(t => t.UserId == null ? 0 : 1) // System templates first
                .ThenBy(t => t.Title)
                .ToListAsync();

            return Ok(templates);
        }

        // POST: api/templates
        [HttpPost]
        public async Task<ActionResult<SMSTemplate>> CreateTemplate([FromBody] CreateTemplateDto dto)
        {
            int userId = AuthenticatedUserId;

            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Body))
            {
                return BadRequest(new { message = "Title and Body are required." });
            }

            var template = new SMSTemplate
            {
                UserId = userId,
                Title = dto.Title.Trim(),
                Body = dto.Body.Trim()
            };

            _context.SMSTemplates.Add(template);
            await _context.SaveChangesAsync();

            return Ok(template);
        }

        // DELETE: api/templates/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            int userId = AuthenticatedUserId;

            var template = await _context.SMSTemplates.FindAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found." });
            }

            if (template.UserId != userId)
            {
                return Forbid(); // Users can't delete system templates or other users' templates
            }

            _context.SMSTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Template deleted successfully." });
        }
    }

    public class CreateTemplateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }
}
