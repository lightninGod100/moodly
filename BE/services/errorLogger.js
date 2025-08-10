// BE/services/errorLogger.js
// Backend Error Logger Service - Handles error logging and response creation

class ErrorLogger {
    /**
     * Log error to server console for debugging
     * @param {string} errorCode - Error code from errorCodes.js (e.g., 'VAL_EMAIL_REQUIRED')
     * @param {string} context - Context where error occurred (e.g., 'Email validation', 'Database operation')
     * @param {Error} technicalError - The actual JavaScript Error object with technical details
     * @param {number|null} userId - User ID if available, null otherwise
     */
    static logError(errorCode, context, technicalError, userId = null) {
      const errorLog = {
        timestamp: new Date().toISOString(),
        errorCode,
        context,
        userId,
        technicalError: technicalError?.message || 'Unknown error',
        stackTrace: technicalError?.stack || 'No stack trace available'
      };
      
      // Log to server console for debugging
      console.error('[BE_ERROR_LOG]', JSON.stringify(errorLog, null, 2));
      
      // Future enhancement: Send to monitoring service
      // this.sendToMonitoringService(errorLog);
    }
  
    /**
     * Create standardized error response object to send to frontend
     * @param {string} errorCode - Error code from errorCodes.js (e.g., 'VAL_EMAIL_REQUIRED')
     * @param {string} customMessage - Custom error message to display (optional)
     * @returns {Object} Standardized error response object
     */
    static createErrorResponse(errorCode, customMessage = null) {
      return {
        errorCode,
        error: customMessage || 'An error occurred',
        timestamp: new Date().toISOString()
      };
    }
  
    /**
     * Log error and create response in one call (convenience method)
     * @param {string} errorCode - Error code from errorCodes.js
     * @param {string} context - Context where error occurred
     * @param {Error} technicalError - The actual JavaScript Error object
     * @param {string} userMessage - Message to send to frontend
     * @param {number|null} userId - User ID if available
     * @returns {Object} Standardized error response object
     */
    static logAndCreateResponse(errorCode, context, technicalError, userMessage, userId = null) {
      // Log the error for debugging
      this.logError(errorCode, context, technicalError, userId);
      
      // Return response for frontend
      return this.createErrorResponse(errorCode, userMessage);
    }
  
    /**
     * Future enhancement: Send error logs to external monitoring service
     * @param {Object} errorLog - The error log object to send
     */
    static sendToMonitoringService(errorLog) {
      // TODO: Implement when monitoring service is set up
      // Examples: Sentry, LogRocket, DataDog, etc.
      // await monitoringService.send(errorLog);
    }
  }
  
  module.exports = ErrorLogger;