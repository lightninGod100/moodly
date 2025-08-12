// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateEmail } = require('../middleware/emailValidation');
// ADD: Rate limiting imports
const { registerProgressiveLimiter } = require('../middleware/progressivePenalty');
const { arl_authHighSecurity, arl_logoutLimiter } = require('../middleware/rateLimiting');

const { ERROR_CATALOG, getError } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');
const router = express.Router();

// Register new user
router.post('/register', registerProgressiveLimiter, validateEmail, async (req, res) => {
  try {
    const { username, email, password, country, gender } = req.body;

    // Field presence validation
    if (!username || !email || !password || !country || !gender) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_ALL_FIELDS_REQUIRED.code,
        ERROR_CATALOG.VAL_ALL_FIELDS_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Username validation
    if (!username.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USERNAME_REQUIRED.code,
        ERROR_CATALOG.VAL_USERNAME_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    if (username.length < 3) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USERNAME_TOO_SHORT.code,
        ERROR_CATALOG.VAL_USERNAME_TOO_SHORT.message
      );
      return res.status(400).json(errorResponse);
    }

    if (username.length > 16) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USERNAME_TOO_LONG.code,
        ERROR_CATALOG.VAL_USERNAME_TOO_LONG.message
      );
      return res.status(400).json(errorResponse);
    }

    // Username format validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USERNAME_INVALID_FORMAT.code,
        ERROR_CATALOG.VAL_USERNAME_INVALID_FORMAT.message
      );
      return res.status(400).json(errorResponse);
    }

    // Password validation
    if (!password.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED.code,
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    if (password.length < 6) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PASSWORD_TOO_SHORT.code,
        ERROR_CATALOG.VAL_PASSWORD_TOO_SHORT.message
      );
      return res.status(400).json(errorResponse);
    }

    // Country validation
    if (!country.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_COUNTRY_REQUIRED.code,
        ERROR_CATALOG.VAL_COUNTRY_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Gender validation
    if (!gender.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_GENDER_REQUIRED.code,
        ERROR_CATALOG.VAL_GENDER_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Check if username already exists - NO SERVER LOGGING (validation error)
    const existingUsername = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (existingUsername.rows.length > 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USERNAME_TAKEN.code,
        ERROR_CATALOG.VAL_USERNAME_TAKEN.message
      );
      return res.status(409).json(errorResponse);
    }

    // Check if email already exists - NO SERVER LOGGING (validation error)
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_EMAIL_TAKEN.code,
        ERROR_CATALOG.VAL_EMAIL_TAKEN.message
      );
      return res.status(409).json(errorResponse);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const now = Date.now();
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash, country, gender, created_at, created_at_utc, last_country_change_at) VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($6::bigint/1000.0), $6) RETURNING id, username, email, country, gender, created_at, created_at_utc, test_user, last_country_change_at',
      [username.toLowerCase(), email.toLowerCase(), passwordHash, country, gender.toLowerCase(), now]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.rows[0].id,
        email: newUser.rows[0].email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        country: newUser.rows[0].country,
        createdAt: newUser.rows[0].created_at
      },
      token
    });

  } catch (error) {
    // Multi-operation endpoint - let ErrorLogger determine context
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'POST /api/auth/register',
      "", // Empty string - multiple operations, let ErrorLogger analyze
      error,
      null
    );
    res.status(500).json(errorResponse);
  }
});

// Login user
router.post('/login', arl_authHighSecurity, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Field validation - NO SERVER LOGGING (validation errors)
    if (!email || !password) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_ALL_FIELDS_REQUIRED.code,
        'Email and password are required'
      );
      return res.status(400).json(errorResponse);
    }

    if (!email.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_EMAIL_REQUIRED.code,
        ERROR_CATALOG.VAL_EMAIL_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    if (!password.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED.code,
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Find user
    const user = await pool.query(
      'SELECT id, email, password_hash, country, created_at, mark_for_deletion FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Invalid credentials - NO SERVER LOGGING (validation/auth error)
    if (user.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.code,
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.message
      );
      return res.status(401).json(errorResponse);
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    // Invalid password - NO SERVER LOGGING (validation/auth error)
    if (!validPassword) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.code,
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.message
      );
      return res.status(401).json(errorResponse);
    }

    // Activity logging
    try {
      const loginTimestamp = Date.now();
      await pool.query(
        'INSERT INTO user_activity_log (user_id, key, value_timestamp, created_at) VALUES ($1, $2, $3, $4)',
        [user.rows[0].id, 'account_login', loginTimestamp, loginTimestamp]
      );

      console.log(`✅ User ${user.rows[0].id} logged in successfully at ${new Date(loginTimestamp).toISOString()}`);
    } catch (logError) {
      // Activity logging failure shouldn't block login, but should be logged
      ErrorLogger.serverLogError(
        ERROR_CATALOG.SYS_DATABASE_ERROR.code,
        ERROR_CATALOG.SYS_DATABASE_ERROR.message,
        'POST /api/auth/login',
        'write to database',
        logError,
        user.rows[0].id,
        'pending-react-routing'
      );
      // Continue with login - logging failure shouldn't block authentication
    }

    // Cancel deletion request if user logs back in
    if (user.rows[0].mark_for_deletion) {
      await pool.query(
        'UPDATE users SET mark_for_deletion = FALSE, mark_for_deletion_at = NULL WHERE id = $1',
        [user.rows[0].id]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.rows[0].id,
        email: user.rows[0].email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        country: user.rows[0].country,
        createdAt: user.rows[0].created_at
      },
      token
    });

  } catch (error) {
    // Multi-operation endpoint - let ErrorLogger determine context
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'POST /api/auth/login',
      "", // Empty string - multiple operations (SELECT, bcrypt, INSERT, UPDATE, JWT)
      error,
      null
    );
    res.status(500).json(errorResponse);
  }
});

// POST /api/auth/logout - Logout user and log activity
// POST /api/auth/logout - HYBRID VERSION
router.post('/logout', arl_logoutLimiter, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();

    const logoutTimestamp = req.body.timestamp || now;
    const retryAttempt = req.body.retryAttempt || 0;

    // Validate timestamp to prevent abuse - NO SERVER LOGGING (validation error)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (logoutTimestamp > now + 60000 || now - logoutTimestamp > maxAge) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_INVALID_EMAIL.code, // Reusing for timestamp validation
        'Invalid timestamp'
      );
      return res.status(400).json(errorResponse);
    }

    // Store logout activity
    await pool.query(
      `INSERT INTO user_activity_log (user_id, key, value_timestamp, created_at, value_string) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'account_logout',
        logoutTimestamp,
        now,
        JSON.stringify({
          retryAttempt: retryAttempt,
          serverDelay: now - logoutTimestamp,
          source: retryAttempt > 0 ? 'retry' : 'immediate'
        })
      ]
    );

    console.log(`✅ User ${userId} logout logged: ${new Date(logoutTimestamp).toISOString()} (attempt: ${retryAttempt})`);

    res.json({
      message: 'Logout successful',
      timestamp: logoutTimestamp,
      serverTimestamp: now,
      attempt: retryAttempt
    });

  } catch (error) {
    // Single operation endpoint - we know it's the INSERT that failed
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'POST /api/auth/logout',
      'write to database', // Specific context - only INSERT operation can fail
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});
// Test protected route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'This is a protected route',
      user: req.user
    });
  } catch (error) {
    // Simple endpoint - no database operations, just JSON response
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      ERROR_CATALOG.SYS_INTERNAL_ERROR.message,
      'GET /api/auth/me',
      'system operation', // Specific context - no DB, just system/JSON response
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

module.exports = router;