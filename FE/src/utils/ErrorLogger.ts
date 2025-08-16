// FE/src/utils/ErrorLogger.ts
// Central Error Logger for API Service Layer
// Unified error logging with configurable console and UI output

import { ERROR_MAPPING, getErrorMapping, type ErrorMappingItem } from './errorMapping';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

// Backend error response format (what we receive from API)
export interface BackendErrorResponse {
  sys_error_code: string;
  sys_error_message: string;
  timestamp: string;
}

// Console log data structure
export interface ConsoleLogData {
  message: string;        // Developer-focused message
  errorCode: string;      // Backend error code
  service: string;        // Service name (e.g., "AuthService")
  action: string;         // Action name (e.g., "userLogin")
  timestamp: string;      // ISO timestamp
}

// UI log data structure
export interface UILogData {
  message: string;        // User-friendly message
  errorCode: string;      // Backend error code
  severity: string;       // Error severity level
}

// Context information for logging
export interface LogContext {
  service: string;        // Service name (e.g., "AuthService")
  action: string;         // Action name (e.g., "userLogin")
}

// Logging options
export interface LogOptions {
  logToConsole?: boolean; // Whether to include console log data
  logToUI?: boolean;      // Whether to include UI log data
}

// Unified ErrorLogger return type
export interface ErrorLogResult {
  consoleLog: ConsoleLogData | {};  // Console data or empty object
  uiLog: UILogData | {};            // UI data or empty object
  success: boolean;                 // Operation success flag
}

// ==========================================
// ERROR LOGGER CLASS
// ==========================================

class ErrorLogger {
  
  /**
   * Unified error logging function - single entry point for all error processing
   * Default behavior: console logging only (industry standard)
   * 
   * @param backendResponse - Error response from backend API
   * @param context - Service and action context
   * @param options - Logging options (console/UI)
   * @returns Object with conditional console and UI log data
   */
  static logError(
    backendResponse: BackendErrorResponse,
    context: LogContext,
    options?: LogOptions
  ): ErrorLogResult {
    
    // Default behavior: console only if no options passed
    const shouldLogToConsole = options?.logToConsole ?? true;
    const shouldLogToUI = options?.logToUI ?? false;
    
    // Get error mapping for the backend error code
    const errorMapping: ErrorMappingItem = getErrorMapping(backendResponse.sys_error_code);
    
    // Console logging
    const consoleLog: ConsoleLogData | {} = shouldLogToConsole 
      ? {
          message: errorMapping.consoleMessage,
          errorCode: backendResponse.sys_error_code,
          service: context.service,
          action: context.action,
          timestamp: new Date().toISOString()
        }
      : {};
    
    // UI logging  
    const uiLog: UILogData | {} = shouldLogToUI
      ? {
          message: errorMapping.userMessage,
          errorCode: backendResponse.sys_error_code,
          severity: errorMapping.severity || 'error'
        }
      : {};
    
    return {
      consoleLog,
      uiLog,
      success: true
    };
  }

  /**
   * Process network/client errors with unified approach
   * Used for fetch failures, network timeouts, etc.
   * 
   * @param error - JavaScript Error object
   * @param context - Service and action context
   * @param options - Logging options (console/UI)
   * @returns Object with conditional console and UI log data
   */
  static logNetworkError(
    error: Error,
    context: LogContext,
    options?: LogOptions
  ): ErrorLogResult {
    
    // Default behavior: console only
    const shouldLogToConsole = options?.logToConsole ?? true;
    const shouldLogToUI = options?.logToUI ?? false;
    
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
    const consoleLog: ConsoleLogData | {} = shouldLogToConsole
      ? {
          message: `${errorMapping.consoleMessage}: ${error.message}`,
          errorCode: 'CLIENT_NETWORK_ERROR',
          service: context.service,
          action: context.action,
          timestamp: new Date().toISOString()
        }
      : {};
    
    // UI logging
    const uiLog: UILogData | {} = shouldLogToUI
      ? {
          message: errorMapping.userMessage,
          errorCode: 'CLIENT_NETWORK_ERROR',
          severity: 'error'
        }
      : {};
    
    return {
      consoleLog,
      uiLog,
      success: true
    };
  }

  /**
   * Process unknown/unexpected errors with unified approach
   * Fallback for any error that doesn't match expected patterns
   * 
   * @param error - Any error object or string
   * @param context - Service and action context
   * @param options - Logging options (console/UI)
   * @returns Object with conditional console and UI log data
   */
  static logUnknownError(
    error: any,
    context: LogContext,
    options?: LogOptions
  ): ErrorLogResult {
    
    // Default behavior: console only
    const shouldLogToConsole = options?.logToConsole ?? true;
    const shouldLogToUI = options?.logToUI ?? false;
    
    const errorMapping = getErrorMapping('UNKNOWN_ERROR');
    
    // Console logging
    const consoleLog: ConsoleLogData | {} = shouldLogToConsole
      ? {
          message: `${errorMapping.consoleMessage}: ${error?.message || error || 'Unknown error'}`,
          errorCode: 'UNKNOWN_ERROR',
          service: context.service,
          action: context.action,
          timestamp: new Date().toISOString()
        }
      : {};
    
    // UI logging
    const uiLog: UILogData | {} = shouldLogToUI
      ? {
          message: errorMapping.userMessage,
          errorCode: 'UNKNOWN_ERROR',
          severity: 'error'
        }
      : {};
    
    return {
      consoleLog,
      uiLog,
      success: true
    };
  }

  /**
   * Helper method to log console data (if not empty)
   * Provides consistent logging format across the application
   * 
   * @param consoleLog - Console log data or empty object
   */
  static outputToConsole(consoleLog: ConsoleLogData | {}): void {
    if (Object.keys(consoleLog).length > 0) {
      console.error('[MOODLY_ERROR]', consoleLog);
    }
  }

  /**
   * Helper method to extract UI message from result
   * Convenience method for getting user-friendly message
   * 
   * @param result - ErrorLogResult from any log method
   * @returns UI message string or empty string
   */
  static getUIMessage(result: ErrorLogResult): string {
    return 'message' in result.uiLog ? (result.uiLog as UILogData).message : '';
  }

  /**
   * Check if an error code exists in our mapping
   * Useful for validation and testing
   * 
   * @param errorCode - Backend error code to check
   * @returns True if error code is mapped, false otherwise
   */
  static hasMapping(errorCode: string): boolean {
    return errorCode in ERROR_MAPPING;
  }

  /**
   * Get all available error codes
   * Useful for testing and validation
   * 
   * @returns Array of all mapped error codes
   */
  static getAllErrorCodes(): string[] {
    return Object.keys(ERROR_MAPPING);
  }
}


export default ErrorLogger;