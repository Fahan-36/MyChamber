-- Migration: Add date range fields to doctor_schedule
-- Allows weekly schedules to be active only within a selected date range.

USE mychamber_db;

-- Add start_date column if missing
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mychamber_db'
  AND TABLE_NAME = 'doctor_schedule'
  AND COLUMN_NAME = 'start_date';

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE doctor_schedule ADD COLUMN start_date DATE NULL',
  'SELECT "Column start_date already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add end_date column if missing
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mychamber_db'
  AND TABLE_NAME = 'doctor_schedule'
  AND COLUMN_NAME = 'end_date';

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE doctor_schedule ADD COLUMN end_date DATE NULL',
  'SELECT "Column end_date already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill missing dates for existing rows
UPDATE doctor_schedule
SET start_date = COALESCE(start_date, CURDATE()),
    end_date = COALESCE(end_date, DATE_ADD(CURDATE(), INTERVAL 1 YEAR));

-- Enforce NOT NULL after backfill
ALTER TABLE doctor_schedule
  MODIFY COLUMN start_date DATE NOT NULL,
  MODIFY COLUMN end_date DATE NOT NULL;
