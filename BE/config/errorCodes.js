// BE/config/errorCodes.js
// Master error codes file - Single source of truth for all error codes and messages

// Error catalog with centralized messages (Industry Standard)
const ERROR_CATALOG = {
    // Validation Errors (VAL_xxx)
    VAL_EMAIL_REQUIRED: {
        code: 'VAL_EMAIL_REQUIRED',
        message: 'Email is required'
    },
    VAL_PASSWORD_REQUIRED: {
        code: 'VAL_PASSWORD_REQUIRED',
        message: 'Password is required'
    },
    VAL_INVALID_EMAIL: {
        code: 'VAL_INVALID_EMAIL',
        message: 'Invalid email format'
    },
    VAL_PASSWORD_TOO_SHORT: {
        code: 'VAL_PASSWORD_TOO_SHORT',
        message: 'Password must be at least 6 characters long'
    },
    VAL_USERNAME_REQUIRED: {
        code: 'VAL_USERNAME_REQUIRED',
        message: 'Username is required'
    },
    VAL_USERNAME_TOO_SHORT: {
        code: 'VAL_USERNAME_TOO_SHORT',
        message: 'Username must be at least 3 characters long'
    },
    VAL_USERNAME_TOO_LONG: {
        code: 'VAL_USERNAME_TOO_LONG',
        message: 'Username cannot exceed 16 characters'
    },
    VAL_USERNAME_INVALID_FORMAT: {
        code: 'VAL_USERNAME_INVALID_FORMAT',
        message: 'Username can only contain letters, numbers, and underscores'
    },
    VAL_USERNAME_TAKEN: {
        code: 'VAL_USERNAME_TAKEN',
        message: 'Username is already taken'
    },
    VAL_EMAIL_TAKEN: {
        code: 'VAL_EMAIL_TAKEN',
        message: 'User with this email already exists'
    },
    VAL_COUNTRY_REQUIRED: {
        code: 'VAL_COUNTRY_REQUIRED',
        message: 'Country is required'
    },
    VAL_GENDER_REQUIRED: {
        code: 'VAL_GENDER_REQUIRED',
        message: 'Gender is required'
    },
    VAL_ALL_FIELDS_REQUIRED: {
        code: 'VAL_ALL_FIELDS_REQUIRED',
        message: 'All fields are required'
    },
    VAL_EMAIL_DOMAIN_NOT_ALLOWED: {
        code: 'VAL_EMAIL_DOMAIN_NOT_ALLOWED',
        message: 'The email domain is not allowed due to security reasons, please use email with common domains like gmail, yahoo etc'
    },
    VAL_EMAIL_PLUS_SIGN: {
        code: 'VAL_EMAIL_PLUS_SIGN',
        message: 'Email with \'+\' character not supported'
    },
    VAL_USER_NOT_FOUND: {
        code: 'VAL_USER_NOT_FOUND',
        message: 'User not found'
    },
    VAL_COUNTRY_SAME: {
        code: 'VAL_COUNTRY_SAME',
        message: 'New country must be different from current country'
    },
    VAL_COUNTRY_CHANGE_RESTRICTED: {
        code: 'VAL_COUNTRY_CHANGE_RESTRICTED',
        message: 'Country can only be changed once per month'
    },
    VAL_PASSWORD_REQUIRED_FOR_DELETION: {
        code: 'VAL_PASSWORD_REQUIRED_FOR_DELETION',
        message: 'Password is required to delete account'
    },
    VAL_PHOTO_DATA_REQUIRED: {
        code: 'VAL_PHOTO_DATA_REQUIRED',
        message: 'Photo data is required'
    },
    VAL_PHOTO_INVALID_FORMAT: {
        code: 'VAL_PHOTO_INVALID_FORMAT',
        message: 'Invalid photo format'
    },
    VAL_ACCOUNT_ALREADY_MARKED: {
        code: 'VAL_ACCOUNT_ALREADY_MARKED',
        message: 'Account is already marked for deletion'
    },
    VAL_INVALID_PERIOD: {
        code: 'VAL_INVALID_PERIOD',
        message: 'Invalid period parameter'
    },
    VAL_PERIOD_REQUIRED: {
        code: 'VAL_PERIOD_REQUIRED',
        message: 'Period parameter is required'
    },
    VAL_INVALID_JSON: {
        code: 'VAL_INVALID_JSON',
        message: 'Invalid request format'
      },

    // Authentication Errors (AUTH_xxx)
    AUTH_INVALID_CREDENTIALS: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password'
    },
    AUTH_TOKEN_EXPIRED: {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Your session has expired'
    },
    AUTH_TOKEN_MISSING: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'Authentication token is missing'
    },
    AUTH_TOKEN_INVALID: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid authentication token'
    },
    AUTH_UNAUTHORIZED: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Unauthorized access'
    },
    AUTH_ACCOUNT_DELETED: {
        code: 'AUTH_ACCOUNT_DELETED',
        message: 'This account has been deleted'
    },
    AUTH_ACCOUNT_LOCKED: {
        code: 'AUTH_ACCOUNT_LOCKED',
        message: 'Account temporarily locked'
    },
    AUTH_TOKEN_REQUIRED: {
        code: 'AUTH_TOKEN_REQUIRED',
        message: 'Access token required'
    },
    AUTH_USER_NOT_EXISTS: {
        code: 'AUTH_USER_NOT_EXISTS',
        message: 'User no longer exists'
    },
    AUTH_TOKEN_MALFORMED: {
        code: 'AUTH_TOKEN_MALFORMED',
        message: 'Token is malformed or invalid'
    },

    // System Errors (SYS_xxx)
    SYS_INTERNAL_ERROR: {
        code: 'SYS_INTERNAL_ERROR',
        message: 'Internal server error'
    },
    SYS_DATABASE_ERROR: {
        code: 'SYS_DATABASE_ERROR',
        message: 'Database operation failed'
    },
    SYS_DATABASE_CONNECTION_FAILED: {
        code: 'SYS_DATABASE_CONNECTION_FAILED',
        message: 'Unable to connect to database'
    },
    SYS_SERVER_ERROR: {
        code: 'SYS_SERVER_ERROR',
        message: 'Server error occurred'
    },
    SYS_MAINTENANCE: {
        code: 'SYS_MAINTENANCE',
        message: 'Service temporarily unavailable for maintenance'
    },
    SYS_LOGGING_ERROR: {
        code: 'SYS_LOGGING_ERROR',
        message: 'Failed to log system event'
      },

    // Network Errors (NET_xxx)
    NET_CONNECTION_ERROR: {
        code: 'NET_CONNECTION_ERROR',
        message: 'Network connection error'
    },
    NET_TIMEOUT: {
        code: 'NET_TIMEOUT',
        message: 'Request timeout'
    },
    NET_SERVER_UNREACHABLE: {
        code: 'NET_SERVER_UNREACHABLE',
        message: 'Server unreachable'
    },

    // Rate Limiting Errors (RATE_xxx)
    RATE_LIMIT_EXCEEDED: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded'
    },
    RATE_TOO_MANY_REQUESTS: {
        code: 'RATE_TOO_MANY_REQUESTS',
        message: 'Too many requests'
    },
    RATE_TOO_MANY_LOGIN_ATTEMPTS: {
        code: 'RATE_TOO_MANY_LOGIN_ATTEMPTS',
        message: 'Too many login attempts'
    },

    // User Settings Errors (SETTINGS_xxx)
    SETTINGS_COUNTRY_CHANGE_RESTRICTED: {
        code: 'SETTINGS_COUNTRY_CHANGE_RESTRICTED',
        message: 'Country can only be changed once per month'
    },
    SETTINGS_INVALID_PROFILE_PHOTO: {
        code: 'SETTINGS_INVALID_PROFILE_PHOTO',
        message: 'Invalid profile photo format'
    },
    SETTINGS_FILE_TOO_LARGE: {
        code: 'SETTINGS_FILE_TOO_LARGE',
        message: 'File size too large'
    },
    SETTINGS_INVALID_FILE_TYPE: {
        code: 'SETTINGS_INVALID_FILE_TYPE',
        message: 'Invalid file type'
    },

    // Mood Tracking Errors (MOOD_xxx)
    MOOD_INVALID: {
        code: 'MOOD_INVALID',
        message: 'Invalid mood selection'
    },
    MOOD_ALREADY_RECORDED: {
        code: 'MOOD_ALREADY_RECORDED',
        message: 'Mood already recorded for today'
    },
    MOOD_REQUIRED: {
        code: 'MOOD_REQUIRED',
        message: 'Mood selection is required'
    },

    // Email Service Errors (EMAIL_xxx)
    EMAIL_SERVICE_UNAVAILABLE: {
        code: 'EMAIL_SERVICE_UNAVAILABLE',
        message: 'Email service temporarily unavailable'
    },
    EMAIL_SENDING_FAILED: {
        code: 'EMAIL_SENDING_FAILED',
        message: 'Failed to send email'
    },
    EMAIL_CONFIG_ERROR: {
        code: 'EMAIL_CONFIG_ERROR',
        message: 'Email configuration error'
    },

    // Database Operation Errors (DB_xxx) - if not already exist
    DB_INSERT_FAILED: {
        code: 'DB_INSERT_FAILED',
        message: 'Database insert operation failed'
    },
    DB_UPDATE_FAILED: {
        code: 'DB_UPDATE_FAILED',
        message: 'Database update operation failed'
    },
    // Contact Form Errors (CONTACT_xxx)

    CONTACT_SUBJECT_REQUIRED: {
        code: 'CONTACT_SUBJECT_REQUIRED',
        message: 'Subject is required'
    },
    CONTACT_MESSAGE_REQUIRED: {
        code: 'CONTACT_MESSAGE_REQUIRED',
        message: 'Message is required'
    },
    CONTACT_EMAIL_REQUIRED: {
        code: 'CONTACT_EMAIL_REQUIRED',
        message: 'Email is required'
    },

    

    // Mood-specific validation errors (MOOD_xxx)
    MOOD_REQUIRED: {
        code: 'MOOD_REQUIRED',
        message: 'Mood is required'
    },
    MOOD_INVALID_VALUE: {
        code: 'MOOD_INVALID_VALUE',
        message: 'Invalid mood value'
    },
    MOOD_USER_REFERENCE_INVALID: {
        code: 'MOOD_USER_REFERENCE_INVALID',
        message: 'Invalid user reference'
    },

    // Mood retrieval errors
    MOOD_RETRIEVAL_ERROR: {
        code: 'MOOD_RETRIEVAL_ERROR',
        message: 'Failed to retrieve mood data'
    },
    MOOD_CREATION_ERROR: {
        code: 'MOOD_CREATION_ERROR',
        message: 'Failed to create mood entry'
    },
    
    //security errors
    SECURITY_PROGRESSIVE_VIOLATION: {
        code: 'SECURITY_PROGRESSIVE_VIOLATION',
        message: 'Progressive rate limit threshold exceeded'
    },
    SECURITY_RATE_LIMIT_VIOLATION: {
        code: 'SEC_RATE_LIMIT_VIOLATION',
        message: 'Rate limit violation detected'
      },

    SECURITY_JSON_ATTACK: {
        code: 'SEC_JSON_ATTACK',
        message: 'JSON syntax attack detected'
      },
    // Generic/Unknown Errors
    UNKNOWN_ERROR: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred'
    },
    OPERATION_FAILED: {
        code: 'OPERATION_FAILED',
        message: 'Operation failed'
    }
};

// Helper function to get error by code
const getError = (errorCode) => {
    return ERROR_CATALOG[errorCode] || ERROR_CATALOG.UNKNOWN_ERROR;
};

// Export both the catalog and helper function
module.exports = { ERROR_CATALOG, getError };