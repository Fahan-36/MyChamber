-- Add file_category to separate report files from prescription files
ALTER TABLE appointment_reports
ADD COLUMN file_category ENUM('report', 'prescription') NOT NULL DEFAULT 'report' AFTER file_type;
