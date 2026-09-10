using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Blocklist")]
    public class Blocklist
    {
        [Key]
        [Column("block_id")]
        [JsonPropertyName("id")]
        public int BlockId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(15)]
        [Column("blocked_number")]
        [JsonPropertyName("blockedNumber")]
        public string BlockedNumber { get; set; } = string.Empty;

        // Navigation
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }
    }
}
