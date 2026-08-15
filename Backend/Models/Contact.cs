using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Contacts")]
    public class Contact
    {
        [Key]
        [Column("contact_id")]
        [JsonPropertyName("id")]
        public int ContactId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("first_name")]
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("last_name")]
        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(15)]
        [Column("contact_number")]
        [JsonPropertyName("contactNumber")]
        public string ContactNumber { get; set; } = string.Empty;

        // Navigation property
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }
    }
}
