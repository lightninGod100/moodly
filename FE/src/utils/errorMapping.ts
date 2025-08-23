// FE/src/utils/errorMapping.ts
// Frontend Error Mapping Configuration
// Maps backend error codes to user-friendly UI messages and developer console messages

export interface ErrorMappingItem {
  userMessage: string;        // User-friendly message for UI display
  consoleMessage: string;     // Developer-focused message for console
  type: 'error' | 'warning';  // Error severity type
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
    type: "error"
  },

  "VAL_PASSWORD_REQUIRED": {
    userMessage: "Please enter your password",
    consoleMessage: "Password is required",
    type: "error"
  },

  "VAL_INVALID_EMAIL": {
    userMessage: "Please enter a valid email address",
    consoleMessage: "Invalid email format",
    type: "error"
  },

  "VAL_PASSWORD_TOO_SHORT": {
    userMessage: "Password must be at least 6 characters long",
    consoleMessage: "Password length validation failed",
    type: "error"
  },

  "VAL_USERNAME_REQUIRED": {
    userMessage: "Please enter a username",
    consoleMessage: "Username is required",
    type: "error"
  },

  "VAL_USERNAME_TOO_SHORT": {
    userMessage: "Username must be at least 3 characters long",
    consoleMessage: "Username too short",
    type: "error"
  },

  "VAL_USERNAME_TOO_LONG": {
    userMessage: "Username cannot be longer than 16 characters",
    consoleMessage: "Username too long",
    type: "error"
  },

  "VAL_USERNAME_INVALID_FORMAT": {
    userMessage: "Username can only contain letters, numbers, and underscores",
    consoleMessage: "Username format validation failed",
    type: "error"
  },

  "VAL_USERNAME_TAKEN": {
    userMessage: "This username is already taken. Please choose another one",
    consoleMessage: "Username already exists",
    type: "error"
  },

  "VAL_EMAIL_TAKEN": {
    userMessage: "An account with this email already exists. Please try logging in instead",
    consoleMessage: "Email already exists",
    type: "error"
  },

  "VAL_COUNTRY_REQUIRED": {
    userMessage: "Please select your country",
    consoleMessage: "Country is required",
    type: "error"
  },

  "VAL_GENDER_REQUIRED": {
    userMessage: "Please select your gender",
    consoleMessage: "Gender is required",
    type: "error"
  },

  "VAL_ALL_FIELDS_REQUIRED": {
    userMessage: "Please fill in all required fields",
    consoleMessage: "Required fields missing",
    type: "error"
  },

  "VAL_EMAIL_DOMAIN_NOT_ALLOWED": {
    userMessage: "Please use an email from a common provider like Gmail, Yahoo, or Outlook etc",
    consoleMessage: "Email domain not allowed",
    type: "error"
  },

  "VAL_EMAIL_PLUS_SIGN": {
    userMessage: "Email addresses with '+' symbols are not supported. Please use a different email",
    consoleMessage: "Email contains unsupported plus sign",
    type: "error"
  },

  "VAL_USER_NOT_FOUND": {
    userMessage: "User account not found",
    consoleMessage: "User not found",
    type: "error"
  },

  "VAL_COUNTRY_SAME": {
    userMessage: "Please select a different country than your current one",
    consoleMessage: "New country same as current",
    type: "error"
  },

  "VAL_COUNTRY_CHANGE_RESTRICTED": {
    userMessage: "You can only change your country once per month. Please try again later",
    consoleMessage: "Country change rate limited",
    type: "error"
  },

  "VAL_PASSWORD_REQUIRED_FOR_DELETION": {
    userMessage: "Please enter your password to confirm account deletion",
    consoleMessage: "Password required for account deletion",
    type: "error"
  },

  "VAL_PHOTO_DATA_REQUIRED": {
    userMessage: "Please select a photo to upload",
    consoleMessage: "Photo data missing",
    type: "error"
  },

  "VAL_PHOTO_INVALID_FORMAT": {
    userMessage: "Please upload a valid image file (JPG, PNG, or GIF)",
    consoleMessage: "Invalid photo format",
    type: "error"
  },

  "VAL_ACCOUNT_ALREADY_MARKED": {
    userMessage: "Your account is already scheduled for deletion",
    consoleMessage: "Account already marked for deletion",
    type: "warning"
  },

  "VAL_INVALID_PERIOD": {
    userMessage: "Please select a valid time period",
    consoleMessage: "Invalid period parameter",
    type: "error"
  },

  "VAL_PERIOD_REQUIRED": {
    userMessage: "Please select a time period",
    consoleMessage: "Period parameter required",
    type: "error"
  },

  "VAL_INVALID_JSON": {
    userMessage: "There was an error with your request. Please try again",
    consoleMessage: "Invalid JSON format",
    type: "error"
  },

  "VAL_REQUEST_TOO_LARGE": {
    userMessage: "Your request is too large. Please try with a smaller file",
    consoleMessage: "Request size exceeds server limit",
    type: "error"
  },

  // ==========================================
  // AUTHENTICATION ERRORS (AUTH_xxx)
  // ==========================================

  "AUTH_INVALID_CREDENTIALS": {
    userMessage: "Invalid email or password. Please check your credentials and try again",
    consoleMessage: "Invalid login credentials",
    type: "error"
  },

  "AUTH_INVALID_PASSWORD": {
    userMessage: "Invalid password. Please check your password and try again",
    consoleMessage: "Invalid password",
    type: "error"
  },

  "AUTH_TOKEN_EXPIRED": {
    userMessage: "Your session has expired. Please log in again",
    consoleMessage: "Authentication token expired",
    type: "warning"
  },

  "AUTH_TOKEN_MISSING": {
    userMessage: "Please log in to access this feature",
    consoleMessage: "Authentication token missing",
    type: "error"
  },

  "AUTH_TOKEN_INVALID": {
    userMessage: "Your session is invalid. Please log in again",
    consoleMessage: "Invalid authentication token",
    type: "error"
  },

  "AUTH_UNAUTHORIZED": {
    userMessage: "You don't have permission to access this feature",
    consoleMessage: "Unauthorized access attempt",
    type: "error"
  },

  "AUTH_ACCOUNT_DELETED": {
    userMessage: "This account has been deleted",
    consoleMessage: "Account marked as deleted",
    type: "error"
  },

  "AUTH_ACCOUNT_LOCKED": {
    userMessage: "Your account is temporarily locked. Please try again later",
    consoleMessage: "Account temporarily locked",
    type: "warning"
  },

  "AUTH_TOKEN_REQUIRED": {
    userMessage: "Please log in to continue",
    consoleMessage: "Access token required",
    type: "error"
  },

  "AUTH_USER_NOT_EXISTS": {
    userMessage: "Your account no longer exists",
    consoleMessage: "User account not found",
    type: "error"
  },

  "AUTH_TOKEN_MALFORMED": {
    userMessage: "There's an issue with your session. Please log in again",
    consoleMessage: "Malformed authentication token",
    type: "error"
  },

  // ==========================================
  // SYSTEM ERRORS (SYS_xxx)
  // ==========================================

  "SYS_INTERNAL_ERROR": {
    userMessage: "Something went wrong on our end. Please try again in a moment",
    consoleMessage: "Internal server error",
    type: "error"
  },

  "SYS_DATABASE_ERROR": {
    userMessage: "We're experiencing technical difficulties. Please try again later.",
    consoleMessage: "Database operation failed",
    type: "error"
  },

  "SYS_DATABASE_CONNECTION_FAILED": {
    userMessage: "We're having trouble connecting to our servers. Please try again",
    consoleMessage: "Database connection failed",
    type: "error"
  },

  "SYS_SERVER_ERROR": {
    userMessage: "Our servers are experiencing issues. Please try again shortly",
    consoleMessage: "Server error occurred",
    type: "error"
  },

  "SYS_MAINTENANCE": {
    userMessage: "We're currently performing maintenance. Please check back soon",
    consoleMessage: "Service under maintenance",
    type: "warning"
  },

  "SYS_LOGGING_ERROR": {
    userMessage: "There was an issue processing your request. Please try again",
    consoleMessage: "System logging failed",
    type: "error"
  },
  // In the SYSTEM ERRORS (SYS_xxx) section
  "SYS_TIMEOUT_ERROR": {
    userMessage: "The request is taking longer than expected. Please try again",
    consoleMessage: "Request timeout from server",
    type: "error"
  },

  // ==========================================
  // NETWORK ERRORS (NET_xxx)
  // ==========================================

  "NET_CONNECTION_ERROR": {
    userMessage: "Please check your internet connection and try again or come back later.",
    consoleMessage: "Network connection error",
    type: "error"
  },

  "NET_TIMEOUT": {
    userMessage: "The request timed out. Please check your connection and try again",
    consoleMessage: "Request timeout",
    type: "error"
  },

  "NET_SERVER_UNREACHABLE": {
    userMessage: "Unable to reach our servers. Please try again later",
    consoleMessage: "Server unreachable",
    type: "error"
  },

  "API_ENDPOINT_NOT_FOUND": {
    userMessage: "The requested feature is not available. Please refresh the page or try again later.",
    consoleMessage: "API endpoint not found - route does not exist",
    type: "error"
  },

  "API_METHOD_NOT_ALLOWED": {
    userMessage: "Invalid request method. Please try again later.",
    consoleMessage: "HTTP method not allowed for endpoint",
    type: "error"
  },
  // ==========================================
  // RATE LIMITING ERRORS (RATE_xxx)
  // ==========================================

  "RATE_LIMIT_EXCEEDED": {
    userMessage: "Too many requests. Please wait a moment before trying again",
    consoleMessage: "Rate limit exceeded",
    type: "warning"
  },


  "RATE_TOO_MANY_LOGIN_ATTEMPTS": {
    userMessage: "Too many login attempts. Please wait a few minutes before trying again",
    consoleMessage: "Login rate limit exceeded",
    type: "warning"
  },

  // ==========================================
  // USER SETTINGS ERRORS (SETTINGS_xxx)
  // ==========================================

  "SETTINGS_COUNTRY_CHANGE_RESTRICTED": {
    userMessage: "You can only change your country once per month",
    consoleMessage: "Country change restricted",
    type: "warning"
  },

  "SETTINGS_INVALID_PROFILE_PHOTO": {
    userMessage: "Please upload a valid profile photo",
    consoleMessage: "Invalid profile photo format",
    type: "error"
  },

  "SETTINGS_FILE_TOO_LARGE": {
    userMessage: "The file is too large. Please choose a smaller image",
    consoleMessage: "File size exceeds limit",
    type: "error"
  },

  "SETTINGS_INVALID_FILE_TYPE": {
    userMessage: "Please upload an image file (JPG, PNG, or GIF)",
    consoleMessage: "Invalid file type",
    type: "error"
  },

  // ==========================================
  // MOOD TRACKING ERRORS (MOOD_xxx)
  // ==========================================

  "MOOD_INVALID": {
    userMessage: "Please select a valid mood",
    consoleMessage: "Invalid mood selection",
    type: "error"
  },

  "MOOD_ALREADY_RECORDED": {
    userMessage: "You've already recorded your mood for today",
    consoleMessage: "Mood already recorded today",
    type: "warning"
  },

  "MOOD_REQUIRED": {
    userMessage: "Please select how you're feeling",
    consoleMessage: "Mood selection required",
    type: "error"
  },

  "MOOD_INVALID_VALUE": {
    userMessage: "Please select a valid mood from the available options",
    consoleMessage: "Invalid mood value",
    type: "error"
  },

  "MOOD_USER_REFERENCE_INVALID": {
    userMessage: "There was an issue with your user account. Please try logging in again",
    consoleMessage: "Invalid user reference for mood",
    type: "error"
  },

  "MOOD_RETRIEVAL_ERROR": {
    userMessage: "Unable to load your mood history. Please try again",
    consoleMessage: "Failed to retrieve mood data",
    type: "error"
  },

  "MOOD_CREATION_ERROR": {
    userMessage: "Unable to save your mood. Please try again later.",
    consoleMessage: "Failed to create mood entry",
    type: "error"
  },

  // ==========================================
  // EMAIL SERVICE ERRORS (EMAIL_xxx)
  // ==========================================

  "EMAIL_SERVICE_UNAVAILABLE": {
    userMessage: "Our email service is temporarily unavailable. Please try again later",
    consoleMessage: "Email service unavailable",
    type: "error"
  },

  "EMAIL_SENDING_FAILED": {
    userMessage: "Unable to send email. Please try again or contact support",
    consoleMessage: "Email sending failed",
    type: "error"
  },

  "EMAIL_CONFIG_ERROR": {
    userMessage: "There's an issue with our email system. Please try again later",
    consoleMessage: "Email configuration error",
    type: "error"
  },

  // ==========================================
  // DATABASE OPERATION ERRORS (DB_xxx)
  // ==========================================

  "DB_INSERT_FAILED": {
    userMessage: "Unable to save your data. Please try again",
    consoleMessage: "Database insert operation failed",
    type: "error"
  },

  "DB_UPDATE_FAILED": {
    userMessage: "Unable to update your information. Please try again",
    consoleMessage: "Database update operation failed",
    type: "error"
  },

  // ==========================================
  // CONTACT FORM ERRORS (CONTACT_xxx)
  // ==========================================

  "CONTACT_SUBJECT_REQUIRED": {
    userMessage: "Please enter a subject for your message",
    consoleMessage: "Contact subject required",
    type: "error"
  },

  "CONTACT_MESSAGE_REQUIRED": {
    userMessage: "Please enter your message",
    consoleMessage: "Contact message required",
    type: "error"
  },

  "CONTACT_EMAIL_REQUIRED": {
    userMessage: "Please enter your email address",
    consoleMessage: "Contact email required",
    type: "error"
  },

  // ==========================================
  // SECURITY ERRORS (SECURITY_xxx, SEC_xxx)
  // ==========================================

  "SECURITY_PROGRESSIVE_VIOLATION": {
    userMessage: "Security limit exceeded. Please wait before trying again",
    consoleMessage: "Progressive rate limit violation",
    type: "warning"
  },

  "SEC_RATE_LIMIT_VIOLATION": {
    userMessage: "Too many requests detected. Please slow down",
    consoleMessage: "Rate limit violation detected",
    type: "warning"
  },

  "SEC_JSON_ATTACK": {
    userMessage: "Invalid request format detected",
    consoleMessage: "JSON syntax attack detected",
    type: "error"
  },

  // ==========================================
  // GENERIC/UNKNOWN ERRORS
  // ==========================================

  "UNKNOWN_ERROR": {
    userMessage: "Something unexpected happened. Please try again",
    consoleMessage: "Unknown error occurred",
    type: "error"
  },

  "OPERATION_FAILED": {
    userMessage: "The operation couldn't be completed. Please try again",
    consoleMessage: "Operation failed",
    type: "error"
  }
};

// Helper function to get error mapping by code
export const getErrorMapping = (errorCode: string): ErrorMappingItem => {
  return ERROR_MAPPING[errorCode] || ERROR_MAPPING["UNKNOWN_ERROR"];
};

// Export all error codes for validation
export const MAPPED_ERROR_CODES = Object.keys(ERROR_MAPPING);