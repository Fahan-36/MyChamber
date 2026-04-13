const { validationResult } = require('express-validator');
const db = require('../config/database');

const isMissingDoctorColumnError = (error) => {
  return error.code === 'ER_BAD_FIELD_ERROR' && (
    error.message.includes('doctor_code') ||
    error.message.includes('qualification') ||
    error.message.includes('bmdc_registration_number') ||
    error.message.includes('consultation_fee') ||
    error.message.includes('chamber_address') ||
    error.message.includes('chamber_latitude') ||
    error.message.includes('chamber_longitude')
  );
};

const getDoctorTableColumns = async () => {
  const [rows] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'doctors'
  `);

  return new Set(rows.map((row) => row.COLUMN_NAME));
};

const getStats = async (req, res) => {
  try {
    const [doctorResult, patientResult, appointmentResult, reviewResult] = await Promise.all([
      db.query('SELECT COUNT(*) AS totalDoctors FROM doctors'),
      db.query('SELECT COUNT(*) AS totalPatients FROM patients'),
      db.query('SELECT COUNT(*) AS totalAppointments FROM appointments'),
      db.query('SELECT COUNT(*) AS totalReviews FROM doctor_reviews'),
    ]);

    const doctorStats = doctorResult?.[0]?.[0] || {};
    const patientStats = patientResult?.[0]?.[0] || {};
    const appointmentStats = appointmentResult?.[0]?.[0] || {};
    const reviewStats = reviewResult?.[0]?.[0] || {};

    return res.json({
      success: true,
      data: {
        totalDoctors: Number(doctorStats?.totalDoctors || 0),
        totalPatients: Number(patientStats?.totalPatients || 0),
        totalAppointments: Number(appointmentStats?.totalAppointments || 0),
        totalReviews: Number(reviewStats?.totalReviews || 0),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load admin stats' });
  }
};

const getDoctors = async (req, res) => {
  try {
    const doctorColumns = await getDoctorTableColumns();
    const doctorCodeSelect = doctorColumns.has('doctor_code')
      ? 'COALESCE(d.doctor_code, d.doctor_id) AS doctor_code'
      : 'd.doctor_id AS doctor_code';
    const qualificationSelect = doctorColumns.has('qualification')
      ? 'd.qualification'
      : 'NULL AS qualification';
    const bmdcSelect = doctorColumns.has('bmdc_registration_number')
      ? 'd.bmdc_registration_number'
      : 'NULL AS bmdc_registration_number';
    const feeSelect = doctorColumns.has('consultation_fee')
      ? 'd.consultation_fee'
      : 'NULL AS consultation_fee';
    const addressSelect = doctorColumns.has('chamber_address')
      ? 'd.chamber_address'
      : 'NULL AS chamber_address';
    const latitudeSelect = doctorColumns.has('chamber_latitude')
      ? 'd.chamber_latitude'
      : 'NULL AS chamber_latitude';
    const longitudeSelect = doctorColumns.has('chamber_longitude')
      ? 'd.chamber_longitude'
      : 'NULL AS chamber_longitude';

    const [rows] = await db.query(`
      SELECT
        d.doctor_id,
        ${doctorCodeSelect},
        ${qualificationSelect},
        ${bmdcSelect},
        ${feeSelect},
        ${addressSelect},
        ${latitudeSelect},
        ${longitudeSelect},
        u.name,
        u.email,
        u.phone,
        d.specialization,
        d.status,
        u.created_at
      FROM doctors d
      INNER JOIN users u ON u.id = d.user_id
      ORDER BY u.created_at DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    if (isMissingDoctorColumnError(error)) {
      try {
        const [rows] = await db.query(`
          SELECT
            d.doctor_id,
            d.doctor_id AS doctor_code,
            NULL AS qualification,
            NULL AS bmdc_registration_number,
            NULL AS consultation_fee,
            NULL AS chamber_address,
            NULL AS chamber_latitude,
            NULL AS chamber_longitude,
            u.name,
            u.email,
            u.phone,
            d.specialization,
            d.status,
            u.created_at
          FROM doctors d
          INNER JOIN users u ON u.id = d.user_id
          ORDER BY u.created_at DESC
        `);

        return res.json({ success: true, data: rows });
      } catch (legacyError) {
        console.error('Admin doctors legacy fallback error:', legacyError);
      }
    }

    console.error('Admin doctors error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load doctors' });
  }
};

const updateDoctorStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const doctorId = Number(req.params.doctorId);
    const { status } = req.body;

    const [result] = await db.query('UPDATE doctors SET status = ? WHERE doctor_id = ?', [status, doctorId]);

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    return res.json({ success: true, message: 'Doctor status updated successfully' });
  } catch (error) {
    console.error('Admin update doctor status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update doctor status' });
  }
};

const deleteDoctor = async (req, res) => {
  let connection;

  try {
    const doctorId = Number(req.params.doctorId);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [doctorRows] = await connection.query(
      'SELECT user_id FROM doctors WHERE doctor_id = ? FOR UPDATE',
      [doctorId]
    );

    if (!doctorRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const userId = doctorRows[0].user_id;
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();
    return res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Admin delete doctor rollback error:', rollbackError);
      }
    }

    console.error('Admin delete doctor error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete doctor' });
  } finally {
    if (connection) connection.release();
  }
};

const getPatients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.patient_id,
        p.patient_code,
        u.name,
        u.email,
        u.phone,
        p.age,
        p.gender,
        u.created_at
      FROM patients p
      INNER JOIN users u ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin patients error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load patients' });
  }
};

const deletePatient = async (req, res) => {
  let connection;

  try {
    const patientId = Number(req.params.patientId);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [patientRows] = await connection.query(
      'SELECT user_id FROM patients WHERE patient_id = ? FOR UPDATE',
      [patientId]
    );

    if (!patientRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const userId = patientRows[0].user_id;
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();
    return res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Admin delete patient rollback error:', rollbackError);
      }
    }

    console.error('Admin delete patient error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete patient' });
  } finally {
    if (connection) connection.release();
  }
};

const getAppointments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.appointment_id,
        a.appointment_date,
        a.time_slot,
        a.status,
        p.patient_code,
        d.doctor_code,
        pu.name AS patient_name,
        du.name AS doctor_name
      FROM appointments a
      INNER JOIN patients p ON p.patient_id = a.patient_id
      INNER JOIN users pu ON pu.id = p.user_id
      INNER JOIN doctors d ON d.doctor_id = a.doctor_id
      INNER JOIN users du ON du.id = d.user_id
      ORDER BY a.appointment_date DESC, a.time_slot DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load appointments' });
  }
};

const getAppointmentIssueReports = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        air.issue_id,
        air.appointment_id,
        air.patient_id,
        air.doctor_id,
        p.patient_code,
        d.doctor_code,
        air.reason,
        air.description,
        air.created_at,
        pu.name AS patient_name,
        du.name AS doctor_name,
        a.appointment_date,
        a.time_slot,
        a.status AS appointment_status
      FROM appointment_issue_reports air
      INNER JOIN appointments a ON a.appointment_id = air.appointment_id
      INNER JOIN patients p ON p.patient_id = air.patient_id
      INNER JOIN users pu ON pu.id = p.user_id
      INNER JOIN doctors d ON d.doctor_id = air.doctor_id
      INNER JOIN users du ON du.id = d.user_id
      ORDER BY air.created_at DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin appointment issue reports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load appointment issue reports' });
  }
};

const getReviews = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        dr.id,
        dr.rating,
        dr.review_text,
        dr.created_at,
        du.name AS doctor_name,
        pu.name AS patient_name
      FROM doctor_reviews dr
      INNER JOIN doctors d ON d.doctor_id = dr.doctor_id
      INNER JOIN users du ON du.id = d.user_id
      INNER JOIN patients p ON p.patient_id = dr.patient_id
      INNER JOIN users pu ON pu.id = p.user_id
      ORDER BY dr.created_at DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin reviews error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const [result] = await db.query('DELETE FROM doctor_reviews WHERE id = ?', [reviewId]);

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};

module.exports = {
  getStats,
  getDoctors,
  updateDoctorStatus,
  deleteDoctor,
  getPatients,
  deletePatient,
  getAppointments,
  getAppointmentIssueReports,
  getReviews,
  deleteReview,
};
