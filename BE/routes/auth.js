// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateEmail } = require('../middleware/emailValidation');
// ADD: Rate limiting imports
const { registerProgressiveLimiter } = require('../middleware/progressivePenalty');
const { arl_authHighSecurity, arl_logoutLimiter } = require('../middleware/rateLimiting');

const { ERROR_CATALOG, getError } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');
const router = express.Router();

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '14d' }
  );

  return { accessToken, refreshToken };
};

// Helper function to save refresh token to database
const saveRefreshToken = async (userId, refreshToken, deviceId, deviceInfo = {}) => {
  const now = Date.now(); // Current time in epoch milliseconds
  const expiresAt = now + (14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds

  // First, delete any existing token for this device
  await pool.query(
    'DELETE FROM refresh_tokens WHERE user_id = $1 AND device_id = $2',
    [userId, deviceId]
  );

  // Then insert the new token
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, device_id, device_info, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, refreshToken, deviceId, JSON.stringify(deviceInfo), now, expiresAt]
  );
};

// Helper function to hash device fingerprint
const hashDeviceFingerprint = (fingerprint) => {
  if (!fingerprint || typeof fingerprint !== 'string') {
    // Generate a random ID if no fingerprint provided
    return crypto.randomBytes(16).toString('hex');
  }
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};
// Cookie configuration
const getCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/'
});

// Register new user
router.post('/register', registerProgressiveLimiter, validateEmail, async (req, res) => {
  try {
    const { username, email, password, country, gender, deviceId, deviceInfo } = req.body;

    // Hash the device ID if provided
    const hashedDeviceId = hashDeviceFingerprint(deviceId);

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


    const { accessToken, refreshToken } = generateTokens(newUser.rows[0].id);
    await saveRefreshToken(newUser.rows[0].id, refreshToken, hashedDeviceId, deviceInfo || {});

    // Set cookies
    const cookieConfig = getCookieConfig();

    res.cookie('accessToken', accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieConfig,
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    });


    res.status(201).json({
      message: 'Registration successful',
      user: {
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
        country: newUser.rows[0].country,
        createdAt: newUser.rows[0].created_at
      }
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
    const { email, password, deviceId, deviceInfo } = req.body;

    // Hash the device ID if provided
    const hashedDeviceId = hashDeviceFingerprint(deviceId);

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
      'SELECT id, username, email, password_hash, country, created_at, mark_for_deletion FROM users WHERE email = $1',
      //           ↑ add username here
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
    // Generate both tokens
    const { accessToken, refreshToken } = generateTokens(user.rows[0].id);

    // Save refresh token to database (WITHOUT deleting existing ones)
    await saveRefreshToken(user.rows[0].id, refreshToken, hashedDeviceId, deviceInfo || {});


    // Set cookies
    const cookieConfig = getCookieConfig();

    res.cookie('accessToken', accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieConfig,
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    });

    // Send response
    res.status(200).json({
      message: 'Login successful',
      user: {
        username: user.rows[0].username,
      }
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

    // Delete only this device's refresh token from database
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );
    }

    // Clear ALL auth-related cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('userData', cookieOptions);

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

// POST /api/auth/refresh - Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
  console.log('Refresh token request received');
  try {
    const { refreshToken } = req.cookies;
    const { deviceId, deviceInfo } = req.body; // Accept device info for rotation

    // Hash the device ID if provided
    const hashedDeviceId = deviceId ? hashDeviceFingerprint(deviceId) : null;
    // Check if refresh token exists
    if (!refreshToken) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_REFRESH_TOKEN_REQUIRED.code,
        'Refresh token required'
      );
      return res.status(401).json(errorResponse);
    }

    // Verify refresh token JWT
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_REFRESH_TOKEN_INVALID.code,
        'Invalid refresh token'
      );
      return res.status(401).json(errorResponse);
    }

    // Check if refresh token exists in database
    const tokenResult = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2',
      [refreshToken, decoded.userId]
    );

    if (tokenResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_REFRESH_TOKEN_REVOKED.code,
        'Refresh token has been revoked'
      );
      return res.status(401).json(errorResponse);
    }

    // Check if token is expired in database
    if (new Date(tokenResult.rows[0].expires_at) < Date.now()) {
      // Clean up expired token
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_REFRESH_TOKEN_EXPIRED.code,
        'Refresh token has expired'
      );
      return res.status(401).json(errorResponse);
    }
    // Update last_used timestamp for the current token
    const now = Date.now();
    // await pool.query(
    //   'UPDATE refresh_tokens SET last_used = $1 WHERE token = $2',
    //   [now, refreshToken]
    // );
    // Generate new token pair (rotation)
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    // Delete old refresh token
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    // Save new refresh token with same device ID or use from request
    const deviceIdToUse = hashedDeviceId || tokenResult.rows[0].device_id;
    const deviceInfoToUse = deviceInfo || tokenResult.rows[0].device_info || {};
    
    await saveRefreshToken(decoded.userId, newRefreshToken, deviceIdToUse, deviceInfoToUse);


    // Set new cookies
    const cookieConfig = getCookieConfig();

    res.cookie('accessToken', newAccessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', newRefreshToken, {
      ...cookieConfig,
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    });

    res.json({
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'POST /api/auth/refresh',
      '',
      error,
      null
    );
    res.status(500).json(errorResponse);
  }
});

router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all refresh tokens for this user
    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );

    // Clear cookies for current session
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.json({
      message: 'Logged out from all devices successfully',
      devicesAffected: result.rowCount
    });

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'POST /api/auth/logout-all',
      'delete from database',
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

// GET /api/auth/verify - Verify authentication and return username
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // The authenticateToken middleware has already verified the cookie and set req.user
    // But we need to fetch the username since the middleware doesn't include it
    
    const userResult = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_USER_NOT_EXISTS.code,
        ERROR_CATALOG.AUTH_USER_NOT_EXISTS.message
      );
      return res.status(401).json(errorResponse);
    }

    // Return success with username only
    res.status(200).json({ 
      authenticated: true,
      username: userResult.rows[0].username 
    });

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'GET /api/auth/verify',
      'read from database',
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

module.exports = router;