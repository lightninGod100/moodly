// BE/middleware/errorHandler.js
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

// Error logging rate limiting
const errorLogLimiter = new Map();
const ERROR_LOG_THRESHOLDS = {
  'JSON_SYNTAX': [1, 5, 25, 100, 500],      // Low severity
  'JWT_ERROR': [1, 3, 10, 50, 200],         // Medium severity  
  'DATABASE_ERROR': [1, 3, 10, 50, 100],      // High severity
  'SIZE_LIMIT': [1, 5, 25, 100, 500],       // Medium severity - could be attacks
  'SYSTEM_ERROR': [1, 3, 10, 50, 100]         // High severity
};

const shouldLogError = (ip, errorType) => {
  const key = `${errorType}-${ip}`;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const thresholds = ERROR_LOG_THRESHOLDS[errorType] || [1, 5, 25, 100];
  
  let record = errorLogLimiter.get(key);
  if (!record || (now - record.firstLog) > oneHour) {
    record = { count: 1, firstLog: now };
  } else {
    record.count += 1;
  }
  
  errorLogLimiter.set(key, record);
  
  // Only log at specific thresholds
  return thresholds.includes(record.count);
};

const globalErrorHandler = (err, req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
  let errorCode, errorMessage, context, errorType;
  
  // Determine error type and logging strategy
  if (err instanceof SyntaxError && (err.status === 400 || err.message.includes('JSON'))) {
    errorCode = ERROR_CATALOG.VAL_INVALID_JSON.code;
    errorMessage = ERROR_CATALOG.VAL_INVALID_JSON.message;
    context = 'JSON parsing';
    errorType = 'JSON_SYNTAX';
  }
  else if (err.status === 413 || err.type === 'entity.too.large' || err.message?.includes('too large')) {
    errorCode = ERROR_CATALOG.VAL_REQUEST_TOO_LARGE.code;
    errorMessage = ERROR_CATALOG.VAL_REQUEST_TOO_LARGE.message;
    context = 'request size validation';
    errorType = 'SIZE_LIMIT';
    
  }
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    errorCode = ERROR_CATALOG.AUTH_TOKEN_MALFORMED.code;
    errorMessage = ERROR_CATALOG.AUTH_TOKEN_MALFORMED.message;
    context = 'token verification';
    errorType = 'JWT_ERROR';
  }
  else if (err.code && err.code.startsWith('23')) {
    errorCode = ERROR_CATALOG.SYS_DATABASE_ERROR.code;
    errorMessage = ERROR_CATALOG.SYS_DATABASE_ERROR.message;
    context = 'database operation';
    errorType = 'DATABASE_ERROR';
  }
  else {
    errorCode = ERROR_CATALOG.SYS_INTERNAL_ERROR.code;
    errorMessage = ERROR_CATALOG.SYS_INTERNAL_ERROR.message;
    context = 'system operation';
    errorType = 'SYSTEM_ERROR';
  }
  
  // Rate-limited logging
 // Rate-limited logging
if (shouldLogError(ip, errorType)) {
    const userId = req.user?.id || null;
    const key = `${errorType}-${ip}`;
    const record = errorLogLimiter.get(key);
    const attemptCount = record ? record.count : 1;
    
    // Create enhanced error with attempt count
    const enhancedError = new Error(`${err.message} | Total Attempts: ${attemptCount} | ErrorType: ${errorType} | IP: ${ip}`);
    enhancedError.stack = err.stack;
    
    ErrorLogger.logAndCreateResponse(
      errorCode,
      errorMessage,
      `${req.method} ${req.originalUrl}`,
      context,
      enhancedError,
      userId
    );
  }
  
  // Always send response to client (don't rate limit responses)
  const errorResponse = ErrorLogger.createErrorResponse(errorCode, errorMessage);
  
  // Send appropriate HTTP status code based on error type
  let httpStatus = 500; // Default to 500 for system errors
  
  if (errorType === 'JSON_SYNTAX' || errorType === 'SIZE_LIMIT') {
    httpStatus = 400; // Bad Request for client-side errors
  } else if (errorType === 'JWT_ERROR') {
    httpStatus = 401; // Unauthorized for auth errors
  } else if (errorType === 'DATABASE_ERROR' || errorType === 'SYSTEM_ERROR') {
    httpStatus = 500; // Internal Server Error for server-side errors
  }
  
  // For size limit errors, use 413 (Request Entity Too Large) instead of 400
  if (errorType === 'SIZE_LIMIT') {
    httpStatus = 413;
  }
  
  res.status(httpStatus).json(errorResponse);
};

module.exports = {
    globalErrorHandler
  };