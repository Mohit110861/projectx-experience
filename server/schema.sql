-- Eventora MySQL schema
-- The server runs this automatically on startup. You can also run it by hand:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS eventora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eventora;

CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    role         ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT NOT NULL,
    date             DATETIME NOT NULL,
    location         VARCHAR(255) NOT NULL,
    category         VARCHAR(100) NOT NULL,
    total_seats      INT NOT NULL,
    available_seats  INT NOT NULL,
    image            VARCHAR(1000) DEFAULT '',
    ticket_price     DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_by       INT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_events_category (category)
) ENGINE=InnoDB;

-- event_id is nullable so bookings survive when an event is deleted (shown as "Deleted Event")
CREATE TABLE IF NOT EXISTS bookings (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    event_id        INT NULL,
    status          ENUM('confirmed', 'cancelled', 'pending') NOT NULL DEFAULT 'pending',
    payment_status  ENUM('paid', 'not_paid') NOT NULL DEFAULT 'not_paid',
    amount          DECIMAL(10, 2) NOT NULL,
    booked_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    INDEX idx_bookings_user_event (user_id, event_id)
) ENGINE=InnoDB;

-- OTPs expire after 5 minutes (checked in queries)
CREATE TABLE IF NOT EXISTS otps (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp         VARCHAR(10) NOT NULL,
    action      ENUM('account_verification', 'event_booking') NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otps_email_action (email, action)
) ENGINE=InnoDB;

-- Gallery photos managed from the admin dashboard
CREATE TABLE IF NOT EXISTS gallery (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    image_url   VARCHAR(1000) NOT NULL,
    caption     VARCHAR(255) DEFAULT '',
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Reels: an uploaded video and/or an Instagram link
CREATE TABLE IF NOT EXISTS reels (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    video_url      VARCHAR(1000) DEFAULT NULL,
    cover_url      VARCHAR(1000) DEFAULT NULL,
    instagram_url  VARCHAR(1000) DEFAULT NULL,
    sort_order     INT NOT NULL DEFAULT 0,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Site settings (hero / header / announcement bar), stored as key-value pairs
CREATE TABLE IF NOT EXISTS settings (
    setting_key    VARCHAR(100) PRIMARY KEY,
    setting_value  TEXT
) ENGINE=InnoDB;
