// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Function to test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('🔍 Testing database connection...');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database test successful. Current time:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database test failed:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};