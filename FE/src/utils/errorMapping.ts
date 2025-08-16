// FE/src/services/errorMapping.ts
// Frontend Error Mapping Configuration
// Maps backend error codes to user-friendly UI messages and developer console messages

export interface ErrorMappingItem {
  userMessage: string;        // User-friendly message for UI display
  consoleMessage: string;     // Developer-focused message for console
  shouldLogToConsole: boolean; // Control console logging (all true for now)
}

export interface ErrorMapping {
  [backendErrorCode: string]: ErrorMappingItem;
}

export const ERROR_MAPPING: ErrorMapping = {
  // ==========================================
  // VALIDATION ERRORS (VAL_xxx)
  // ==========================================
  
  "VAL_EMAIL_REQUIRED": {
    userMessage: "Please enter your email address",
    consoleMessage: "Email is required",
    shouldLogToConsole: true
  },
  
  "VAL_PASSWORD_REQUIRED": {
    userMessage: "Please enter your password",
    consoleMessage: "Password is required", 
    shouldLogToConsole: true
  },
  
  "VAL_INVALID_EMAIL": {
    userMessage: "Please enter a valid email address",
    consoleMessage: "Invalid email format",
    shouldLogToConsole: true
  },
  
  "VAL_PASSWORD_TOO_SHORT": {
    userMessage: "Password must be at least 6 characters long",
    consoleMessage: "Password length validation failed",
    shouldLogToConsole: true
  },
  
  "VAL_USERNAME_REQUIRED": {
    userMessage: "Please enter a username",
    consoleMessage: "Username is required",
    shouldLogToConsole: true
  },
  
  "VAL_USERNAME_TOO_SHORT": {
    userMessage: "Username must be at least 3 characters long",
    consoleMessage: "Username too short",
    shouldLogToConsole: true
  },
  
  "VAL_USERNAME_TOO_LONG": {
    userMessage: "Username cannot be longer than 16 characters",
    consoleMessage: "Username too long",
    shouldLogToConsole: true
  },
  
  "VAL_USERNAME_INVALID_FORMAT": {
    userMessage: "Username can only contain letters, numbers, and underscores",
    consoleMessage: "Username format validation failed",
    shouldLogToConsole: true
  },
  
  "VAL_USERNAME_TAKEN": {
    userMessage: "This username is already taken. Please choose another one",
    consoleMessage: "Username already exists",
    shouldLogToConsole: true
  },
  
  "VAL_EMAIL_TAKEN": {
    userMessage: "An account with this email already exists. Please try logging in instead",
    consoleMessage: "Email already exists",
    shouldLogToConsole: true
  },
  
  "VAL_COUNTRY_REQUIRED": {
    userMessage: "Please select your country",
    consoleMessage: "Country is required",
    shouldLogToConsole: true
  },
  
  "VAL_GENDER_REQUIRED": {
    userMessage: "Please select your gender",
    consoleMessage: "Gender is required", 
    shouldLogToConsole: true
  },
  
  "VAL_ALL_FIELDS_REQUIRED": {
    userMessage: "Please fill in all required fields",
    consoleMessage: "Required fields missing",
    shouldLogToConsole: true
  },
  
  "VAL_EMAIL_DOMAIN_NOT_ALLOWED": {
    userMessage: "Please use an email from a common provider like Gmail, Yahoo, or Outlook for security reasons",
    consoleMessage: "Email domain not allowed",
    shouldLogToConsole: true
  },
  
  "VAL_EMAIL_PLUS_SIGN": {
    userMessage: "Email addresses with '+' symbols are not supported. Please use a different email",
    consoleMessage: "Email contains unsupported plus sign",
    shouldLogToConsole: true
  },
  
  "VAL_USER_NOT_FOUND": {
    userMessage: "User account not found",
    consoleMessage: "User not found",
    shouldLogToConsole: true
  },
  
  "VAL_COUNTRY_SAME": {
    userMessage: "Please select a different country than your current one",
    consoleMessage: "New country same as current",
    shouldLogToConsole: true
  },
  
  "VAL_COUNTRY_CHANGE_RESTRICTED": {
    userMessage: "You can only change your country once per month. Please try again later",
    consoleMessage: "Country change rate limited",
    shouldLogToConsole: true
  },
  
  "VAL_PASSWORD_REQUIRED_FOR_DELETION": {
    userMessage: "Please enter your password to confirm account deletion",
    consoleMessage: "Password required for account deletion",
    shouldLogToConsole: true
  },
  
  "VAL_PHOTO_DATA_REQUIRED": {
    userMessage: "Please select a photo to upload",
    consoleMessage: "Photo data missing",
    shouldLogToConsole: true
  },
  
  "VAL_PHOTO_INVALID_FORMAT": {
    userMessage: "Please upload a valid image file (JPG, PNG, or GIF)",
    consoleMessage: "Invalid photo format",
    shouldLogToConsole: true
  },
  
  "VAL_ACCOUNT_ALREADY_MARKED": {
    userMessage: "Your account is already scheduled for deletion",
    consoleMessage: "Account already marked for deletion",
    shouldLogToConsole: true
  },
  
  "VAL_INVALID_PERIOD": {
    userMessage: "Please select a valid time period",
    consoleMessage: "Invalid period parameter",
    shouldLogToConsole: true
  },
  
  "VAL_PERIOD_REQUIRED": {
    userMessage: "Please select a time period",
    consoleMessage: "Period parameter required",
    shouldLogToConsole: true
  },
  
  "VAL_INVALID_JSON": {
    userMessage: "There was an error with your request. Please try again",
    consoleMessage: "Invalid JSON format",
    shouldLogToConsole: true
  },

  // ==========================================
  // AUTHENTICATION ERRORS (AUTH_xxx)
  // ==========================================
  
  "AUTH_INVALID_CREDENTIALS": {
    userMessage: "Invalid email or password. Please check your credentials and try again",
    consoleMessage: "Invalid login credentials",
    shouldLogToConsole: true
  },
  
  "AUTH_TOKEN_EXPIRED": {
    userMessage: "Your session has expired. Please log in again",
    consoleMessage: "Authentication token expired",
    shouldLogToConsole: true
  },
  
  "AUTH_TOKEN_MISSING": {
    userMessage: "Please log in to access this feature",
    consoleMessage: "Authentication token missing",
    shouldLogToConsole: true
  },
  
  "AUTH_TOKEN_INVALID": {
    userMessage: "Your session is invalid. Please log in again",
    consoleMessage: "Invalid authentication token",
    shouldLogToConsole: true
  },
  
  "AUTH_UNAUTHORIZED": {
    userMessage: "You don't have permission to access this feature",
    consoleMessage: "Unauthorized access attempt",
    shouldLogToConsole: true
  },
  
  "AUTH_ACCOUNT_DELETED": {
    userMessage: "This account has been deleted",
    consoleMessage: "Account marked as deleted",
    shouldLogToConsole: true
  },
  
  "AUTH_ACCOUNT_LOCKED": {
    userMessage: "Your account is temporarily locked. Please try again later",
    consoleMessage: "Account temporarily locked",
    shouldLogToConsole: true
  },
  
  "AUTH_TOKEN_REQUIRED": {
    userMessage: "Please log in to continue",
    consoleMessage: "Access token required",
    shouldLogToConsole: true
  },
  
  "AUTH_USER_NOT_EXISTS": {
    userMessage: "Your account no longer exists",
    consoleMessage: "User account not found",
    shouldLogToConsole: true
  },
  
  "AUTH_TOKEN_MALFORMED": {
    userMessage: "There's an issue with your session. Please log in again",
    consoleMessage: "Malformed authentication token",
    shouldLogToConsole: true
  },

  // ==========================================
  // SYSTEM ERRORS (SYS_xxx)
  // ==========================================
  
  "SYS_INTERNAL_ERROR": {
    userMessage: "Something went wrong on our end. Please try again in a moment",
    consoleMessage: "Internal server error",
    shouldLogToConsole: true
  },
  
  "SYS_DATABASE_ERROR": {
    userMessage: "We're experiencing technical difficulties. Please try again later",
    consoleMessage: "Database operation failed",
    shouldLogToConsole: true
  },
  
  "SYS_DATABASE_CONNECTION_FAILED": {
    userMessage: "We're having trouble connecting to our servers. Please try again",
    consoleMessage: "Database connection failed",
    shouldLogToConsole: true
  },
  
  "SYS_SERVER_ERROR": {
    userMessage: "Our servers are experiencing issues. Please try again shortly",
    consoleMessage: "Server error occurred",
    shouldLogToConsole: true
  },
  
  "SYS_MAINTENANCE": {
    userMessage: "We're currently performing maintenance. Please check back soon",
    consoleMessage: "Service under maintenance",
    shouldLogToConsole: true
  },
  
  "SYS_LOGGING_ERROR": {
    userMessage: "There was an issue processing your request. Please try again",
    consoleMessage: "System logging failed",
    shouldLogToConsole: true
  },

  // ==========================================
  // NETWORK ERRORS (NET_xxx)
  // ==========================================
  
  "NET_CONNECTION_ERROR": {
    userMessage: "Please check your internet connection and try again",
    consoleMessage: "Network connection error",
    shouldLogToConsole: true
  },
  
  "NET_TIMEOUT": {
    userMessage: "The request timed out. Please check your connection and try again",
    consoleMessage: "Request timeout",
    shouldLogToConsole: true
  },
  
  "NET_SERVER_UNREACHABLE": {
    userMessage: "Unable to reach our servers. Please try again later",
    consoleMessage: "Server unreachable",
    shouldLogToConsole: true
  },

  // ==========================================
  // RATE LIMITING ERRORS (RATE_xxx)
  // ==========================================
  
  "RATE_LIMIT_EXCEEDED": {
    userMessage: "You're doing that too quickly. Please wait a moment and try again",
    consoleMessage: "Rate limit exceeded",
    shouldLogToConsole: true
  },
  
  "RATE_TOO_MANY_REQUESTS": {
    userMessage: "Too many requests. Please wait a moment before trying again",
    consoleMessage: "Too many requests",
    shouldLogToConsole: true
  },
  
  "RATE_TOO_MANY_LOGIN_ATTEMPTS": {
    userMessage: "Too many login attempts. Please wait a few minutes before trying again",
    consoleMessage: "Login rate limit exceeded",
    shouldLogToConsole: true
  },

  // ==========================================
  // USER SETTINGS ERRORS (SETTINGS_xxx)
  // ==========================================
  
  "SETTINGS_COUNTRY_CHANGE_RESTRICTED": {
    userMessage: "You can only change your country once per month",
    consoleMessage: "Country change restricted",
    shouldLogToConsole: true
  },
  
  "SETTINGS_INVALID_PROFILE_PHOTO": {
    userMessage: "Please upload a valid profile photo",
    consoleMessage: "Invalid profile photo format",
    shouldLogToConsole: true
  },
  
  "SETTINGS_FILE_TOO_LARGE": {
    userMessage: "The file is too large. Please choose a smaller image",
    consoleMessage: "File size exceeds limit",
    shouldLogToConsole: true
  },
  
  "SETTINGS_INVALID_FILE_TYPE": {
    userMessage: "Please upload an image file (JPG, PNG, or GIF)",
    consoleMessage: "Invalid file type",
    shouldLogToConsole: true
  },

  // ==========================================
  // MOOD TRACKING ERRORS (MOOD_xxx)
  // ==========================================
  
  "MOOD_INVALID": {
    userMessage: "Please select a valid mood",
    consoleMessage: "Invalid mood selection",
    shouldLogToConsole: true
  },
  
  "MOOD_ALREADY_RECORDED": {
    userMessage: "You've already recorded your mood for today",
    consoleMessage: "Mood already recorded today",
    shouldLogToConsole: true
  },
  
  "MOOD_REQUIRED": {
    userMessage: "Please select how you're feeling",
    consoleMessage: "Mood selection required",
    shouldLogToConsole: true
  },
  
  "MOOD_INVALID_VALUE": {
    userMessage: "Please select a valid mood from the available options",
    consoleMessage: "Invalid mood value",
    shouldLogToConsole: true
  },
  
  "MOOD_USER_REFERENCE_INVALID": {
    userMessage: "There was an issue with your user account. Please try logging in again",
    consoleMessage: "Invalid user reference for mood",
    shouldLogToConsole: true
  },
  
  "MOOD_RETRIEVAL_ERROR": {
    userMessage: "Unable to load your mood history. Please try again",
    consoleMessage: "Failed to retrieve mood data",
    shouldLogToConsole: true
  },
  
  "MOOD_CREATION_ERROR": {
    userMessage: "Unable to save your mood. Please try again",
    consoleMessage: "Failed to create mood entry",
    shouldLogToConsole: true
  },

  // ==========================================
  // EMAIL SERVICE ERRORS (EMAIL_xxx)
  // ==========================================
  
  "EMAIL_SERVICE_UNAVAILABLE": {
    userMessage: "Our email service is temporarily unavailable. Please try again later",
    consoleMessage: "Email service unavailable",
    shouldLogToConsole: true
  },
  
  "EMAIL_SENDING_FAILED": {
    userMessage: "Unable to send email. Please try again or contact support",
    consoleMessage: "Email sending failed",
    shouldLogToConsole: true
  },
  
  "EMAIL_CONFIG_ERROR": {
    userMessage: "There's an issue with our email system. Please try again later",
    consoleMessage: "Email configuration error",
    shouldLogToConsole: true
  },

  // ==========================================
  // DATABASE OPERATION ERRORS (DB_xxx)
  // ==========================================
  
  "DB_INSERT_FAILED": {
    userMessage: "Unable to save your data. Please try again",
    consoleMessage: "Database insert operation failed",
    shouldLogToConsole: true
  },
  
  "DB_UPDATE_FAILED": {
    userMessage: "Unable to update your information. Please try again",
    consoleMessage: "Database update operation failed",
    shouldLogToConsole: true
  },

  // ==========================================
  // CONTACT FORM ERRORS (CONTACT_xxx)
  // ==========================================
  
  "CONTACT_SUBJECT_REQUIRED": {
    userMessage: "Please enter a subject for your message",
    consoleMessage: "Contact subject required",
    shouldLogToConsole: true
  },
  
  "CONTACT_MESSAGE_REQUIRED": {
    userMessage: "Please enter your message",
    consoleMessage: "Contact message required",
    shouldLogToConsole: true
  },
  
  "CONTACT_EMAIL_REQUIRED": {
    userMessage: "Please enter your email address",
    consoleMessage: "Contact email required",
    shouldLogToConsole: true
  },

  // ==========================================
  // SECURITY ERRORS (SECURITY_xxx, SEC_xxx)
  // ==========================================
  
  "SECURITY_PROGRESSIVE_VIOLATION": {
    userMessage: "Security limit exceeded. Please wait before trying again",
    consoleMessage: "Progressive rate limit violation",
    shouldLogToConsole: true
  },
  
  "SEC_RATE_LIMIT_VIOLATION": {
    userMessage: "Too many requests detected. Please slow down",
    consoleMessage: "Rate limit violation detected",
    shouldLogToConsole: true
  },
  
  "SEC_JSON_ATTACK": {
    userMessage: "Invalid request format detected",
    consoleMessage: "JSON syntax attack detected",
    shouldLogToConsole: true
  },

  // ==========================================
  // GENERIC/UNKNOWN ERRORS
  // ==========================================
  
  "UNKNOWN_ERROR": {
    userMessage: "Something unexpected happened. Please try again",
    consoleMessage: "Unknown error occurred",
    shouldLogToConsole: true
  },
  
  "OPERATION_FAILED": {
    userMessage: "The operation couldn't be completed. Please try again",
    consoleMessage: "Operation failed",
    shouldLogToConsole: true
  }
};

// Helper function to get error mapping by code
export const getErrorMapping = (errorCode: string): ErrorMappingItem => {
  return ERROR_MAPPING[errorCode] || ERROR_MAPPING["UNKNOWN_ERROR"];
};

// Export all error codes for validation
export const MAPPED_ERROR_CODES = Object.keys(ERROR_MAPPING);