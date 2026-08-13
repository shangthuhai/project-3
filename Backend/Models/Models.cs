using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string MobileNumber { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Profile? Profile { get; set; }
    }

    public class Profile
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Gender { get; set; } = string.Empty;

        public DateTime? Dob { get; set; }

        public string Address { get; set; } = string.Empty;

        public string MaritalStatus { get; set; } = string.Empty;

        public string Hobbies { get; set; } = string.Empty;

        public string Likes { get; set; } = string.Empty;

        public string Dislikes { get; set; } = string.Empty;

        public string Cuisines { get; set; } = string.Empty;

        public string Sports { get; set; } = string.Empty;

        public string ProfilePhoto { get; set; } = string.Empty;

        public string Qualification { get; set; } = string.Empty;

        public string School { get; set; } = string.Empty;

        public string College { get; set; } = string.Empty;

        public string WorkStatus { get; set; } = string.Empty;

        public string Organization { get; set; } = string.Empty;

        public string Designation { get; set; } = string.Empty;

        public User? User { get; set; }
    }

    public class Contact
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        public string ContactNumber { get; set; } = string.Empty;
    }

    public class FriendConnection
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public int FriendUserId { get; set; }
        
        [Required]
        public string Status { get; set; } = "pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Message
    {
        public int Id { get; set; }
        
        public int SenderId { get; set; }
        
        [Required]
        public string ReceiverNumber { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(120)]
        public string Content { get; set; } = string.Empty;
        
        public DateTime SentTime { get; set; } = DateTime.UtcNow;
        
        public bool IsFreeFriendMsg { get; set; }
    }

    public class Service
    {
        public int Id { get; set; }
        
        [Required]
        public string ServiceName { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public decimal Price { get; set; }
    }

    public class UserService
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int ServiceId { get; set; }

        [Required]
        public string PaymentStatus { get; set; } = "pending";

        public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;

        public Service? Service { get; set; }
    }
}
