using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Admins")]
    public class Admin
    {
        [Key]
        [Column("admin_id")]
        [JsonPropertyName("id")]
        public int AdminId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("username")]
        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("password_hash")]
        [JsonPropertyName("password")]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("email")]
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("full_name")]
        [JsonPropertyName("fullName")]
        public string FullName { get; set; } = string.Empty;

        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        [JsonPropertyName("token")]
        public string? Token { get; set; }

        [NotMapped]
        [JsonPropertyName("isAdmin")]
        public bool IsAdmin => true;
    }
}
