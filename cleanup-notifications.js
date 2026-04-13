const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupNotifications() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  console.log('Deleting old notifications with bad formatting...');

  const [result] = await connection.query('DELETE FROM notifications');
  
  console.log(`✅ Deleted ${result.affectedRows} old notifications`);
  console.log('✅ All new notifications will use proper formatting');
  
  await connection.end();
}

cleanupNotifications().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
