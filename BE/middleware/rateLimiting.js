// BE/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');
const {
  generateUserKey,
  createRateLimitErrorHandler
} = require('./rateLimitHelpers');

/**
 * HIGH SECURITY - Authentication endpoints (IP-based)
 * Used for: login
 */
/**
 * HIGH SECURITY - Authentication endpoints (IP-based)
 * Used for: login
 */
const arl_authHighSecurity = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // 5 attempts per 15 minutes
  handler: createRateLimitErrorHandler('auth_login', 'POST /api/auth/login', 'ip'),
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * USER HIGH SECURITY - Critical user actions (User-based)
 * Used for: password change, account deletion
 */
const arl_userHighSecurity = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('account_deletion', 'DELETE /api/user-settings/account', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_user_settings_password_change = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 4, // 4 attempts per hour
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('password_change', 'PUT /api/user-settings/password', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_userSettingsRead = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 15 requests per hour per user
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('user_settings_read', 'GET /api/user-settings', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_mediumUsage = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // 60 requests per hour
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('moods', 'API /api/moods/*', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_moodCreation = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8, // 20 mood entries per hour
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('moods', 'POST /api/moods', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_moodRetrievalLast = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute windows
  max: 8, // 8 requests per 10 minutes
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('moods', 'GET /api/moods/last', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_lowUsage = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 120, // 120 requests per hour
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('user_stats', 'API /api/user-stats/*', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_user_stats = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 24, // 8*No of API call on dashboard page
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('user_stats', 'GET /api/user-stats/*', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_world_stats = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 48, // 10 page loads * 3 APIs = 30 requests per hour per IP
  handler: createRateLimitErrorHandler('world_stats', 'GET /api/world-stats/*', 'ip'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_mood_selected_stats = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 32, // 8*No of API call on dashboard page
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('mood_selected_stats', 'GET /api/mood-selected-stats/*', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_veryLowUsage = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // 2 requests per day
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('country_change', 'PUT /api/user-settings/country', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_account_deletion = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // 2 attempt per day
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('account_deletion', 'DELETE /api/user-settings/account', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_validate_password = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 4, // 4 attempt per day
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('validate_password', 'POST /api/user-settings/validate-password', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_country_change = rateLimit({
  windowMs: 24 * 24 * 60 * 60 * 1000, // 24 days (close to 1 month, within Node.js limits)
  max: 2, // 2 attempts per month
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('country_change', 'PUT /api/user-settings/country', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_logoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('auth_logout', 'POST /api/auth/logout', 'user'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_healthCheck = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  handler: createRateLimitErrorHandler('health_check', 'GET /api/health', 'ip'),
  standardHeaders: false,
  legacyHeaders: false
});

const arl_photo_upload_delete = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 10 uploads per hour
  keyGenerator: generateUserKey,
  handler: createRateLimitErrorHandler('photo_upload', 'PUT /api/user-settings/photo', 'user'),
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