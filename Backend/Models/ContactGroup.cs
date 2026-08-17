using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Contact_Groups")]
    public class ContactGroup
    {
        [Key]
        [Column("group_id")]
        [JsonPropertyName("id")]
        public int GroupId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }
    }
}
