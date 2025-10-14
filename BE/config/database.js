// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const { ERROR_CATALOG } = require('./errorCodes');
const ErrorLogger = require('../services/errorLogger');
// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Optimized for Neon + Vercel serverless
  max: 1, // Neon handles connection pooling server-side
  min: 0, // Start with 0 connections, create on demand
  connectionTimeoutMillis: 5000, // Fast fail - 5 seconds
  idleTimeoutMillis: 10000, // Close idle connections after 10 seconds
  allowExitOnIdle: true, // Critical for serverless - allows clean function exit
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // ✅ Conditional SSL
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  // Log critical database connection error
  ErrorLogger.serverLogError(
    ERROR_CATALOG.SYS_DATABASE_CONNECTION_FAILED.code,
    ERROR_CATALOG.SYS_DATABASE_CONNECTION_FAILED.message,
    'DATABASE_CONFIG',
    'database connection pool',
    err,
    null, // No user context at system level
    'database-service'
  );
  
  console.error('❌ Database connection error:', err);
 
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
    // Log database test failure
    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'DATABASE_TEST',
      'test database connection',
      err,
      null, // No user context at system level
      'database-service'
    );
    
    console.error('❌ Database test failed:', err.message);
    return false;
  }
};

// Lazy database initialization - called on first request
let isInitialized = false;
const initializeDatabase = async () => {
  if (isInitialized) {
    return true; // Already initialized
  }

  try {
    console.log('🔄 Initializing database connection pool...');
    const client = await pool.connect();
    await client.query('SELECT 1'); // Simple health check
    client.release();
    
    isInitialized = true;
    console.log('✅ Database pool initialized successfully');
    return true;
  } catch (err) {
    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_DATABASE_CONNECTION_FAILED.code,
      ERROR_CATALOG.SYS_DATABASE_CONNECTION_FAILED.message,
      'DATABASE_INIT',
      'lazy database initialization',
      err,
      null,
      'database-service'
    );
    
    console.error('❌ Database initialization failed:', err.message);
    return false;
  }
};


module.exports = {
  pool,
  testConnection,
  initializeDatabase
};