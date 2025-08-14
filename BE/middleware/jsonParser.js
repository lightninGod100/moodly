// BE/middleware/jsonParser.js
const express = require('express');
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

// JSON attack tracking with thresholds
const jsonAttackTracking = new Map();
const JSON_ATTACK_THRESHOLDS = [1, 5, 25, 100, 500]; // Similar to rate limiters

const shouldLogJsonAttack = (ip) => {
  const key = `json-attack-${ip}`;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  let record = jsonAttackTracking.get(key);
  if (!record || (now - record.firstAttack) > oneHour) {
    record = { count: 1, firstAttack: now };
  } else {
    record.count += 1;
  }
  
  jsonAttackTracking.set(key, record);
  
  // Only log at specific thresholds
  return JSON_ATTACK_THRESHOLDS.includes(record.count);
};

const enhancedJsonParser = () => {
  return express.json({
    limit: '1mb',
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (err) {
        const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
        
        // Threshold-based logging (Server logging only)
        if (shouldLogJsonAttack(ip)) {
          const userAgent = req.get('User-Agent') || 'Unknown';
          const payload = buf.toString('utf8').substring(0, 200);
          const record = jsonAttackTracking.get(`json-attack-${ip}`);
          
          const enhancedError = new Error(`JSON Syntax Attack: IP=${ip}, UserAgent=${userAgent}, Attempts=${record.count}, Payload=${payload}`);
          
          ErrorLogger.logAndCreateResponse(
            ERROR_CATALOG.SECURITY_JSON_ATTACK.code,
            ERROR_CATALOG.SECURITY_JSON_ATTACK.message,
            `${req.method} ${req.originalUrl}`,
            'JSON parsing attack detection',
            enhancedError,
            null // No user ID available at this stage
          );
        }
        
        // Let Express handle the error response (goes to globalErrorHandler)
        throw err;
      }
    }
  });
};

module.exports = {
  enhancedJsonParser
};