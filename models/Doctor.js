const db = require('../config/database');

const generateUniqueDoctorCode = async () => {
  const maxAttempts = 80;

  for (let i = 0; i < maxAttempts; i += 1) {
    const code = Math.floor(10000 + (Math.random() * 90000));
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM doctors WHERE doctor_code = ?', [code]);

    if (Number(rows?.[0]?.count || 0) === 0) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique 5-digit doctor code');
};

// Helper function to check if error is due to missing columns
const isMissingColumnError = (error) => {
  return error.code === 'ER_BAD_FIELD_ERROR' && (
    error.message.includes('chamber_latitude') ||
    error.message.includes('chamber_longitude') ||
    error.message.includes('bmdc_registration_number') ||
    error.message.includes('profile_image') ||
    error.message.includes('doctor_code')
  );
};

// Extended SELECT with new columns
const doctorSelectFields = {
  extended: `
    d.doctor_id,
    d.doctor_code,
    d.user_id,
    u.name,
    u.email,
    u.phone,
    u.profile_image,
    d.specialization,
    d.qualification,
    d.bmdc_registration_number AS bmdcRegistrationNumber,
    d.consultation_fee,
    d.chamber_address,
    d.chamber_latitude,
    d.chamber_longitude
  `,
  legacy: `
    d.doctor_id,
    d.doctor_code,
    d.user_id,
    u.name,
    u.email,
    u.phone,
    u.profile_image,
    d.specialization,
    d.qualification,
    d.bmdc_registration_number AS bmdcRegistrationNumber,
    d.consultation_fee,
    d.chamber_address,
    NULL AS chamber_latitude,
    NULL AS chamber_longitude
  `
};

const Doctor = {
  // Create doctor profile
  create: async (doctorData) => {
    const {
      user_id,
      specialization,
      qualification,
      bmdc_registration_number,
      consultation_fee,
      chamber_address,
      chamber_latitude = null,
      chamber_longitude = null
    } = doctorData;
    const doctor_code = await generateUniqueDoctorCode();
    try {
      const [result] = await db.query(
        'INSERT INTO doctors (doctor_code, user_id, specialization, qualification, bmdc_registration_number, consultation_fee, chamber_address, chamber_latitude, chamber_longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [doctor_code, user_id, specialization, qualification, bmdc_registration_number, consultation_fee, chamber_address, chamber_latitude, chamber_longitude]
      );
      return result.insertId;
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }

      try {
        // Legacy fallback when chamber_latitude/chamber_longitude columns are not present.
        const [result] = await db.query(
          'INSERT INTO doctors (doctor_code, user_id, specialization, qualification, bmdc_registration_number, consultation_fee, chamber_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [doctor_code, user_id, specialization, qualification, bmdc_registration_number, consultation_fee, chamber_address]
        );
        return result.insertId;
      } catch (legacyError) {
        if (!isMissingColumnError(legacyError)) {
          throw legacyError;
        }

        // Older schema fallback when bmdc_registration_number is also missing.
        const [result] = await db.query(
          'INSERT INTO doctors (doctor_code, user_id, specialization, qualification, consultation_fee, chamber_address) VALUES (?, ?, ?, ?, ?, ?)',
          [doctor_code, user_id, specialization, qualification, consultation_fee, chamber_address]
        );
        return result.insertId;
      }
    }
  },

  // Get all doctors with user details (with schema fallback)
  getAll: async () => {
    try {
      const [rows] = await db.query(`
        SELECT ${doctorSelectFields.extended}
        FROM doctors d
        INNER JOIN users u ON d.user_id = u.id
        ORDER BY u.name
      `);
      return rows;
    } catch (error) {
      if (isMissingColumnError(error)) {
        // Fallback for legacy schema without chamber_latitude/longitude
        const [rows] = await db.query(`
          SELECT ${doctorSelectFields.legacy}
          FROM doctors d
          INNER JOIN users u ON d.user_id = u.id
          ORDER BY u.name
        `);
        return rows;
      }
      throw error;
    }
  },

  // Search doctors by specialization (with schema fallback)
  searchBySpecialization: async (specialization) => {
    try {
      const [rows] = await db.query(`
        SELECT ${doctorSelectFields.extended}
        FROM doctors d
        INNER JOIN users u ON d.user_id = u.id
        WHERE d.specialization LIKE ?
        ORDER BY u.name
      `, [`%${specialization}%`]);
      return rows;
    } catch (error) {
      if (isMissingColumnError(error)) {
        // Fallback for legacy schema
        const [rows] = await db.query(`
          SELECT ${doctorSelectFields.legacy}
          FROM doctors d
          INNER JOIN users u ON d.user_id = u.id
          WHERE d.specialization LIKE ?
          ORDER BY u.name
        `, [`%${specialization}%`]);
        return rows;
      }
      throw error;
    }
  },

  // Get doctor by ID (with schema fallback)
  findById: async (doctor_id) => {
    try {
      const [rows] = await db.query(`
        SELECT ${doctorSelectFields.extended}
        FROM doctors d
        INNER JOIN users u ON d.user_id = u.id
        WHERE d.doctor_id = ?
      `, [doctor_id]);
      return rows[0];
    } catch (error) {
      if (isMissingColumnError(error)) {
        // Fallback for legacy schema
        const [rows] = await db.query(`
          SELECT ${doctorSelectFields.legacy}
          FROM doctors d
          INNER JOIN users u ON d.user_id = u.id
          WHERE d.doctor_id = ?
        `, [doctor_id]);
        return rows[0];
      }
      throw error;
    }
  },

  // Get doctor by user ID
  findByUserId: async (user_id) => {
    const [rows] = await db.query('SELECT * FROM doctors WHERE user_id = ?', [user_id]);
    return rows[0];
  },

  // Update doctor profile
  update: async (doctor_id, doctorData) => {
    const {
      specialization,
      qualification,
      bmdc_registration_number,
      consultation_fee,
      chamber_address,
      chamber_latitude = null,
      chamber_longitude = null
    } = doctorData;
    try {
      const [result] = await db.query(
        'UPDATE doctors SET specialization = ?, qualification = ?, bmdc_registration_number = ?, consultation_fee = ?, chamber_address = ?, chamber_latitude = ?, chamber_longitude = ? WHERE doctor_id = ?',
        [specialization, qualification, bmdc_registration_number, consultation_fee, chamber_address, chamber_latitude, chamber_longitude, doctor_id]
      );
      return result.affectedRows;
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }

      try {
        // Legacy fallback when chamber_latitude/chamber_longitude columns are not present.
        const [result] = await db.query(
          'UPDATE doctors SET specialization = ?, qualification = ?, bmdc_registration_number = ?, consultation_fee = ?, chamber_address = ? WHERE doctor_id = ?',
          [specialization, qualification, bmdc_registration_number, consultation_fee, chamber_address, doctor_id]
        );
        return result.affectedRows;
      } catch (legacyError) {
        if (!isMissingColumnError(legacyError)) {
          throw legacyError;
        }

        // Older schema fallback when bmdc_registration_number is also missing.
        const [result] = await db.query(
          'UPDATE doctors SET specialization = ?, qualification = ?, consultation_fee = ?, chamber_address = ? WHERE doctor_id = ?',
          [specialization, qualification, consultation_fee, chamber_address, doctor_id]
        );
        return result.affectedRows;
      }
    }
  }
};

module.exports = Doctor;
