-- Migration: Add bmdc_registration_number to doctors table
-- Run this if your database was created before this column was added to schema.sql
-- Note: ADD COLUMN IF NOT EXISTS requires MySQL 8.0.21+; for older versions check manually first.

ALTER TABLE doctors
  ADD COLUMN bmdc_registration_number VARCHAR(100) NOT NULL DEFAULT '' AFTER qualification;
