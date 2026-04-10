-- CreateTable
CREATE TABLE `processing_results` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `course_code` VARCHAR(191),
    `raw_data` LONGTEXT NOT NULL,
    `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `source_type` VARCHAR(191),
    `description` TEXT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `processing_results_user_id_idx` ON `processing_results`(`user_id`);

-- CreateIndex
CREATE INDEX `processing_results_course_code_idx` ON `processing_results`(`course_code`);
