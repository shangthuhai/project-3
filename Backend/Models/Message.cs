using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Messages")]
    public class Message
    {
        [Key]
        [Column("message_id")]
        [JsonPropertyName("id")]
        public int MessageId { get; set; }

        [Column("sender_id")]
        [JsonPropertyName("senderId")]
        public int SenderId { get; set; }

        [Column("receiver_id")]
        [JsonPropertyName("receiverId")]
        public int? ReceiverId { get; set; }

        [Required]
        [MaxLength(15)]
        [Column("receiver_number")]
        [JsonPropertyName("receiverNumber")]
        public string ReceiverNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(160)]
        [Column("content")]
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [Column("is_free_friend_msg")]
        [JsonPropertyName("isFreeFriendMsg")]
        public bool IsFreeFriendMsg { get; set; } = false;

        [Column("sent_at")]
        [JsonPropertyName("sentTime")]
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("SenderId")]
        [JsonIgnore]
        public User? Sender { get; set; }

        [ForeignKey("ReceiverId")]
        [JsonIgnore]
        public User? Receiver { get; set; }
    }
}
