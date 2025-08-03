// BE/middleware/rateLimitHelpers.js
const jwt = require('jsonwebtoken');

/**
 * Generate rate limiting key for authenticated users only
 * Falls back to default IP-based limiting if not authenticated
 * @param {Object} req - Express request object
 * @returns {string|undefined} - User-based key or undefined (uses default)
 */
const generateUserKey = (req) => {
  try {
    // Try to extract user ID from JWT token
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return `user-${decoded.userId}`;
    }
  } catch (error) {
    // Token invalid or missing, fall back to default IP-based
  }
  
  // Return undefined to use express-rate-limit's default IPv6-safe key generation
  return undefined;
};

/**
 * Standard rate limit error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const rateLimitErrorHandler = (req, res, next) => {
  return res.status(429).json({
    error: 'Something went wrong. If issue persists kindly reach to support.'
  });
};

/**
 * Skip rate limiting for successful requests (used in some configurations)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} - Whether to skip rate limiting
 */
const skipSuccessfulRequests = (req, res) => {
  return res.statusCode < 400;
};

module.exports = {
  generateUserKey,
  rateLimitErrorHandler,
  skipSuccessfulRequests
};