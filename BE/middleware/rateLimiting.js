// BE/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');
const { 
  generateUserKey, 
  rateLimitErrorHandler, 
  skipSuccessfulRequests 
} = require('./rateLimitHelpers');

/**
 * HIGH SECURITY - Authentication endpoints (IP-based)
 * Used for: login
 */
const authHighSecurity = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  // Remove keyGenerator - use default IPv6-safe IP-based limiting
  handler: rateLimitErrorHandler,
  standardHeaders: false, // Disable rate limit headers
  legacyHeaders: false,
  skipSuccessfulRequests: true // Only count failed login attempts
});

/**
 * USER HIGH SECURITY - Critical user actions (User-based)
 * Used for: password change, account deletion
 */
const userHighSecurity = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * MEDIUM USAGE - Regular application features (User/Session-based)
 * Used for: mood tracking, world stats, user settings updates
 */
const mediumUsage = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // 60 requests per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * MEDIUM USAGE - Mood creation (User-based)
 * Used for: POST /api/moods
 */
const moodCreation = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 mood entries per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * LOW USAGE - Dashboard and statistics (User-based)
 * Used for: user stats, mood history
 */
const lowUsage = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 120, // 120 requests per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * VERY LOW USAGE - Critical settings (User-based)
 * Used for: country change (business rule: 2/day), account deletion (1/day)
 */
const veryLowUsage = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // 2 requests per day
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * ACCOUNT DELETION - Ultra restricted (User-based)
 * Used for: DELETE /api/user-settings/account
 */
const accountDeletion = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // 1 attempt per day
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * LOGOUT - Special case (User-based, very permissive)
 * Used for: POST /api/auth/logout
 */
const logoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * HEALTH CHECK - Monitoring endpoints (IP-based)
 * Used for: /api/health, test endpoints
 */
const healthCheck = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  // Remove keyGenerator - use default IPv6-safe IP-based limiting
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * PHOTO UPLOAD - File upload protection (User-based)
 * Used for: PUT /api/user-settings/photo
 */
const photoUpload = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

module.exports = {
  // High Security
  authHighSecurity,
  userHighSecurity,
  
  // Medium Usage
  mediumUsage,
  moodCreation,
  
  // Low Usage
  lowUsage,
  
  // Special Cases
  veryLowUsage,
  accountDeletion,
  logoutLimiter,
  photoUpload,
  
  // Infrastructure
  healthCheck
};