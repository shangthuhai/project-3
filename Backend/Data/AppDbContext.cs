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
        public DbSet<Admin> Admins { get; set; } = null!;
        public DbSet<Profile> Profiles { get; set; } = null!;
        public DbSet<Contact> Contacts { get; set; } = null!;
        public DbSet<Friendship> Friendships { get; set; } = null!;
        public DbSet<UserQuota> UserQuotas { get; set; } = null!;
        public DbSet<Message> Messages { get; set; } = null!;
        public DbSet<SMSLog> SMSLogs { get; set; } = null!;
        public DbSet<Service> Services { get; set; } = null!;
        public DbSet<UserService> UserServices { get; set; } = null!;
        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<ContactGroup> ContactGroups { get; set; } = null!;
        public DbSet<ContactGroupMember> ContactGroupMembers { get; set; } = null!;
        public DbSet<SMSTemplate> SMSTemplates { get; set; } = null!;
        public DbSet<Blocklist> Blocklists { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure 1-to-1: User and Profile
            modelBuilder.Entity<Profile>()
                .HasOne(p => p.User)
                .WithOne(u => u.Profile)
                .HasForeignKey<Profile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure 1-to-1: User and UserQuota
            modelBuilder.Entity<UserQuota>()
                .HasOne(q => q.User)
                .WithOne(u => u.Quota)
                .HasForeignKey<UserQuota>(q => q.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Friendships unique bidirectional constraint via computed columns
            modelBuilder.Entity<Friendship>()
                .Property(f => f.UserLower)
                .HasComputedColumnSql("CASE WHEN requester_id < addressee_id THEN requester_id ELSE addressee_id END", stored: true);

            modelBuilder.Entity<Friendship>()
                .Property(f => f.UserHigher)
                .HasComputedColumnSql("CASE WHEN requester_id > addressee_id THEN requester_id ELSE addressee_id END", stored: true);

            modelBuilder.Entity<Friendship>()
                .HasIndex(f => new { f.UserLower, f.UserHigher })
                .IsUnique();

            // Index for pending check in Friendships
            modelBuilder.Entity<Friendship>()
                .HasIndex(f => new { f.AddresseeId, f.Status });

            // Messages composite indexes for high speed chat retrieval
            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.SenderId, m.ReceiverId, m.SentAt });

            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.ReceiverId, m.SenderId, m.SentAt });

            modelBuilder.Entity<Message>()
                .HasIndex(m => m.ReceiverNumber);

            // SMS Logs index
            modelBuilder.Entity<SMSLog>()
                .HasIndex(l => l.DeliveryStatus);

            // Contacts index
            modelBuilder.Entity<Contact>()
                .HasIndex(c => c.UserId);

            // Transactions index
            modelBuilder.Entity<Transaction>()
                .HasIndex(t => t.UserId);

            // RESTRICT: User cannot be deleted if transactions exist
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seeding Data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // 1. Seed Users
            modelBuilder.Entity<User>().HasData(
                new User { UserId = 1, Username = "alice", PasswordHash = "password123", MobileNumber = "0987654321", Email = "alice@example.com", IsActive = true, CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new User { UserId = 2, Username = "bob", PasswordHash = "password123", MobileNumber = "0912345678", Email = "bob@example.com", IsActive = true, CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new User { UserId = 3, Username = "charlie", PasswordHash = "password123", MobileNumber = "0901234567", Email = "charlie@example.com", IsActive = true, CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new User { UserId = 999, Username = "ai_assistant", PasswordHash = "system_ai_password_not_used", MobileNumber = "9999999999", Email = "ai@smschat.com", IsActive = true, CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") }
            );

            // 2. Seed Admins
            modelBuilder.Entity<Admin>().HasData(
                new Admin { AdminId = 1, Username = "admin", PasswordHash = "admin123", Email = "admin@smschat.com", FullName = "System Administrator", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") }
            );

            // 3. Seed Profiles
            modelBuilder.Entity<Profile>().HasData(
                new Profile
                {
                    ProfileId = 1,
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
                    Qualification = "Bachelor of Computer Science",
                    School = "Hanoi High School",
                    College = "Vietnam National University",
                    WorkStatus = "Employed",
                    Organization = "TechCorp Solutions",
                    Designation = "Senior Software Engineer",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%236366f1\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">AV</text></svg>"
                },
                new Profile
                {
                    ProfileId = 2,
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
                    Qualification = "Master of Business Administration",
                    School = "Da Nang Gifted School",
                    College = "University of Economics",
                    WorkStatus = "Employed",
                    Organization = "FinTech Group",
                    Designation = "Product Manager",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%2310b981\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">BS</text></svg>"
                },
                new Profile
                {
                    ProfileId = 3,
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
                    Qualification = "Undergraduate",
                    School = "Saigon High School",
                    College = "RMIT University",
                    WorkStatus = "Student",
                    Organization = "RMIT",
                    Designation = "IT Student",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23f59e0b\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">CD</text></svg>"
                },
                new Profile
                {
                    ProfileId = 999,
                    UserId = 999,
                    FullName = "🤖 Trợ lý AI (Chatbot)",
                    Gender = "Robot",
                    Dob = new DateTime(2026, 1, 1),
                    Address = "Cloud",
                    MaritalStatus = "Single",
                    Hobbies = "Answering questions, helping users",
                    Likes = "Tokens, Prompts",
                    Dislikes = "Toxic inputs",
                    Cuisines = "Data",
                    Sports = "Mental gym",
                    Qualification = "PhD in Artificial Intelligence",
                    School = "Internet",
                    College = "Supercomputer",
                    WorkStatus = "Self-Employed",
                    Organization = "Groq Inc",
                    Designation = "Virtual Assistant",
                    ProfilePhoto = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23ec4899\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"40\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">AI</text></svg>"
                }
            );

            // 4. Seed Quotas (Default limit of 5 free messages per stranger for all users)
            modelBuilder.Entity<UserQuota>().HasData(
                new UserQuota { QuotaId = 1, UserId = 1, FreeMessagesLeft = 5, UpdatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new UserQuota { QuotaId = 2, UserId = 2, FreeMessagesLeft = 5, UpdatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new UserQuota { QuotaId = 3, UserId = 3, FreeMessagesLeft = 5, UpdatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new UserQuota { QuotaId = 999, UserId = 999, FreeMessagesLeft = 999999, UpdatedAt = DateTime.Parse("2026-08-14T00:00:00Z") }
            );

            // 5. Seed Contacts
            modelBuilder.Entity<Contact>().HasData(
                new Contact { ContactId = 1, UserId = 1, FirstName = "Bob", LastName = "Stone", ContactNumber = "0912345678" },
                new Contact { ContactId = 2, UserId = 1, FirstName = "Charlie", LastName = "Davis", ContactNumber = "0901234567" },
                new Contact { ContactId = 3, UserId = 1, FirstName = "David", LastName = "Miller", ContactNumber = "0944444444" },
                new Contact { ContactId = 4, UserId = 2, FirstName = "Alice", LastName = "Vance", ContactNumber = "0987654321" },
                new Contact { ContactId = 5, UserId = 2, FirstName = "Emma", LastName = "Watson", ContactNumber = "0955555555" },
                new Contact { ContactId = 6, UserId = 1, FirstName = "🤖 Trợ lý", LastName = "AI (Chatbot)", ContactNumber = "9999999999" },
                new Contact { ContactId = 7, UserId = 2, FirstName = "🤖 Trợ lý", LastName = "AI (Chatbot)", ContactNumber = "9999999999" },
                new Contact { ContactId = 8, UserId = 3, FirstName = "🤖 Trợ lý", LastName = "AI (Chatbot)", ContactNumber = "9999999999" }
            );

            // 6. Seed Friendships
            modelBuilder.Entity<Friendship>().HasData(
                new Friendship { FriendshipId = 1, RequesterId = 1, AddresseeId = 2, Status = "accepted", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new Friendship { FriendshipId = 2, RequesterId = 3, AddresseeId = 2, Status = "pending", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new Friendship { FriendshipId = 3, RequesterId = 1, AddresseeId = 3, Status = "pending", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new Friendship { FriendshipId = 4, RequesterId = 1, AddresseeId = 999, Status = "accepted", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new Friendship { FriendshipId = 5, RequesterId = 2, AddresseeId = 999, Status = "accepted", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new Friendship { FriendshipId = 6, RequesterId = 3, AddresseeId = 999, Status = "accepted", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") }
            );

            // 7. Seed Services
            modelBuilder.Entity<Service>().HasData(
                new Service { ServiceId = 1, ServiceName = "Joke", Description = "Receive funny jokes daily.", Price = 2.99m, IsActive = true },
                new Service { ServiceId = 2, ServiceName = "Current Affairs", Description = "Get the latest local and global affairs.", Price = 4.99m, IsActive = true },
                new Service { ServiceId = 3, ServiceName = "Sports", Description = "Follow sports scores and schedules.", Price = 3.99m, IsActive = true },
                new Service { ServiceId = 4, ServiceName = "News", Description = "Daily top news headlines.", Price = 4.99m, IsActive = true }
            );

            // 8. Seed User_Services (Subscriptions)
            modelBuilder.Entity<UserService>().HasData(
                new UserService { SubscriptionId = 1, UserId = 1, ServiceId = 1, PaymentStatus = "paid", ActivatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new UserService { SubscriptionId = 2, UserId = 1, ServiceId = 4, PaymentStatus = "paid", ActivatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new UserService { SubscriptionId = 3, UserId = 2, ServiceId = 3, PaymentStatus = "paid", ActivatedAt = DateTime.Parse("2026-08-14T00:00:00Z") }
            );

            // 9. Seed Transactions
            modelBuilder.Entity<Transaction>().HasData(
                new Transaction { TransactionId = 1, UserId = 1, SubscriptionId = 1, Amount = 2.99m, CardLast4 = "1111", TransactionStatus = "success", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new Transaction { TransactionId = 2, UserId = 1, SubscriptionId = 2, Amount = 4.99m, CardLast4 = "2222", TransactionStatus = "success", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") },
                new Transaction { TransactionId = 3, UserId = 2, SubscriptionId = 3, Amount = 3.99m, CardLast4 = "3333", TransactionStatus = "success", CreatedAt = DateTime.Parse("2026-08-14T00:00:00Z") }
            );

            // 10. Seed Messages
            modelBuilder.Entity<Message>().HasData(
                new Message { MessageId = 1, SenderId = 1, ReceiverId = 2, ReceiverNumber = "0912345678", Content = "Hi Bob! How are you doing today?", IsFreeFriendMsg = true, SentAt = DateTime.Parse("2026-08-14T12:00:00Z") },
                new Message { MessageId = 2, SenderId = 2, ReceiverId = 1, ReceiverNumber = "0987654321", Content = "Hey Alice! I am doing great, working on our new app dashboard. You?", IsFreeFriendMsg = true, SentAt = DateTime.Parse("2026-08-14T12:02:00Z") },
                new Message { MessageId = 3, SenderId = 1, ReceiverId = 2, ReceiverNumber = "0912345678", Content = "That sounds awesome. I am designing the frontend for the online SMS system.", IsFreeFriendMsg = true, SentAt = DateTime.Parse("2026-08-14T12:05:00Z") },
                new Message { MessageId = 4, SenderId = 1, ReceiverId = null, ReceiverNumber = "0944444444", Content = "Hello David, this is Alice. Just checking if you received my email.", IsFreeFriendMsg = false, SentAt = DateTime.Parse("2026-08-14T11:00:00Z") },
                new Message { MessageId = 5, SenderId = 1, ReceiverId = null, ReceiverNumber = "0944444444", Content = "Let me know when you are free.", IsFreeFriendMsg = false, SentAt = DateTime.Parse("2026-08-14T12:20:00Z") }
            );

            // 11. Seed SMS Logs
            modelBuilder.Entity<SMSLog>().HasData(
                new SMSLog { LogId = 1, MessageId = 1, GatewayStatusCode = "200_OK", DeliveryStatus = "delivered", UpdatedAt = DateTime.Parse("2026-08-14T12:00:00Z") },
                new SMSLog { LogId = 2, MessageId = 2, GatewayStatusCode = "200_OK", DeliveryStatus = "delivered", UpdatedAt = DateTime.Parse("2026-08-14T12:02:00Z") },
                new SMSLog { LogId = 3, MessageId = 3, GatewayStatusCode = "200_OK", DeliveryStatus = "delivered", UpdatedAt = DateTime.Parse("2026-08-14T12:05:00Z") },
                new SMSLog { LogId = 4, MessageId = 4, GatewayStatusCode = "200_OK", DeliveryStatus = "delivered", UpdatedAt = DateTime.Parse("2026-08-14T11:00:00Z") },
                new SMSLog { LogId = 5, MessageId = 5, GatewayStatusCode = "200_OK", DeliveryStatus = "delivered", UpdatedAt = DateTime.Parse("2026-08-14T12:20:00Z") }
            );

            // 12. Seed SMS Templates
            modelBuilder.Entity<SMSTemplate>().HasData(
                new SMSTemplate { TemplateId = 1, UserId = null, Title = "Chúc mừng Sinh nhật", Body = "Chúc mừng sinh nhật {Name}! Chúc bạn tuổi mới ngập tràn niềm vui, sức khỏe và luôn thành công trong cuộc sống." },
                new SMSTemplate { TemplateId = 2, UserId = null, Title = "Nhắc lịch hẹn", Body = "Xin chào {Name}, đây là tin nhắn nhắc bạn về lịch hẹn của chúng ta vào lúc 15h chiều nay. Hẹn gặp lại bạn nhé!" },
                new SMSTemplate { TemplateId = 3, UserId = null, Title = "Nhắc thanh toán", Body = "Kính chào quý khách {Name}, vui lòng hoàn thành thanh toán hóa đơn cước dịch vụ tháng này trước ngày 20. Trân trọng cảm ơn!" },
                new SMSTemplate { TemplateId = 4, UserId = null, Title = "Tin nhắn công việc nhanh", Body = "Hi {Name}, mình đã nhận được tài liệu bạn gửi. Mình sẽ phản hồi lại cho bạn sớm nhất có thể. Cảm ơn nhé!" }
            );
        }
    }
}
