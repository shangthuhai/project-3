using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("User_Quotas")]
    public class UserQuota
    {
        [Key]
        [Column("quota_id")]
        [JsonPropertyName("quotaId")]
        public int QuotaId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [Column("free_messages_left")]
        [JsonPropertyName("freeMessagesLeft")]
        public int FreeMessagesLeft { get; set; } = 5;

        [Column("updated_at")]
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }
    }
}
