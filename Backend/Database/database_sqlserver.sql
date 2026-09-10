-- =============================================================================
-- Database Script for Microsoft SQL Server (T-SQL)
-- Project: Online SMS Chat & Services Platform
-- Compatible with: SQL Server 2014, 2016, 2017, 2019, 2022 & Azure SQL
-- Generated: 2026-09-03
-- =============================================================================

-- 1. Create Database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SMSChatDb')
BEGIN
    CREATE DATABASE [SMSChatDb];
END
GO

USE [SMSChatDb];
GO

-- 2. Drop existing foreign keys and tables in reverse dependency order
IF OBJECT_ID(N'[dbo].[SMS_Logs]', 'U') IS NOT NULL DROP TABLE [dbo].[SMS_Logs];
IF OBJECT_ID(N'[dbo].[Messages]', 'U') IS NOT NULL DROP TABLE [dbo].[Messages];
IF OBJECT_ID(N'[dbo].[Transactions]', 'U') IS NOT NULL DROP TABLE [dbo].[Transactions];
IF OBJECT_ID(N'[dbo].[User_Services]', 'U') IS NOT NULL DROP TABLE [dbo].[User_Services];
IF OBJECT_ID(N'[dbo].[Services]', 'U') IS NOT NULL DROP TABLE [dbo].[Services];
IF OBJECT_ID(N'[dbo].[Contact_Group_Members]', 'U') IS NOT NULL DROP TABLE [dbo].[Contact_Group_Members];
IF OBJECT_ID(N'[dbo].[Contact_Groups]', 'U') IS NOT NULL DROP TABLE [dbo].[Contact_Groups];
IF OBJECT_ID(N'[dbo].[Contacts]', 'U') IS NOT NULL DROP TABLE [dbo].[Contacts];
IF OBJECT_ID(N'[dbo].[Friendships]', 'U') IS NOT NULL DROP TABLE [dbo].[Friendships];
IF OBJECT_ID(N'[dbo].[User_Quotas]', 'U') IS NOT NULL DROP TABLE [dbo].[User_Quotas];
IF OBJECT_ID(N'[dbo].[Profiles]', 'U') IS NOT NULL DROP TABLE [dbo].[Profiles];
IF OBJECT_ID(N'[dbo].[SMS_Templates]', 'U') IS NOT NULL DROP TABLE [dbo].[SMS_Templates];
IF OBJECT_ID(N'[dbo].[Blocklist]', 'U') IS NOT NULL DROP TABLE [dbo].[Blocklist];
IF OBJECT_ID(N'[dbo].[Admins]', 'U') IS NOT NULL DROP TABLE [dbo].[Admins];
IF OBJECT_ID(N'[dbo].[Users]', 'U') IS NOT NULL DROP TABLE [dbo].[Users];
GO

-- =============================================================================
-- 1. TABLE: Users
-- =============================================================================
CREATE TABLE [dbo].[Users] (
    [user_id] INT IDENTITY(1,1) NOT NULL,
    [username] NVARCHAR(50) NOT NULL,
    [password_hash] NVARCHAR(255) NOT NULL,
    [mobile_number] NVARCHAR(15) NOT NULL,
    [email] NVARCHAR(100) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [DF_Users_is_active] DEFAULT (1),
    [two_factor_enabled] BIT NOT NULL CONSTRAINT [DF_Users_two_factor_enabled] DEFAULT (0),
    [two_factor_code] NVARCHAR(6) NULL,
    [two_factor_expiry] DATETIME2(7) NULL,
    [only_friends_sms] BIT NOT NULL CONSTRAINT [DF_Users_only_friends_sms] DEFAULT (0),
    [created_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_Users_created_at] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([user_id] ASC),
    CONSTRAINT [UQ_Users_username] UNIQUE NONCLUSTERED ([username] ASC),
    CONSTRAINT [UQ_Users_mobile_number] UNIQUE NONCLUSTERED ([mobile_number] ASC),
    CONSTRAINT [UQ_Users_email] UNIQUE NONCLUSTERED ([email] ASC)
);
GO

-- =============================================================================
-- 2. TABLE: Admins
-- =============================================================================
CREATE TABLE [dbo].[Admins] (
    [admin_id] INT IDENTITY(1,1) NOT NULL,
    [username] NVARCHAR(50) NOT NULL,
    [password_hash] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(100) NOT NULL,
    [full_name] NVARCHAR(100) NOT NULL,
    [created_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_Admins_created_at] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Admins] PRIMARY KEY CLUSTERED ([admin_id] ASC),
    CONSTRAINT [UQ_Admins_username] UNIQUE NONCLUSTERED ([username] ASC),
    CONSTRAINT [UQ_Admins_email] UNIQUE NONCLUSTERED ([email] ASC)
);
GO

-- =============================================================================
-- 3. TABLE: Profiles
-- =============================================================================
CREATE TABLE [dbo].[Profiles] (
    [profile_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [full_name] NVARCHAR(100) NULL,
    [gender] NVARCHAR(10) NULL,
    [dob] DATE NULL,
    [address] NVARCHAR(255) NULL,
    [marital_status] NVARCHAR(20) NULL,
    [hobbies] NVARCHAR(MAX) NULL,
    [likes] NVARCHAR(MAX) NULL,
    [dislikes] NVARCHAR(MAX) NULL,
    [cuisines] NVARCHAR(MAX) NULL,
    [sports] NVARCHAR(MAX) NULL,
    [profile_photo] NVARCHAR(MAX) NULL,
    [qualification] NVARCHAR(100) NULL,
    [school] NVARCHAR(100) NULL,
    [college] NVARCHAR(100) NULL,
    [work_status] NVARCHAR(50) NULL,
    [organization] NVARCHAR(100) NULL,
    [designation] NVARCHAR(100) NULL,
    CONSTRAINT [PK_Profiles] PRIMARY KEY CLUSTERED ([profile_id] ASC),
    CONSTRAINT [FK_Profiles_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Profiles_user_id] ON [dbo].[Profiles] ([user_id] ASC);
GO

-- =============================================================================
-- 4. TABLE: User_Quotas
-- =============================================================================
CREATE TABLE [dbo].[User_Quotas] (
    [quota_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [free_messages_left] INT NOT NULL CONSTRAINT [DF_User_Quotas_free_messages_left] DEFAULT (5),
    [updated_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_User_Quotas_updated_at] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_User_Quotas] PRIMARY KEY CLUSTERED ([quota_id] ASC),
    CONSTRAINT [FK_User_Quotas_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_User_Quotas_user_id] ON [dbo].[User_Quotas] ([user_id] ASC);
GO

-- =============================================================================
-- 5. TABLE: Contacts
-- =============================================================================
CREATE TABLE [dbo].[Contacts] (
    [contact_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [first_name] NVARCHAR(50) NOT NULL,
    [last_name] NVARCHAR(50) NOT NULL,
    [contact_number] NVARCHAR(15) NOT NULL,
    CONSTRAINT [PK_Contacts] PRIMARY KEY CLUSTERED ([contact_id] ASC),
    CONSTRAINT [FK_Contacts_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX [IX_Contacts_user_id] ON [dbo].[Contacts] ([user_id] ASC);
GO

-- =============================================================================
-- 6. TABLE: Friendships
-- =============================================================================
CREATE TABLE [dbo].[Friendships] (
    [friendship_id] INT IDENTITY(1,1) NOT NULL,
    [requester_id] INT NOT NULL,
    [addressee_id] INT NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Friendships_status] DEFAULT ('pending'),
    [created_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_Friendships_created_at] DEFAULT (SYSUTCDATETIME()),
    [user_lower] AS (CASE WHEN [requester_id] < [addressee_id] THEN [requester_id] ELSE [addressee_id] END) PERSISTED,
    [user_higher] AS (CASE WHEN [requester_id] > [addressee_id] THEN [requester_id] ELSE [addressee_id] END) PERSISTED,
    CONSTRAINT [PK_Friendships] PRIMARY KEY CLUSTERED ([friendship_id] ASC),
    CONSTRAINT [FK_Friendships_Users_requester_id] FOREIGN KEY ([requester_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Friendships_Users_addressee_id] FOREIGN KEY ([addressee_id]) REFERENCES [dbo].[Users] ([user_id]) -- NO ACTION to avoid multiple cascade paths in MSSQL
);
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Friendships_user_lower_user_higher] ON [dbo].[Friendships] ([user_lower] ASC, [user_higher] ASC);
CREATE NONCLUSTERED INDEX [IX_Friendships_requester_id] ON [dbo].[Friendships] ([requester_id] ASC);
CREATE NONCLUSTERED INDEX [IX_Friendships_addressee_id_status] ON [dbo].[Friendships] ([addressee_id] ASC, [status] ASC);
GO

-- =============================================================================
-- 7. TABLE: Services
-- =============================================================================
CREATE TABLE [dbo].[Services] (
    [service_id] INT IDENTITY(1,1) NOT NULL,
    [service_name] NVARCHAR(50) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [price] DECIMAL(10,2) NOT NULL CONSTRAINT [DF_Services_price] DEFAULT (0.00),
    [is_active] BIT NOT NULL CONSTRAINT [DF_Services_is_active] DEFAULT (1),
    CONSTRAINT [PK_Services] PRIMARY KEY CLUSTERED ([service_id] ASC)
);
GO

-- =============================================================================
-- 8. TABLE: User_Services (Subscriptions)
-- =============================================================================
CREATE TABLE [dbo].[User_Services] (
    [subscription_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [service_id] INT NOT NULL,
    [payment_status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_User_Services_payment_status] DEFAULT ('paid'),
    [activated_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_User_Services_activated_at] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_User_Services] PRIMARY KEY CLUSTERED ([subscription_id] ASC),
    CONSTRAINT [FK_User_Services_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_User_Services_Services_service_id] FOREIGN KEY ([service_id]) REFERENCES [dbo].[Services] ([service_id]) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX [IX_User_Services_user_id] ON [dbo].[User_Services] ([user_id] ASC);
CREATE NONCLUSTERED INDEX [IX_User_Services_service_id] ON [dbo].[User_Services] ([service_id] ASC);
GO

-- =============================================================================
-- 9. TABLE: Transactions
-- =============================================================================
CREATE TABLE [dbo].[Transactions] (
    [transaction_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [subscription_id] INT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [card_last4] NVARCHAR(4) NOT NULL,
    [transaction_status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Transactions_transaction_status] DEFAULT ('success'),
    [created_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_Transactions_created_at] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Transactions] PRIMARY KEY CLUSTERED ([transaction_id] ASC),
    CONSTRAINT [FK_Transactions_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]),
    CONSTRAINT [FK_Transactions_User_Services_subscription_id] FOREIGN KEY ([subscription_id]) REFERENCES [dbo].[User_Services] ([subscription_id]) ON DELETE SET NULL
);
GO

CREATE NONCLUSTERED INDEX [IX_Transactions_user_id] ON [dbo].[Transactions] ([user_id] ASC);
CREATE NONCLUSTERED INDEX [IX_Transactions_subscription_id] ON [dbo].[Transactions] ([subscription_id] ASC);
GO

-- =============================================================================
-- 10. TABLE: Messages
-- =============================================================================
CREATE TABLE [dbo].[Messages] (
    [message_id] INT IDENTITY(1,1) NOT NULL,
    [sender_id] INT NOT NULL,
    [receiver_id] INT NULL,
    [receiver_number] NVARCHAR(15) NOT NULL,
    [content] NVARCHAR(500) NOT NULL,
    [is_free_friend_msg] BIT NOT NULL CONSTRAINT [DF_Messages_is_free_friend_msg] DEFAULT (0),
    [scheduled_at] DATETIME2(7) NULL,
    [sent_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_Messages_sent_at] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Messages] PRIMARY KEY CLUSTERED ([message_id] ASC),
    CONSTRAINT [FK_Messages_Users_sender_id] FOREIGN KEY ([sender_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Messages_Users_receiver_id] FOREIGN KEY ([receiver_id]) REFERENCES [dbo].[Users] ([user_id]) -- NO ACTION to avoid multiple cascade paths in MSSQL
);
GO

CREATE NONCLUSTERED INDEX [IX_Messages_sender_id_receiver_id_sent_at] ON [dbo].[Messages] ([sender_id] ASC, [receiver_id] ASC, [sent_at] ASC);
CREATE NONCLUSTERED INDEX [IX_Messages_receiver_id_sender_id_sent_at] ON [dbo].[Messages] ([receiver_id] ASC, [sender_id] ASC, [sent_at] ASC);
CREATE NONCLUSTERED INDEX [IX_Messages_receiver_number] ON [dbo].[Messages] ([receiver_number] ASC);
GO

-- =============================================================================
-- 11. TABLE: SMS_Logs
-- =============================================================================
CREATE TABLE [dbo].[SMS_Logs] (
    [log_id] INT IDENTITY(1,1) NOT NULL,
    [message_id] INT NOT NULL,
    [gateway_status_code] NVARCHAR(50) NOT NULL CONSTRAINT [DF_SMS_Logs_gateway_status_code] DEFAULT ('200_OK'),
    [delivery_status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_SMS_Logs_delivery_status] DEFAULT ('delivered'),
    [updated_at] DATETIME2(7) NOT NULL CONSTRAINT [DF_SMS_Logs_updated_at] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_SMS_Logs] PRIMARY KEY CLUSTERED ([log_id] ASC),
    CONSTRAINT [FK_SMS_Logs_Messages_message_id] FOREIGN KEY ([message_id]) REFERENCES [dbo].[Messages] ([message_id]) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX [IX_SMS_Logs_message_id] ON [dbo].[SMS_Logs] ([message_id] ASC);
CREATE NONCLUSTERED INDEX [IX_SMS_Logs_delivery_status] ON [dbo].[SMS_Logs] ([delivery_status] ASC);
GO

-- =============================================================================
-- 12. TABLE: Contact_Groups
-- =============================================================================
CREATE TABLE [dbo].[Contact_Groups] (
    [group_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [name] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_Contact_Groups] PRIMARY KEY CLUSTERED ([group_id] ASC),
    CONSTRAINT [FK_Contact_Groups_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX [IX_Contact_Groups_user_id] ON [dbo].[Contact_Groups] ([user_id] ASC);
GO

-- =============================================================================
-- 13. TABLE: Contact_Group_Members
-- =============================================================================
CREATE TABLE [dbo].[Contact_Group_Members] (
    [member_id] INT IDENTITY(1,1) NOT NULL,
    [group_id] INT NOT NULL,
    [contact_id] INT NOT NULL,
    CONSTRAINT [PK_Contact_Group_Members] PRIMARY KEY CLUSTERED ([member_id] ASC),
    CONSTRAINT [FK_Contact_Group_Members_Contact_Groups_group_id] FOREIGN KEY ([group_id]) REFERENCES [dbo].[Contact_Groups] ([group_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Contact_Group_Members_Contacts_contact_id] FOREIGN KEY ([contact_id]) REFERENCES [dbo].[Contacts] ([contact_id]) -- NO ACTION to prevent cascade cycle
);
GO

CREATE NONCLUSTERED INDEX [IX_Contact_Group_Members_group_id] ON [dbo].[Contact_Group_Members] ([group_id] ASC);
CREATE NONCLUSTERED INDEX [IX_Contact_Group_Members_contact_id] ON [dbo].[Contact_Group_Members] ([contact_id] ASC);
GO

-- =============================================================================
-- 14. TABLE: SMS_Templates
-- =============================================================================
CREATE TABLE [dbo].[SMS_Templates] (
    [template_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NULL,
    [title] NVARCHAR(100) NOT NULL,
    [body] NVARCHAR(500) NOT NULL,
    CONSTRAINT [PK_SMS_Templates] PRIMARY KEY CLUSTERED ([template_id] ASC),
    CONSTRAINT [FK_SMS_Templates_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE SET NULL
);
GO

CREATE NONCLUSTERED INDEX [IX_SMS_Templates_user_id] ON [dbo].[SMS_Templates] ([user_id] ASC);
GO

-- =============================================================================
-- 15. TABLE: Blocklist
-- =============================================================================
CREATE TABLE [dbo].[Blocklist] (
    [block_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [blocked_number] NVARCHAR(15) NOT NULL,
    CONSTRAINT [PK_Blocklist] PRIMARY KEY CLUSTERED ([block_id] ASC),
    CONSTRAINT [FK_Blocklist_Users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX [IX_Blocklist_user_id] ON [dbo].[Blocklist] ([user_id] ASC);
GO

-- =============================================================================
-- MOCK DATA INSERTION (SQL Server)
-- =============================================================================

-- 1. Insert Users
SET IDENTITY_INSERT [dbo].[Users] ON;
INSERT INTO [dbo].[Users] ([user_id], [username], [password_hash], [mobile_number], [email], [is_active], [two_factor_enabled], [two_factor_code], [two_factor_expiry], [only_friends_sms], [created_at]) VALUES
(1, N'alice', N'password123', N'0987654321', N'alice@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(2, N'bob', N'password123', N'0912345678', N'bob@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(3, N'charlie', N'password123', N'0901234567', N'charlie@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(4, N'david', N'password123', N'0944444444', N'david@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(5, N'emma', N'password123', N'0955555555', N'emma@example.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00'),
(6, N'lan', N'password123', N'0888888888', N'lan@gmail.com', 1, 0, NULL, NULL, 0, '2026-08-20 08:00:00'),
(7, N'john', N'password123', N'0899999999', N'john@gmail.com', 1, 0, NULL, NULL, 0, '2026-08-20 09:00:00'),
(8, N'thuan', N'password123', N'0777777777', N'khuathuythuan@gmail.com', 1, 0, NULL, NULL, 0, '2026-08-22 10:00:00'),
(999, N'ai_assistant', N'system_ai_password_not_used', N'9999999999', N'ai@smschat.com', 1, 0, NULL, NULL, 0, '2026-08-14 07:00:00');
SET IDENTITY_INSERT [dbo].[Users] OFF;
GO

-- 2. Insert Admins
SET IDENTITY_INSERT [dbo].[Admins] ON;
INSERT INTO [dbo].[Admins] ([admin_id], [username], [password_hash], [email], [full_name], [created_at]) VALUES
(1, N'admin', N'admin123', N'admin@smschat.com', N'System Administrator', '2026-08-14 07:00:00'),
(2, N'manager', N'admin123', N'manager@smschat.com', N'Operations Manager', '2026-08-15 08:00:00');
SET IDENTITY_INSERT [dbo].[Admins] OFF;
GO

-- 3. Insert Profiles
SET IDENTITY_INSERT [dbo].[Profiles] ON;
INSERT INTO [dbo].[Profiles] ([profile_id], [user_id], [full_name], [gender], [dob], [address], [marital_status], [hobbies], [likes], [dislikes], [cuisines], [sports], [profile_photo], [qualification], [school], [college], [work_status], [organization], [designation]) VALUES
(1, 1, N'Alice Vance', N'Female', '1998-05-15', N'123 Flower St, Hanoi', N'Single', N'Reading, Photography', N'Coffee, Rainy Days', N'Traffic Jam', N'Vietnamese, Italian', N'Swimming, Badminton', N'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%236366f1"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">AV</text></svg>', N'Bachelor of Computer Science', N'Hanoi High School', N'Vietnam National University', N'Employed', N'TechCorp Solutions', N'Senior Software Engineer'),
(2, 2, N'Bob Stone', N'Male', '1995-10-22', N'456 Oak Ave, Da Nang', N'Married', N'Guitar, Hiking', N'Rock Music, Spicy Food', N'Lateness', N'Mexican, Japanese', N'Football, Cycling', N'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2310b981"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">BS</text></svg>', N'Master of Business Administration', N'Da Nang Gifted School', N'University of Economics', N'Employed', N'FinTech Group', N'Product Manager'),
(3, 3, N'Charlie Davis', N'Male', '2002-01-30', N'789 Pine Rd, HCMC', N'Single', N'Gaming, Cooking', N'Video Games, Dessert', N'Mondays', N'Vietnamese, Korean', N'E-Sports, Basketball', N'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f59e0b"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">CD</text></svg>', N'Undergraduate', N'Saigon High School', N'RMIT University', N'Student', N'RMIT', N'IT Student'),
(4, 4, N'David Miller', N'Male', '1993-07-12', N'12 Le Loi, Hue', N'Single', N'Traveling, Chess', N'Jazz, Tea', N'Noise', N'Vietnamese', N'Tennis', N'', N'Bachelor of Arts', N'Hue High School', N'Hue University', N'Employed', N'Creative Media', N'Content Lead'),
(5, 5, N'Emma Watson', N'Female', '1996-09-08', N'88 Tran Phu, Nha Trang', N'Single', N'Yoga, Painting', N'Sunsets, Nature', N'Pollution', N'European, Vegetarian', N'Yoga, Pilates', N'', N'Master of Marketing', N'Nha Trang Gifted School', N'Foreign Trade University', N'Employed', N'Global Brands', N'Marketing Manager'),
(6, 6, N'Nguyễn Thị Lan', N'Female', '1999-11-20', N'56 Hai Ba Trung, Hanoi', N'Single', N'Shopping, Travel', N'Milk Tea, Movies', N'Lies', N'Vietnamese, Thai', N'Aerobics', N'', N'Bachelor of Finance', N'Chu Van An High School', N'National Economics University', N'Employed', N'Vietcombank', N'Financial Analyst'),
(7, 7, N'Johnathan Smith', N'Male', '1990-03-14', N'77 Nguyen Thi Minh Khai, HCMC', N'Married', N'Running, Reading', N'Craft Beer, BBQ', N'Cold Weather', N'Western, Vietnamese', N'Marathon', N'', N'Master of Computer Science', N'Melbourne High', N'University of Melbourne', N'Employed', N'Software Vietnam', N'Technical Lead'),
(8, 8, N'Khuất Huy Thuận', N'Male', '2000-04-18', N'Khuất Duy Tiến, Thanh Xuân, Hà Nội', N'Single', N'Coding, Tech Gadgets', N'Clean Code, Open Source', N'Bugs', N'Vietnamese, BBQ', N'Badminton, Gym', N'', N'Bachelor of Information Technology', N'Hanoi High School', N'Aptech Computer Education', N'Employed', N'FPT Software', N'Fullstack Developer'),
(9, 999, N'🤖 Trợ lý AI (Chatbot)', N'Robot', '2026-01-01', N'Cloud Network', N'Single', N'Answering questions, helping users', N'Tokens, Prompts', N'Toxic inputs', N'Data', N'Mental gym', N'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ec4899"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">AI</text></svg>', N'PhD in Artificial Intelligence', N'Internet', N'Supercomputer', N'Self-Employed', N'Groq Inc', N'Virtual Assistant');
SET IDENTITY_INSERT [dbo].[Profiles] OFF;
GO

-- 4. Insert User Quotas
SET IDENTITY_INSERT [dbo].[User_Quotas] ON;
INSERT INTO [dbo].[User_Quotas] ([quota_id], [user_id], [free_messages_left], [updated_at]) VALUES
(1, 1, 5, '2026-08-14 07:00:00'),
(2, 2, 5, '2026-08-14 07:00:00'),
(3, 3, 5, '2026-08-14 07:00:00'),
(4, 4, 5, '2026-08-14 07:00:00'),
(5, 5, 5, '2026-08-14 07:00:00'),
(6, 6, 5, '2026-08-20 08:00:00'),
(7, 7, 5, '2026-08-20 09:00:00'),
(8, 8, 5, '2026-08-22 10:00:00'),
(9, 999, 999999, '2026-08-14 07:00:00');
SET IDENTITY_INSERT [dbo].[User_Quotas] OFF;
GO

-- 5. Insert Contacts
SET IDENTITY_INSERT [dbo].[Contacts] ON;
INSERT INTO [dbo].[Contacts] ([contact_id], [user_id], [first_name], [last_name], [contact_number]) VALUES
(1, 1, N'Bob', N'Stone', N'0912345678'),
(2, 1, N'Charlie', N'Davis', N'0901234567'),
(3, 1, N'David', N'Miller', N'0944444444'),
(4, 1, N'🤖 Trợ lý', N'AI (Chatbot)', N'9999999999'),
(5, 2, N'Alice', N'Vance', N'0987654321'),
(6, 2, N'Emma', N'Watson', N'0955555555'),
(7, 2, N'🤖 Trợ lý', N'AI (Chatbot)', N'9999999999'),
(8, 3, N'🤖 Trợ lý', N'AI (Chatbot)', N'9999999999'),
(9, 8, N'Alice', N'Vance', N'0987654321'),
(10, 8, N'Bob', N'Stone', N'0912345678'),
(11, 8, N'Lan', N'Nguyễn', N'0888888888');
SET IDENTITY_INSERT [dbo].[Contacts] OFF;
GO

-- 6. Insert Friendships
SET IDENTITY_INSERT [dbo].[Friendships] ON;
INSERT INTO [dbo].[Friendships] ([friendship_id], [requester_id], [addressee_id], [status], [created_at]) VALUES
(1, 1, 2, N'accepted', '2026-08-14 07:00:00'),
(2, 3, 2, N'pending', '2026-08-14 07:00:00'),
(3, 1, 3, N'pending', '2026-08-14 07:00:00'),
(4, 1, 999, N'accepted', '2026-08-14 07:00:00'),
(5, 2, 999, N'accepted', '2026-08-14 07:00:00'),
(6, 3, 999, N'accepted', '2026-08-14 07:00:00'),
(7, 8, 1, N'accepted', '2026-08-22 10:10:00'),
(8, 8, 2, N'accepted', '2026-08-22 10:15:00'),
(9, 8, 999, N'accepted', '2026-08-22 10:20:00');
SET IDENTITY_INSERT [dbo].[Friendships] OFF;
GO

-- 7. Insert Services
SET IDENTITY_INSERT [dbo].[Services] ON;
INSERT INTO [dbo].[Services] ([service_id], [service_name], [description], [price], [is_active]) VALUES
(1, N'Joke', N'Receive funny jokes daily straight to your mobile.', 2.99, 1),
(2, N'Current Affairs', N'Get the latest local and global affairs daily.', 4.99, 1),
(3, N'Sports', N'Follow sports scores, fixtures and live schedules.', 3.99, 1),
(4, N'News', N'Daily top breaking news headlines and analysis.', 4.99, 1);
SET IDENTITY_INSERT [dbo].[Services] OFF;
GO

-- 8. Insert User_Services
SET IDENTITY_INSERT [dbo].[User_Services] ON;
INSERT INTO [dbo].[User_Services] ([subscription_id], [user_id], [service_id], [payment_status], [activated_at]) VALUES
(1, 1, 1, N'paid', '2026-08-14 07:00:00'),
(2, 1, 4, N'paid', '2026-08-14 07:00:00'),
(3, 2, 3, N'paid', '2026-08-14 07:00:00'),
(4, 8, 4, N'paid', '2026-08-22 11:00:00');
SET IDENTITY_INSERT [dbo].[User_Services] OFF;
GO

-- 9. Insert Transactions
SET IDENTITY_INSERT [dbo].[Transactions] ON;
INSERT INTO [dbo].[Transactions] ([transaction_id], [user_id], [subscription_id], [amount], [card_last4], [transaction_status], [created_at]) VALUES
(1, 1, 1, 2.99, N'1111', N'success', '2026-08-14 07:00:00'),
(2, 1, 2, 4.99, N'2222', N'success', '2026-08-14 07:00:00'),
(3, 2, 3, 3.99, N'3333', N'success', '2026-08-14 07:00:00'),
(4, 8, 4, 4.99, N'8888', N'success', '2026-08-22 11:00:00');
SET IDENTITY_INSERT [dbo].[Transactions] OFF;
GO

-- 10. Insert Messages
SET IDENTITY_INSERT [dbo].[Messages] ON;
INSERT INTO [dbo].[Messages] ([message_id], [sender_id], [receiver_id], [receiver_number], [content], [is_free_friend_msg], [scheduled_at], [sent_at]) VALUES
(1, 1, 2, N'0912345678', N'Hi Bob! How are you doing today?', 1, NULL, '2026-08-14 12:00:00'),
(2, 2, 1, N'0987654321', N'Hey Alice! I am doing great, working on our new app dashboard. You?', 1, NULL, '2026-08-14 12:02:00'),
(3, 1, 2, N'0912345678', N'That sounds awesome. I am designing the frontend for the online SMS system.', 1, NULL, '2026-08-14 12:05:00'),
(4, 1, NULL, N'0944444444', N'Hello David, this is Alice. Just checking if you received my email.', 0, NULL, '2026-08-14 11:00:00'),
(5, 1, NULL, N'0944444444', N'Let me know when you are free for a quick call.', 0, NULL, '2026-08-14 12:20:00'),
(6, 8, 1, N'0987654321', N'Chào Alice! Hệ thống SMS Online hoạt động rất mượt mà.', 1, NULL, '2026-08-22 14:00:00'),
(7, 1, 8, N'0777777777', N'Chào Thuận! Cảm ơn bạn, mình đang hoàn thiện thêm tính năng templates.', 1, NULL, '2026-08-22 14:05:00'),
(8, 8, 999, N'9999999999', N'Xin chào AI, hãy tóm tắt các tính năng chính của dự án SMS Chat?', 1, NULL, '2026-08-22 14:10:00'),
(9, 999, 8, N'0777777777', N'Dự án gồm: Gửi SMS bạn bè miễn phí, SMS người lạ giới hạn quota, Kết bạn, Đăng ký gói tin tức/thể thao và Trợ lý AI.', 1, NULL, '2026-08-22 14:10:02');
SET IDENTITY_INSERT [dbo].[Messages] OFF;
GO

-- 11. Insert SMS Logs
SET IDENTITY_INSERT [dbo].[SMS_Logs] ON;
INSERT INTO [dbo].[SMS_Logs] ([log_id], [message_id], [gateway_status_code], [delivery_status], [updated_at]) VALUES
(1, 1, N'200_OK', N'delivered', '2026-08-14 12:00:00'),
(2, 2, N'200_OK', N'delivered', '2026-08-14 12:02:00'),
(3, 3, N'200_OK', N'delivered', '2026-08-14 12:05:00'),
(4, 4, N'200_OK', N'delivered', '2026-08-14 11:00:00'),
(5, 5, N'200_OK', N'delivered', '2026-08-14 12:20:00'),
(6, 6, N'200_OK', N'delivered', '2026-08-22 14:00:00'),
(7, 7, N'200_OK', N'delivered', '2026-08-22 14:05:00'),
(8, 8, N'200_OK', N'delivered', '2026-08-22 14:10:00'),
(9, 9, N'200_OK', N'delivered', '2026-08-22 14:10:02');
SET IDENTITY_INSERT [dbo].[SMS_Logs] OFF;
GO

-- 12. Insert Contact Groups
SET IDENTITY_INSERT [dbo].[Contact_Groups] ON;
INSERT INTO [dbo].[Contact_Groups] ([group_id], [user_id], [name]) VALUES
(1, 1, N'Đồng nghiệp (Work)'),
(2, 1, N'Bạn thân (Friends)'),
(3, 8, N'Dự án Aptech');
SET IDENTITY_INSERT [dbo].[Contact_Groups] OFF;
GO

-- 13. Insert Contact Group Members
SET IDENTITY_INSERT [dbo].[Contact_Group_Members] ON;
INSERT INTO [dbo].[Contact_Group_Members] ([member_id], [group_id], [contact_id]) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 3),
(4, 3, 9),
(5, 3, 10);
SET IDENTITY_INSERT [dbo].[Contact_Group_Members] OFF;
GO

-- 14. Insert SMS Templates
SET IDENTITY_INSERT [dbo].[SMS_Templates] ON;
INSERT INTO [dbo].[SMS_Templates] ([template_id], [user_id], [title], [body]) VALUES
(1, NULL, N'Chúc mừng Sinh nhật', N'Chúc mừng sinh nhật {Name}! Chúc bạn tuổi mới ngập tràn niềm vui, sức khỏe và luôn thành công trong cuộc sống.'),
(2, NULL, N'Nhắc lịch hẹn', N'Xin chào {Name}, đây là tin nhắn nhắc bạn về lịch hẹn của chúng ta vào lúc 15h chiều nay. Hẹn gặp lại bạn nhé!'),
(3, NULL, N'Nhắc thanh toán', N'Kính chào quý khách {Name}, vui lòng hoàn thành thanh toán hóa đơn cước dịch vụ tháng này trước ngày 20. Trân trọng cảm ơn!'),
(4, NULL, N'Tin nhắn công việc nhanh', N'Hi {Name}, mình đã nhận được tài liệu bạn gửi. Mình sẽ phản hồi lại cho bạn sớm nhất có thể. Cảm ơn nhé!'),
(5, 8, N'Họp nhóm đồ án', N'Chào {Name}, nhớ tham gia buổi họp đồ án eProject lúc 20h tối nay trên Google Meet nhé!');
SET IDENTITY_INSERT [dbo].[SMS_Templates] OFF;
GO

-- 15. Insert Blocklist
SET IDENTITY_INSERT [dbo].[Blocklist] ON;
INSERT INTO [dbo].[Blocklist] ([block_id], [user_id], [blocked_number]) VALUES
(1, 1, N'0901234567'),
(2, 8, N'0912345678');
SET IDENTITY_INSERT [dbo].[Blocklist] OFF;
GO

PRINT 'Database setup and mock data insertion completed successfully!';
GO
