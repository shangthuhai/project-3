using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Backend.Services.ICloudinaryService _cloudinaryService;

        public PostsController(AppDbContext context, Backend.Services.ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        private int AuthenticatedUserId =>
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        [HttpGet]
        public async Task<IActionResult> GetFeed()
        {
            var userId = AuthenticatedUserId;
            var friendIds = await _context.Friendships
                .Where(f => f.Status == "accepted" && (f.RequesterId == userId || f.AddresseeId == userId))
                .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();
            friendIds.Add(userId);

            var posts = await _context.Posts
                .Include(p => p.User)
                .ThenInclude(u => u!.Profile)
                .Where(p => friendIds.Contains(p.UserId))
                .OrderByDescending(p => p.CreatedAt)
                .Take(100)
                .Select(p => new
                {
                    id = p.PostId,
                    content = p.Content,
                    mediaUrl = p.MediaUrl,
                    mediaType = p.MediaType,
                    createdAt = p.CreatedAt,
                    userId = p.UserId,
                    authorName = p.User!.Name,
                    username = p.User.Username,
                    profilePhoto = p.User.ProfilePhoto
                })
                .ToListAsync();

            return Ok(posts);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content) && string.IsNullOrWhiteSpace(dto.MediaData))
                return BadRequest(new { message = "Hãy nhập nội dung hoặc chọn ảnh/video." });

            var content = dto.Content?.Trim() ?? string.Empty;
            if (content.Length > 2000)
                return BadRequest(new { message = "Post content cannot exceed 2000 characters." });

            if (!string.IsNullOrWhiteSpace(dto.MediaData) && dto.MediaType is not ("image" or "video"))
                return BadRequest(new { message = "Chỉ hỗ trợ một ảnh hoặc một video cho mỗi bài viết." });

            if (!string.IsNullOrWhiteSpace(dto.MediaData) && dto.MediaData.Length > 14_000_000)
                return BadRequest(new { message = "Ảnh/video không được vượt quá 10 MB." });

            var mediaUrl = string.IsNullOrWhiteSpace(dto.MediaData)
                ? null
                : await _cloudinaryService.UploadBase64MediaAsync(dto.MediaData, dto.MediaType!, "posts");

            var post = new Post { UserId = AuthenticatedUserId, Content = content, MediaUrl = mediaUrl, MediaType = dto.MediaType };
            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            var author = await _context.Users
                .Include(u => u.Profile)
                .FirstAsync(u => u.UserId == post.UserId);

            return Ok(new
            {
                id = post.PostId,
                content = post.Content,
                mediaUrl = post.MediaUrl,
                mediaType = post.MediaType,
                createdAt = post.CreatedAt,
                userId = post.UserId,
                authorName = author.Name,
                username = author.Username,
                profilePhoto = author.ProfilePhoto
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var post = await _context.Posts.FirstOrDefaultAsync(p => p.PostId == id);
            if (post == null) return NotFound(new { message = "Post not found." });
            if (post.UserId != AuthenticatedUserId) return Forbid();

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Post deleted." });
        }
    }

    public class CreatePostDto
    {
        public string? Content { get; set; }
        public string? MediaData { get; set; }
        public string? MediaType { get; set; }
    }
}