const db = require('../config/database');

const initPromise = (async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.query('CREATE INDEX idx_notifications_user_id ON notifications(user_id)');
  await db.query('CREATE INDEX idx_notifications_is_read ON notifications(is_read)');
})().catch(async (error) => {
  // Ignore duplicate index errors if indexes already exist.
  if (error?.code === 'ER_DUP_KEYNAME') {
    return;
  }
  throw error;
});

const Notification = {
  create: async ({ user_id, title, message, type }) => {
    await initPromise;
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
      [user_id, title, message, type]
    );
    return result.insertId;
  },

  getByUserId: async (userId, limit = 20) => {
    await initPromise;
    const [rows] = await db.query(
      `SELECT id, user_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, Number(limit)]
    );
    return rows;
  },

  getUnreadCountByUserId: async (userId) => {
    await initPromise;
    const [rows] = await db.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return Number(rows[0]?.unread_count || 0);
  },

  markAsRead: async (notificationId, userId) => {
    await initPromise;
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows;
  },

  markAllAsRead: async (userId) => {
    await initPromise;
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.affectedRows;
  },

  delete: async (notificationId, userId) => {
    await initPromise;
    const [result] = await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows;
  },
};

module.exports = Notification;
