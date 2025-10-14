// middleware/databaseInit.js
const { initializeDatabase } = require('../config/database');
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

/**
 * Middleware to ensure database is initialized before processing requests
 * Runs once on first request to the application
 */
const ensureDatabaseInitialized = async (req, res, next) => {
  try {
    const initialized = await initializeDatabase();
    
    if (!initialized) {
      // Database initialization failed
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.SYS_DATABASE_CONNECTION_FAILED.code,
        'Database is temporarily unavailable. Please try again in a moment.'
      );
      
      return res.status(503).json(errorResponse);
    }
    
    // Database initialized successfully, continue to route
    next();
  } catch (error) {
    // Unexpected error during initialization
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      req.path,
      'database initialization middleware',
      error,
      null
    );
    
    res.status(503).json(errorResponse);
  }
};

module.exports = { ensureDatabaseInitialized };