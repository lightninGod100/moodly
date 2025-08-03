// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateEmail } = require('../middleware/emailValidation');
// ADD: Rate limiting imports
const { registerProgressiveLimiter } = require('../middleware/progressivePenalty');
const { authHighSecurity, logoutLimiter } = require('../middleware/rateLimiting');
const router = express.Router();

// Register new user
router.post('/register', registerProgressiveLimiter, validateEmail, async (req, res) => {
  try {
    const { username, email, password, country, gender } = req.body;

    // Validation
    if (!username || !email || !password || !country || !gender) {
      return res.status(400).json({
        error: 'All fields are required',
        required: ['username', 'email', 'password', 'country', 'gender']
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Username validation
    if (username.length < 3 || username.length > 16) {
      return res.status(400).json({
        error: 'Username must be between 3 and 16 characters'
      });
    }
    // Username format validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }
    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }
    // Check if username already exists
    const existingUsername = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({
        error: 'Username is already taken'
      });
    }
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user - ADD: UNIX timestamp for created_at
    const now = Date.now(); // UNIX timestamp in milliseconds
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
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// Login user
router.post('/login', authHighSecurity, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    // Find user
    const user = await pool.query(
      'SELECT id, email, password_hash, country, created_at, mark_for_deletion FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    try {
      const loginTimestamp = Date.now(); // UNIX timestamp in milliseconds
      await pool.query(
        'INSERT INTO user_activity_log (user_id, key, value_timestamp, created_at) VALUES ($1, $2, $3, $4)',
        [user.rows[0].id, 'account_login', loginTimestamp, loginTimestamp]
      );

      console.log(`✅ User ${user.rows[0].id} logged in successfully at ${new Date(loginTimestamp).toISOString()}`);
    } catch (logError) {
      console.error('❌ Failed to log login activity:', logError.message);
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
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// POST /api/auth/logout - Logout user and log activity
router.post('/logout', logoutLimiter, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now(); // UNIX timestamp in milliseconds

    // Log logout activity
    await pool.query(
      'INSERT INTO user_activity_log (user_id, key, value_timestamp, created_at) VALUES ($1, $2, $3, $4)',
      [userId, 'account_logout', now, now]
    );

    console.log(`✅ User ${userId} logged out successfully at ${new Date(now).toISOString()}`);

    res.json({
      message: 'Logout successful',
      timestamp: now
    });

  } catch (error) {
    console.error('Logout activity logging error:', error);

    // Even if logging fails, we should return success
    // Frontend will clear tokens regardless
    res.json({
      message: 'Logout completed',
      note: 'Activity logging may have failed but logout was processed'
    });
  }
});
// Test protected route
router.get('/me', async (req, res) => {
  try {
    // This route will be protected by middleware we'll create next
    res.json({
      message: 'This is a protected route',
      user: req.user // Will be set by auth middleware
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching user data'
    });
  }
});

module.exports = router;