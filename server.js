const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const bcrypt = require('bcryptjs');
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const clinicalHistoryRoutes = require('./routes/clinicalHistoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/admin');
const Appointment = require('./models/Appointment');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded reports)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinical-history', clinicalHistoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MyChamber API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const configuredCleanupInterval = Number(process.env.AUTO_STATUS_CLEANUP_INTERVAL_MS);
const statusCleanupIntervalMs = Number.isFinite(configuredCleanupInterval) && configuredCleanupInterval > 0
  ? configuredCleanupInterval
  : DEFAULT_CLEANUP_INTERVAL_MS;

const ensureProfileImageColumn = async () => {
  try {
    const [columnRows] = await db.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'profile_image'
      LIMIT 1
      `
    );

    if (columnRows.length > 0) {
      return;
    }

    await db.query(
      'ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL AFTER phone'
    );
    console.log('Applied schema update: users.profile_image column added');
  } catch (error) {
    console.error('Failed to ensure users.profile_image column:', error.message);
  }
};

const ensureAppointmentReportFileCategoryColumn = async () => {
  try {
    const [columnRows] = await db.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'appointment_reports'
        AND COLUMN_NAME = 'file_category'
      LIMIT 1
      `
    );

    if (columnRows.length > 0) {
      return;
    }

    await db.query(
      "ALTER TABLE appointment_reports ADD COLUMN file_category ENUM('report', 'prescription') NOT NULL DEFAULT 'report' AFTER file_type"
    );
    console.log('Applied schema update: appointment_reports.file_category column added');
  } catch (error) {
    console.error('Failed to ensure appointment_reports.file_category column:', error.message);
  }
};

const ensureAppointmentIssueReportsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS appointment_issue_reports (
        issue_id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        description TEXT NULL,
        reported_by_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_air_appointment_id (appointment_id),
        INDEX idx_air_patient_id (patient_id),
        INDEX idx_air_doctor_id (doctor_id),
        INDEX idx_air_created_at (created_at),
        CONSTRAINT fk_air_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
        CONSTRAINT fk_air_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
        CONSTRAINT fk_air_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
        CONSTRAINT fk_air_reported_by_user FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (error) {
    console.error('Failed to ensure appointment_issue_reports table:', error.message);
  }
};

const ensureAppointmentCancellationTypeColumn = async () => {
  try {
    const [columns] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'appointments'
         AND COLUMN_NAME = 'cancellation_type'`
    );

    if (columns.length > 0) {
      return;
    }

    await db.query("ALTER TABLE appointments ADD COLUMN cancellation_type ENUM('manual', 'system') NULL AFTER status");
    console.log('Applied schema update: appointments.cancellation_type column added');
  } catch (error) {
    console.error('Failed to ensure appointment cancellation_type column:', error.message);
  }
};

const ensureAppointmentCancellationMetadataColumns = async () => {
  try {
    const [columns] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'appointments'
         AND COLUMN_NAME IN ('cancelled_by_role', 'cancelled_by_user_id', 'cancelled_at')`
    );

    const existingColumns = new Set(columns.map((row) => row.COLUMN_NAME));

    if (!existingColumns.has('cancelled_by_role')) {
      await db.query("ALTER TABLE appointments ADD COLUMN cancelled_by_role ENUM('doctor', 'patient', 'system') NULL AFTER cancellation_type");
      console.log('Applied schema update: appointments.cancelled_by_role column added');
    }

    if (!existingColumns.has('cancelled_by_user_id')) {
      await db.query('ALTER TABLE appointments ADD COLUMN cancelled_by_user_id INT NULL AFTER cancelled_by_role');
      console.log('Applied schema update: appointments.cancelled_by_user_id column added');
    }

    if (!existingColumns.has('cancelled_at')) {
      await db.query('ALTER TABLE appointments ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by_user_id');
      console.log('Applied schema update: appointments.cancelled_at column added');
    }
  } catch (error) {
    console.error('Failed to ensure appointment cancellation metadata columns:', error.message);
  }
};

const generateUniqueCodeForTable = async (tableName, columnName) => {
  const maxAttempts = 120;

  for (let i = 0; i < maxAttempts; i += 1) {
    const code = Math.floor(10000 + (Math.random() * 90000));
    const [rows] = await db.query(`SELECT COUNT(*) AS count FROM ${tableName} WHERE ${columnName} = ?`, [code]);

    if (Number(rows?.[0]?.count || 0) === 0) {
      return code;
    }
  }

  throw new Error(`Unable to generate a unique 5-digit code for ${tableName}.${columnName}`);
};

const ensureFiveDigitIdentityColumns = async () => {
  try {
    const [doctorCodeColumn] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'doctors'
         AND COLUMN_NAME = 'doctor_code'
       LIMIT 1`
    );

    if (!doctorCodeColumn.length) {
      await db.query('ALTER TABLE doctors ADD COLUMN doctor_code INT NULL AFTER doctor_id');
      console.log('Applied schema update: doctors.doctor_code column added');
    }

    const [patientCodeColumn] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'patients'
         AND COLUMN_NAME = 'patient_code'
       LIMIT 1`
    );

    if (!patientCodeColumn.length) {
      await db.query('ALTER TABLE patients ADD COLUMN patient_code INT NULL AFTER patient_id');
      console.log('Applied schema update: patients.patient_code column added');
    }

    const [missingDoctorCodes] = await db.query(
      `SELECT doctor_id FROM doctors
       WHERE doctor_code IS NULL
          OR doctor_code < 10000
          OR doctor_code > 99999`
    );

    for (const row of missingDoctorCodes) {
      const code = await generateUniqueCodeForTable('doctors', 'doctor_code');
      await db.query('UPDATE doctors SET doctor_code = ? WHERE doctor_id = ?', [code, row.doctor_id]);
    }

    const [missingPatientCodes] = await db.query(
      `SELECT patient_id FROM patients
       WHERE patient_code IS NULL
          OR patient_code < 10000
          OR patient_code > 99999`
    );

    for (const row of missingPatientCodes) {
      const code = await generateUniqueCodeForTable('patients', 'patient_code');
      await db.query('UPDATE patients SET patient_code = ? WHERE patient_id = ?', [code, row.patient_id]);
    }

    const [doctorCodeIndex] = await db.query(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'doctors'
         AND INDEX_NAME = 'ux_doctors_doctor_code'
       LIMIT 1`
    );

    if (!doctorCodeIndex.length) {
      await db.query('ALTER TABLE doctors ADD UNIQUE KEY ux_doctors_doctor_code (doctor_code)');
    }

    const [patientCodeIndex] = await db.query(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'patients'
         AND INDEX_NAME = 'ux_patients_patient_code'
       LIMIT 1`
    );

    if (!patientCodeIndex.length) {
      await db.query('ALTER TABLE patients ADD UNIQUE KEY ux_patients_patient_code (patient_code)');
    }
  } catch (error) {
    console.error('Failed to ensure 5-digit identity codes:', error.message);
  }
};

const ensureDefaultAdminUser = async () => {
  const adminEmail = 'admin@mychamber.com';
  const adminPassword = 'admin123';

  try {
    const [existingAdmins] = await db.query(
      `SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (existingAdmins.length > 0) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await db.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES (?, ?, ?, ?, ?)`,
      ['System Admin', adminEmail, passwordHash, 'admin', null]
    );

    console.log(`Default admin created: ${adminEmail}`);
  } catch (error) {
    console.error('Failed to ensure default admin user:', error.message);
  }
};

const runAppointmentStatusCleanup = async () => {
  try {
    const cancelledCount = await Appointment.autoCancelElapsedPending();
    const completedCount = await Appointment.autoCompleteElapsedConfirmed();

    if (cancelledCount > 0 || completedCount > 0) {
      console.log(
        `Appointment status cleanup updated ${cancelledCount} pending->cancelled and ${completedCount} confirmed->completed rows`
      );
    }
  } catch (error) {
    console.error('Appointment status cleanup failed:', error.message);
  }
};

const startServer = async () => {
  await ensureProfileImageColumn();
  await ensureAppointmentReportFileCategoryColumn();
  await ensureAppointmentIssueReportsTable();
  await ensureAppointmentCancellationTypeColumn();
  await ensureAppointmentCancellationMetadataColumns();
  await ensureFiveDigitIdentityColumns();
  await ensureDefaultAdminUser();

  runAppointmentStatusCleanup();
  setInterval(runAppointmentStatusCleanup, statusCleanupIntervalMs);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();
