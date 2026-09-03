-- =========================================================================
-- DATABASE SCHEMA CHO HỆ THỐNG ONLINE SMS
-- Hệ quản trị cơ sở dữ liệu: MySQL / MariaDB
-- =========================================================================

-- 1. BẢNG USERS (Lưu thông tin đăng nhập và tài khoản cốt lõi)
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG PROFILES (Lưu hồ sơ cá nhân và nghề nghiệp của User)
CREATE TABLE Profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(100),
    gender VARCHAR(10),
    dob DATE,
    address VARCHAR(255),
    marital_status VARCHAR(20),
    hobbies TEXT,
    likes TEXT,
    dislikes TEXT,
    cuisines TEXT,
    sports TEXT,
    profile_photo VARCHAR(255),
    qualification VARCHAR(100),
    school VARCHAR(100),
    college VARCHAR(100),
    work_status VARCHAR(50),
    organization VARCHAR(100),
    designation VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3. BẢNG CONTACTS (Lưu danh bạ liên hệ do User tự thêm)
CREATE TABLE Contacts (
    contact_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    contact_number VARCHAR(10) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 4. BẢNG FRIENDSHIPS (Quản lý trạng thái kết bạn và lời mời)
CREATE TABLE Friendships (
    friendship_id INT PRIMARY KEY AUTO_INCREMENT,
    requester_id INT NOT NULL,
    addressee_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (requester_id, addressee_id) -- Ngăn gửi 2 lời mời giống nhau
);

-- 5. BẢNG MESSAGES (Lưu trữ lịch sử tin nhắn đã gửi đi)
CREATE TABLE Messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_number VARCHAR(10) NOT NULL,
    content VARCHAR(120) NOT NULL,
    is_free_friend_msg BOOLEAN DEFAULT FALSE,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 6. BẢNG SERVICES (Lưu danh sách các dịch vụ SMS giá trị gia tăng)
CREATE TABLE Services (
    service_id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL
);

-- Dữ liệu khởi tạo cho các Dịch vụ theo yêu cầu dự án
INSERT INTO Services (service_name, description, price) VALUES
('Joke', 'Dịch vụ nhận tin nhắn truyện cười hàng ngày', 10.00),
('Current Affairs', 'Cập nhật tình hình thời sự hiện tại', 15.00),
('Sports', 'Tin tức và kết quả thể thao', 12.00),
('News', 'Tin tức tổng hợp hàng ngày', 10.00);

-- 7. BẢNG USER_SERVICES (Quản lý User đăng ký và thanh toán dịch vụ nào)
CREATE TABLE User_Services (
    subscription_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
    activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE CASCADE
);
