-- =============================================================================
-- Database Script for SQLite (SMS Chat System)
-- Project: Online SMS Chat & Services Platform
-- Compatible with: SQLite 3, Entity Framework Core SQLite Provider
-- Generated: 2026-09-03
-- =============================================================================

PRAGMA foreign_keys = OFF;

-- Drop existing tables
DROP TABLE IF EXISTS "SMS_Logs";
DROP TABLE IF EXISTS "Messages";
DROP TABLE IF EXISTS "Transactions";
DROP TABLE IF EXISTS "User_Services";
DROP TABLE IF EXISTS "Services";
DROP TABLE IF EXISTS "Contact_Group_Members";
DROP TABLE IF EXISTS "Contact_Groups";
DROP TABLE IF EXISTS "Contacts";
DROP TABLE IF EXISTS "Friendships";
DROP TABLE IF EXISTS "User_Quotas";
DROP TABLE IF EXISTS "Profiles";
DROP TABLE IF EXISTS "SMS_Templates";
DROP TABLE IF EXISTS "Blocklist";
DROP TABLE IF EXISTS "Admins";
DROP TABLE IF EXISTS "Users";

PRAGMA foreign_keys = ON;

-- =============================================================================
-- 1. TABLE: Users
-- =============================================================================
CREATE TABLE "Users" (
    "user_id" INTEGER NOT NULL CONSTRAINT "PK_Users" PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "two_factor_enabled" INTEGER NOT NULL DEFAULT 0,
    "two_factor_code" TEXT NULL,
    "two_factor_expiry" TEXT NULL,
    "only_friends_sms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- 2. TABLE: Admins
-- =============================================================================
CREATE TABLE "Admins" (
    "admin_id" INTEGER NOT NULL CONSTRAINT "PK_Admins" PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "full_name" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- 3. TABLE: Profiles
-- =============================================================================
CREATE TABLE "Profiles" (
    "profile_id" INTEGER NOT NULL CONSTRAINT "PK_Profiles" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL UNIQUE,
    "full_name" TEXT NULL,
    "gender" TEXT NULL,
    "dob" TEXT NULL,
    "address" TEXT NULL,
    "marital_status" TEXT NULL,
    "hobbies" TEXT NULL,
    "likes" TEXT NULL,
    "dislikes" TEXT NULL,
    "cuisines" TEXT NULL,
    "sports" TEXT NULL,
    "profile_photo" TEXT NULL,
    "qualification" TEXT NULL,
    "school" TEXT NULL,
    "college" TEXT NULL,
    "work_status" TEXT NULL,
    "organization" TEXT NULL,
    "designation" TEXT NULL,
    CONSTRAINT "FK_Profiles_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_Profiles_user_id" ON "Profiles" ("user_id");

-- =============================================================================
-- 4. TABLE: User_Quotas
-- =============================================================================
CREATE TABLE "User_Quotas" (
    "quota_id" INTEGER NOT NULL CONSTRAINT "PK_User_Quotas" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL UNIQUE,
    "free_messages_left" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "FK_User_Quotas_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_User_Quotas_user_id" ON "User_Quotas" ("user_id");

-- =============================================================================
-- 5. TABLE: Contacts
-- =============================================================================
CREATE TABLE "Contacts" (
    "contact_id" INTEGER NOT NULL CONSTRAINT "PK_Contacts" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "contact_number" TEXT NOT NULL,
    CONSTRAINT "FK_Contacts_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE INDEX "IX_Contacts_user_id" ON "Contacts" ("user_id");

-- =============================================================================
-- 6. TABLE: Friendships
-- =============================================================================
CREATE TABLE "Friendships" (
    "friendship_id" INTEGER NOT NULL CONSTRAINT "PK_Friendships" PRIMARY KEY AUTOINCREMENT,
    "requester_id" INTEGER NOT NULL,
    "addressee_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    "user_lower" INTEGER GENERATED ALWAYS AS (CASE WHEN requester_id < addressee_id THEN requester_id ELSE addressee_id END) STORED,
    "user_higher" INTEGER GENERATED ALWAYS AS (CASE WHEN requester_id > addressee_id THEN requester_id ELSE addressee_id END) STORED,
    CONSTRAINT "FK_Friendships_Users_requester_id" FOREIGN KEY ("requester_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE,
    CONSTRAINT "FK_Friendships_Users_addressee_id" FOREIGN KEY ("addressee_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_Friendships_user_lower_user_higher" ON "Friendships" ("user_lower", "user_higher");
CREATE INDEX "IX_Friendships_requester_id" ON "Friendships" ("requester_id");
CREATE INDEX "IX_Friendships_addressee_id_status" ON "Friendships" ("addressee_id", "status");

-- =============================================================================
-- 7. TABLE: Services
-- =============================================================================
CREATE TABLE "Services" (
    "service_id" INTEGER NOT NULL CONSTRAINT "PK_Services" PRIMARY KEY AUTOINCREMENT,
    "service_name" TEXT NOT NULL,
    "description" TEXT NULL,
    "price" NUMERIC NOT NULL DEFAULT 0.00,
    "is_active" INTEGER NOT NULL DEFAULT 1
);

-- =============================================================================
-- 8. TABLE: User_Services (Subscriptions)
-- =============================================================================
CREATE TABLE "User_Services" (
    "subscription_id" INTEGER NOT NULL CONSTRAINT "PK_User_Services" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'paid',
    "activated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "FK_User_Services_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE,
    CONSTRAINT "FK_User_Services_Services_service_id" FOREIGN KEY ("service_id") REFERENCES "Services" ("service_id") ON DELETE CASCADE
);

CREATE INDEX "IX_User_Services_user_id" ON "User_Services" ("user_id");
CREATE INDEX "IX_User_Services_service_id" ON "User_Services" ("service_id");

-- =============================================================================
-- 9. TABLE: Transactions
-- =============================================================================
CREATE TABLE "Transactions" (
    "transaction_id" INTEGER NOT NULL CONSTRAINT "PK_Transactions" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "subscription_id" INTEGER NULL,
    "amount" NUMERIC NOT NULL,
    "card_last4" TEXT NOT NULL,
    "transaction_status" TEXT NOT NULL DEFAULT 'success',
    "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "FK_Transactions_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Transactions_User_Services_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "User_Services" ("subscription_id") ON DELETE SET NULL
);

CREATE INDEX "IX_Transactions_user_id" ON "Transactions" ("user_id");
CREATE INDEX "IX_Transactions_subscription_id" ON "Transactions" ("subscription_id");

-- =============================================================================
-- 10. TABLE: Messages
-- =============================================================================
CREATE TABLE "Messages" (
    "message_id" INTEGER NOT NULL CONSTRAINT "PK_Messages" PRIMARY KEY AUTOINCREMENT,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NULL,
    "receiver_number" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_free_friend_msg" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TEXT NULL,
    "sent_at" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "FK_Messages_Users_sender_id" FOREIGN KEY ("sender_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE,
    CONSTRAINT "FK_Messages_Users_receiver_id" FOREIGN KEY ("receiver_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL
);

CREATE INDEX "IX_Messages_sender_id_receiver_id_sent_at" ON "Messages" ("sender_id", "receiver_id", "sent_at");
CREATE INDEX "IX_Messages_receiver_id_sender_id_sent_at" ON "Messages" ("receiver_id", "sender_id", "sent_at");
CREATE INDEX "IX_Messages_receiver_number" ON "Messages" ("receiver_number");

-- =============================================================================
-- 11. TABLE: SMS_Logs
-- =============================================================================
CREATE TABLE "SMS_Logs" (
    "log_id" INTEGER NOT NULL CONSTRAINT "PK_SMS_Logs" PRIMARY KEY AUTOINCREMENT,
    "message_id" INTEGER NOT NULL,
    "gateway_status_code" TEXT NOT NULL DEFAULT '200_OK',
    "delivery_status" TEXT NOT NULL DEFAULT 'delivered',
    "updated_at" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "FK_SMS_Logs_Messages_message_id" FOREIGN KEY ("message_id") REFERENCES "Messages" ("message_id") ON DELETE CASCADE
);

CREATE INDEX "IX_SMS_Logs_message_id" ON "SMS_Logs" ("message_id");
CREATE INDEX "IX_SMS_Logs_delivery_status" ON "SMS_Logs" ("delivery_status");

-- =============================================================================
-- 12. TABLE: Contact_Groups
-- =============================================================================
CREATE TABLE "Contact_Groups" (
    "group_id" INTEGER NOT NULL CONSTRAINT "PK_Contact_Groups" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "FK_Contact_Groups_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE INDEX "IX_Contact_Groups_user_id" ON "Contact_Groups" ("user_id");

-- =============================================================================
-- 13. TABLE: Contact_Group_Members
-- =============================================================================
CREATE TABLE "Contact_Group_Members" (
    "member_id" INTEGER NOT NULL CONSTRAINT "PK_Contact_Group_Members" PRIMARY KEY AUTOINCREMENT,
    "group_id" INTEGER NOT NULL,
    "contact_id" INTEGER NOT NULL,
    CONSTRAINT "FK_Contact_Group_Members_Contact_Groups_group_id" FOREIGN KEY ("group_id") REFERENCES "Contact_Groups" ("group_id") ON DELETE CASCADE,
    CONSTRAINT "FK_Contact_Group_Members_Contacts_contact_id" FOREIGN KEY ("contact_id") REFERENCES "Contacts" ("contact_id") ON DELETE CASCADE
);

CREATE INDEX "IX_Contact_Group_Members_group_id" ON "Contact_Group_Members" ("group_id");
CREATE INDEX "IX_Contact_Group_Members_contact_id" ON "Contact_Group_Members" ("contact_id");

-- =============================================================================
-- 14. TABLE: SMS_Templates
-- =============================================================================
CREATE TABLE "SMS_Templates" (
    "template_id" INTEGER NOT NULL CONSTRAINT "PK_SMS_Templates" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    CONSTRAINT "FK_SMS_Templates_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL
);

CREATE INDEX "IX_SMS_Templates_user_id" ON "SMS_Templates" ("user_id");

-- =============================================================================
-- 15. TABLE: Blocklist
-- =============================================================================
CREATE TABLE "Blocklist" (
    "block_id" INTEGER NOT NULL CONSTRAINT "PK_Blocklist" PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "blocked_number" TEXT NOT NULL,
    CONSTRAINT "FK_Blocklist_Users_user_id" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE INDEX "IX_Blocklist_user_id" ON "Blocklist" ("user_id");

-- =============================================================================
-- MOCK DATA INSERTION
-- =============================================================================

-- 1. Insert Users
INSERT INTO "Users" ("user_id", "username", "password_hash", "mobile_number", "email", "is_active", "two_factor_enabled", "two_factor_code", "two_factor_expiry", "only_friends_sms", "created_at") VALUES
(1, 'alice', 'password123', '0987654321', 'alice@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(2, 'bob', 'password123', '0912345678', 'bob@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(3, 'charlie', 'password123', '0901234567', 'charlie@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(4, 'david', 'password123', '0944444444', 'david@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(5, 'emma', 'password123', '0955555555', 'emma@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(6, 'lan', 'password123', '0888888888', 'lan@gmail.com', 1, 0, NULL, NULL, 0, '2026-08-20 08:00:00'),
(7, 'john', 'password123', '0899999999', 'john@gmail.com', 1, 0, NULL, NULL, 0, '2026-08-20 09:00:00'),
(8, 'thuan', 'password123', '0777777777', 'khuathuythuan@gmail.com', 1, 0, NULL, NULL, 0, '2026-08-22 10:00:00'),
(999, 'ai_assistant', 'system_ai_password_not_used', '9999999999', 'ai@smschat.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00');

-- 2. Insert Admins
INSERT INTO "Admins" ("admin_id", "username", "password_hash", "email", "full_name", "created_at") VALUES
(1, 'admin', 'admin123', 'admin@smschat.com', 'System Administrator', '2026-08-14 07:00:00'),
(2, 'manager', 'admin123', 'manager@smschat.com', 'Operations Manager', '2026-08-15 08:00:00');

-- 3. Insert Profiles
INSERT INTO "Profiles" ("profile_id", "user_id", "full_name", "gender", "dob", "address", "marital_status", "hobbies", "likes", "dislikes", "cuisines", "sports", "profile_photo", "qualification", "school", "college", "work_status", "organization", "designation") VALUES
(1, 1, 'Alice Vance', 'Female', '1998-05-15', '123 Flower St, Hanoi', 'Single', 'Reading, Photography', 'Coffee, Rainy Days', 'Traffic Jam', 'Vietnamese, Italian', 'Swimming, Badminton', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%236366f1"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">AV</text></svg>', 'Bachelor of Computer Science', 'Hanoi High School', 'Vietnam National University', 'Employed', 'TechCorp Solutions', 'Senior Software Engineer'),
(2, 2, 'Bob Stone', 'Male', '1995-10-22', '456 Oak Ave, Da Nang', 'Married', 'Guitar, Hiking', 'Rock Music, Spicy Food', 'Lateness', 'Mexican, Japanese', 'Football, Cycling', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2310b981"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">BS</text></svg>', 'Master of Business Administration', 'Da Nang Gifted School', 'University of Economics', 'Employed', 'FinTech Group', 'Product Manager'),
(3, 3, 'Charlie Davis', 'Male', '2002-01-30', '789 Pine Rd, HCMC', 'Single', 'Gaming, Cooking', 'Video Games, Dessert', 'Mondays', 'Vietnamese, Korean', 'E-Sports, Basketball', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f59e0b"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">CD</text></svg>', 'Undergraduate', 'Saigon High School', 'RMIT University', 'Student', 'RMIT', 'IT Student'),
(4, 4, 'David Miller', 'Male', '1993-07-12', '12 Le Loi, Hue', 'Single', 'Traveling, Chess', 'Jazz, Tea', 'Noise', 'Vietnamese', 'Tennis', '', 'Bachelor of Arts', 'Hue High School', 'Hue University', 'Employed', 'Creative Media', 'Content Lead'),
(5, 5, 'Emma Watson', 'Female', '1996-09-08', '88 Tran Phu, Nha Trang', 'Single', 'Yoga, Painting', 'Sunsets, Nature', 'Pollution', 'European, Vegetarian', 'Yoga, Pilates', '', 'Master of Marketing', 'Nha Trang Gifted School', 'Foreign Trade University', 'Employed', 'Global Brands', 'Marketing Manager'),
(6, 6, 'Nguyễn Thị Lan', 'Female', '1999-11-20', '56 Hai Ba Trung, Hanoi', 'Single', 'Shopping, Travel', 'Milk Tea, Movies', 'Lies', 'Vietnamese, Thai', 'Aerobics', '', 'Bachelor of Finance', 'Chu Van An High School', 'National Economics University', 'Employed', 'Vietcombank', 'Financial Analyst'),
(7, 7, 'Johnathan Smith', 'Male', '1990-03-14', '77 Nguyen Thi Minh Khai, HCMC', 'Married', 'Running, Reading', 'Craft Beer, BBQ', 'Cold Weather', 'Western, Vietnamese', 'Marathon', '', 'Master of Computer Science', 'Melbourne High', 'University of Melbourne', 'Employed', 'Software Vietnam', 'Technical Lead'),
(8, 8, 'Khuất Huy Thuận', 'Male', '2000-04-18', 'Khuất Duy Tiến, Thanh Xuân, Hà Nội', 'Single', 'Coding, Tech Gadgets', 'Clean Code, Open Source', 'Bugs', 'Vietnamese, BBQ', 'Badminton, Gym', '', 'Bachelor of Information Technology', 'Hanoi High School', 'Aptech Computer Education', 'Employed', 'FPT Software', 'Fullstack Developer'),
(9, 999, '🤖 Trợ lý AI (Chatbot)', 'Robot', '2026-01-01', 'Cloud Network', 'Single', 'Answering questions, helping users', 'Tokens, Prompts', 'Toxic inputs', 'Data', 'Mental gym', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ec4899"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">AI</text></svg>', 'PhD in Artificial Intelligence', 'Internet', 'Supercomputer', 'Self-Employed', 'Groq Inc', 'Virtual Assistant');

-- 4. Insert User Quotas (5 free messages to strangers for regular users, 999999 for AI)
INSERT INTO "User_Quotas" ("quota_id", "user_id", "free_messages_left", "updated_at") VALUES
(1, 1, 5, '2026-08-14 07:00:00'),
(2, 2, 5, '2026-08-14 07:00:00'),
(3, 3, 5, '2026-08-14 07:00:00'),
(4, 4, 5, '2026-08-14 07:00:00'),
(5, 5, 5, '2026-08-14 07:00:00'),
(6, 6, 5, '2026-08-20 08:00:00'),
(7, 7, 5, '2026-08-20 09:00:00'),
(8, 8, 5, '2026-08-22 10:00:00'),
(9, 999, 999999, '2026-08-14 07:00:00');

-- 5. Insert Contacts
INSERT INTO "Contacts" ("contact_id", "user_id", "first_name", "last_name", "contact_number") VALUES
(1, 1, 'Bob', 'Stone', '0912345678'),
(2, 1, 'Charlie', 'Davis', '0901234567'),
(3, 1, 'David', 'Miller', '0944444444'),
(4, 1, '🤖 Trợ lý', 'AI (Chatbot)', '9999999999'),
(5, 2, 'Alice', 'Vance', '0987654321'),
(6, 2, 'Emma', 'Watson', '0955555555'),
(7, 2, '🤖 Trợ lý', 'AI (Chatbot)', '9999999999'),
(8, 3, '🤖 Trợ lý', 'AI (Chatbot)', '9999999999'),
(9, 8, 'Alice', 'Vance', '0987654321'),
(10, 8, 'Bob', 'Stone', '0912345678'),
(11, 8, 'Lan', 'Nguyễn', '0888888888');

-- 6. Insert Friendships
INSERT INTO "Friendships" ("friendship_id", "requester_id", "addressee_id", "status", "created_at") VALUES
(1, 1, 2, 'accepted', '2026-08-14 07:00:00'),
(2, 3, 2, 'pending', '2026-08-14 07:00:00'),
(3, 1, 3, 'pending', '2026-08-14 07:00:00'),
(4, 1, 999, 'accepted', '2026-08-14 07:00:00'),
(5, 2, 999, 'accepted', '2026-08-14 07:00:00'),
(6, 3, 999, 'accepted', '2026-08-14 07:00:00'),
(7, 8, 1, 'accepted', '2026-08-22 10:10:00'),
(8, 8, 2, 'accepted', '2026-08-22 10:15:00'),
(9, 8, 999, 'accepted', '2026-08-22 10:20:00');

-- 7. Insert Services
INSERT INTO "Services" ("service_id", "service_name", "description", "price", "is_active") VALUES
(1, 'Joke', 'Receive funny jokes daily straight to your mobile.', 2.99, 1),
(2, 'Current Affairs', 'Get the latest local and global affairs daily.', 4.99, 1),
(3, 'Sports', 'Follow sports scores, fixtures and live schedules.', 3.99, 1),
(4, 'News', 'Daily top breaking news headlines and analysis.', 4.99, 1);

-- 8. Insert User_Services (Subscriptions)
INSERT INTO "User_Services" ("subscription_id", "user_id", "service_id", "payment_status", "activated_at") VALUES
(1, 1, 1, 'paid', '2026-08-14 07:00:00'),
(2, 1, 4, 'paid', '2026-08-14 07:00:00'),
(3, 2, 3, 'paid', '2026-08-14 07:00:00'),
(4, 8, 4, 'paid', '2026-08-22 11:00:00');

-- 9. Insert Transactions
INSERT INTO "Transactions" ("transaction_id", "user_id", "subscription_id", "amount", "card_last4", "transaction_status", "created_at") VALUES
(1, 1, 1, 2.99, '1111', 'success', '2026-08-14 07:00:00'),
(2, 1, 2, 4.99, '2222', 'success', '2026-08-14 07:00:00'),
(3, 2, 3, 3.99, '3333', 'success', '2026-08-14 07:00:00'),
(4, 8, 4, 4.99, '8888', 'success', '2026-08-22 11:00:00');

-- 10. Insert Messages
INSERT INTO "Messages" ("message_id", "sender_id", "receiver_id", "receiver_number", "content", "is_free_friend_msg", "scheduled_at", "sent_at") VALUES
(1, 1, 2, '0912345678', 'Hi Bob! How are you doing today?', 1, NULL, '2026-08-14 12:00:00'),
(2, 2, 1, '0987654321', 'Hey Alice! I am doing great, working on our new app dashboard. You?', 1, NULL, '2026-08-14 12:02:00'),
(3, 1, 2, '0912345678', 'That sounds awesome. I am designing the frontend for the online SMS system.', 1, NULL, '2026-08-14 12:05:00'),
(4, 1, NULL, '0944444444', 'Hello David, this is Alice. Just checking if you received my email.', 0, NULL, '2026-08-14 11:00:00'),
(5, 1, NULL, '0944444444', 'Let me know when you are free for a quick call.', 0, NULL, '2026-08-14 12:20:00'),
(6, 8, 1, '0987654321', 'Chào Alice! Hệ thống SMS Online hoạt động rất mượt mà.', 1, NULL, '2026-08-22 14:00:00'),
(7, 1, 8, '0777777777', 'Chào Thuận! Cảm ơn bạn, mình đang hoàn thiện thêm tính năng templates.', 1, NULL, '2026-08-22 14:05:00'),
(8, 8, 999, '9999999999', 'Xin chào AI, hãy tóm tắt các tính năng chính của dự án SMS Chat?', 1, NULL, '2026-08-22 14:10:00'),
(9, 999, 8, '0777777777', 'Dự án gồm: Gửi SMS bạn bè miễn phí, SMS người lạ giới hạn quota, Kết bạn, Đăng ký gói tin tức/thể thao và Trợ lý AI.', 1, NULL, '2026-08-22 14:10:02');

-- 11. Insert SMS Logs
INSERT INTO "SMS_Logs" ("log_id", "message_id", "gateway_status_code", "delivery_status", "updated_at") VALUES
(1, 1, '200_OK', 'delivered', '2026-08-14 12:00:00'),
(2, 2, '200_OK', 'delivered', '2026-08-14 12:02:00'),
(3, 3, '200_OK', 'delivered', '2026-08-14 12:05:00'),
(4, 4, '200_OK', 'delivered', '2026-08-14 11:00:00'),
(5, 5, '200_OK', 'delivered', '2026-08-14 12:20:00'),
(6, 6, '200_OK', 'delivered', '2026-08-22 14:00:00'),
(7, 7, '200_OK', 'delivered', '2026-08-22 14:05:00'),
(8, 8, '200_OK', 'delivered', '2026-08-22 14:10:00'),
(9, 9, '200_OK', 'delivered', '2026-08-22 14:10:02');

-- 12. Insert Contact Groups
INSERT INTO "Contact_Groups" ("group_id", "user_id", "name") VALUES
(1, 1, 'Đồng nghiệp (Work)'),
(2, 1, 'Bạn thân (Friends)'),
(3, 8, 'Dự án Aptech');

-- 13. Insert Contact Group Members
INSERT INTO "Contact_Group_Members" ("member_id", "group_id", "contact_id") VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 3),
(4, 3, 9),
(5, 3, 10);

-- 14. Insert SMS Templates
INSERT INTO "SMS_Templates" ("template_id", "user_id", "title", "body") VALUES
(1, NULL, 'Chúc mừng Sinh nhật', 'Chúc mừng sinh nhật {Name}! Chúc bạn tuổi mới ngập tràn niềm vui, sức khỏe và luôn thành công trong cuộc sống.'),
(2, NULL, 'Nhắc lịch hẹn', 'Xin chào {Name}, đây là tin nhắn nhắc bạn về lịch hẹn của chúng ta vào lúc 15h chiều nay. Hẹn gặp lại bạn nhé!'),
(3, NULL, 'Nhắc thanh toán', 'Kính chào quý khách {Name}, vui lòng hoàn thành thanh toán hóa đơn cước dịch vụ tháng này trước ngày 20. Trân trọng cảm ơn!'),
(4, NULL, 'Tin nhắn công việc nhanh', 'Hi {Name}, mình đã nhận được tài liệu bạn gửi. Mình sẽ phản hồi lại cho bạn sớm nhất có thể. Cảm ơn nhé!'),
(5, 8, 'Họp nhóm đồ án', 'Chào {Name}, nhớ tham gia buổi họp đồ án eProject lúc 20h tối nay trên Google Meet nhé!');

-- 15. Insert Blocklist
INSERT INTO "Blocklist" ("block_id", "user_id", "blocked_number") VALUES
(1, 1, '0901234567'),
(2, 8, '0912345678');
