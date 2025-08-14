// BE/middleware/progressivePenalty.js
const rateLimit = require('express-rate-limit');
const { ERROR_CATALOG, getError } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

// In-memory stores
const registrationAttempts = new Map();
const registrationPenalties = new Map();
const contactAttempts = new Map();
const contactPenalties = new Map();

// Attack detection stores - track total attempts for DDoS/spam detection
const attackDetectionTracking = new Map();

// Industry-standard DDoS/spam detection thresholds
const ATTACK_THRESHOLDS = [25, 50, 100, 500, 1000, 5000];

/**
 * Generate IP-based key
 */
const getProgressiveKey = (req, prefix = '') => {
  const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
  return `${prefix}${ip}`;
};

/**
 * Check if attempt count matches any attack threshold
 */
const shouldLogAttackThreshold = (count) => {
  return ATTACK_THRESHOLDS.includes(count);
};

/**
 * Get attack severity level based on count
 */
const getAttackSeverity = (count) => {
  if (count >= 5000) return 'CRITICAL';
  if (count >= 1000) return 'SEVERE';
  if (count >= 500) return 'HIGH';
  if (count >= 100) return 'MEDIUM';
  if (count >= 50) return 'LOW';
  if (count >= 25) return 'SUSPICIOUS';
  return 'NORMAL';
};

/**
 * Track attempts for attack detection
 */
const trackForAttackDetection = (key, req, endpoint) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Get or create tracking record
  let record = attackDetectionTracking.get(key);
  
  if (!record || (now - record.firstAttempt) > oneHour) {
    // Create new record or reset if older than 1 hour
    record = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      endpoint: endpoint
    };
  } else {
    // Increment existing record
    record.count += 1;
    record.lastAttempt = now;
  }
  
  attackDetectionTracking.set(key, record);
  
  // Check if we hit any threshold
  if (shouldLogAttackThreshold(record.count)) {
    const severity = getAttackSeverity(record.count);
    const duration = Math.round((now - record.firstAttempt) / 1000); // seconds
    
    try {
      ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.SECURITY_PROGRESSIVE_VIOLATION.code,
        ERROR_CATALOG.SECURITY_PROGRESSIVE_VIOLATION.message,
        endpoint,
        'Attack Detection - API Threshold Breached',
        new Error(`Attack Severity: ${severity}, IP: ${req.ip}, User-Agent: ${req.get('User-Agent') || 'Unknown'}, Attempts: ${record.count}, Duration: ${duration}s`),
        null
      );
      
    } catch (logError) {
      ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.SYS_LOGGING_ERROR.code,  // You need to add this to error catalog
        ERROR_CATALOG.SYS_LOGGING_ERROR.message,
        endpoint,
        'Server Logging Failed',
        logError,
        null
      );
    }
  }
  
  return record.count;
};

/**
 * Clean up expired records - runs every hour
 */
const cleanupExpiredRecords = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const twoHours = 2 * 60 * 60 * 1000;
  
  // Clean attack detection tracking (1 hour expiry)
  let cleanedAttackRecords = 0;
  for (const [key, record] of attackDetectionTracking.entries()) {
    if (now - record.firstAttempt > oneHour) {
      attackDetectionTracking.delete(key);
      cleanedAttackRecords++;
    }
  }
  
  if (cleanedAttackRecords > 0) {
    console.log(`[CLEANUP] Removed ${cleanedAttackRecords} expired attack detection records`);
  }
  
  // Clean expired penalties
  for (const [key, penalty] of registrationPenalties.entries()) {
    if (now > penalty.expiry) {
      registrationPenalties.delete(key);
      console.log(`[CLEANUP] Expired registration penalty for ${key}`);
    }
  }
  
  for (const [key, penalty] of contactPenalties.entries()) {
    if (now > penalty.expiry) {
      contactPenalties.delete(key);
      console.log(`[CLEANUP] Expired contact penalty for ${key}`);
    }
  }
  
  // Clean old attempt records (2 hour expiry for normal tracking)
  for (const [key, data] of registrationAttempts.entries()) {
    if (now - data.lastReset > twoHours) {
      registrationAttempts.delete(key);
    }
  }
  
  for (const [key, data] of contactAttempts.entries()) {
    if (now - data.lastReset > twoHours) {
      contactAttempts.delete(key);
    }
  }
  
  // Log cleanup summary
  const totalRecords = attackDetectionTracking.size + registrationPenalties.size + 
                      contactPenalties.size + registrationAttempts.size + contactAttempts.size;
  console.log(`[CLEANUP] Active records: Attack:${attackDetectionTracking.size}, RegPenalty:${registrationPenalties.size}, ContactPenalty:${contactPenalties.size}, Total:${totalRecords}`);
};

// Run cleanup every hour
setInterval(cleanupExpiredRecords, 60 * 60 * 1000);

// Also run cleanup on startup to clear any old data
setTimeout(cleanupExpiredRecords, 5000);

/**
 * Get current attempt count within window
 */
const getCurrentCount = (store, key, windowMs, now) => {
  const record = store.get(key);
  if (!record || now - record.lastReset > windowMs) {
    return 0;
  }
  return record.count;
};

/**
 * Increment attempt count
 */
const incrementCount = (store, key, windowMs, now) => {
  const record = store.get(key) || { count: 0, lastReset: now };
  
  if (now - record.lastReset > windowMs) {
    record.count = 1;
    record.lastReset = now;
  } else {
    record.count += 1;
  }
  
  store.set(key, record);
  return record.count;
};

/**
 * Registration Combined Limiter: 5/15min → 3/3hr → 1/24hr
 * Attack Detection: Logs at 25, 50, 100, 500, 1000, 5000 attempts
 */
const registerCombinedLimiter = (req, res, next) => {
  const baseKey = getProgressiveKey(req);
  const key = `register-${baseKey}`;
  const now = Date.now();
  
  // Track for attack detection (DDoS/spam monitoring)
  trackForAttackDetection(`attack-register-${baseKey}`, req, 'POST /api/auth/register');
  
  // Check if under active penalty
  const activePenalty = registrationPenalties.get(key);
  if (activePenalty && now < activePenalty.expiry) {
    const penaltyAttempts = getCurrentCount(registrationAttempts, key, activePenalty.windowMs, now);
    
    // Check if should block under penalty
    if (penaltyAttempts >= activePenalty.max) {
      console.log(`Registration blocked for ${baseKey}: Under penalty level ${activePenalty.level}`);
      
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.RATE_LIMIT_EXCEEDED.code,
        ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message
      );
      return res.status(429).json(errorResponse);
    }
    
    // Under penalty but within limits - increment and allow
    const newCount = incrementCount(registrationAttempts, key, activePenalty.windowMs, now);
    console.log(`Registration allowed under penalty for ${baseKey}: ${newCount}/${activePenalty.max}`);
    return next();
  }
  
  // Normal operation - check base limits: 5/15min
  const baseWindowMs = 15 * 60 * 1000; // 15 minutes
  const baseMax = 5; // 5 attempts per 15 minutes
  const newCount = incrementCount(registrationAttempts, key, baseWindowMs, now);
  
  // Apply penalty if base limit exceeded
  if (newCount > baseMax) {
    // Exceeded base limit - apply progressive penalty
    const existing = registrationPenalties.get(key) || { violationCount: 0 };
    const newViolationCount = existing.violationCount + 1;
    
    let penalty;
    if (newViolationCount >= 2) {
      // 2nd+ violation: 1/24hr for 24hr
      penalty = {
        level: 2,
        violationCount: newViolationCount,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 1, // 1 attempt
        expiry: now + (24 * 60 * 60 * 1000) // 24 hours
      };
    } else {
      // 1st violation: 3/3hr for 3hr
      penalty = {
        level: 1,
        violationCount: newViolationCount,
        windowMs: 3 * 60 * 60 * 1000, // 3 hours
        max: 3, // 3 attempts
        expiry: now + (3 * 60 * 60 * 1000) // 3 hours
      };
    }
    
    registrationPenalties.set(key, penalty);
    
    // Reset the regular attempt counter for the penalty window
    registrationAttempts.set(key, { count: 0, lastReset: now });
    
    console.log(`Applied registration penalty level ${penalty.level} for ${key}: ${penalty.max} attempts per ${penalty.windowMs / (60 * 60 * 1000)} hours`);
    
    const errorResponse = ErrorLogger.createErrorResponse(
      ERROR_CATALOG.RATE_LIMIT_EXCEEDED.code,
      ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message
    );
    return res.status(429).json(errorResponse);
  }
  
  console.log(`Registration allowed for ${baseKey}: ${newCount}/${baseMax}`);
  next();
};

/**
 * Contact Progressive Limiter: 5/1hr → 2/6hr → 1/24hr
 * Attack Detection: Logs at 25, 50, 100, 500, 1000, 5000 attempts
 */
const contactProgressiveLimiter = (req, res, next) => {
  const baseKey = getProgressiveKey(req);
  const key = `contact-${baseKey}`;
  const now = Date.now();
  
  // Track for attack detection (DDoS/spam monitoring)
  trackForAttackDetection(`attack-contact-${baseKey}`, req, 'POST /api/contact');
  
  // Check if under active penalty
  const activePenalty = contactPenalties.get(key);
  if (activePenalty && now < activePenalty.expiry) {
    const penaltyAttempts = getCurrentCount(contactAttempts, key, activePenalty.windowMs, now);
    
    // Check if should block under penalty
    if (penaltyAttempts >= activePenalty.max) {
      console.log(`Contact blocked for ${baseKey}: Under penalty level ${activePenalty.level}`);
      
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.RATE_LIMIT_EXCEEDED.code,
        ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message
      );
      return res.status(429).json(errorResponse);
    }
    
    // Under penalty but within limits - increment and allow
    const newCount = incrementCount(contactAttempts, key, activePenalty.windowMs, now);
    console.log(`Contact allowed under penalty for ${baseKey}: ${newCount}/${activePenalty.max}`);
    return next();
  }
  
  // Normal operation - check base limits: 5/1hr
  const baseWindowMs = 60 * 60 * 1000; // 1 hour
  const baseMax = 5; // 5 attempts per hour
  const newCount = incrementCount(contactAttempts, key, baseWindowMs, now);
  
  // Apply penalty if base limit exceeded
  if (newCount > baseMax) {
    // Exceeded base limit - apply progressive penalty
    const existing = contactPenalties.get(key) || { violationCount: 0 };
    const newViolationCount = existing.violationCount + 1;
    
    let penalty;
    if (newViolationCount >= 2) {
      // 2nd+ violation: 1/24hr for 24hr
      penalty = {
        level: 2,
        violationCount: newViolationCount,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 1, // 1 attempt
        expiry: now + (24 * 60 * 60 * 1000) // 24 hours
      };
    } else {
      // 1st violation: 2/6hr for 6hr
      penalty = {
        level: 1,
        violationCount: newViolationCount,
        windowMs: 6 * 60 * 60 * 1000, // 6 hours
        max: 2, // 2 attempts
        expiry: now + (6 * 60 * 60 * 1000) // 6 hours
      };
    }
    
    contactPenalties.set(key, penalty);
    
    // Reset the regular attempt counter for the penalty window
    contactAttempts.set(key, { count: 0, lastReset: now });
    
    console.log(`Applied contact penalty level ${penalty.level} for ${key}: ${penalty.max} attempts per ${penalty.windowMs / (60 * 60 * 1000)} hours`);
    
    const errorResponse = ErrorLogger.createErrorResponse(
      ERROR_CATALOG.RATE_LIMIT_EXCEEDED.code,
      ERROR_CATALOG.RATE_LIMIT_EXCEEDED.message
    );
    return res.status(429).json(errorResponse);
  }
  
  console.log(`Contact allowed for ${baseKey}: ${newCount}/${baseMax}`);
  next();
};

module.exports = {
  registerProgressiveLimiter: registerCombinedLimiter,
  contactProgressiveLimiter,
  registerCombinedLimiter,
  getProgressiveKey
};