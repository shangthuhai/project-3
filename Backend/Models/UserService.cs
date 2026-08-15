using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("User_Services")]
    public class UserService
    {
        [Key]
        [Column("subscription_id")]
        [JsonPropertyName("subscriptionId")]
        public int SubscriptionId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [Column("service_id")]
        [JsonPropertyName("serviceId")]
        public int ServiceId { get; set; }

        [Required]
        [Column("payment_status")]
        [JsonPropertyName("paymentStatus")]
        public string PaymentStatus { get; set; } = "paid"; // pending, paid

        [Column("activated_at")]
        [JsonPropertyName("activatedAt")]
        public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }

        [ForeignKey("ServiceId")]
        [JsonIgnore]
        public Service? Service { get; set; }
    }
}
