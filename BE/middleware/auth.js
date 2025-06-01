// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authorization token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure user still exists
    const user = await pool.query(
      'SELECT id, email, country, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User no longer exists'
      });
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
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error during authentication'
    });
  }
};

module.exports = {
  authenticateToken
};