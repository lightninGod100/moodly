// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { ERROR_CATALOG, getError } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

// Middleware to verify JWT token from cookies
const authenticateToken = async (req, res, next) => {
  let decoded = null; // Declare decoded in outer scope
  
  try {
    // Get token from cookies (NOT from headers anymore)
    const token = req.cookies.accessToken;

    if (!token) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_TOKEN_REQUIRED.code,
        ERROR_CATALOG.AUTH_TOKEN_REQUIRED.message
      );
      return res.status(401).json(errorResponse);
    }

    // Verify token
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure user still exists
    const user = await pool.query(
      'SELECT id, email, country, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (user.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_USER_NOT_EXISTS.code,
        ERROR_CATALOG.AUTH_USER_NOT_EXISTS.message
      );
      return res.status(401).json(errorResponse);
    }

    // Add user info to request object
    req.user = {
      id: user.rows[0].id,
      email: user.rows[0].email,
      country: user.rows[0].country,
      createdAt: user.rows[0].created_at
    };

    next(); // Continue to the next middleware/route handler
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_TOKEN_MALFORMED.code,
        ERROR_CATALOG.AUTH_TOKEN_MALFORMED.message
      );
      return res.status(401).json(errorResponse);
    }
    
    if (error.name === 'TokenExpiredError') {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_TOKEN_EXPIRED.code,
        ERROR_CATALOG.AUTH_TOKEN_EXPIRED.message
      );
      return res.status(401).json(errorResponse);
    }

    // System error - with server logging
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      ERROR_CATALOG.SYS_INTERNAL_ERROR.message,
      'AUTH_MIDDLEWARE',
      'authentication verification',
      error,
      decoded?.userId || null // Now decoded is in scope
    );
    res.status(500).json(errorResponse);
  }
};

module.exports = {
  authenticateToken
};