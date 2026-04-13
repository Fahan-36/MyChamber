const db = require('../config/database');

const toDateOnly = (value) => {
  if (!value) return value;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
};

const normalizeScheduleRow = (row) => ({
  ...row,
  start_date: toDateOnly(row.start_date),
  end_date: toDateOnly(row.end_date),
});

const DoctorSchedule = {
  // Create schedule
  create: async (scheduleData) => {
    const { doctor_id, day_of_week, start_time, end_time, slot_duration, start_date, end_date } = scheduleData;
    const [result] = await db.query(
      'INSERT INTO doctor_schedule (doctor_id, day_of_week, start_time, end_time, slot_duration, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doctor_id, day_of_week, start_time, end_time, slot_duration, start_date, end_date]
    );
    return result.insertId;
  },

  // Get schedule by doctor ID
  getByDoctorId: async (doctor_id) => {
    const [rows] = await db.query(
      'SELECT * FROM doctor_schedule WHERE doctor_id = ? ORDER BY FIELD(day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")',
      [doctor_id]
    );
    return rows.map(normalizeScheduleRow);
  },

  // Get schedule by doctor ID and day
  getByDoctorAndDay: async (doctor_id, day_of_week) => {
    const [rows] = await db.query(
      'SELECT * FROM doctor_schedule WHERE doctor_id = ? AND day_of_week = ?',
      [doctor_id, day_of_week]
    );
    return rows[0] ? normalizeScheduleRow(rows[0]) : undefined;
  },

  // Get schedule by id
  findById: async (schedule_id) => {
    const [rows] = await db.query('SELECT * FROM doctor_schedule WHERE schedule_id = ?', [schedule_id]);
    return rows[0] ? normalizeScheduleRow(rows[0]) : undefined;
  },

  // Check if doctor already has schedule for same weekday.
  existsByDoctorAndDay: async (doctor_id, day_of_week, exclude_schedule_id = null) => {
    const params = [doctor_id, day_of_week];
    let query = 'SELECT schedule_id FROM doctor_schedule WHERE doctor_id = ? AND day_of_week = ?';

    if (exclude_schedule_id) {
      query += ' AND schedule_id != ?';
      params.push(exclude_schedule_id);
    }

    query += ' LIMIT 1';

    const [rows] = await db.query(query, params);
    return rows[0] || null;
  },

  // Update schedule
  update: async (schedule_id, scheduleData) => {
    const { day_of_week, start_time, end_time, slot_duration, start_date, end_date } = scheduleData;
    const [result] = await db.query(
      'UPDATE doctor_schedule SET day_of_week = ?, start_time = ?, end_time = ?, slot_duration = ?, start_date = ?, end_date = ? WHERE schedule_id = ?',
      [day_of_week, start_time, end_time, slot_duration, start_date, end_date, schedule_id]
    );
    return result.affectedRows;
  },

  // Delete schedule
  delete: async (schedule_id) => {
    const [result] = await db.query('DELETE FROM doctor_schedule WHERE schedule_id = ?', [schedule_id]);
    return result.affectedRows;
  }
};

module.exports = DoctorSchedule;
