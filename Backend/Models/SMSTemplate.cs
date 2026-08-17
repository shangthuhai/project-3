using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("SMS_Templates")]
    public class SMSTemplate
    {
        [Key]
        [Column("template_id")]
        [JsonPropertyName("id")]
        public int TemplateId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int? UserId { get; set; } // Null if it's a default system template

        [Required]
        [MaxLength(100)]
        [Column("title")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(160)]
        [Column("body")]
        [JsonPropertyName("body")]
        public string Body { get; set; } = string.Empty;

        // Navigation
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }
    }
}
