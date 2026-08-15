using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Friendships")]
    public class Friendship
    {
        [Key]
        [Column("friendship_id")]
        [JsonPropertyName("friendshipId")]
        public int FriendshipId { get; set; }

        [Column("requester_id")]
        [JsonPropertyName("requesterId")]
        public int RequesterId { get; set; }

        [Column("addressee_id")]
        [JsonPropertyName("addresseeId")]
        public int AddresseeId { get; set; }

        [Required]
        [Column("status")]
        [JsonPropertyName("status")]
        public string Status { get; set; } = "pending"; // pending, accepted, rejected

        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Virtual computed columns managed by SQLite
        [Column("user_lower")]
        [JsonPropertyName("userLower")]
        public int UserLower { get; private set; }

        [Column("user_higher")]
        [JsonPropertyName("userHigher")]
        public int UserHigher { get; private set; }

        // Navigation properties
        [ForeignKey("RequesterId")]
        [JsonIgnore]
        public User? Requester { get; set; }

        [ForeignKey("AddresseeId")]
        [JsonIgnore]
        public User? Addressee { get; set; }
    }
}
