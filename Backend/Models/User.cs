using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    [Table("Users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        [JsonPropertyName("id")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("username")]
        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("password_hash")]
        [JsonPropertyName("password")]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(15)]
        [Column("mobile_number")]
        [JsonPropertyName("mobileNumber")]
        public string MobileNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("email")]
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [Column("is_active")]
        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; } = true;

        [Column("two_factor_enabled")]
        [JsonPropertyName("twoFactorEnabled")]
        public bool TwoFactorEnabled { get; set; } = false;

        [MaxLength(6)]
        [Column("two_factor_code")]
        [JsonPropertyName("twoFactorCode")]
        public string? TwoFactorCode { get; set; }

        [Column("two_factor_expiry")]
        [JsonPropertyName("twoFactorExpiry")]
        public DateTime? TwoFactorExpiry { get; set; }

        [Column("only_friends_sms")]
        [JsonPropertyName("onlyReceiveFromFriends")]
        public bool OnlyReceiveFromFriends { get; set; } = false;

        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [JsonIgnore]
        public Profile? Profile { get; set; }

        [JsonIgnore]
        public UserQuota? Quota { get; set; }

        // JWT token property for authorization
        [NotMapped]
        [JsonPropertyName("token")]
        public string? Token { get; set; }

        // Helper method to ensure Profile exists for setters
        private Profile EnsureProfile()
        {
            if (Profile == null)
            {
                Profile = new Profile { UserId = this.UserId };
            }
            return Profile;
        }

        // --- Flat Profile Properties for Frontend Compatibility (Not Mapped to Users Table) ---

        [NotMapped]
        [JsonPropertyName("profilePhoto")]
        public string ProfilePhoto
        {
            get => Profile?.ProfilePhoto ?? string.Empty;
            set => EnsureProfile().ProfilePhoto = value;
        }

        [NotMapped]
        [JsonPropertyName("name")]
        public string Name
        {
            get => Profile?.FullName ?? string.Empty;
            set => EnsureProfile().FullName = value;
        }

        [NotMapped]
        [JsonPropertyName("gender")]
        public string Gender
        {
            get => Profile?.Gender ?? string.Empty;
            set => EnsureProfile().Gender = value;
        }

        [NotMapped]
        [JsonPropertyName("dob")]
        public DateTime? Dob
        {
            get => Profile?.Dob;
            set => EnsureProfile().Dob = value;
        }

        [NotMapped]
        [JsonPropertyName("address")]
        public string Address
        {
            get => Profile?.Address ?? string.Empty;
            set => EnsureProfile().Address = value;
        }

        [NotMapped]
        [JsonPropertyName("maritalStatus")]
        public string MaritalStatus
        {
            get => Profile?.MaritalStatus ?? string.Empty;
            set => EnsureProfile().MaritalStatus = value;
        }

        [NotMapped]
        [JsonPropertyName("hobbies")]
        public string Hobbies
        {
            get => Profile?.Hobbies ?? string.Empty;
            set => EnsureProfile().Hobbies = value;
        }

        [NotMapped]
        [JsonPropertyName("likes")]
        public string Likes
        {
            get => Profile?.Likes ?? string.Empty;
            set => EnsureProfile().Likes = value;
        }

        [NotMapped]
        [JsonPropertyName("dislikes")]
        public string Dislikes
        {
            get => Profile?.Dislikes ?? string.Empty;
            set => EnsureProfile().Dislikes = value;
        }

        [NotMapped]
        [JsonPropertyName("cuisines")]
        public string Cuisines
        {
            get => Profile?.Cuisines ?? string.Empty;
            set => EnsureProfile().Cuisines = value;
        }

        [NotMapped]
        [JsonPropertyName("sports")]
        public string Sports
        {
            get => Profile?.Sports ?? string.Empty;
            set => EnsureProfile().Sports = value;
        }

        [NotMapped]
        [JsonPropertyName("qualification")]
        public string Qualification
        {
            get => Profile?.Qualification ?? string.Empty;
            set => EnsureProfile().Qualification = value;
        }

        [NotMapped]
        [JsonPropertyName("school")]
        public string School
        {
            get => Profile?.School ?? string.Empty;
            set => EnsureProfile().School = value;
        }

        [NotMapped]
        [JsonPropertyName("college")]
        public string College
        {
            get => Profile?.College ?? string.Empty;
            set => EnsureProfile().College = value;
        }

        [NotMapped]
        [JsonPropertyName("workStatus")]
        public string WorkStatus
        {
            get => Profile?.WorkStatus ?? string.Empty;
            set => EnsureProfile().WorkStatus = value;
        }

        [NotMapped]
        [JsonPropertyName("organization")]
        public string Organization
        {
            get => Profile?.Organization ?? string.Empty;
            set => EnsureProfile().Organization = value;
        }

        [NotMapped]
        [JsonPropertyName("designation")]
        public string Designation
        {
            get => Profile?.Designation ?? string.Empty;
            set => EnsureProfile().Designation = value;
        }
    }
}
