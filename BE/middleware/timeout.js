// BE/middleware/timeout.js
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

// Timeout tracking for logging (similar to your rate limiting approach)
const timeoutTracking = new Map();
const TIMEOUT_LOG_THRESHOLDS = [1, 5, 25, 100, 500];

const shouldLogTimeout = (ip) => {
    const key = `timeout-${ip}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    let record = timeoutTracking.get(key);
    if (!record || (now - record.firstTimeout) > oneHour) {
        record = { count: 1, firstTimeout: now };
    } else {
        record.count += 1;
    }

    timeoutTracking.set(key, record);

    // Only log at specific thresholds
    return TIMEOUT_LOG_THRESHOLDS.includes(record.count);
};

// Create timeout middleware with configurable duration
const createTimeoutMiddleware = (duration = 30000) => { // Default 30 seconds
    return (req, res, next) => {
        // Set timeout flag
        let timedOut = false;

        // Create timeout timer
        // In timeout.js - Update the timeout handler
        const timeoutId = setTimeout(() => {
            timedOut = true;

            const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';

            // Only log at thresholds to prevent log spam
            if (shouldLogTimeout(ip)) {
                const record = timeoutTracking.get(`timeout-${ip}`);
                const timeoutError = new Error(
                    `Request timeout after ${duration}ms | IP: ${ip} | Total timeouts: ${record.count}`
                );

                ErrorLogger.logAndCreateResponse(
                    'SYS_TIMEOUT_ERROR',
                    `Request timed out after ${duration / 1000} seconds`,
                    `${req.method} ${req.originalUrl}`,
                    'request timeout',
                    timeoutError,
                    req.user?.id || null
                );
            }

            // Send timeout response if not already sent
            if (!res.headersSent) {
                const errorResponse = ErrorLogger.createErrorResponse(
                    'SYS_TIMEOUT_ERROR',
                    `Request timed out after ${duration / 1000} seconds`
                );
                res.status(408).json(errorResponse);

                // ✅ DELAY socket destruction to allow response to be sent
                setTimeout(() => {
                    req.socket.destroy();
                }, 1000); // Give 100ms for response to be sent
            } else {
                // If headers already sent, destroy immediately
                req.socket.destroy();
            }
        }, duration);

        // Clear timeout when response finishes
        res.on('finish', () => {
            clearTimeout(timeoutId);
        });

        // Clear timeout on close
        res.on('close', () => {
            clearTimeout(timeoutId);
        });

        // Override res.send/json to check for timeout
        const originalSend = res.send;
        const originalJson = res.json;

        res.send = function (...args) {
            if (!timedOut) {
                clearTimeout(timeoutId);
                return originalSend.apply(res, args);
            }
        };

        res.json = function (...args) {
            if (!timedOut) {
                clearTimeout(timeoutId);
                return originalJson.apply(res, args);
            }
        };

        next();
    };
};

// Different timeout durations for different endpoint types
const timeoutDurations = {
    fast: 6000,     // 6 seconds for simple queries
    normal: 30000,   // 30 seconds for normal operations
    slow: 60000,     // 60 seconds for complex operations
    upload: 120000   // 120 seconds for file uploads
};

module.exports = {
    createTimeoutMiddleware,
    timeoutDurations
};