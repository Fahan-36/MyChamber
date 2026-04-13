-- Add admin role support and doctor approval status

ALTER TABLE users
  MODIFY COLUMN role ENUM('doctor', 'patient', 'admin') NOT NULL;

ALTER TABLE doctors
  ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER chamber_address;
