// BE/middleware/progressivePenalty.js
const rateLimit = require('express-rate-limit');
const { generateIPKey, rateLimitErrorHandler } = require('./rateLimitHelpers');

// In-memory store for tracking violations and penalties
const violationStore = new Map();
const penaltyStore = new Map();

/**
 * Clean up expired violation records (runs every hour)
 */
const cleanupExpiredViolations = () => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  for (const [key, data] of violationStore.entries()) {
    if (now - data.lastViolation > twentyFourHours) {
      violationStore.delete(key);
      penaltyStore.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredViolations, 60 * 60 * 1000);

/**
 * Progressive penalty configuration for register endpoint
 */
const registerProgressiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Base window: 15 minutes
  max: 3, // Base limit: 3 attempts per 15 minutes
  keyGenerator: generateIPKey,
  handler: rateLimitErrorHandler,
  skip: (req, res) => {
    const key = generateIPKey(req);
    const now = Date.now();
    
    // Check if user is currently under penalty
    const penalty = penaltyStore.get(key);
    if (penalty && now < penalty.expiry) {
      // Still under penalty, reject request
      return false; // Don't skip, apply rate limit
    }
    
    // Check violation history
    const violations = violationStore.get(key);
    if (violations) {
      const timeSinceLastViolation = now - violations.lastViolation;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // Reset violations after 24 hours of good behavior
      if (timeSinceLastViolation > twentyFourHours) {
        violationStore.delete(key);
        penaltyStore.delete(key);
        return false; // Don't skip, use base rate limit
      }
      
      // Apply progressive penalties based on violation count
      if (violations.count >= 2) {
        // Third violation: 24 hour penalty
        const penaltyDuration = 24 * 60 * 60 * 1000;
        penaltyStore.set(key, { expiry: now + penaltyDuration });
        return false; // Don't skip, will be blocked
      } else if (violations.count >= 1) {
        // Second violation: 1 hour penalty
        const penaltyDuration = 60 * 60 * 1000;
        penaltyStore.set(key, { expiry: now + penaltyDuration });
        return false; // Don't skip, will be blocked
      }
    }
    
    return false; // Don't skip, use base rate limit
  },
  onLimitReached: (req, res) => {
    const key = generateIPKey(req);
    const now = Date.now();
    
    // Record violation
    const existingViolations = violationStore.get(key) || { count: 0, lastViolation: 0 };
    violationStore.set(key, {
      count: existingViolations.count + 1,
      lastViolation: now
    });
  }
});

/**
 * Progressive penalty configuration for contact endpoint
 */
const contactProgressiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // Base window: 1 hour
  max: 5, // Base limit: 5 attempts per hour
  keyGenerator: generateIPKey,
  handler: rateLimitErrorHandler,
  skip: (req, res) => {
    const key = `contact-${generateIPKey(req)}`;
    const now = Date.now();
    
    // Check if user is currently under penalty
    const penalty = penaltyStore.get(key);
    if (penalty && now < penalty.expiry) {
      return false; // Don't skip, apply rate limit
    }
    
    // Check violation history
    const violations = violationStore.get(key);
    if (violations) {
      const timeSinceLastViolation = now - violations.lastViolation;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // Reset violations after 24 hours of good behavior
      if (timeSinceLastViolation > twentyFourHours) {
        violationStore.delete(key);
        penaltyStore.delete(key);
        return false; // Don't skip, use base rate limit
      }
      
      // Apply progressive penalties
      if (violations.count >= 2) {
        // Third violation: 24 hour penalty, 1 attempt
        const penaltyDuration = 24 * 60 * 60 * 1000;
        penaltyStore.set(key, { expiry: now + penaltyDuration });
        return false; // Don't skip, will be heavily limited
      } else if (violations.count >= 1) {
        // Second violation: 6 hour penalty, 2 attempts
        const penaltyDuration = 6 * 60 * 60 * 1000;
        penaltyStore.set(key, { expiry: now + penaltyDuration });
        return false; // Don't skip, will be limited
      }
    }
    
    return false; // Don't skip, use base rate limit
  },
  onLimitReached: (req, res) => {
    const key = `contact-${generateIPKey(req)}`;
    const now = Date.now();
    
    // Record violation
    const existingViolations = violationStore.get(key) || { count: 0, lastViolation: 0 };
    violationStore.set(key, {
      count: existingViolations.count + 1,
      lastViolation: now
    });
  }
});

module.exports = {
  registerProgressiveLimiter,
  contactProgressiveLimiter
};