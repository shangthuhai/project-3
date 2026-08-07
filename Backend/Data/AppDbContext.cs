using Microsoft.EntityFrameworkCore;
using Backend.Models;
using System;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Contact> Contacts { get; set; } = null!;
        public DbSet<FriendConnection> FriendConnections { get; set; } = null!;
        public DbSet<Message> Messages { get; set; } = null!;
        public DbSet<ServiceActivation> ServiceActivations { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "alice",
                    Password = "password123",
                    Email = "alice@example.com",
                    MobileNumber = "0987654321",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%236366f1\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">AV</text></svg>",
                    Name = "Alice Vance",
                    Gender = "Female",
                    Dob = new DateTime(1998, 5, 15),
                    Address = "123 Flower St, Hanoi",
                    MaritalStatus = "Single",
                    Hobbies = "Reading, Photography",
                    Likes = "Coffee, Rainy Days",
                    Dislikes = "Traffic Jam",
                    Cuisines = "Vietnamese, Italian",
                    Sports = "Swimming, Badminton",
                    Qualification = "Bachelor of Computer Science",
                    School = "Hanoi High School",
                    College = "Vietnam National University",
                    WorkStatus = "Employed",
                    Organization = "TechCorp Solutions",
                    Designation = "Senior Software Engineer"
                },
                new User
                {
                    Id = 2,
                    Username = "bob",
                    Password = "password123",
                    Email = "bob@example.com",
                    MobileNumber = "0912345678",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%2310b981\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">BS</text></svg>",
                    Name = "Bob Stone",
                    Gender = "Male",
                    Dob = new DateTime(1995, 10, 22),
                    Address = "456 Oak Ave, Da Nang",
                    MaritalStatus = "Married",
                    Hobbies = "Guitar, Hiking",
                    Likes = "Rock Music, Spicy Food",
                    Dislikes = "Lateness",
                    Cuisines = "Mexican, Japanese",
                    Sports = "Football, Cycling",
                    Qualification = "Master of Business Administration",
                    School = "Da Nang Gifted School",
                    College = "University of Economics",
                    WorkStatus = "Employed",
                    Organization = "FinTech Group",
                    Designation = "Product Manager"
                },
                new User
                {
                    Id = 3,
                    Username = "charlie",
                    Password = "password123",
                    Email = "charlie@example.com",
                    MobileNumber = "0901234567",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23f59e0b\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">CD</text></svg>",
                    Name = "Charlie Davis",
                    Gender = "Male",
                    Dob = new DateTime(2002, 1, 30),
                    Address = "789 Pine Rd, HCMC",
                    MaritalStatus = "Single",
                    Hobbies = "Gaming, Cooking",
                    Likes = "Video Games, Dessert",
                    Dislikes = "Mondays",
                    Cuisines = "Vietnamese, Korean",
                    Sports = "E-Sports, Basketball",
                    Qualification = "Undergraduate",
                    School = "Saigon High School",
                    College = "RMIT University",
                    WorkStatus = "Student",
                    Organization = "RMIT",
                    Designation = "IT Student"
                }
            );

            // Seed Contacts
            modelBuilder.Entity<Contact>().HasData(
                // Alice's Contacts
                new Contact { Id = 1, UserId = 1, FirstName = "Bob", LastName = "Stone", ContactNumber = "0912345678" },
                new Contact { Id = 2, UserId = 1, FirstName = "Charlie", LastName = "Davis", ContactNumber = "0901234567" },
                new Contact { Id = 3, UserId = 1, FirstName = "David", LastName = "Miller", ContactNumber = "0944444444" }, // Non-friend contact
                
                // Bob's Contacts
                new Contact { Id = 4, UserId = 2, FirstName = "Alice", LastName = "Vance", ContactNumber = "0987654321" },
                new Contact { Id = 5, UserId = 2, FirstName = "Emma", LastName = "Watson", ContactNumber = "0955555555" }  // Non-friend contact
            );

            // Seed Friend Connections
            // Alice & Bob are Friends
            modelBuilder.Entity<FriendConnection>().HasData(
                new FriendConnection { Id = 1, UserId = 1, FriendUserId = 2, Status = "Accepted" },
                // Charlie sent a request to Bob
                new FriendConnection { Id = 2, UserId = 3, FriendUserId = 2, Status = "Pending" },
                // Alice sent a request to Charlie
                new FriendConnection { Id = 3, UserId = 1, FriendUserId = 3, Status = "Pending" }
            );

            // Seed Messages
            modelBuilder.Entity<Message>().HasData(
                // Alice and Bob (Friends - Unlimited Messages)
                new Message { Id = 1, SenderId = 1, ReceiverNumber = "0912345678", ReceiverId = 2, Content = "Hi Bob! How are you doing today?", SentTime = DateTime.UtcNow.AddMinutes(-30), IsFriendMessage = true },
                new Message { Id = 2, SenderId = 2, ReceiverNumber = "0987654321", ReceiverId = 1, Content = "Hey Alice! I am doing great, working on our new app dashboard. You?", SentTime = DateTime.UtcNow.AddMinutes(-28), IsFriendMessage = true },
                new Message { Id = 3, SenderId = 1, ReceiverNumber = "0912345678", ReceiverId = 2, Content = "That sounds awesome. I am designing the frontend for the online SMS system.", SentTime = DateTime.UtcNow.AddMinutes(-25), IsFriendMessage = true },
                
                // Alice and David (Non-friends - Free Quota used: 2 messages)
                new Message { Id = 4, SenderId = 1, ReceiverNumber = "0944444444", ReceiverId = null, Content = "Hello David, this is Alice. Just checking if you received my email.", SentTime = DateTime.UtcNow.AddHours(-1), IsFriendMessage = false },
                new Message { Id = 5, SenderId = 1, ReceiverNumber = "0944444444", ReceiverId = null, Content = "Let me know when you are free.", SentTime = DateTime.UtcNow.AddMinutes(-40), IsFriendMessage = false }
            );

            // Seed Paid Service Activations
            modelBuilder.Entity<ServiceActivation>().HasData(
                new ServiceActivation { Id = 1, UserId = 1, ServiceName = "Joke", Price = 2.99m, ActivatedTime = DateTime.UtcNow.AddDays(-5) },
                new ServiceActivation { Id = 2, UserId = 1, ServiceName = "News", Price = 4.99m, ActivatedTime = DateTime.UtcNow.AddDays(-2) },
                new ServiceActivation { Id = 3, UserId = 2, ServiceName = "Sports", Price = 3.99m, ActivatedTime = DateTime.UtcNow.AddDays(-10) }
            );
        }
    }
}
