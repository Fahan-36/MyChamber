-- MyChamber Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS mychamber_db;
USE mychamber_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('doctor', 'patient', 'admin') NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    bmdc_registration_number VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    chamber_address TEXT NOT NULL,
    chamber_latitude DECIMAL(10, 7) NULL,
    chamber_longitude DECIMAL(10, 7) NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT,
    gender ENUM('male', 'female', 'other'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Doctor Schedule table
CREATE TABLE IF NOT EXISTS doctor_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT NOT NULL COMMENT 'Duration in minutes',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    CHECK (slot_duration >= 5 AND slot_duration <= 60)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    cancellation_type ENUM('manual', 'system') NULL,
    cancelled_by_role ENUM('doctor', 'patient', 'system') NULL,
    cancelled_by_user_id INT NULL,
    cancelled_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_schedule_doctor ON doctor_schedule(doctor_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_slot_lookup ON appointments(doctor_id, appointment_date, time_slot, status, cancellation_type);
CREATE INDEX idx_appointments_cancelled_by_user_id ON appointments(cancelled_by_user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Insert sample data for testing

-- Sample users (password: password123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Dr. John Smith', 'john.smith@hospital.com', '$2a$10$YourHashedPasswordHere', 'doctor', '+1234567890'),
('Dr. Sarah Johnson', 'sarah.johnson@clinic.com', '$2a$10$YourHashedPasswordHere', 'doctor', '+1234567891'),
('Michael Brown', 'michael.brown@email.com', '$2a$10$YourHashedPasswordHere', 'patient', '+1234567892'),
('Emily Davis', 'emily.davis@email.com', '$2a$10$YourHashedPasswordHere', 'patient', '+1234567893');

-- Sample doctors
INSERT INTO doctors (user_id, specialization, qualification, consultation_fee, chamber_address) VALUES
(1, 'Cardiology', 'MBBS, MD (Cardiology)', 1500.00, '123 Medical Center, New York, NY 10001'),
(2, 'Dermatology', 'MBBS, MD (Dermatology)', 1000.00, '456 Health Plaza, Los Angeles, CA 90001');

-- Sample patients
INSERT INTO patients (user_id, age, gender) VALUES
(3, 35, 'male'),
(4, 28, 'female');

-- Sample doctor schedules
INSERT INTO doctor_schedule (doctor_id, day_of_week, start_time, end_time, slot_duration, start_date, end_date) VALUES
(1, 'Monday', '09:00:00', '13:00:00', 30, '2026-01-01', '2026-12-31'),
(1, 'Wednesday', '14:00:00', '18:00:00', 30, '2026-01-01', '2026-12-31'),
(1, 'Friday', '09:00:00', '13:00:00', 30, '2026-01-01', '2026-12-31'),
(2, 'Tuesday', '10:00:00', '14:00:00', 30, '2026-01-01', '2026-12-31'),
(2, 'Thursday', '15:00:00', '19:00:00', 30, '2026-01-01', '2026-12-31'),
(2, 'Saturday', '09:00:00', '12:00:00', 30, '2026-01-01', '2026-12-31');

-- Sample appointments
INSERT INTO appointments (doctor_id, patient_id, appointment_date, time_slot, status) VALUES
(1, 1, '2026-03-10', '09:00:00', 'confirmed'),
(1, 2, '2026-03-10', '09:30:00', 'pending'),
(2, 1, '2026-03-11', '10:00:00', 'confirmed');
