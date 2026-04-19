-- DropIndex
DROP INDEX `processing_results_course_code_idx` ON `processing_results`;

-- DropIndex
DROP INDEX `processing_results_user_id_idx` ON `processing_results`;

-- AlterTable
ALTER TABLE `processing_results` ADD COLUMN `advice_text` LONGTEXT NULL,
    ADD COLUMN `course_summary_json` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `academic_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `due_date` VARCHAR(191) NULL,
    `weight` DOUBLE NULL,
    `type` VARCHAR(191) NULL,
    `course_code` VARCHAR(191) NULL,
    `course_name` VARCHAR(191) NULL,
    `detail` TEXT NULL,
    `source_quote` TEXT NULL,
    `page_numbers_json` LONGTEXT NULL,
    `estimated_hours` DOUBLE NULL,
    `rationale` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
