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
        public DbSet<Profile> Profiles { get; set; } = null!;
        public DbSet<Contact> Contacts { get; set; } = null!;
        public DbSet<FriendConnection> FriendConnections { get; set; } = null!;
        public DbSet<Message> Messages { get; set; } = null!;
        public DbSet<Service> Services { get; set; } = null!;
        public DbSet<UserService> UserServices { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("user_id");
                entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(50).IsRequired();
                entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
                entity.Property(e => e.MobileNumber).HasColumnName("mobile_number").HasMaxLength(10).IsRequired();
                entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.MobileNumber).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasOne(e => e.Profile)
                    .WithOne(e => e.User)
                    .HasForeignKey<Profile>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Profile>(entity =>
            {
                entity.ToTable("Profiles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("profile_id");
                entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
                entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(100);
                entity.Property(e => e.Gender).HasColumnName("gender").HasMaxLength(10);
                entity.Property(e => e.Dob).HasColumnName("dob");
                entity.Property(e => e.Address).HasColumnName("address").HasMaxLength(255);
                entity.Property(e => e.MaritalStatus).HasColumnName("marital_status").HasMaxLength(20);
                entity.Property(e => e.Hobbies).HasColumnName("hobbies");
                entity.Property(e => e.Likes).HasColumnName("likes");
                entity.Property(e => e.Dislikes).HasColumnName("dislikes");
                entity.Property(e => e.Cuisines).HasColumnName("cuisines");
                entity.Property(e => e.Sports).HasColumnName("sports");
                entity.Property(e => e.ProfilePhoto).HasColumnName("profile_photo").HasMaxLength(255);
                entity.Property(e => e.Qualification).HasColumnName("qualification").HasMaxLength(100);
                entity.Property(e => e.School).HasColumnName("school").HasMaxLength(100);
                entity.Property(e => e.College).HasColumnName("college").HasMaxLength(100);
                entity.Property(e => e.WorkStatus).HasColumnName("work_status").HasMaxLength(50);
                entity.Property(e => e.Organization).HasColumnName("organization").HasMaxLength(100);
                entity.Property(e => e.Designation).HasColumnName("designation").HasMaxLength(100);
                entity.HasIndex(e => e.UserId).IsUnique();
            });

            modelBuilder.Entity<Contact>(entity =>
            {
                entity.ToTable("Contacts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("contact_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(50).IsRequired();
                entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(50).IsRequired();
                entity.Property(e => e.ContactNumber).HasColumnName("contact_number").HasMaxLength(10).IsRequired();
            });

            modelBuilder.Entity<FriendConnection>(entity =>
            {
                entity.ToTable("Friendships");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("friendship_id");
                entity.Property(e => e.UserId).HasColumnName("requester_id");
                entity.Property(e => e.FriendUserId).HasColumnName("addressee_id");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.HasIndex(e => new { e.UserId, e.FriendUserId }).IsUnique();
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.ToTable("Messages");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("message_id");
                entity.Property(e => e.SenderId).HasColumnName("sender_id");
                entity.Property(e => e.ReceiverNumber).HasColumnName("receiver_number").HasMaxLength(10).IsRequired();
                entity.Property(e => e.Content).HasColumnName("content").HasMaxLength(120).IsRequired();
                entity.Property(e => e.IsFreeFriendMsg).HasColumnName("is_free_friend_msg");
                entity.Property(e => e.SentTime).HasColumnName("sent_at");
            });

            modelBuilder.Entity<Service>(entity =>
            {
                entity.ToTable("Services");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("service_id");
                entity.Property(e => e.ServiceName).HasColumnName("service_name").HasMaxLength(50).IsRequired();
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.Price).HasColumnName("price").HasPrecision(10, 2);
            });

            modelBuilder.Entity<UserService>(entity =>
            {
                entity.ToTable("User_Services");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("subscription_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ServiceId).HasColumnName("service_id");
                entity.Property(e => e.PaymentStatus).HasColumnName("payment_status").HasMaxLength(20).IsRequired();
                entity.Property(e => e.ActivatedAt).HasColumnName("activated_at");
                entity.HasOne(e => e.Service)
                    .WithMany()
                    .HasForeignKey(e => e.ServiceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "alice",
                    PasswordHash = "password123",
                    Email = "alice@example.com",
                    MobileNumber = "0987654321",
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Id = 2,
                    Username = "bob",
                    PasswordHash = "password123",
                    Email = "bob@example.com",
                    MobileNumber = "0912345678",
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Id = 3,
                    Username = "charlie",
                    PasswordHash = "password123",
                    Email = "charlie@example.com",
                    MobileNumber = "0901234567",
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            modelBuilder.Entity<Contact>().HasData(
                new Contact { Id = 1, UserId = 1, FirstName = "Bob", LastName = "Stone", ContactNumber = "0912345678" },
                new Contact { Id = 2, UserId = 1, FirstName = "Charlie", LastName = "Davis", ContactNumber = "0901234567" },
                new Contact { Id = 3, UserId = 1, FirstName = "David", LastName = "Miller", ContactNumber = "0944444444" },
                new Contact { Id = 4, UserId = 2, FirstName = "Alice", LastName = "Vance", ContactNumber = "0987654321" },
                new Contact { Id = 5, UserId = 2, FirstName = "Emma", LastName = "Watson", ContactNumber = "0955555555" }
            );

            modelBuilder.Entity<FriendConnection>().HasData(
                new FriendConnection { Id = 1, UserId = 1, FriendUserId = 2, Status = "accepted", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new FriendConnection { Id = 2, UserId = 3, FriendUserId = 2, Status = "pending", CreatedAt = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc) },
                new FriendConnection { Id = 3, UserId = 1, FriendUserId = 3, Status = "pending", CreatedAt = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc) }
            );

            modelBuilder.Entity<Message>().HasData(
                new Message { Id = 1, SenderId = 1, ReceiverNumber = "0912345678", Content = "Hi Bob! How are you doing today?", SentTime = new DateTime(2026, 1, 10, 8, 30, 0, DateTimeKind.Utc), IsFreeFriendMsg = true },
                new Message { Id = 2, SenderId = 2, ReceiverNumber = "0987654321", Content = "Hey Alice! I am doing great, working on our new app dashboard. You?", SentTime = new DateTime(2026, 1, 10, 8, 32, 0, DateTimeKind.Utc), IsFreeFriendMsg = true },
                new Message { Id = 3, SenderId = 1, ReceiverNumber = "0912345678", Content = "That sounds awesome. I am designing the frontend for the online SMS system.", SentTime = new DateTime(2026, 1, 10, 8, 35, 0, DateTimeKind.Utc), IsFreeFriendMsg = true },
                new Message { Id = 4, SenderId = 1, ReceiverNumber = "0944444444", Content = "Hello David, this is Alice. Just checking if you received my email.", SentTime = new DateTime(2026, 1, 10, 7, 30, 0, DateTimeKind.Utc), IsFreeFriendMsg = false },
                new Message { Id = 5, SenderId = 1, ReceiverNumber = "0944444444", Content = "Let me know when you are free.", SentTime = new DateTime(2026, 1, 10, 7, 50, 0, DateTimeKind.Utc), IsFreeFriendMsg = false }
            );

            modelBuilder.Entity<Profile>().HasData(
                new Profile
                {
                    Id = 1,
                    UserId = 1,
                    FullName = "Alice Vance",
                    Gender = "Female",
                    Dob = new DateTime(1998, 5, 15),
                    Address = "123 Flower St, Hanoi",
                    MaritalStatus = "Single",
                    Hobbies = "Reading, Photography",
                    Likes = "Coffee, Rainy Days",
                    Dislikes = "Traffic Jam",
                    Cuisines = "Vietnamese, Italian",
                    Sports = "Swimming, Badminton",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%236366f1\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">AV</text></svg>",
                    Qualification = "Bachelor of Computer Science",
                    School = "Hanoi High School",
                    College = "Vietnam National University",
                    WorkStatus = "Employed",
                    Organization = "TechCorp Solutions",
                    Designation = "Senior Software Engineer"
                },
                new Profile
                {
                    Id = 2,
                    UserId = 2,
                    FullName = "Bob Stone",
                    Gender = "Male",
                    Dob = new DateTime(1995, 10, 22),
                    Address = "456 Oak Ave, Da Nang",
                    MaritalStatus = "Married",
                    Hobbies = "Guitar, Hiking",
                    Likes = "Rock Music, Spicy Food",
                    Dislikes = "Lateness",
                    Cuisines = "Mexican, Japanese",
                    Sports = "Football, Cycling",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%2310b981\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">BS</text></svg>",
                    Qualification = "Master of Business Administration",
                    School = "Da Nang Gifted School",
                    College = "University of Economics",
                    WorkStatus = "Employed",
                    Organization = "FinTech Group",
                    Designation = "Product Manager"
                },
                new Profile
                {
                    Id = 3,
                    UserId = 3,
                    FullName = "Charlie Davis",
                    Gender = "Male",
                    Dob = new DateTime(2002, 1, 30),
                    Address = "789 Pine Rd, HCMC",
                    MaritalStatus = "Single",
                    Hobbies = "Gaming, Cooking",
                    Likes = "Video Games, Dessert",
                    Dislikes = "Mondays",
                    Cuisines = "Vietnamese, Korean",
                    Sports = "E-Sports, Basketball",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23f59e0b\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">CD</text></svg>",
                    Qualification = "Undergraduate",
                    School = "Saigon High School",
                    College = "RMIT University",
                    WorkStatus = "Student",
                    Organization = "RMIT",
                    Designation = "IT Student"
                }
            );

            modelBuilder.Entity<Service>().HasData(
                new Service { Id = 1, ServiceName = "Joke", Description = "Dịch vụ nhận tin nhắn truyện cười hàng ngày", Price = 10.00m },
                new Service { Id = 2, ServiceName = "Current Affairs", Description = "Cập nhật tình hình thời sự hiện tại", Price = 15.00m },
                new Service { Id = 3, ServiceName = "Sports", Description = "Tin tức và kết quả thể thao", Price = 12.00m },
                new Service { Id = 4, ServiceName = "News", Description = "Tin tức tổng hợp hàng ngày", Price = 10.00m }
            );

            modelBuilder.Entity<UserService>().HasData(
                new UserService { Id = 1, UserId = 1, ServiceId = 1, PaymentStatus = "paid", ActivatedAt = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc) },
                new UserService { Id = 2, UserId = 1, ServiceId = 4, PaymentStatus = "paid", ActivatedAt = new DateTime(2026, 1, 8, 0, 0, 0, DateTimeKind.Utc) },
                new UserService { Id = 3, UserId = 2, ServiceId = 3, PaymentStatus = "paid", ActivatedAt = new DateTime(2025, 12, 30, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
