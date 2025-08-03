// BE/middleware/rateLimitHelpers.js
const jwt = require('jsonwebtoken');

/**
 * Generate rate limiting key based on user authentication status
 * @param {Object} req - Express request object
 * @returns {string} - Rate limiting key (user-based or IP-based)
 */
const generateRateLimitKey = (req) => {
  try {
    // Try to extract user ID from JWT token
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return `user-${decoded.userId}`;
    }
  } catch (error) {
    // Token invalid or missing, fall back to IP
  }
  
  // Fall back to IP-based limiting for anonymous users
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  return `ip-${clientIP}`;
};

/**
 * Generate IP-based key (for auth endpoints that should always be IP-based)
 * @param {Object} req - Express request object
 * @returns {string} - IP-based rate limiting key
 */
const generateIPKey = (req) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  return `ip-${clientIP}`;
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
  generateRateLimitKey,
  generateIPKey,
  rateLimitErrorHandler,
  skipSuccessfulRequests
};