-- CreateEnum for WebhookStatus
-- CreateEnum for PaymentProvider

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` ENUM('stripe', 'paypal', 'ziina') NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `event_id` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    UNIQUE INDEX `webhook_events_event_id_key`(`event_id`),
    INDEX `webhook_events_provider_idx`(`provider`),
    INDEX `webhook_events_status_idx`(`status`),
    INDEX `webhook_events_event_type_idx`(`event_type`),
    INDEX `webhook_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_licenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_id` VARCHAR(255) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `license_id` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `provider` ENUM('stripe', 'paypal', 'ziina') NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payment_licenses_payment_id_key`(`payment_id`),
    INDEX `payment_licenses_payment_id_idx`(`payment_id`),
    INDEX `payment_licenses_user_id_idx`(`user_id`),
    INDEX `payment_licenses_license_id_idx`(`license_id`),
    INDEX `payment_licenses_provider_idx`(`provider`),
    INDEX `payment_licenses_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_licenses` ADD CONSTRAINT `payment_licenses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_licenses` ADD CONSTRAINT `payment_licenses_license_id_fkey` FOREIGN KEY (`license_id`) REFERENCES `License`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
