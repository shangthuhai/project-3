using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Profiles")]
    public class Profile
    {
        [Key]
        [Column("profile_id")]
        [JsonPropertyName("profileId")]
        public int ProfileId { get; set; }

        [Column("user_id")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [MaxLength(100)]
        [Column("full_name")]
        [JsonPropertyName("fullName")]
        public string? FullName { get; set; }

        [MaxLength(10)]
        [Column("gender")]
        [JsonPropertyName("gender")]
        public string? Gender { get; set; }

        [Column("dob")]
        [JsonPropertyName("dob")]
        public DateTime? Dob { get; set; }

        [MaxLength(255)]
        [Column("address")]
        [JsonPropertyName("address")]
        public string? Address { get; set; }

        [MaxLength(20)]
        [Column("marital_status")]
        [JsonPropertyName("maritalStatus")]
        public string? MaritalStatus { get; set; }

        [Column("hobbies")]
        [JsonPropertyName("hobbies")]
        public string? Hobbies { get; set; }

        [Column("likes")]
        [JsonPropertyName("likes")]
        public string? Likes { get; set; }

        [Column("dislikes")]
        [JsonPropertyName("dislikes")]
        public string? Dislikes { get; set; }

        [Column("cuisines")]
        [JsonPropertyName("cuisines")]
        public string? Cuisines { get; set; }

        [Column("sports")]
        [JsonPropertyName("sports")]
        public string? Sports { get; set; }

        [Column("profile_photo")]
        [JsonPropertyName("profilePhoto")]
        public string? ProfilePhoto { get; set; }

        [MaxLength(100)]
        [Column("qualification")]
        [JsonPropertyName("qualification")]
        public string? Qualification { get; set; }

        [MaxLength(100)]
        [Column("school")]
        [JsonPropertyName("school")]
        public string? School { get; set; }

        [MaxLength(100)]
        [Column("college")]
        [JsonPropertyName("college")]
        public string? College { get; set; }

        [MaxLength(50)]
        [Column("work_status")]
        [JsonPropertyName("workStatus")]
        public string? WorkStatus { get; set; }

        [MaxLength(100)]
        [Column("organization")]
        [JsonPropertyName("organization")]
        public string? Organization { get; set; }

        [MaxLength(100)]
        [Column("designation")]
        [JsonPropertyName("designation")]
        public string? Designation { get; set; }

        // Navigation property
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }
    }
}
