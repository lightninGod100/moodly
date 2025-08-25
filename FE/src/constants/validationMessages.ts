// FE/src/constants/validationMessages.ts
// Centralized Frontend Validation Messages
// Consistent with backend error codes and user-friendly language

export const FE_VALIDATION_MESSAGES = {
  // ==========================================
  // GENERAL FIELD VALIDATION
  // ==========================================
  ALL_FIELDS_REQUIRED: 'All fields are required',

  // ==========================================
  // EMAIL VALIDATION
  // ==========================================
  EMAIL_REQUIRED: 'Please enter your email address',
  EMAIL_INVALID: 'Please enter a valid email address',

  // ==========================================
  // PASSWORD VALIDATION
  // ==========================================
  PASSWORD_REQUIRED: 'Please enter your password',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',

  // ==========================================
  // USERNAME VALIDATION
  // ==========================================
  USERNAME_REQUIRED: 'Please enter a username',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters long',
  USERNAME_TOO_LONG: 'Username cannot be longer than 16 characters',
  USERNAME_INVALID_FORMAT: 'Username can only contain letters, numbers, and underscores',

  // ==========================================
  // PROFILE VALIDATION
  // ==========================================
  COUNTRY_REQUIRED: 'Please select your country',
  GENDER_REQUIRED: 'Please select your gender',

  // ==========================================
  // AUTHENTICATION SPECIFIC
  // ==========================================
  LOGIN_CREDENTIALS_REQUIRED: 'Email and password are required',
  REGISTRATION_FIELDS_REQUIRED: 'All registration fields are required',

  // ==========================================
  // SETTINGS VALIDATION
  // ==========================================
  CURRENT_PASSWORD_REQUIRED: 'Please enter your current password',
  NEW_PASSWORD_REQUIRED: 'Please enter a new password',
  PASSWORD_CONFIRMATION_REQUIRED: 'Please confirm your new password',
  PASSWORDS_DO_NOT_MATCH: 'New passwords do not match',
  PASSWORD_SAME_AS_CURRENT: 'New password must be different from current password',
  BOTH_PASSWORDS_REQUIRED: 'Both current and new passwords are required',
  NEW_PASSWORD_TOO_SHORT: 'New password must be at least 6 characters long',
  
  // ==========================================
  // PROFILE/ACCOUNT VALIDATION
  // ==========================================
  COUNTRY_IS_REQUIRED: 'Country is required',
  PHOTO_DATA_REQUIRED: 'Photo data is required',
  INVALID_IMAGE_FORMAT: 'Invalid image format',
  IMAGE_TOO_LARGE: 'Image size must be less than 100KB',
  INVALID_IMAGE_TYPE: 'Only PNG and JPEG images are allowed',
  IMAGE_DIMENSIONS_TOO_LARGE: 'Image dimensions must be 256x256 pixels or smaller',
  FAILED_TO_READ_IMAGE: 'Failed to read image file',
  INVALID_IMAGE_FILE: 'Invalid image file',
  PASSWORD_REQUIRED_FOR_DELETION: 'Password is required to delete account',
  PASSWORD_VALIDATION_REQUIRED: 'Password is required',

  // ==========================================
  // GENERIC VALIDATION
  // ==========================================
  FIELD_REQUIRED: 'This field is required',
  INVALID_FORMAT: 'Please enter a valid format',

  // PERIOD VALIDATION
  INVALID_PERIOD: 'Please select a valid time period',
  PERIOD_FORMAT_ERROR: 'Invalid period format',

} as const;

// Export type for TypeScript intellisense
export type ValidationMessageKey = keyof typeof FE_VALIDATION_MESSAGES;

// Helper function to get validation message
export const getValidationMessage = (key: ValidationMessageKey): string => {
  return FE_VALIDATION_MESSAGES[key];
};

