using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("SMS_Logs")]
    public class SMSLog
    {
        [Key]
        [Column("log_id")]
        [JsonPropertyName("logId")]
        public int LogId { get; set; }

        [Column("message_id")]
        [JsonPropertyName("messageId")]
        public int MessageId { get; set; }

        [MaxLength(50)]
        [Column("gateway_status_code")]
        [JsonPropertyName("gatewayStatusCode")]
        public string GatewayStatusCode { get; set; } = "200_OK";

        [Required]
        [Column("delivery_status")]
        [JsonPropertyName("deliveryStatus")]
        public string DeliveryStatus { get; set; } = "sent"; // pending, sent, delivered, failed

        [Column("updated_at")]
        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("MessageId")]
        [JsonIgnore]
        public Message? Message { get; set; }
    }
}
