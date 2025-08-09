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
const arl_authHighSecurity = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // 5 attempts per 15 minutes
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
const arl_userHighSecurity = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

const arl_user_settings_password_change = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 4, // 4 attempts per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * USER SETTINGS READ - Moderate protection (User-based)
 * Used for: GET /api/user-settings
 * Prevents abuse while allowing legitimate app loads/refreshes
 */
const arl_userSettingsRead = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 20 requests per hour per user
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});
/**
 * MEDIUM USAGE - Regular application features (User/Session-based)
 * Used for: mood tracking, world stats, user settings updates
 */
const arl_mediumUsage = rateLimit({
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
const arl_moodCreation = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8, // 20 mood entries per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * MOOD RETRIEVAL - Tiered limiting
 * Used for: GET /api/moods/last
 */
const arl_moodRetrievalLast = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute windows
  max: 8, // 8 requests per 10 minutes
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});
/**
 * LOW USAGE - Dashboard and statistics (User-based)
 * Used for: user stats, mood history
 */
const arl_lowUsage = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 120, // 120 requests per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

const  arl_user_stats = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 24, // 8*No of API call on dashboard page
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

const arl_world_stats = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 48, // 10 page loads * 3 APIs = 30 requests per hour per IP
  // No keyGenerator = IP-based limiting
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

const arl_mood_selected_stats = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 32, // 8*No of API call on dashboard page
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});
/**
 * VERY LOW USAGE - Critical settings (User-based)
 * Used for: country change (business rule: 2/day), account deletion (1/day)
 */
const arl_veryLowUsage = rateLimit({
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
const arl_account_deletion = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // 2 attempt per day
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

const arl_validate_password = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 4, // 4 attempt per day
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

const arl_country_change = rateLimit({
  windowMs: 24 * 24 * 60 * 60 * 1000, // 24 days (close to 1 month, within Node.js limits)
  max: 2, // 2 attempts per month
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});
/**
 * LOGOUT - Special case (User-based, very permissive)
 * Used for: POST /api/auth/logout
 */
const arl_logoutLimiter = rateLimit({
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
const arl_healthCheck = rateLimit({
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
const arl_photo_upload_delete = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 10 uploads per hour
  keyGenerator: generateUserKey,
  handler: rateLimitErrorHandler,
  standardHeaders: false,
  legacyHeaders: false
});

module.exports = {
  // High Security
  arl_authHighSecurity,
  arl_userHighSecurity,
  arl_user_settings_password_change,
  arl_userSettingsRead,
  // Medium Usage
  arl_mediumUsage,
  arl_moodCreation,

  // Low Usage
  arl_lowUsage,
  arl_user_stats,
  arl_mood_selected_stats,
  arl_world_stats,
  // Special Cases
  arl_veryLowUsage,
  arl_account_deletion,
  arl_logoutLimiter,
  arl_photo_upload_delete,
  arl_moodRetrievalLast,
  arl_validate_password,
  arl_country_change,
  // Infrastructure
  arl_healthCheck
};