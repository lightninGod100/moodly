// BE/middleware/progressivePenalty.js
const rateLimit = require('express-rate-limit');

// In-memory stores
const registrationAttempts = new Map(); // Track all registration attempts
const registrationPenalties = new Map(); // Track registration penalties
const contactAttempts = new Map(); // Track contact attempts
const contactPenalties = new Map(); // Track contact penalties

/**
 * Generate IP-based key
 */
const getProgressiveKey = (req, prefix = '') => {
  const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
  return `${prefix}${ip}`;
};

/**
 * Clean up expired records
 */
const cleanupExpiredRecords = () => {
  const now = Date.now();
  const twoHours = 2 * 60 * 60 * 1000;
  
  // Clean expired penalties
  for (const [key, penalty] of registrationPenalties.entries()) {
    if (now > penalty.expiry) {
      registrationPenalties.delete(key);
      console.log(`Cleaned up expired registration penalty for ${key}`);
    }
  }
  
  for (const [key, penalty] of contactPenalties.entries()) {
    if (now > penalty.expiry) {
      contactPenalties.delete(key);
      console.log(`Cleaned up expired contact penalty for ${key}`);
    }
  }
  
  // Clean old attempt records
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
};

setInterval(cleanupExpiredRecords, 60 * 60 * 1000);

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
 * Registration Combined Limiter: 6/15min → 3/1hr → 1/24hr
 */
const registerCombinedLimiter = (req, res, next) => {
  const baseKey = getProgressiveKey(req);
  const key = `register-${baseKey}`;
  const now = Date.now();
  
  // Check if under active penalty
  const activePenalty = registrationPenalties.get(key);
  if (activePenalty && now < activePenalty.expiry) {
    const penaltyAttempts = getCurrentCount(registrationAttempts, key, activePenalty.windowMs, now);
    if (penaltyAttempts >= activePenalty.max) {
      console.log(`Registration blocked for ${baseKey}: Under penalty level ${activePenalty.level}`);
      return res.status(429).json({
        error: 'Something went wrong. If issue persists kindly reach to support.'
      });
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
      // 1st violation: 3/3hr for 1hr
      penalty = {
        level: 1,
        violationCount: newViolationCount,
        windowMs: 3*60 * 60 * 1000, // 1 hour
        max: 3, // 3 attempts
        expiry: now + (60 * 60 * 1000) // 1 hour
      };
    }
    
    registrationPenalties.set(key, penalty);
    console.log(`Applied registration penalty level ${penalty.level} for ${key}: ${penalty.max} attempts per ${penalty.windowMs / (60 * 60 * 1000)} hours`);
    
    return res.status(429).json({
      error: 'Something went wrong. If issue persists kindly reach to support.'
    });
  }
  
  console.log(`Registration allowed for ${baseKey}: ${newCount}/${baseMax}`);
  next();
};

/**
 * Contact Progressive Limiter: 6/1hr → 3/6hr → 1/24hr
 */
const contactProgressiveLimiter = (req, res, next) => {
  const baseKey = getProgressiveKey(req);
  const key = `contact-${baseKey}`;
  const now = Date.now();
  
  // Check if under active penalty
  const activePenalty = contactPenalties.get(key);
  if (activePenalty && now < activePenalty.expiry) {
    const penaltyAttempts = getCurrentCount(contactAttempts, key, activePenalty.windowMs, now);
    if (penaltyAttempts >= activePenalty.max) {
      console.log(`Contact blocked for ${baseKey}: Under penalty level ${activePenalty.level}`);
      return res.status(429).json({
        error: 'Something went wrong. If issue persists kindly reach to support.'
      });
    }
    
    // Under penalty but within limits - increment and allow
    const newCount = incrementCount(contactAttempts, key, activePenalty.windowMs, now);
    console.log(`Contact allowed under penalty for ${baseKey}: ${newCount}/${activePenalty.max}`);
    return next();
  }
  
  // Normal operation - check base limits: 5/1hr
  const baseWindowMs = 60 * 60 * 1000; // 1 hour
  const baseMax = 5; // 6 attempts per hour
  
  const newCount = incrementCount(contactAttempts, key, baseWindowMs, now);
  
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
      // 1st violation: 3/6hr for 6hr
      penalty = {
        level: 1,
        violationCount: newViolationCount,
        windowMs: 6 * 60 * 60 * 1000, // 6 hours
        max: 2, // 3 attempts
        expiry: now + (6 * 60 * 60 * 1000) // 6 hours
      };
    }
    
    contactPenalties.set(key, penalty);
    console.log(`Applied contact penalty level ${penalty.level} for ${key}: ${penalty.max} attempts per ${penalty.windowMs / (60 * 60 * 1000)} hours`);
    
    return res.status(429).json({
      error: 'Something went wrong. If issue persists kindly reach to support.'
    });
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