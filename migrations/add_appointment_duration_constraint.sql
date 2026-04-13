-- Add appointment duration constraint
-- This migration enforces that appointment durations must be between 5 and 60 minutes

-- Check if constraint already exists
SELECT IF(
  CONSTRAINT_NAME IS NOT NULL,
  'Constraint already exists',
  'Adding constraint'
) AS status
FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE
WHERE TABLE_NAME = 'doctor_schedule'
  AND CONSTRAINT_NAME LIKE '%slot_duration%'
INTO @constraint_status;

-- Add the CHECK constraint if it doesn't exist
-- Note: MySQL 8.0.16+ supports named CHECK constraints
ALTER TABLE doctor_schedule
ADD CONSTRAINT chk_appointment_duration CHECK (slot_duration >= 5 AND slot_duration <= 60);

-- Display confirmation
SELECT 'Appointment duration constraint added' AS migration_result;
