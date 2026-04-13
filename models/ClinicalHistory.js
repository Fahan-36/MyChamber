// NEW MODEL: Clinical History Management for Patient History Feature
// This does NOT modify existing appointment logic

const db = require('../config/database');

const isMissingFileCategoryColumnError = (error) => {
  return error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('file_category');
};

const ClinicalHistory = {
  // Get full clinical data for an appointment
  getAppointmentClinicalData: async (appointmentId) => {
    const [rows] = await db.query(`
      SELECT 
        appointment_id,
        diagnosis_notes,
        prescription_notes,
        followup_notes,
        followup_date
      FROM appointments
      WHERE appointment_id = ?
    `, [appointmentId]);
    return rows[0];
  },

  // Save diagnosis notes
  saveDiagnosisNotes: async (appointmentId, notes) => {
    const [result] = await db.query(
      'UPDATE appointments SET diagnosis_notes = ? WHERE appointment_id = ?',
      [notes, appointmentId]
    );
    return result.affectedRows > 0;
  },

  // Save prescription notes
  savePrescriptionNotes: async (appointmentId, notes) => {
    const [result] = await db.query(
      'UPDATE appointments SET prescription_notes = ? WHERE appointment_id = ?',
      [notes, appointmentId]
    );
    return result.affectedRows > 0;
  },

  // Save follow-up notes
  saveFollowupNotes: async (appointmentId, notes, followupDate = null) => {
    const [result] = await db.query(
      'UPDATE appointments SET followup_notes = ?, followup_date = ? WHERE appointment_id = ?',
      [notes, followupDate, appointmentId]
    );
    return result.affectedRows > 0;
  },

  // Upload report or prescription file record
  uploadReport: async (appointmentId, fileName, filePath, fileType, fileCategory = 'report') => {
    try {
      const [result] = await db.query(
        'INSERT INTO appointment_reports (appointment_id, file_name, file_path, file_type, file_category) VALUES (?, ?, ?, ?, ?)',
        [appointmentId, fileName, filePath, fileType, fileCategory]
      );
      return result.insertId;
    } catch (error) {
      if (!isMissingFileCategoryColumnError(error)) {
        throw error;
      }

      const [result] = await db.query(
        'INSERT INTO appointment_reports (appointment_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)',
        [appointmentId, fileName, filePath, fileType]
      );
      return result.insertId;
    }
  },

  // Get all reports for an appointment
  getAppointmentReports: async (appointmentId) => {
    try {
      const [rows] = await db.query(
        'SELECT report_id, file_name, file_path, file_type, file_category, uploaded_at FROM appointment_reports WHERE appointment_id = ? ORDER BY uploaded_at DESC',
        [appointmentId]
      );
      return rows;
    } catch (error) {
      if (!isMissingFileCategoryColumnError(error)) {
        throw error;
      }

      const [rows] = await db.query(
        "SELECT report_id, file_name, file_path, file_type, 'report' AS file_category, uploaded_at FROM appointment_reports WHERE appointment_id = ? ORDER BY uploaded_at DESC",
        [appointmentId]
      );
      return rows;
    }
  },

  // Get report by ID
  getReportById: async (reportId) => {
    try {
      const [rows] = await db.query(
        'SELECT report_id, appointment_id, file_name, file_path, file_type, file_category FROM appointment_reports WHERE report_id = ? LIMIT 1',
        [reportId]
      );
      return rows[0] || null;
    } catch (error) {
      if (!isMissingFileCategoryColumnError(error)) {
        throw error;
      }

      const [rows] = await db.query(
        "SELECT report_id, appointment_id, file_name, file_path, file_type, 'report' AS file_category FROM appointment_reports WHERE report_id = ? LIMIT 1",
        [reportId]
      );
      return rows[0] || null;
    }
  },

  // Delete a report
  deleteReport: async (reportId) => {
    const [result] = await db.query(
      'DELETE FROM appointment_reports WHERE report_id = ?',
      [reportId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = ClinicalHistory;
