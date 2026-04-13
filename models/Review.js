const db = require('../config/database');

// Auto-create table on first load (mirrors the pattern used in Notification.js)
const initPromise = (async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS doctor_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL UNIQUE,
      doctor_id INT NOT NULL,
      patient_id INT NOT NULL,
      rating TINYINT NOT NULL,
      review_text TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
    )
  `);

  await db.query('CREATE INDEX idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id)');
  await db.query('CREATE INDEX idx_doctor_reviews_patient_id ON doctor_reviews(patient_id)');
})().catch((error) => {
  if (error?.code === 'ER_DUP_KEYNAME') return;
  throw error;
});

const Review = {
  // Create a new review for a completed appointment
  createReview: async ({ appointment_id, doctor_id, patient_id, rating, review_text }) => {
    await initPromise;
    const [result] = await db.query(
      `INSERT INTO doctor_reviews (appointment_id, doctor_id, patient_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [appointment_id, doctor_id, patient_id, rating, review_text || null]
    );
    return result.insertId;
  },

  // Get a single review by appointment ID
  getReviewByAppointmentId: async (appointment_id) => {
    await initPromise;
    const [rows] = await db.query(
      `SELECT id, appointment_id, doctor_id, patient_id, rating, review_text, created_at
       FROM doctor_reviews
       WHERE appointment_id = ?
       LIMIT 1`,
      [appointment_id]
    );
    return rows[0] || null;
  },

  // Get all reviews for a specific doctor, with patient name
  getReviewsByDoctorId: async (doctor_id) => {
    await initPromise;
    const [rows] = await db.query(
      `SELECT
         dr.id,
         dr.appointment_id,
         dr.rating,
         dr.review_text,
         dr.created_at,
         u.name AS patient_name
       FROM doctor_reviews dr
       INNER JOIN patients p ON dr.patient_id = p.patient_id
       INNER JOIN users u ON p.user_id = u.id
       WHERE dr.doctor_id = ?
       ORDER BY dr.created_at DESC`,
      [doctor_id]
    );
    return rows;
  },

  // Get aggregate rating summary for a doctor
  getDoctorRatingSummary: async (doctor_id) => {
    await initPromise;
    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS total_reviews,
         ROUND(AVG(rating), 1) AS average_rating,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star
       FROM doctor_reviews
       WHERE doctor_id = ?`,
      [doctor_id]
    );
    const row = rows[0];
    return {
      total_reviews: Number(row.total_reviews || 0),
      average_rating: row.average_rating ? Number(row.average_rating) : null,
      breakdown: {
        5: Number(row.five_star || 0),
        4: Number(row.four_star || 0),
        3: Number(row.three_star || 0),
        2: Number(row.two_star || 0),
        1: Number(row.one_star || 0),
      },
    };
  },
};

module.exports = Review;
