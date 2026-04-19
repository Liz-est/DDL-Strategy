-- CreateTable
CREATE TABLE IF NOT EXISTS `academic_courses` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `course_code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `course_name` VARCHAR(191) NULL,
  `description` LONGTEXT NULL,
  `source_quote` LONGTEXT NULL,
  `raw_course_info_json` LONGTEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `academic_courses_user_id_course_code_key`(`user_id`, `course_code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable (full definition for shadow DB; IF NOT EXISTS for DBs that already have course_policies from init scripts)
CREATE TABLE IF NOT EXISTS `course_policies` (
  `id` VARCHAR(191) NOT NULL,
  `course_id` VARCHAR(191) NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `course_code` VARCHAR(191) NOT NULL,
  `late_policy` LONGTEXT NULL,
  `absence_policy` LONGTEXT NULL,
  `grading_notes` LONGTEXT NULL,
  `raw_policy_text` LONGTEXT NULL,
  `extension_rule` TEXT NULL,
  `integrity_rule` TEXT NULL,
  `collaboration_rule` TEXT NULL,
  `exam_aid_rule` TEXT NULL,
  `parsed_policy_json` LONGTEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `course_policies_user_id_course_code_key`(`user_id`, `course_code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Upgrade path: add missing columns on legacy course_policies (no IF NOT EXISTS in MySQL ALTER)
SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'course_id'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `course_policies` ADD COLUMN `course_id` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'raw_policy_text'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `course_policies` ADD COLUMN `raw_policy_text` LONGTEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'extension_rule'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `course_policies` ADD COLUMN `extension_rule` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'integrity_rule'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `course_policies` ADD COLUMN `integrity_rule` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'collaboration_rule'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `course_policies` ADD COLUMN `collaboration_rule` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'exam_aid_rule'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `course_policies` ADD COLUMN `exam_aid_rule` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'parsed_policy_json'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `course_policies` ADD COLUMN `parsed_policy_json` LONGTEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND COLUMN_NAME = 'updated_at'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `course_policies` ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure unique index exists (legacy DB may lack it)
SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND INDEX_NAME = 'course_policies_user_id_course_code_key'
);
SET @sql := IF(@idx = 0,
  'CREATE UNIQUE INDEX `course_policies_user_id_course_code_key` ON `course_policies`(`user_id`, `course_code`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- AlterTable academic_tasks
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'academic_tasks' AND COLUMN_NAME = 'start_at'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `academic_tasks` ADD COLUMN `start_at` DATETIME(3) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'academic_tasks' AND COLUMN_NAME = 'end_at'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `academic_tasks` ADD COLUMN `end_at` DATETIME(3) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'academic_tasks' AND COLUMN_NAME = 'is_all_day'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `academic_tasks` ADD COLUMN `is_all_day` BOOLEAN NULL DEFAULT true', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- CreateTable
CREATE TABLE IF NOT EXISTS `course_policy_rules` (
  `id` VARCHAR(191) NOT NULL,
  `policy_id` VARCHAR(191) NOT NULL,
  `rule_type` VARCHAR(191) NOT NULL,
  `threshold_value` DOUBLE NULL,
  `penalty_percent` DOUBLE NULL,
  `time_unit` VARCHAR(191) NULL,
  `raw_quote` LONGTEXT NULL,
  `rule_order` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `course_policy_rules_policy_id_idx`(`policy_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ingestion_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `course_code` VARCHAR(191) NULL,
  `course_id` VARCHAR(191) NULL,
  `processing_result_id` VARCHAR(191) NULL,
  `source_type` VARCHAR(191) NULL,
  `raw_json` LONGTEXT NOT NULL,
  `report_text` LONGTEXT NULL,
  `parsed_policy_json` LONGTEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ingestion_snapshots_user_id_idx`(`user_id`),
  INDEX `ingestion_snapshots_course_id_idx`(`course_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey (only if missing)
SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'course_policies' AND CONSTRAINT_NAME = 'course_policies_course_id_fkey'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `course_policies` ADD CONSTRAINT `course_policies_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `academic_courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'course_policy_rules' AND CONSTRAINT_NAME = 'course_policy_rules_policy_id_fkey'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `course_policy_rules` ADD CONSTRAINT `course_policy_rules_policy_id_fkey` FOREIGN KEY (`policy_id`) REFERENCES `course_policies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'ingestion_snapshots' AND CONSTRAINT_NAME = 'ingestion_snapshots_course_id_fkey'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `ingestion_snapshots` ADD CONSTRAINT `ingestion_snapshots_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `academic_courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'ingestion_snapshots' AND CONSTRAINT_NAME = 'ingestion_snapshots_processing_result_id_fkey'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `ingestion_snapshots` ADD CONSTRAINT `ingestion_snapshots_processing_result_id_fkey` FOREIGN KEY (`processing_result_id`) REFERENCES `processing_results`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
