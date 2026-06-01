-- Zentrix Chat Database Schema
-- Run this to manually create tables, or use Sequelize auto-sync

CREATE DATABASE IF NOT EXISTS zentrix_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zentrix_chat;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  status ENUM('online', 'away', 'offline') DEFAULT 'offline',
  last_seen DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('direct', 'group') NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Participants table (junction between users and conversations)
CREATE TABLE IF NOT EXISTS participants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (conversation_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  type ENUM('text', 'image', 'file') DEFAULT 'text',
  file_url VARCHAR(500) DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_size INT DEFAULT NULL,
  edited TINYINT(1) DEFAULT 0,
  edited_at DATETIME DEFAULT NULL,
  deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME DEFAULT NULL,
  read_by TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  message_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  emoji VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reaction (message_id, user_id, emoji)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_participants_conversation ON participants(conversation_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_reactions_message ON reactions(message_id);
