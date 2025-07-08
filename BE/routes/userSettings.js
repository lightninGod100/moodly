// routes/userSettings.js
const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      'SELECT id, email, country, gender, profile_photo, last_country_change_at, mark_for_deletion, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Calculate next country change date with proper validation
    let nextCountryChangeDate = null;
    if (!canChangeCountry(user.last_country_change_at) && user.last_country_change_at) {
      const nextChangeTimestamp = user.last_country_change_at + (30 * 24 * 60 * 60 * 1000);
      if (nextChangeTimestamp && !isNaN(nextChangeTimestamp)) {
        const dateObj = new Date(nextChangeTimestamp);
        if (!isNaN(dateObj.getTime())) {
          nextCountryChangeDate = dateObj.toISOString();
        }
      }
    }

    return res.json({
      message: 'User settings retrieved successfully',
      settings: {
        id: user.id,
        email: user.email,
        country: user.country,
        gender: user.gender,
        profilePhoto: user.profile_photo,
        lastCountryChangeAt: user.last_country_change_at,
        canChangeCountry: canChangeCountry(user.last_country_change_at),
        nextCountryChangeDate: nextCountryChangeDate,
        markForDeletion: user.mark_for_deletion
      }
    });

  } catch (error) {
    console.error('Get user settings error:', error);
    return res.status(500).json({
      error: 'Internal server error while retrieving user settings'
    });
  }
});

// PUT /api/user-settings/password - Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters long'
      });
    }

    // Get user's current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const validCurrentPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    
    if (!validCurrentPassword) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    return res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      error: 'Internal server error while changing password'
    });
  }
});

// PUT /api/user-settings/country - Update country (with 30-day restriction)
router.put('/country', authenticateToken, async (req, res) => {
  try {
    const { country } = req.body;
    const userId = req.user.id;

    // Validation
    if (!country || typeof country !== 'string' || country.trim().length === 0) {
      return res.status(400).json({
        error: 'Valid country is required'
      });
    }

    // Get user's current country and last change timestamp
    const userResult = await pool.query(
      'SELECT country, last_country_change_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const currentUser = userResult.rows[0];

    // Check if country is actually different
    if (currentUser.country === country.trim()) {
      return res.status(400).json({
        error: 'New country must be different from current country'
      });
    }

    // Check 30-day restriction
    if (!canChangeCountry(currentUser.last_country_change_at)) {
      const nextChangeTimestamp = currentUser.last_country_change_at + (30 * 24 * 60 * 60 * 1000);
      const nextChangeDate = new Date(nextChangeTimestamp);
      return res.status(429).json({
        error: 'Country can only be changed once per month',
        nextChangeDate: nextChangeDate.toISOString(),
        message: `Next change available: ${nextChangeDate.toLocaleDateString()}`
      });
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
    console.error('Update country error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating country'
    });
  }
});

// PUT /api/user-settings/photo - Upload/update profile photo
router.put('/photo', authenticateToken, async (req, res) => {
  try {
    const { photoData } = req.body;
    const userId = req.user.id;

    // Validation
    if (!photoData || typeof photoData !== 'string') {
      return res.status(400).json({
        error: 'Photo data is required'
      });
    }

    // Validate Base64 image
    const validation = validateBase64Image(photoData);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
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
    console.error('Update profile photo error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating profile photo'
    });
  }
});

// DELETE /api/user-settings/photo - Remove profile photo
router.delete('/photo', authenticateToken, async (req, res) => {
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
    console.error('Remove profile photo error:', error);
    return res.status(500).json({
      error: 'Internal server error while removing profile photo'
    });
  }
});

// DELETE /api/user-settings/account - Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Validation
    if (!password) {
      return res.status(400).json({
        error: 'Password is required to delete account'
      });
    }

    // Get user's password hash, email, and deletion status
    const userResult = await pool.query(
      'SELECT password_hash, email, mark_for_deletion FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Check if account is already marked for deletion
    if (user.mark_for_deletion) {
      return res.status(400).json({
        error: 'Account is already marked for deletion'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(400).json({
        error: 'Incorrect password'
      });
    }

    // Mark account for deletion instead of immediate deletion
    await pool.query(
      'UPDATE users SET mark_for_deletion = TRUE WHERE id = $1',
      [userId]
    );

    return res.json({
      message: 'Account marked for deletion. You will receive a confirmation email shortly.'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      error: 'Internal server error while processing account deletion'
    });
  }
});

module.exports = router;