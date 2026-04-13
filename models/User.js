const db = require('../config/database');

const isMissingProfileImageColumnError = (error) => {
  return error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('profile_image');
};

const User = {
  // Create a new user
  create: async (userData) => {
    const { name, email, password, role, phone } = userData;
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, role, phone]
    );
    return result.insertId;
  },

  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    try {
      const [rows] = await db.query('SELECT id, name, email, role, phone, profile_image FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      if (!isMissingProfileImageColumnError(error)) {
        throw error;
      }

      const [rows] = await db.query('SELECT id, name, email, role, phone FROM users WHERE id = ?', [id]);
      return rows[0] ? { ...rows[0], profile_image: null } : null;
    }
  },

  // Find user by ID including password hash (for password change flow)
  findByIdWithPassword: async (id) => {
    try {
      const [rows] = await db.query('SELECT id, name, email, role, phone, profile_image, password FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      if (!isMissingProfileImageColumnError(error)) {
        throw error;
      }

      const [rows] = await db.query('SELECT id, name, email, role, phone, password FROM users WHERE id = ?', [id]);
      return rows[0] ? { ...rows[0], profile_image: null } : null;
    }
  },

  // Update user
  update: async (id, userData) => {
    const { name, phone } = userData;
    const [result] = await db.query(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone, id]
    );
    return result.affectedRows;
  },

  // Update user password hash
  updatePassword: async (id, passwordHash) => {
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [passwordHash, id]
    );
    return result.affectedRows;
  },

  // Update user profile image path
  updateProfileImage: async (id, profileImagePath) => {
    try {
      const [result] = await db.query(
        'UPDATE users SET profile_image = ? WHERE id = ?',
        [profileImagePath, id]
      );
      return result.affectedRows;
    } catch (error) {
      if (!isMissingProfileImageColumnError(error)) {
        throw error;
      }

      const migrationError = new Error('Database is not updated for profile images. Run: migrations/add_profile_image_to_users.sql');
      migrationError.code = 'ER_PROFILE_IMAGE_MIGRATION_REQUIRED';
      throw migrationError;
    }
  },

  // Delete user
  delete: async (id) => {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = User;
