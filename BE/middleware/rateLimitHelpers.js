// BE/middleware/rateLimitHelpers.js
const jwt = require('jsonwebtoken');
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

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
 * Skip rate limiting for OPTIONS requests (CORS preflight)
 * @param {Object} req - Express request object
 * @returns {boolean} - True to skip rate limiting
 */
const skipOptionsRequests = (req) => {
  return req.method === 'OPTIONS';
};


// Endpoint-specific attack detection thresholds
const THRESHOLD_CONFIGS = {
  // /contact,user-settings/account_deletion,user-settings/validate-password, user-settings/password
  SUPER_HIGH_SECURITY: {
    thresholds: [10, 25, 100, 500, 2000, 5000],
    endpoints: ['contact', 'account_deletion', 'validate_password', 'password_change']
  },
  // POST /api/auth/login, PUT /api/user-settings/country
  HIGH_SECURITY: {
    thresholds: [40, 100, 250, 500, 1000, 2500],
    endpoints: ['auth_login', 'country_change']
  },
  //POST /api/auth/logout
  LOW_SECURITY : {
    thresholds: [700, 1200, 2500, 4000, 7000, 10000],
    endpoints: ['auth_logout']
  },
  // /user-settings, DELETE /api/user-settings/photo, PUT /api/user-settings/photo
  USER_SETTINGS: {
    thresholds: [80, 160, 320, 640, 2000, 5000],
    endpoints: ['user_settings_read', 'photo_upload', 'photo_delete']
  },
  // /api/moods ,/api/moods/last
  MOODS: {
    thresholds: [20, 50, 200, 500, 1000, 2500],
    endpoints: ['moods']
  },
  // /api/user-stats/, /api/mood-selected-stats/
  USER_MOOD_STATS: {
    thresholds: [60, 120, 250, 600, 2000, 5000],
    endpoints: ['user_stats','mood_selected_stats']
  },
  // /world-stats/global
  WORLD_STATS: {
    thresholds: [100, 250, 500, 1000, 2500, 5000],
    endpoints: ['world_stats']
  },
  // Infrastructure
  INFRASTRUCTURE: {
    thresholds: [100, 500, 1000, 2500, 5000, 10000],
    endpoints: ['health_check']
  }
};

// Attack detection tracking
const rateLimitAttackTracking = new Map();

/**
 * Get attack severity level based on count and threshold config
 */
const getAttackSeverity = (count, thresholds) => {
  const maxThreshold = thresholds[thresholds.length - 1];
  if (count >= maxThreshold) return 'CRITICAL';
  if (count >= thresholds[thresholds.length - 2]) return 'SEVERE';
  if (count >= thresholds[thresholds.length - 3]) return 'HIGH';
  if (count >= thresholds[2]) return 'MEDIUM';
  if (count >= thresholds[1]) return 'LOW';
  if (count >= thresholds[0]) return 'SUSPICIOUS';
  return 'NORMAL';
};

/**
 * Get threshold configuration for endpoint
 */
const getThresholdConfig = (endpointType) => {
  for (const [configName, config] of Object.entries(THRESHOLD_CONFIGS)) {
    if (config.endpoints.includes(endpointType)) {
      return config.thresholds;
    }
  }
  // Default to medium security if not found
  return THRESHOLD_CONFIGS.USER_MOOD_STATS.thresholds;
};

/**
 * Extract user ID from JWT token
 */
const extractUserIdFromRequest = (req) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId;
    }
  } catch (error) {
    // No valid token
  }
  return null;
};

/**
 * Track attack by specific key
 */
const trackAttackByKey = (key, req, route, endpointType, trackingType, thresholds, now, oneHour) => {
  const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
  
  // Get or create tracking record
  let record = rateLimitAttackTracking.get(key);
  
  if (!record || (now - record.firstAttempt) > oneHour) {
    // Create new record or reset if older than 1 hour
    record = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      userAgent: req.get('User-Agent') || 'Unknown',
      endpointType: endpointType,
      route: route,
      trackingType: trackingType
    };
  } else {
    // Increment existing record
    record.count += 1;
    record.lastAttempt = now;
  }
  
  rateLimitAttackTracking.set(key, record);
  
  // Check if we hit any threshold for this endpoint type
  if (thresholds.includes(record.count)) {
    const severity = getAttackSeverity(record.count, thresholds);
    const duration = Math.round((now - record.firstAttempt) / 1000);
    
    try {
      ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.SECURITY_RATE_LIMIT_VIOLATION.code,
        ERROR_CATALOG.SECURITY_RATE_LIMIT_VIOLATION.message,
        route,
        `Attack Detection - ${endpointType.toUpperCase()} Rate Limit Threshold Breached`,
        new Error(`Rate Limit Attack: Endpoint=${endpointType}, TrackingType=${trackingType}, Severity=${severity}, IP=${ip}, User-Agent=${record.userAgent}, Total Attempts=${record.count}, Duration=${duration}s, Threshold Hit=${record.count}/${thresholds[thresholds.length - 1]}`),
        null
      );
    } catch (logError) {
      console.error(`[RATE-LIMIT-ATTACK] Failed to log: Endpoint=${endpointType}, TrackingType=${trackingType}, IP=${ip}, Count=${record.count}, Severity=${severity}`);
    }
  }
  
  return record.count;
};

/**
 * Track rate limit violations for attack detection
 */
const trackRateLimitAttack = (req, endpointType, route, limiterType = 'ip') => {
  const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const thresholds = getThresholdConfig(endpointType);
  
  if (limiterType === 'user') {
    // User-based limiter - track both user and IP
    const userId = extractUserIdFromRequest(req);
    
    if (userId) {
      // Track user-specific abuse
      const userKey = `attack-user-${endpointType}-${userId}`;
      trackAttackByKey(userKey, req, route, endpointType, 'USER', thresholds, now, oneHour);
    }
    
    // Also track IP for multi-account attacks
    const ipKey = `attack-ip-${endpointType}-${ip}`;
    trackAttackByKey(ipKey, req, route, endpointType, 'IP', thresholds, now, oneHour);
    
  } else {
    // IP-based limiter - track only IP
    const ipKey = `attack-ip-${endpointType}-${ip}`;
    trackAttackByKey(ipKey, req, route, endpointType, 'IP', thresholds, now, oneHour);
  }
};

/**
 * Create endpoint-specific rate limit error handler
 */
const createRateLimitErrorHandler = (endpointType, route, limiterType = 'ip') => {
  return (req, res, next) => {
    // Track this rate limit violation for attack detection
    trackRateLimitAttack(req, endpointType, route, limiterType);
    
    // Return user-friendly response (every breach)
    const errorResponse = ErrorLogger.createErrorResponse(
      ERROR_CATALOG.RATE_LIMIT_EXCEEDED.code,
      ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message
    );
    return res.status(429).json(errorResponse);
  };
};

/**
 * Cleanup expired attack tracking records
 */
const cleanupRateLimitAttackTracking = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  let cleanedRecords = 0;
  for (const [key, record] of rateLimitAttackTracking.entries()) {
    if (now - record.firstAttempt > oneHour) {
      rateLimitAttackTracking.delete(key);
      cleanedRecords++;
    }
  }
  
  if (cleanedRecords > 0) {
    console.log(`[RATE-LIMIT-CLEANUP] Removed ${cleanedRecords} expired attack tracking records`);
  }
  
  // Log current tracking stats
  const activeEndpoints = new Set();
  for (const record of rateLimitAttackTracking.values()) {
    activeEndpoints.add(record.endpointType);
  }
  
  console.log(`[RATE-LIMIT-STATUS] Active tracking: ${rateLimitAttackTracking.size} records across ${activeEndpoints.size} endpoint types`);
};

// Run cleanup every hour (same as progressivePenalty)
setInterval(cleanupRateLimitAttackTracking, 60 * 60 * 1000);

// Also run cleanup on startup to clear any old data
setTimeout(cleanupRateLimitAttackTracking, 5000);

// Legacy handler for backward compatibility
const rateLimitErrorHandler = createRateLimitErrorHandler('general', 'UNKNOWN_ROUTE');


module.exports = {
  generateUserKey,
  rateLimitErrorHandler, // Legacy - for backward compatibility
  createRateLimitErrorHandler, // New - endpoint-specific
  trackRateLimitAttack,
  getThresholdConfig,
  THRESHOLD_CONFIGS,
  skipOptionsRequests
};