const db = require('../config/database');

let hasCancellationTypeColumnCache = null;

const hasCancellationTypeColumn = async () => {
  if (hasCancellationTypeColumnCache !== null) {
    return hasCancellationTypeColumnCache;
  }

  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'appointments'
       AND column_name = 'cancellation_type'`
  );

  hasCancellationTypeColumnCache = Number(rows?.[0]?.count || 0) > 0;
  return hasCancellationTypeColumnCache;
};

const getSlotBlockingConditionSql = (tableAlias = '', includeCancellationType = true) => {
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (!includeCancellationType) {
    return `LOWER(COALESCE(${prefix}status, '')) IN ('pending', 'confirmed', 'completed')`;
  }

  return `(
    LOWER(COALESCE(${prefix}status, '')) IN ('pending', 'confirmed', 'completed')
    OR (
      LOWER(COALESCE(${prefix}status, '')) = 'cancelled'
      AND LOWER(COALESCE(${prefix}cancellation_type, '')) = 'system'
    )
  )`;
};

const Appointment = {
  // Create appointment
  create: async (appointmentData) => {
    const { doctor_id, patient_id, appointment_date, time_slot } = appointmentData;
    const includeCancellationType = await hasCancellationTypeColumn();
    const slotBlockingConditionSql = getSlotBlockingConditionSql('', includeCancellationType);

    const [blockingRows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE doctor_id = ?
         AND appointment_date = ?
         AND time_slot = ?
         AND ${slotBlockingConditionSql}`,
      [doctor_id, appointment_date, time_slot]
    );

    if (Number(blockingRows?.[0]?.count || 0) > 0) {
      return null;
    }

    const reusableCancelledConditionSql = includeCancellationType
      ? "LOWER(COALESCE(status, '')) = 'cancelled' AND LOWER(COALESCE(cancellation_type, '')) <> 'system'"
      : "LOWER(COALESCE(status, '')) = 'cancelled'";

    const [reusableRows] = await db.query(
      `SELECT appointment_id
       FROM appointments
       WHERE doctor_id = ?
         AND appointment_date = ?
         AND time_slot = ?
         AND ${reusableCancelledConditionSql}
       ORDER BY appointment_id DESC
       LIMIT 1`,
      [doctor_id, appointment_date, time_slot]
    );

    if (reusableRows.length > 0) {
      const reusableAppointmentId = reusableRows[0].appointment_id;
      const reuseQuery = includeCancellationType
        ? "UPDATE appointments SET patient_id = ?, status = 'pending', cancellation_type = NULL, cancelled_by_role = NULL, cancelled_by_user_id = NULL, cancelled_at = NULL WHERE appointment_id = ?"
        : "UPDATE appointments SET patient_id = ?, status = 'pending', cancelled_by_role = NULL, cancelled_by_user_id = NULL, cancelled_at = NULL WHERE appointment_id = ?";

      await db.query(reuseQuery, [patient_id, reusableAppointmentId]);
      return reusableAppointmentId;
    }

    const [result] = await db.query(
      'INSERT INTO appointments (doctor_id, patient_id, appointment_date, time_slot, status) VALUES (?, ?, ?, ?, ?)',
      [doctor_id, patient_id, appointment_date, time_slot, 'pending']
    );

    return result.insertId;
  },

  // Get appointments by patient ID (includes review data if present)
  getByPatientId: async (patient_id) => {
    const [rows] = await db.query(`
      SELECT
        a.appointment_id,
        a.appointment_date,
        a.time_slot,
        a.status,
        a.diagnosis_notes,
        a.prescription_notes,
        a.followup_notes,
        a.followup_date,
        a.updated_at,
        a.cancellation_type,
        a.cancelled_by_role,
        a.cancelled_by_user_id,
        a.cancelled_at,
        a.created_at,
        d.doctor_id,
        d.doctor_code,
        u.name as doctor_name,
        d.specialization,
        d.consultation_fee,
        d.chamber_address,
        cu.name AS cancelled_by_name,
        dr.id AS review_id,
        dr.rating AS review_rating,
        dr.review_text AS review_text
      FROM appointments a
      INNER JOIN doctors d ON a.doctor_id = d.doctor_id
      INNER JOIN users u ON d.user_id = u.id
      LEFT JOIN users cu ON cu.id = a.cancelled_by_user_id
      LEFT JOIN doctor_reviews dr ON dr.appointment_id = a.appointment_id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.time_slot DESC
    `, [patient_id]);
    return rows;
  },

  // Get appointments by doctor ID
  getByDoctorId: async (doctor_id) => {
    const [rows] = await db.query(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.time_slot,
        a.status,
        a.updated_at,
        a.cancellation_type,
        a.cancelled_by_role,
        a.cancelled_by_user_id,
        a.cancelled_at,
        a.created_at,
        p.patient_id,
        p.patient_code,
        u.name as patient_name,
        u.phone as patient_phone,
        p.age,
        p.gender,
        cu.name AS cancelled_by_name,
        air.issue_report_id
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.patient_id
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN users cu ON cu.id = a.cancelled_by_user_id
      LEFT JOIN (
        SELECT appointment_id, reported_by_user_id, MAX(issue_id) AS issue_report_id
        FROM appointment_issue_reports
        GROUP BY appointment_id, reported_by_user_id
      ) air ON air.appointment_id = a.appointment_id
        AND air.reported_by_user_id = (SELECT user_id FROM doctors WHERE doctor_id = a.doctor_id)
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date DESC, a.time_slot DESC
    `, [doctor_id]);
    return rows;
  },

  // Get appointments by doctor ID for patient history (exclude cancelled/canceled)
  getByDoctorIdForHistory: async (doctor_id) => {
    const [rows] = await db.query(`
      SELECT
        a.appointment_id,
        a.appointment_date,
        a.time_slot,
        a.status,
        a.updated_at,
        a.cancellation_type,
        a.cancelled_by_role,
        a.cancelled_by_user_id,
        a.cancelled_at,
        a.created_at,
        p.patient_id,
        p.patient_code,
        u.name as patient_name,
        u.phone as patient_phone,
        p.age,
        p.gender,
        cu.name AS cancelled_by_name,
        air.issue_report_id
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.patient_id
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN users cu ON cu.id = a.cancelled_by_user_id
      LEFT JOIN (
        SELECT appointment_id, reported_by_user_id, MAX(issue_id) AS issue_report_id
        FROM appointment_issue_reports
        GROUP BY appointment_id, reported_by_user_id
      ) air ON air.appointment_id = a.appointment_id
        AND air.reported_by_user_id = (SELECT user_id FROM doctors WHERE doctor_id = a.doctor_id)
      WHERE a.doctor_id = ?
        AND LOWER(COALESCE(a.status, '')) NOT IN ('cancelled', 'canceled')
      ORDER BY a.appointment_date DESC, a.time_slot DESC
    `, [doctor_id]);
    return rows;
  },

  // Get today's appointments for doctor
  getTodayByDoctorId: async (doctor_id) => {
    const [rows] = await db.query(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.time_slot,
        a.status,
        a.updated_at,
        a.cancellation_type,
        a.cancelled_by_role,
        a.cancelled_by_user_id,
        a.cancelled_at,
        a.created_at,
        p.patient_id,
        p.patient_code,
        u.name as patient_name,
        u.phone as patient_phone,
        p.age,
        p.gender,
        cu.name AS cancelled_by_name,
        air.issue_report_id
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.patient_id
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN users cu ON cu.id = a.cancelled_by_user_id
      LEFT JOIN (
        SELECT appointment_id, reported_by_user_id, MAX(issue_id) AS issue_report_id
        FROM appointment_issue_reports
        GROUP BY appointment_id, reported_by_user_id
      ) air ON air.appointment_id = a.appointment_id
        AND air.reported_by_user_id = (SELECT user_id FROM doctors WHERE doctor_id = a.doctor_id)
      WHERE a.doctor_id = ?
        AND a.appointment_date = CURDATE()
        AND LOWER(COALESCE(a.status, '')) NOT IN ('cancelled', 'canceled')
      ORDER BY a.time_slot
    `, [doctor_id]);
    return rows;
  },

  // Get dashboard stats for doctor (exclude cancelled/canceled)
  getDashboardStatsByDoctorId: async (doctor_id) => {
    const [rows] = await db.query(`
      SELECT
        SUM(CASE WHEN LOWER(COALESCE(a.status, '')) NOT IN ('cancelled', 'canceled') THEN 1 ELSE 0 END) AS total_appointments,
        SUM(CASE WHEN a.appointment_date = CURDATE() AND LOWER(COALESCE(a.status, '')) NOT IN ('cancelled', 'canceled') THEN 1 ELSE 0 END) AS today_appointments,
        SUM(CASE WHEN LOWER(COALESCE(a.status, '')) = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_appointments,
        COUNT(DISTINCT CASE WHEN LOWER(COALESCE(a.status, '')) NOT IN ('cancelled', 'canceled') THEN a.patient_id END) AS unique_patients,
        SUM(CASE WHEN LOWER(COALESCE(a.status, '')) = 'pending' THEN 1 ELSE 0 END) AS pending_appointments,
        SUM(CASE WHEN LOWER(COALESCE(a.status, '')) = 'completed' THEN 1 ELSE 0 END) AS completed_appointments
      FROM appointments a
      WHERE a.doctor_id = ?
    `, [doctor_id]);

    return rows[0] || {
      total_appointments: 0,
      today_appointments: 0,
      confirmed_appointments: 0,
      unique_patients: 0,
      pending_appointments: 0,
      completed_appointments: 0,
    };
  },

  // Get upcoming appointments for patient
  getUpcomingByPatientId: async (patient_id) => {
    const [rows] = await db.query(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.time_slot,
        a.status,
        a.created_at,
        d.doctor_id,
        u.name as doctor_name,
        d.specialization,
        d.consultation_fee,
        d.chamber_address
      FROM appointments a
      INNER JOIN doctors d ON a.doctor_id = d.doctor_id
      INNER JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ? AND a.appointment_date >= CURDATE()
      ORDER BY a.appointment_date, a.time_slot
    `, [patient_id]);
    return rows;
  },

  // Get booked slots for a doctor on a specific date
  getBookedSlots: async (doctor_id, appointment_date) => {
    const includeCancellationType = await hasCancellationTypeColumn();
    const slotBlockingConditionSql = getSlotBlockingConditionSql('', includeCancellationType);
    const [rows] = await db.query(
      `SELECT time_slot
       FROM appointments
       WHERE doctor_id = ?
         AND appointment_date = ?
         AND ${slotBlockingConditionSql}`,
      [doctor_id, appointment_date]
    );
    return rows.map(row => row.time_slot);
  },

  // Get active appointments on a weekday that are outside a proposed schedule date range.
  getActiveOutsideDateRangeForWeekday: async (doctor_id, day_of_week, start_date, end_date) => {
    const [rows] = await db.query(
      `SELECT appointment_id, appointment_date, time_slot, status
       FROM appointments
       WHERE doctor_id = ?
         AND LOWER(COALESCE(status, '')) IN ('pending', 'confirmed')
         AND appointment_date >= CURDATE()
         AND DAYNAME(appointment_date) = ?
         AND (appointment_date < ? OR appointment_date > ?)
       ORDER BY appointment_date, time_slot`,
      [doctor_id, day_of_week, start_date, end_date]
    );

    return rows;
  },

  // Get active appointments for a doctor on a specific weekday.
  getActiveByDoctorAndWeekday: async (doctor_id, day_of_week) => {
    const [rows] = await db.query(
      `SELECT appointment_id, appointment_date, time_slot, status
       FROM appointments
       WHERE doctor_id = ?
         AND LOWER(COALESCE(status, '')) IN ('pending', 'confirmed')
         AND appointment_date >= CURDATE()
         AND DAYNAME(appointment_date) = ?
       ORDER BY appointment_date, time_slot`,
      [doctor_id, day_of_week]
    );

    return rows;
  },

  // Get confirmed appointments for a doctor (for public view)
  getConfirmedByDoctorId: async (doctor_id) => {
    const [rows] = await db.query(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.time_slot,
        a.status,
        a.created_at
      FROM appointments a
      WHERE a.doctor_id = ?
        AND LOWER(COALESCE(a.status, '')) = 'confirmed'
        AND a.appointment_date >= CURDATE()
      ORDER BY a.appointment_date, a.time_slot
    `, [doctor_id]);
    return rows;
  },

  // Check if slot is available
  isSlotAvailable: async (doctor_id, appointment_date, time_slot) => {
    const includeCancellationType = await hasCancellationTypeColumn();
    const slotBlockingConditionSql = getSlotBlockingConditionSql('', includeCancellationType);
    const [rows] = await db.query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE doctor_id = ?
         AND appointment_date = ?
         AND time_slot = ?
         AND ${slotBlockingConditionSql}`,
      [doctor_id, appointment_date, time_slot]
    );
    return rows[0].count === 0;
  },

  // Check if patient already has an active appointment on a specific date.
  hasPatientAppointmentOnDate: async (patient_id, appointment_date) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE patient_id = ?
         AND appointment_date = ?
         AND LOWER(COALESCE(status, '')) IN ('pending', 'confirmed', 'completed')`,
      [patient_id, appointment_date]
    );

    return Number(rows?.[0]?.count || 0) > 0;
  },

  // Check if patient already has an active appointment with a specific doctor on a specific date.
  hasPatientAppointmentWithDoctorOnDate: async (patient_id, doctor_id, appointment_date) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE patient_id = ?
         AND doctor_id = ?
         AND appointment_date = ?
         AND LOWER(COALESCE(status, '')) IN ('pending', 'confirmed', 'completed')`,
      [patient_id, doctor_id, appointment_date]
    );

    return Number(rows?.[0]?.count || 0) > 0;
  },

  // Update appointment status
  updateStatus: async (appointment_id, status, cancellation_type = null, cancelled_by_role = null, cancelled_by_user_id = null) => {
    const includeCancellationType = await hasCancellationTypeColumn();
    let query;
    let params;

    if (status === 'cancelled') {
      if (!includeCancellationType) {
        query = 'UPDATE appointments SET status = ?, cancelled_by_role = ?, cancelled_by_user_id = ?, cancelled_at = NOW() WHERE appointment_id = ?';
        params = [status, cancelled_by_role, cancelled_by_user_id, appointment_id];
      } else {
        query = 'UPDATE appointments SET status = ?, cancellation_type = ?, cancelled_by_role = ?, cancelled_by_user_id = ?, cancelled_at = NOW() WHERE appointment_id = ?';
        params = [status, cancellation_type, cancelled_by_role, cancelled_by_user_id, appointment_id];
      }
    } else {
      if (!includeCancellationType) {
        query = 'UPDATE appointments SET status = ?, cancelled_by_role = NULL, cancelled_by_user_id = NULL, cancelled_at = NULL WHERE appointment_id = ?';
        params = [status, appointment_id];
      } else {
        query = 'UPDATE appointments SET status = ?, cancellation_type = NULL, cancelled_by_role = NULL, cancelled_by_user_id = NULL, cancelled_at = NULL WHERE appointment_id = ?';
        params = [status, appointment_id];
      }
    }

    const [result] = await db.query(query, params);
    return result.affectedRows;
  },

  // Auto-cancel only pending appointments that have already passed.
  autoCancelElapsedPending: async (filters = {}) => {
    const { doctor_id, patient_id } = filters;
    const includeCancellationType = await hasCancellationTypeColumn();
    const whereClauses = [
      "LOWER(COALESCE(status, '')) = 'pending'",
      'TIMESTAMP(appointment_date, time_slot) < NOW()'
    ];
    const params = [];

    if (doctor_id) {
      whereClauses.push('doctor_id = ?');
      params.push(doctor_id);
    }

    if (patient_id) {
      whereClauses.push('patient_id = ?');
      params.push(patient_id);
    }

    const updateClause = includeCancellationType
      ? "SET status = 'cancelled', cancellation_type = 'system', cancelled_by_role = 'system', cancelled_by_user_id = NULL, cancelled_at = NOW()"
      : "SET status = 'cancelled', cancelled_by_role = 'system', cancelled_by_user_id = NULL, cancelled_at = NOW()";

    const [result] = await db.query(
      `UPDATE appointments
       ${updateClause}
       WHERE ${whereClauses.join(' AND ')}`,
      params
    );

    return result.affectedRows;
  },

  // Auto-complete only confirmed appointments that have already passed.
  autoCompleteElapsedConfirmed: async (filters = {}) => {
    const { doctor_id, patient_id } = filters;
    const whereClauses = [
      "LOWER(COALESCE(status, '')) = 'confirmed'",
      'TIMESTAMP(appointment_date, time_slot) < NOW()'
    ];
    const params = [];

    if (doctor_id) {
      whereClauses.push('doctor_id = ?');
      params.push(doctor_id);
    }

    if (patient_id) {
      whereClauses.push('patient_id = ?');
      params.push(patient_id);
    }

    const [result] = await db.query(
      `UPDATE appointments SET status = 'completed' WHERE ${whereClauses.join(' AND ')}`,
      params
    );

    return result.affectedRows;
  },

  // Cancel appointment
  cancel: async (appointment_id, cancelled_by_role = 'patient', cancelled_by_user_id = null) => {
    const includeCancellationType = await hasCancellationTypeColumn();
    const query = includeCancellationType
      ? 'UPDATE appointments SET status = "cancelled", cancellation_type = "manual", cancelled_by_role = ?, cancelled_by_user_id = ?, cancelled_at = NOW() WHERE appointment_id = ?'
      : 'UPDATE appointments SET status = "cancelled", cancelled_by_role = ?, cancelled_by_user_id = ?, cancelled_at = NOW() WHERE appointment_id = ?';

    const params = includeCancellationType
      ? [cancelled_by_role, cancelled_by_user_id, appointment_id]
      : [cancelled_by_role, cancelled_by_user_id, appointment_id];

    const [result] = await db.query(query, params);
    return result.affectedRows;
  },

  // Get appointment by ID
  findById: async (appointment_id) => {
    const [rows] = await db.query('SELECT * FROM appointments WHERE appointment_id = ?', [appointment_id]);
    return rows[0];
  },

  // Create an appointment issue report for admin review
  createIssueReport: async ({ appointment_id, patient_id, doctor_id, reason, description = '', reported_by_user_id }) => {
    const [result] = await db.query(
      `INSERT INTO appointment_issue_reports
        (appointment_id, patient_id, doctor_id, reason, description, reported_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [appointment_id, patient_id, doctor_id, reason, description || null, reported_by_user_id]
    );

    return result.insertId;
  },

  // Get issue reports for admin panel
  getIssueReportsForAdmin: async () => {
    const [rows] = await db.query(`
      SELECT
        air.issue_id,
        air.appointment_id,
        air.patient_id,
        air.doctor_id,
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

    return rows;
  }
};

module.exports = Appointment;
