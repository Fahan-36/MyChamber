-- Track cancellation source so slot blocking can distinguish manual vs system cancellation.
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS cancellation_type ENUM('manual', 'system') NULL AFTER status;

-- Backfill existing cancelled rows. Past cancelled rows are treated as system-cancelled
-- to preserve permanent blocking behavior for elapsed appointments.
UPDATE appointments
SET cancellation_type = 'system'
WHERE LOWER(COALESCE(status, '')) = 'cancelled'
  AND TIMESTAMP(appointment_date, time_slot) < NOW()
  AND cancellation_type IS NULL;

-- Remaining cancelled rows are treated as manual cancellations.
UPDATE appointments
SET cancellation_type = 'manual'
WHERE LOWER(COALESCE(status, '')) = 'cancelled'
  AND cancellation_type IS NULL;

-- Drop legacy unique slot index so manual cancellations can release slots.
SET @has_unique := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'appointments'
    AND index_name = 'unique_appointment'
);
SET @drop_unique_sql := IF(@has_unique > 0, 'ALTER TABLE appointments DROP INDEX unique_appointment', 'SELECT 1');
PREPARE drop_stmt FROM @drop_unique_sql;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

-- Add lookup index used by slot conflict checks.
SET @has_lookup := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'appointments'
    AND index_name = 'idx_appointments_slot_lookup'
);
SET @create_lookup_sql := IF(
  @has_lookup = 0,
  'CREATE INDEX idx_appointments_slot_lookup ON appointments (doctor_id, appointment_date, time_slot, status, cancellation_type)',
  'SELECT 1'
);
PREPARE create_stmt FROM @create_lookup_sql;
EXECUTE create_stmt;
DEALLOCATE PREPARE create_stmt;
