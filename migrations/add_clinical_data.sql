-- Migration: Add clinical data fields to appointments table
-- This adds diagnosis, prescription, and follow-up functionality to Patient History

USE mychamber_db;

-- Add clinical data columns to appointments table (only if they don't exist)
-- MySQL 8.0 doesn't support ADD COLUMN IF NOT EXISTS, so we need to check first

-- Add diagnosis_notes column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mychamber_db' 
  AND TABLE_NAME = 'appointments' 
  AND COLUMN_NAME = 'diagnosis_notes';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE appointments ADD COLUMN diagnosis_notes TEXT', 
    'SELECT "Column diagnosis_notes already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add prescription_notes column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mychamber_db' 
  AND TABLE_NAME = 'appointments' 
  AND COLUMN_NAME = 'prescription_notes';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE appointments ADD COLUMN prescription_notes TEXT', 
    'SELECT "Column prescription_notes already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add followup_notes column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mychamber_db' 
  AND TABLE_NAME = 'appointments' 
  AND COLUMN_NAME = 'followup_notes';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE appointments ADD COLUMN followup_notes TEXT', 
    'SELECT "Column followup_notes already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add followup_date column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mychamber_db' 
  AND TABLE_NAME = 'appointments' 
  AND COLUMN_NAME = 'followup_date';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE appointments ADD COLUMN followup_date DATE', 
    'SELECT "Column followup_date already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create table for uploaded report files
CREATE TABLE IF NOT EXISTS appointment_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    INDEX idx_appointment_reports (appointment_id)
);
