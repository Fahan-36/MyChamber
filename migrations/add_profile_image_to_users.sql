-- Add profile_image field to users for doctor/patient avatar uploads
ALTER TABLE users
ADD COLUMN profile_image VARCHAR(255) NULL AFTER phone;
