const mysql = require('mysql2');

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const logConnectionError = (error) => {
  if (!error) {
    console.error('Database connection failed: Unknown error');
    return;
  }

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    console.error('Database connection failed: Unable to reach MySQL server');

    error.errors.forEach((subError) => {
      const location = subError.address && subError.port
        ? `${subError.address}:${subError.port}`
        : 'unknown host';
      const code = subError.code || 'UNKNOWN';
      const message = subError.message || 'No additional details';

      console.error(` - [${code}] ${location} - ${message}`);
    });

    return;
  }

  const message = error.message || error.code || 'Unknown error';
  console.error(`Database connection failed: ${message}`);

  if (error.code) {
    console.error(`Error code: ${error.code}`);
  }
};

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get promise-based connection
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    logConnectionError(error);
    process.exit(1);
  }
};

testConnection();

module.exports = promisePool;
