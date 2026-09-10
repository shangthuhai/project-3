using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Posts")]
    public class Post
    {
        [Key]
        [Column("post_id")]
        [JsonPropertyName("id")]
        public int PostId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(2000)]
        [Column("content")]
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [MaxLength(2000)]
        [Column("media_url")]
        [JsonPropertyName("mediaUrl")]
        public string? MediaUrl { get; set; }

        [MaxLength(20)]
        [Column("media_type")]
        [JsonPropertyName("mediaType")]
        public string? MediaType { get; set; }

        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }
    }
}