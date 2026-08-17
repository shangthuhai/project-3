using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Contact_Group_Members")]
    public class ContactGroupMember
    {
        [Key]
        [Column("member_id")]
        [JsonPropertyName("id")]
        public int MemberId { get; set; }

        [Column("group_id")]
        [JsonPropertyName("groupId")]
        public int GroupId { get; set; }

        [Column("contact_id")]
        [JsonPropertyName("contactId")]
        public int ContactId { get; set; }

        // Navigation properties
        [ForeignKey("GroupId")]
        [JsonIgnore]
        public ContactGroup? Group { get; set; }

        [ForeignKey("ContactId")]
        [JsonIgnore]
        public Contact? Contact { get; set; }
    }
}
