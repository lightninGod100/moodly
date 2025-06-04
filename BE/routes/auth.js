// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, country } = req.body;

    // Validation
    if (!email || !password || !country) {
      return res.status(400).json({
        error: 'All fields are required',
        required: ['email', 'password', 'country']
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
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
     'INSERT INTO users (email, password_hash, country, created_at, created_at_utc) VALUES ($1, $2, $3, $4, to_timestamp($4::bigint/1000.0)) RETURNING id, email, country, created_at, created_at_utc, test_user',
     [email.toLowerCase(), passwordHash, country, now]
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await pool.query(
      'SELECT id, email, password_hash, country, created_at FROM users WHERE email = $1',
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