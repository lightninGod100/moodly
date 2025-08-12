// BE/services/errorLogger.js
// Backend Error Logger Service - Handles error logging and response creation

class ErrorLogger {

  /* Determine context from error analysis for multi - operation endpoints
    * @param { Error } error - The technical error object
      * @returns { string } - Context string or empty string if uncertain
        */
  static determineContext(error) {
    // Database constraint/write errors (PostgreSQL error codes starting with '23')
    if (error.code?.startsWith('23')) {
      return "write to database";
    }

    // Network/fetch related errors
    if (error.message?.toLowerCase().includes('fetch') ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('timeout')) {
      return "call external service";
    }

    // Database connection errors
    if (error.code === 'ECONNREFUSED' ||
      error.message?.toLowerCase().includes('connection') ||
      error.message?.toLowerCase().includes('connect')) {
      return "database connection";
    }

    // Return empty string if context cannot be determined
    return "";
  }
  /**
   * Log error to server console for debugging
   * @param {string} sys_error_code - Error code from errorCodes.js (e.g., 'VAL_EMAIL_REQUIRED')
   * @param {string} api - API endpoint where error occurred
   * @param {string} context - Context where error occurred (e.g., 'Email validation', 'Database operation')
   * @param {Error} error - The actual JavaScript Error object with technical details
   * @param {number|null} userID - User ID if available, null otherwise
   * @param {string} source - Source of the error (e.g., 'pending-react-routing')
   */
  static serverLogError(sys_error_code, sys_error_message, apiEndpoint, operationContext, technicalError, userId = null, source) {
    const errorLog = {
      sys_error_code: sys_error_code,
      sys_error_message: sys_error_message || 'Unknown error',
      api: apiEndpoint,
      context: operationContext,
      timestamp: new Date().toISOString(),
      error: {
        name: technicalError?.name || 'Unknown',
        message: technicalError?.message || 'Unknown error',
        code: technicalError?.code || null
      },
      source: source,
      userID: userId,
      stackTrace: technicalError?.stack || 'No stack trace available'
    };

    // Log to server console for debugging
    console.error('[MOODLY_ERROR]', JSON.stringify(errorLog, null, 2));

    // Future enhancement: Send to monitoring service
    // this.sendToMonitoringService(errorLog);
  }

  /**
   * Create standardized error response object to send to frontend
   * @param {string}  sys_error_code - Error code from errorCodes.js (e.g., 'VAL_EMAIL_REQUIRED')
   * @param {string} sys_error_message - Custom error message to display (optional)
   * @returns {Object} Standardized error response object
   */
  static createErrorResponse(sys_error_code, sys_error_message = null) {
    return {
      sys_error_code,
      sys_error_message: sys_error_message || 'An error occurred',
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
  static logAndCreateResponse(sys_error_code, sys_error_message, apiEndpoint, operationContext, technicalError, userId = null, source = 'pending-react-routing') {
    // If context is empty string, try to determine it from error
    const finalContext = operationContext === "" ? this.determineContext(technicalError) : operationContext;

    // Always log the error (routes decide when to call this)
    this.serverLogError(sys_error_code, sys_error_message, apiEndpoint, finalContext, technicalError, userId, source);

    // Return response for frontend
    return this.createErrorResponse(sys_error_code, sys_error_message);
  }

}

module.exports = ErrorLogger;