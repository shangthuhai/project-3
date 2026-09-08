using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Keyword_Rules")]
    public class KeywordRule
    {
        [Key]
        [Column("rule_id")]
        [JsonPropertyName("ruleId")]
        public int RuleId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("keyword")]
        [JsonPropertyName("keyword")]
        public string Keyword { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("category")]
        [JsonPropertyName("category")]
        public string Category { get; set; } = "Sensitive"; // Sensitive, Spam, Scam, Abuse

        [MaxLength(20)]
        [Column("action")]
        [JsonPropertyName("action")]
        public string Action { get; set; } = "flag"; // block, flag, delay

        [Column("is_active")]
        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
