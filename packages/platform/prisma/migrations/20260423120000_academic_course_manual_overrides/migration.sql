-- Per-course manual planner overrides (completion + semester display)
ALTER TABLE `academic_courses`
  ADD COLUMN `manual_completion_rate` INT NULL,
  ADD COLUMN `manual_semester_progress` INT NULL;
