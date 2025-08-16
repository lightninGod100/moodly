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
   * SINGLE unified error logging function - handles ALL error types automatically
   * API service layer only needs to call this one function for any error
   * Default behavior: console logging only (industry standard)
   * 
   * @param error - Any error: BackendErrorResponse | Error | any
   * @param context - Service and action context
   * @param options - Logging options (console/UI)
   * @returns Object with conditional console and UI log data
   */
  static logError(
    error: BackendErrorResponse | Error | any,
    context: LogContext,
    options?: LogOptions
  ): ErrorLogResult {
    
    // Default behavior: console only if no options passed
    const shouldLogToConsole = options?.logToConsole ?? true;
    const shouldLogToUI = options?.logToUI ?? false;
    
    // Auto-detect error type and process accordingly
    if (this.isBackendError(error)) {
      return this.processBackendError(error, context, shouldLogToConsole, shouldLogToUI);
    } else if (this.isNetworkError(error)) {
      return this.processNetworkError(error, context, shouldLogToConsole, shouldLogToUI);
    } else {
      return this.processUnknownError(error, context, shouldLogToConsole, shouldLogToUI);
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
    shouldLogToConsole: boolean,
    shouldLogToUI: boolean
  ): ErrorLogResult {
    
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
          errorCode: backendResponse.sys_error_code
        }
      : {};
    
    return {
      consoleLog,
      uiLog,
      success: true
    };
  }

  /**
   * Process network/client errors
   */
  private static processNetworkError(
    error: Error,
    context: LogContext,
    shouldLogToConsole: boolean,
    shouldLogToUI: boolean
  ): ErrorLogResult {
    
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
   * Process unknown/unexpected errors
   */
  private static processUnknownError(
    error: any,
    context: LogContext,
    shouldLogToConsole: boolean,
    shouldLogToUI: boolean
  ): ErrorLogResult {
    
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

// ==========================================
// USAGE EXAMPLES (for documentation)
// ==========================================

/*
// SINGLE FUNCTION FOR ALL ERROR TYPES - API Service Layer Consistency!

// Example 1: Default behavior (console only) - works for ANY error type
try {
  const response = await fetch('/api/auth/login', { ... });
  const data = await response.json();
  
  if (!response.ok) {
    // Backend error - auto-detected
    const result = ErrorLogger.logError(data, {
      service: 'AuthService',
      action: 'userLogin'
    });
    ErrorLogger.outputToConsole(result.consoleLog);
  }
} catch (error) {
  // Network error - auto-detected  
  const result = ErrorLogger.logError(error, {
    service: 'AuthService', 
    action: 'userLogin'
  });
  ErrorLogger.outputToConsole(result.consoleLog);
}

// Example 2: Console + UI logging - works for ANY error type
try {
  const response = await fetch('/api/users/update', { ... });
  const data = await response.json();
  
  if (!response.ok) {
    // Same function call regardless of error type!
    const result = ErrorLogger.logError(data, {
      service: 'UserService',
      action: 'updateProfile'
    }, {
      logToConsole: true,
      logToUI: true
    });
    
    // Handle outputs
    ErrorLogger.outputToConsole(result.consoleLog);
    const uiMessage = ErrorLogger.getUIMessage(result);
    if (uiMessage) {
      setErrorMessage(uiMessage);
    }
  }
} catch (networkError) {
  // Same function call for network errors too!
  const result = ErrorLogger.logError(networkError, {
    service: 'UserService',
    action: 'updateProfile'  
  }, {
    logToConsole: true,
    logToUI: true
  });
  
  ErrorLogger.outputToConsole(result.consoleLog);
  const uiMessage = ErrorLogger.getUIMessage(result);
  if (uiMessage) {
    setErrorMessage(uiMessage);
  }
}

// Example 3: UI only (no console logging)
const result = ErrorLogger.logError(anyError, {
  service: 'AuthService',
  action: 'login'
}, {
  logToConsole: false,
  logToUI: true
});

const uiMessage = ErrorLogger.getUIMessage(result);
setErrorMessage(uiMessage);

// Example 4: Generic error handler function for API service layer
function handleApiError(error: any, service: string, action: string) {
  const result = ErrorLogger.logError(error, { service, action }, {
    logToConsole: true,
    logToUI: true
  });
  
  ErrorLogger.outputToConsole(result.consoleLog);
  const uiMessage = ErrorLogger.getUIMessage(result);
  if (uiMessage) {
    showToast(uiMessage);
  }
}

// Usage: Same function for ANY error type
handleApiError(backendError, 'AuthService', 'login');
handleApiError(networkError, 'UserService', 'update');  
handleApiError(unknownError, 'ProfileService', 'upload');
*/

export default ErrorLogger;