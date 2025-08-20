// BE/middleware/timeout.js
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

// Timeout tracking for logging
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
    return TIMEOUT_LOG_THRESHOLDS.includes(record.count);
};

// Create timeout middleware with configurable duration
const createTimeoutMiddleware = (duration = 30000) => {
    return (req, res, next) => {
        let timeoutId;
        let timedOut = false;

        // Set the timeout
        timeoutId = setTimeout(() => {
            if (res.headersSent) return; // Response already sent, ignore timeout
            
            timedOut = true;

            // Log if needed
            const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
            if (shouldLogTimeout(ip)) {
                const record = timeoutTracking.get(`timeout-${ip}`);
                ErrorLogger.serverLogError(
                    'SYS_TIMEOUT_ERROR',
                    `Request timeout after ${duration}ms | IP: ${ip} | Total timeouts: ${record.count}`,
                    `${req.method} ${req.originalUrl}`,
                    'request timeout',
                    new Error('Request timeout'),
                    req.user?.id || null
                );
            }

            // Send timeout response
            try {
                res.status(408).json({
                    sys_error_code: 'SYS_TIMEOUT_ERROR',
                    sys_error_message: `Request timed out after ${duration / 1000} seconds`,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                // Response already sent or connection closed
                console.error('Error sending timeout response:', error.message);
            }
        }, duration);

        // Clear timeout when response starts being sent
        const originalWriteHead = res.writeHead;
        res.writeHead = function(...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            return originalWriteHead.apply(this, args);
        };

        // Add timeout check to req object for other middleware to use
        req.isTimedOut = () => timedOut;

        // Continue with next middleware
        next();
    };
};

// Different timeout durations for different endpoint types
const timeoutDurations = {
    fast: 6000,      // 6 seconds for simple queries
    normal: 30000,   // 30 seconds for normal operations
    slow: 60000,     // 60 seconds for complex operations
    upload: 120000   // 120 seconds for file uploads
};

module.exports = {
    createTimeoutMiddleware,
    timeoutDurations
};