// FE/src/utils/errorMessages.ts

// Index signature allows any string key
const ERROR_MESSAGES: { [key: string]: string } = {
    // Authentication Errors
    'INVALID_PASSWORD': 'The password you entered is incorrect',
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again',
    'INVALID_CREDENTIALS': 'Email or password is incorrect',
    'ACCOUNT_LOCKED': 'Account temporarily locked. Try again in 15 minutes',
    
    // Rate Limiting
    'RATE_LIMIT_EXCEEDED': 'Please wait a moment before trying again',
    'TOO_MANY_LOGIN_ATTEMPTS': 'Too many login attempts. Try again later',
    
    // Validation Errors
    'EMAIL_ALREADY_EXISTS': 'An account with this email already exists',
    'WEAK_PASSWORD': 'Password must be at least 6 characters long',
    'INVALID_EMAIL': 'Please enter a valid email address',
    'EMAIL_REQUIRED': 'Email is required',
    'PASSWORD_REQUIRED': 'Password is required',
    
    // User Settings Specific
    'COUNTRY_CHANGE_RESTRICTED': 'You can only change your country once per month',
    'INVALID_PROFILE_PHOTO': 'Profile photo must be PNG or JPEG, under 100KB',
    'FILE_TOO_LARGE': 'Image must be less than 100KB',
    'INVALID_FILE_TYPE': 'Only PNG and JPEG images are allowed',
    
    // Mood Tracking
    'INVALID_MOOD': 'Please select a valid mood',
    'MOOD_ALREADY_RECORDED': 'You have already recorded your mood today',
    
    // Server/Database Errors
    'DATABASE_CONNECTION_ERROR': 'Unable to connect. Please try again',
    'SERVER_MAINTENANCE': 'Service temporarily unavailable for maintenance',
    'INTERNAL_SERVER_ERROR': 'Something went wrong. Please try again',
    
    // Network Errors
    'NETWORK_ERROR': 'Please check your internet connection and try again',
    'SERVER_UNREACHABLE': 'Unable to reach server. Please try again later'
  };
  
  export const getErrorMessage = (
    errorCode: string, 
    fallback: string = 'Something went wrong. Please try again'
  ): string => {
    return ERROR_MESSAGES[errorCode] || fallback;
  };
  
  export const getContextualErrorMessage = (
    errorCode: string, 
    context: 'login' | 'signup' | 'settings' | 'mood' | 'general' = 'general'
  ): string => {
    if (errorCode === 'RATE_LIMIT_EXCEEDED') {
      switch (context) {
        case 'login': return 'Too many login attempts. Please wait before trying again';
        case 'settings': return 'Please wait a moment before refreshing your settings';
        case 'mood': return 'Please wait before recording another mood';
        case 'general':
        default: 
          return ERROR_MESSAGES[errorCode] || 'Please wait before trying again';
      }
    }
    
    return getErrorMessage(errorCode);
  };
  
  export default { getErrorMessage, getContextualErrorMessage };