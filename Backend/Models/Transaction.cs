using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Transactions")]
    public class Transaction
    {
        [Key]
        [Column("transaction_id")]
        [JsonPropertyName("transactionId")]
        public int TransactionId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [Column("subscription_id")]
        [JsonPropertyName("subscriptionId")]
        public int? SubscriptionId { get; set; }

        [Column("amount")]
        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(4)]
        [Column("card_last4")]
        [JsonPropertyName("cardLast4")]
        public string CardLast4 { get; set; } = string.Empty;

        [Required]
        [Column("transaction_status")]
        [JsonPropertyName("transactionStatus")]
        public string TransactionStatus { get; set; } = "success"; // success, failed, refunded

        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }

        [ForeignKey("SubscriptionId")]
        [JsonIgnore]
        public UserService? Subscription { get; set; }
    }
}
