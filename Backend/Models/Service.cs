using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Services")]
    public class Service
    {
        [Key]
        [Column("service_id")]
        [JsonPropertyName("serviceId")]
        public int ServiceId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("service_name")]
        [JsonPropertyName("serviceName")]
        public string ServiceName { get; set; } = string.Empty;

        [Column("description")]
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [Column("price")]
        [JsonPropertyName("price")]
        public decimal Price { get; set; }

        [Column("is_active")]
        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; } = true;
    }
}
