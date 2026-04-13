-- Store who cancelled an appointment and when it happened.
SET @has_cancellation_type := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'appointments'
    AND column_name = 'cancellation_type'
);
SET @add_cancellation_type_sql := IF(
  @has_cancellation_type = 0,
  'ALTER TABLE appointments ADD COLUMN cancellation_type ENUM(\'manual\', \'system\') NULL AFTER status',
  'SELECT 1'
);
PREPARE add_cancellation_type_stmt FROM @add_cancellation_type_sql;
EXECUTE add_cancellation_type_stmt;
DEALLOCATE PREPARE add_cancellation_type_stmt;

SET @has_cancelled_by_role := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'appointments'
    AND column_name = 'cancelled_by_role'
);
SET @add_cancelled_by_role_sql := IF(
  @has_cancelled_by_role = 0,
  'ALTER TABLE appointments ADD COLUMN cancelled_by_role ENUM(\'doctor\', \'patient\', \'system\') NULL AFTER cancellation_type',
  'SELECT 1'
);
PREPARE add_cancelled_by_role_stmt FROM @add_cancelled_by_role_sql;
EXECUTE add_cancelled_by_role_stmt;
DEALLOCATE PREPARE add_cancelled_by_role_stmt;

SET @has_cancelled_by_user_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'appointments'
    AND column_name = 'cancelled_by_user_id'
);
SET @add_cancelled_by_user_id_sql := IF(
  @has_cancelled_by_user_id = 0,
  'ALTER TABLE appointments ADD COLUMN cancelled_by_user_id INT NULL AFTER cancelled_by_role',
  'SELECT 1'
);
PREPARE add_cancelled_by_user_id_stmt FROM @add_cancelled_by_user_id_sql;
EXECUTE add_cancelled_by_user_id_stmt;
DEALLOCATE PREPARE add_cancelled_by_user_id_stmt;

SET @has_cancelled_at := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'appointments'
    AND column_name = 'cancelled_at'
);
SET @add_cancelled_at_sql := IF(
  @has_cancelled_at = 0,
  'ALTER TABLE appointments ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by_user_id',
  'SELECT 1'
);
PREPARE add_cancelled_at_stmt FROM @add_cancelled_at_sql;
EXECUTE add_cancelled_at_stmt;
DEALLOCATE PREPARE add_cancelled_at_stmt;

SET @has_cancelled_by_user_id_idx := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'appointments'
    AND index_name = 'idx_appointments_cancelled_by_user_id'
);
SET @create_cancelled_by_user_id_idx_sql := IF(
  @has_cancelled_by_user_id_idx = 0,
  'CREATE INDEX idx_appointments_cancelled_by_user_id ON appointments(cancelled_by_user_id)',
  'SELECT 1'
);
PREPARE create_cancelled_by_user_id_idx_stmt FROM @create_cancelled_by_user_id_idx_sql;
EXECUTE create_cancelled_by_user_id_idx_stmt;
DEALLOCATE PREPARE create_cancelled_by_user_id_idx_stmt;
