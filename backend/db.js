const mysql = require('mysql2');
require('dotenv').config();

// Create the connection pool for handling multiple requests
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'fitbox_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Use promise wrapper for cleaner async/await syntax
const promisePool = pool.promise();

module.exports = promisePool;
