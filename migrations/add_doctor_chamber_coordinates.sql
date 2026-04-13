-- Add coordinate fields for doctor chamber map pinning.
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS chamber_latitude DECIMAL(10, 7) NULL AFTER chamber_address,
  ADD COLUMN IF NOT EXISTS chamber_longitude DECIMAL(10, 7) NULL AFTER chamber_latitude;
