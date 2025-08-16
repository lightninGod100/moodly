// FE/src/utils/ErrorLogger.ts
// Central Error Logger for API Service Layer
// Single entry point that handles console logging and returns UI message

import { getErrorMapping, type ErrorMappingItem } from './errorMapping';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

// Backend error response format (what we receive from API)
export interface BackendErrorResponse {
  sys_error_code: string;
  sys_error_message: string;
  timestamp: string;
}

// Context information for logging
export interface LogContext {
  service: string;        // Service name (e.g., "AuthService")
  action: string;         // Action name (e.g., "userLogin")
}

// Logging options
export interface LogOptions {
  logToConsole?: boolean; // Whether to log to console
  logToUI?: boolean;      // Whether to return UI message (always true)
}

// ==========================================
// ERROR LOGGER CLASS
// ==========================================

class ErrorLogger {
  
  /**
   * SINGLE unified error logging function - handles ALL error types automatically
   * Logs to console (if enabled) and returns UI message for throwing
   * 
   * @param error - Any error: BackendErrorResponse | Error | any
   * @param context - Service and action context
   * @param options - Logging options (console/UI)
   * @returns UI message string to throw
   */
  static logError(
    error: BackendErrorResponse | Error | any,
    context: LogContext,
    options?: LogOptions
  ): string {
    
    // Default behavior: console logging enabled
    const shouldLogToConsole = options?.logToConsole ?? true;
    
    // Auto-detect error type and process accordingly
    if (this.isBackendError(error)) {
      return this.processBackendError(error, context, shouldLogToConsole);
    } else if (this.isNetworkError(error)) {
      return this.processNetworkError(error, context, shouldLogToConsole);
    } else {
      return this.processUnknownError(error, context, shouldLogToConsole);
    }
  }

  /**
   * Check if error is a backend error response
   */
  private static isBackendError(error: any): error is BackendErrorResponse {
    return error && 
           typeof error === 'object' && 
           'sys_error_code' in error && 
           'sys_error_message' in error;
  }

  /**
   * Check if error is a network/client error
   */
  private static isNetworkError(error: any): error is Error {
    return error instanceof Error;
  }

  /**
   * Process backend errors
   */
  private static processBackendError(
    backendResponse: BackendErrorResponse,
    context: LogContext,
    shouldLogToConsole: boolean
  ): string {
    
    const errorMapping: ErrorMappingItem = getErrorMapping(backendResponse.sys_error_code);
    
    // Console logging - use errorMapping.consoleMessage || backendResponse.sys_error_message
    if (shouldLogToConsole) {
      const finalConsoleMessage = errorMapping.consoleMessage || backendResponse.sys_error_message;
      
      console.log({
        message: finalConsoleMessage,
        errorCode: backendResponse.sys_error_code,
        service: context.service,
        action: context.action,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return UI message for throwing
    return errorMapping.userMessage;
  }

  /**
   * Process network/client errors
   */
  private static processNetworkError(
    error: Error,
    context: LogContext,
    shouldLogToConsole: boolean
  ): string {
    
    // Determine error type and get appropriate mapping
    let errorMapping: ErrorMappingItem;
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMapping = getErrorMapping('NET_CONNECTION_ERROR');
    } else if (error.message.toLowerCase().includes('timeout')) {
      errorMapping = getErrorMapping('NET_TIMEOUT');
    } else {
      errorMapping = getErrorMapping('NET_CONNECTION_ERROR');
    }
    
    // Console logging
    if (shouldLogToConsole) {
      const finalConsoleMessage = errorMapping.consoleMessage || error.message;
      
      console.log({
        message: finalConsoleMessage,
        errorCode: 'CLIENT_NETWORK_ERROR',
        service: context.service,
        action: context.action,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return UI message for throwing
    return errorMapping.userMessage;
  }

  /**
   * Process unknown/unexpected errors
   */
  private static processUnknownError(
    error: any,
    context: LogContext,
    shouldLogToConsole: boolean
  ): string {
    
    const errorMapping = getErrorMapping('UNKNOWN_ERROR');
    
    // Console logging
    if (shouldLogToConsole) {
      const finalConsoleMessage = errorMapping.consoleMessage || String(error?.message || error || 'Unknown error');
      
      console.log({
        message: finalConsoleMessage,
        errorCode: 'UNKNOWN_ERROR',
        service: context.service,
        action: context.action,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return UI message for throwing
    return errorMapping.userMessage;
  }
}

export default ErrorLogger;