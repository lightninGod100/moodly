// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/database');
const userStatsRoutes = require('./routes/userStats');
const userSettingsRoutes = require('./routes/userSettings');

// Import routes
const authRoutes = require('./routes/auth');
const MoodsRoutes = require('./routes/moods');
const worldStatsRoutes = require('./routes/worldStats');
const contactRoutes = require('./routes/contact');
const moodSelectedStatsRoutes = require('./routes/moodSelectedStats');
const { globalErrorHandler } = require('./middleware/errorHandler');
// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { arl_healthCheck } = require('./middleware/rateLimiting');
const { enhancedJsonParser } = require('./middleware/jsonParser');

const { ERROR_CATALOG } = require('./config/errorCodes');
const ErrorLogger = require('./services/errorLogger');
const { createTimeoutMiddleware, timeoutDurations } = require('./middleware/timeout');
// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;
// ADD: Rate limiting import

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(enhancedJsonParser());
app.use(express.urlencoded({ extended: true, limit: '150kb' }));
app.use(createTimeoutMiddleware(timeoutDurations.fast));
// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Moodly Backend API is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/api/health', arl_healthCheck, async (req, res) => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    res.json({
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      server: 'running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'GET /api/health',
      'health check database test',
      error,
      null,
      'health-check'
    );

    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});

// Test database query route
app.get('/api/test-db', arl_healthCheck, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users LIMIT 5');
    res.json({
      message: 'Database query successful',
      userCount: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'GET /api/test-db',
      'test database query',
      error,
      null
    );
    res.status(500).json(errorResponse);
  }
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/moods', MoodsRoutes);
app.use('/api/world-stats', worldStatsRoutes);
app.use('/api/user-stats', userStatsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/mood-selected-stats', moodSelectedStatsRoutes);

// Protected route example (requires authentication)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Successfully accessed protected route',
      user: req.user
    });
  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      ERROR_CATALOG.SYS_INTERNAL_ERROR.message,
      'GET /api/auth/me',
      'fetch user data',
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// Error handling middleware
app.use(globalErrorHandler);

// 404 handler
// BE/server.js - Updated 404 handler
app.use('*', (req, res) => {
  const errorResponse = ErrorLogger.createErrorResponse(
    ERROR_CATALOG.API_ENDPOINT_NOT_FOUND.code,
    ERROR_CATALOG.API_ENDPOINT_NOT_FOUND.message
  );

  res.status(404).json(errorResponse);
});

// Start server function
const startServer = async () => {
  try {
    // Test database connection first
    console.log('🚀 Starting Moodly Backend Server...');

    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_SERVER_ERROR.code,
      ERROR_CATALOG.SYS_SERVER_ERROR.message,
      'SERVER_STARTUP',
      'start server',
      error,
      null,
      'server-startup'
    );

    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;