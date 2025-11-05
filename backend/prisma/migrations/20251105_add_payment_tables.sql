-- Migration: Add Payment Integration Tables
-- Created: 2025-11-05
-- Description: Add tables for webhook events and payment tracking

-- جدول لتسجيل جميع Webhook Events
CREATE TABLE `webhook_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `provider` VARCHAR(50) NOT NULL COMMENT 'stripe, paypal, ziina',
  `event_type` VARCHAR(100) NOT NULL COMMENT 'payment_intent.succeeded, etc',
  `event_id` VARCHAR(255) NOT NULL COMMENT 'معرف فريد من المنصة',
  `payload` JSON NOT NULL COMMENT 'البيانات الكاملة',
  `status` ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `webhook_events_event_id_unique` (`event_id`),
  KEY `idx_provider` (`provider`),
  KEY `idx_status` (`status`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول لربط الدفعات بالتراخيص
CREATE TABLE `payment_licenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `payment_id` VARCHAR(255) NOT NULL COMMENT 'معرف الدفع من المنصة',
  `user_id` INT NOT NULL,
  `license_id` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL,
  `provider` VARCHAR(50) NOT NULL COMMENT 'stripe, paypal, ziina',
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_licenses_payment_id_unique` (`payment_id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_license_id` (`license_id`),
  KEY `idx_provider` (`provider`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `payment_licenses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payment_licenses_license_id_fkey` FOREIGN KEY (`license_id`) REFERENCES `License` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
