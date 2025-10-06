// routes/userSettings.js
const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const { sendAccountDeletionEmails } = require('../services/emailService');
// Import email functionality
// ADD: Rate limiting imports
const { ERROR_CATALOG, getError } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');
const { arl_account_deletion, arl_photo_upload_delete, arl_validate_password, arl_country_change, arl_user_settings_password_change, arl_userSettingsRead } = require('../middleware/rateLimiting');

// Helper function to validate Base64 image
const validateBase64Image = (base64String) => {
  try {
    // Check if it's a valid Base64 image
    if (!base64String.startsWith('data:image/')) {
      return { valid: false, error: 'Invalid image format' };
    }

    // Extract image type
    const imageType = base64String.split(';')[0].split('/')[1];
    const allowedTypes = ['png', 'jpeg', 'jpg'];

    if (!allowedTypes.includes(imageType.toLowerCase())) {
      return { valid: false, error: 'Only PNG and JPEG images are allowed' };
    }

    // Calculate file size from Base64 (approximate)
    const base64Data = base64String.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeBytes = 100 * 1024; // 100KB

    if (sizeInBytes > maxSizeBytes) {
      return {
        valid: false,
        error: `Image size must be less than 100KB. Current size: ${Math.round(sizeInBytes / 1024)}KB`
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid image data' };
  }
};

// Helper function to check if country can be changed (30-day restriction)
const canChangeCountry = (lastChangeTimestamp) => {
  if (!lastChangeTimestamp) return true;

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return (now - lastChangeTimestamp) >= thirtyDaysMs;
};

// GET /api/user-settings - Get current user settings

router.get('/', arl_userSettingsRead, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's password hash, email, username, and deletion status
    const userResult = await pool.query(
      'SELECT id, username, email, country, gender, profile_photo, last_country_change_at, mark_for_deletion, mark_for_deletion_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USER_NOT_FOUND.code,
        ERROR_CATALOG.VAL_USER_NOT_FOUND.message
      );
      return res.status(404).json(errorResponse);
    }

    const user = userResult.rows[0];

    // Calculate next country change date with proper validation
    let nextCountryChangeDate = null;
    if (user.last_country_change_at && !canChangeCountry(user.last_country_change_at)) {
      const nextChangeTimestamp = parseInt(user.last_country_change_at) + (30 * 24 * 60 * 60 * 1000);
      const dateObj = new Date(nextChangeTimestamp);
      if (!isNaN(dateObj.getTime())) {
        nextCountryChangeDate = dateObj.toISOString();
      }
    }

    // Calculate deletion timestamp (UTC + 7 days)
    let deletionTimestamp = null;
    if (user.mark_for_deletion_at) {
      deletionTimestamp = parseInt(user.mark_for_deletion_at) + (7 * 24 * 60 * 60 * 1000);
    }

    return res.json({
      message: 'User settings retrieved successfully',
      settings: {
        username: user.username,
        email: user.email,
        country: user.country,
        gender: user.gender,
        profilePhoto: user.profile_photo,
        lastCountryChangeAt: user.last_country_change_at,
        canChangeCountry: canChangeCountry(user.last_country_change_at),
        nextCountryChangeDate: nextCountryChangeDate,
        markForDeletion: user.mark_for_deletion,
        deletionTimestamp: deletionTimestamp
      }
    });

  } catch (error) {
    // Single operation endpoint - we know it's the SELECT that failed
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'GET /api/user-settings',
      'read from database', // Specific context - only SELECT operation can fail
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// PUT /api/user-settings/password - Change password
router.put('/password_change', arl_user_settings_password_change, authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Field validation - NO SERVER LOGGING (validation errors)
    if (!currentPassword || !newPassword) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_ALL_FIELDS_REQUIRED.code,
        ERROR_CATALOG.VAL_ALL_FIELDS_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    if (newPassword.length < 6) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PASSWORD_TOO_SHORT.code,
        ERROR_CATALOG.VAL_PASSWORD_TOO_SHORT.message
      );
      return res.status(400).json(errorResponse);
    }

    // Get user's current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    // User not found - NO SERVER LOGGING (validation error)
    if (userResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USER_NOT_FOUND.code,
        ERROR_CATALOG.VAL_USER_NOT_FOUND.message
      );
      return res.status(404).json(errorResponse);
    }

    // Verify current password - NO SERVER LOGGING (validation error)
    const validCurrentPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!validCurrentPassword) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_INCORRECT_PASSWORD.code,
        ERROR_CATALOG.AUTH_INCORRECT_PASSWORD.message
      );
      return res.status(401).json(errorResponse);
    }

    // Hash new password and update
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Invalidate all refresh tokens EXCEPT current device's
    const currentRefreshToken = req.cookies.refreshToken;
    if (currentRefreshToken) {
      // Delete all tokens for this user except the current one
      await pool.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1 AND token != $2',
        [userId, currentRefreshToken]
      );
    } else {
      // If no current token, delete all (shouldn't happen with auth middleware)
      await pool.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [userId]
      );
    }

    return res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    // Multi-operation endpoint - let ErrorLogger determine context
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'PUT /api/user-settings/password_change',
      '', // Empty string - multiple operations (SELECT + UPDATE)
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// PUT /api/user-settings/country - Update country (with 30-day restriction)
router.put('/country', arl_country_change, authenticateToken, async (req, res) => {
  try {
    const { country } = req.body;
    const userId = req.user.id;

    // Validation - NO SERVER LOGGING (validation errors)
    if (!country || typeof country !== 'string' || country.trim().length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_COUNTRY_REQUIRED.code,
        ERROR_CATALOG.VAL_COUNTRY_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Get user's current country and last change timestamp
    const userResult = await pool.query(
      'SELECT country, last_country_change_at FROM users WHERE id = $1',
      [userId]
    );

    // User not found - NO SERVER LOGGING (validation error)
    if (userResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USER_NOT_FOUND.code,
        ERROR_CATALOG.VAL_USER_NOT_FOUND.message
      );
      return res.status(404).json(errorResponse);
    }

    const currentUser = userResult.rows[0];

    // Check if country is actually different - NO SERVER LOGGING (validation error)
    if (currentUser.country === country.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_COUNTRY_SAME.code,
        ERROR_CATALOG.VAL_COUNTRY_SAME.message
      );
      return res.status(400).json(errorResponse);
    }

    // Check 30-day restriction - NO SERVER LOGGING (validation error)
    if (!canChangeCountry(currentUser.last_country_change_at)) {
      const nextChangeTimestamp = currentUser.last_country_change_at + (30 * 24 * 60 * 60 * 1000);
      const nextChangeDate = new Date(nextChangeTimestamp);
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_COUNTRY_CHANGE_RESTRICTED.code,
        ERROR_CATALOG.VAL_COUNTRY_CHANGE_RESTRICTED.message
      );
      return res.status(429).json(errorResponse);
    }

    // Update country and timestamp
    const now = Date.now();
    await pool.query(
      'UPDATE users SET country = $1, last_country_change_at = $2 WHERE id = $3',
      [country.trim(), now, userId]
    );

    return res.json({
      message: 'Country updated successfully',
      country: country.trim(),
      lastCountryChangeAt: now
    });

  } catch (error) {
    // Multi-operation endpoint - let ErrorLogger determine context
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'PUT /api/user-settings/country',
      '', // Empty string - multiple operations (SELECT + UPDATE)
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// PUT /api/user-settings/photo - Upload/update profile photo
router.put('/photo', arl_photo_upload_delete, authenticateToken, async (req, res) => {
  try {
    const { photoData } = req.body;
    const userId = req.user.id;

    // Validation - NO SERVER LOGGING (validation errors)
    if (!photoData || typeof photoData !== 'string') {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PHOTO_DATA_REQUIRED.code,
        ERROR_CATALOG.VAL_PHOTO_DATA_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Validate Base64 image - NO SERVER LOGGING (validation error)
    const validation = validateBase64Image(photoData);
    if (!validation.valid) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PHOTO_INVALID_FORMAT.code,
        ERROR_CATALOG.VAL_PHOTO_INVALID_FORMAT.message
      );
      return res.status(400).json(errorResponse);
    }

    // Update profile photo in database
    await pool.query(
      'UPDATE users SET profile_photo = $1 WHERE id = $2',
      [photoData, userId]
    );

    return res.json({
      message: 'Profile photo updated successfully'
    });

  } catch (error) {
    // Single operation endpoint - we know it's the UPDATE that failed
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'PUT /api/user-settings/photo',
      'write to database', // Specific context - only UPDATE operation can fail
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// DELETE /api/user-settings/photo - Remove profile photo
router.delete('/photo', arl_photo_upload_delete, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Remove profile photo from database (set to NULL)
    await pool.query(
      'UPDATE users SET profile_photo = NULL WHERE id = $1',
      [userId]
    );

    return res.json({
      message: 'Profile photo removed successfully'
    });

  } catch (error) {
    // Single operation endpoint - we know it's the UPDATE that failed
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'DELETE /api/user-settings/photo',
      'write to database', // Specific context - only UPDATE operation can fail
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// DELETE /api/user-settings/account - Delete account
router.delete('/account_deletion', arl_account_deletion, authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Validation - NO SERVER LOGGING (validation error)
    if (!password) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED_FOR_DELETION.code,
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED_FOR_DELETION.message
      );
      return res.status(400).json(errorResponse);
    }

    // Get user's password hash, email, and deletion status
    const userResult = await pool.query(
      'SELECT email, password_hash, mark_for_deletion FROM users WHERE id = $1',
      [userId]
    );

    // User not found - NO SERVER LOGGING (validation error)
    if (userResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USER_NOT_FOUND.code,
        ERROR_CATALOG.VAL_USER_NOT_FOUND.message
      );
      return res.status(404).json(errorResponse);
    }

    const user = userResult.rows[0];

    // Verify password - NO SERVER LOGGING (validation error)
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.code,
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.message
      );
      return res.status(400).json(errorResponse);
    }

    // Check if already marked for deletion - NO SERVER LOGGING (validation error)
    if (user.mark_for_deletion) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_ACCOUNT_ALREADY_MARKED.code,
        ERROR_CATALOG.VAL_ACCOUNT_ALREADY_MARKED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Mark account for deletion and send email
    const now = Date.now();
    await pool.query(
      'UPDATE users SET mark_for_deletion = true, mark_for_deletion_at = $1 WHERE id = $2',
      [now, userId]
    );

    // Send deletion confirmation emails (non-critical operation)
    try {
      await sendAccountDeletionEmails(user.email, userId);
    } catch (emailError) {
      // Email failure shouldn't block the deletion request
      ErrorLogger.serverLogError(
        ERROR_CATALOG.EMAIL_SENDING_FAILED.code,
        ERROR_CATALOG.EMAIL_SENDING_FAILED.message,
        'DELETE /api/user-settings/account_deletion',
        'call external service',
        emailError,
        userId,
        'pending-react-routing'
      );
    }

    res.json({
      message: 'Account marked for deletion successfully. Your account will be deleted in 7 days. You can cancel this request anytime by logging into Moodly before the 7-day period expires. You will receive confirmation emails shortly.'
    });

  } catch (error) {
    // Multi-operation endpoint - let ErrorLogger determine context
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'DELETE /api/user-settings/account_deletion',
      '', // Empty string - multiple operations (SELECT + UPDATE)
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// Add this to BE/routes/userSettings.js

// POST /api/user-settings/validate-password - Validate password only (no action)
router.post('/validate-password', arl_validate_password, authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Validation - NO SERVER LOGGING (validation error)
    if (!password) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED.code,
        ERROR_CATALOG.VAL_PASSWORD_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Get user's password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    // User not found - NO SERVER LOGGING (validation error)
    if (userResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.VAL_USER_NOT_FOUND.code,
        ERROR_CATALOG.VAL_USER_NOT_FOUND.message
      );
      return res.status(404).json(errorResponse);
    }

    // Verify password - NO SERVER LOGGING (validation error)
    const validPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);

    if (!validPassword) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.code,
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.message
      );
      return res.status(400).json(errorResponse);
    }

    // Password is correct
    return res.json({
      message: 'Password validated successfully',
      valid: true
    });

  } catch (error) {
    // Single operation endpoint - we know it's the SELECT that failed
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      ERROR_CATALOG.SYS_DATABASE_ERROR.message,
      'POST /api/user-settings/validate-password',
      'read from database', // Specific context - only SELECT operation can fail
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

module.exports = router;