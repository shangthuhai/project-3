using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [JsonIgnore]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string MobileNumber { get; set; } = string.Empty;
        
        public string ProfilePhoto { get; set; } = string.Empty; // base64 or URL
        
        public string Name { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public DateTime? Dob { get; set; }
        public string Address { get; set; } = string.Empty;
        public string MaritalStatus { get; set; } = string.Empty;
        public string Hobbies { get; set; } = string.Empty;
        public string Likes { get; set; } = string.Empty;
        public string Dislikes { get; set; } = string.Empty;
        public string Cuisines { get; set; } = string.Empty;
        public string Sports { get; set; } = string.Empty;
        
        // Professional Details
        public string Qualification { get; set; } = string.Empty;
        public string School { get; set; } = string.Empty;
        public string College { get; set; } = string.Empty;
        public string WorkStatus { get; set; } = string.Empty; // Employed, Not Employed, Student
        public string Organization { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
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
        
        public int UserId { get; set; } // Sender of the request
        public int FriendUserId { get; set; } // Receiver of the request
        
        [Required]
        public string Status { get; set; } = "Pending"; // Pending, Accepted
    }

    public class Message
    {
        public int Id { get; set; }
        
        public int SenderId { get; set; }
        
        [Required]
        public string ReceiverNumber { get; set; } = string.Empty;
        
        public int? ReceiverId { get; set; } // Null if sent to a non-friend contact number
        
        [Required]
        [MaxLength(120)]
        public string Content { get; set; } = string.Empty;
        
        public DateTime SentTime { get; set; } = DateTime.UtcNow;
        
        public bool IsFriendMessage { get; set; }
    }

    public class ServiceActivation
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        
        [Required]
        public string ServiceName { get; set; } = string.Empty; // Joke, Current Affairs, Sports, News
        
        public decimal Price { get; set; }
        
        public DateTime ActivatedTime { get; set; } = DateTime.UtcNow;
    }
}
