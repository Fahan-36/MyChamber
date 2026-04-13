const db = require('../config/database');

const generateUniquePatientCode = async () => {
  const maxAttempts = 80;

  for (let i = 0; i < maxAttempts; i += 1) {
    const code = Math.floor(10000 + (Math.random() * 90000));
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM patients WHERE patient_code = ?', [code]);

    if (Number(rows?.[0]?.count || 0) === 0) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique 5-digit patient code');
};

const Patient = {
  // Create patient profile
  create: async (patientData) => {
    const { user_id, age, gender } = patientData;
    const patient_code = await generateUniquePatientCode();
    const [result] = await db.query(
      'INSERT INTO patients (patient_code, user_id, age, gender) VALUES (?, ?, ?, ?)',
      [patient_code, user_id, age, gender]
    );
    return result.insertId;
  },

  // Get patient by ID
  findById: async (patient_id) => {
    const [rows] = await db.query(`
      SELECT 
        p.patient_id,
        p.patient_code,
        p.user_id,
        u.name,
        u.email,
        u.phone,
        p.age,
        p.gender
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.patient_id = ?
    `, [patient_id]);
    return rows[0];
  },

  // Get patient by user ID
  findByUserId: async (user_id) => {
    const [rows] = await db.query('SELECT * FROM patients WHERE user_id = ?', [user_id]);
    return rows[0];
  },

  // Update patient profile
  update: async (patient_id, patientData) => {
    const { age, gender } = patientData;
    const [result] = await db.query(
      'UPDATE patients SET age = ?, gender = ? WHERE patient_id = ?',
      [age, gender, patient_id]
    );
    return result.affectedRows;
  }
};

module.exports = Patient;
