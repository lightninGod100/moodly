// src/services/SettingsService.ts

import ErrorLogger, { type BackendErrorResponse } from '../utils/ErrorLogger';
import { FE_VALIDATION_MESSAGES } from '../constants/validationMessages';

// Types for API responses and requests
export interface UserSettings {
  id: number;
  username: string;
  email: string;
  country: string;
  gender: string;
  profilePhoto: string | null;
  lastCountryChangeAt: number;
  canChangeCountry: boolean;
  nextCountryChangeDate: string | null;
  markForDeletion: boolean;
  deletionTimestamp: number | null;
}

export interface UserSettingsResponse {
  message: string;
  settings: UserSettings;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CountryUpdateRequest {
  country: string;
}

export interface CountryUpdateResponse {
  message: string;
  country: string;
  lastCountryChangeAt: number;
}

export interface PhotoUploadRequest {
  photoData: string; // Base64 image data
}

export interface ApiResponse {
  message: string;
}

export interface AccountDeletionRequest {
  password: string;
  reason: string;
}

// Add this interface and method to src/services/SettingsService.ts

export interface PasswordValidationRequest {
  password: string;
}

export interface PasswordValidationResponse {
  message: string;
  valid: boolean;
}
// API configuration
const API_BASE = 'http://localhost:5000/api';

// Helper function to get auth headers

// Settings API service functions
export const settingsApiService = {
  /**
   * Get current user settings
   */

  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await fetch(`${API_BASE}/user-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // Parse backend error response - NO LOGGING HERE
        let backendError: BackendErrorResponse | null = null;

        try {
          backendError = await response.json();
        } catch (parseError) {
          // Create synthetic network error object - NO LOGGING HERE
          throw new Error(`NETWORK_ERROR: HTTP ${response.status}: ${response.statusText}`);
        }

        // Throw parsed backend error - NO LOGGING HERE
        if (backendError) {
          throw backendError;
        }
      }

      const data: UserSettingsResponse = await response.json();
      return data.settings;

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // Frontend validation errors: throw as-is (no logging needed)
      if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
        throw error;
      }

      // All other errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "SettingsService", action: "getUserSettings" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Change user password
   */
  async updatePassword(passwordData: PasswordChangeRequest): Promise<string> {
    try {
      // Basic validation
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        throw new Error(FE_VALIDATION_MESSAGES.BOTH_PASSWORDS_REQUIRED);
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error(FE_VALIDATION_MESSAGES.NEW_PASSWORD_TOO_SHORT);
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        throw new Error(FE_VALIDATION_MESSAGES.PASSWORD_SAME_AS_CURRENT);
      }

      const response = await fetch(`${API_BASE}/user-settings/password_change`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        // Parse backend error response - NO LOGGING HERE
        let backendError: BackendErrorResponse | null = null;

        try {
          backendError = await response.json();
        } catch (parseError) {
          // Create synthetic network error object - NO LOGGING HERE
          throw new Error(`NETWORK_ERROR: HTTP ${response.status}: ${response.statusText}`);
        }

        // Throw parsed backend error - NO LOGGING HERE
        if (backendError) {
          throw backendError;
        }
      }

      const data: ApiResponse = await response.json();
      return data.message;

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // Frontend validation errors: throw as-is (no logging needed)
      if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
        throw error;
      }

      // All other errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "SettingsService", action: "updatePassword" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Update user country (with 30-day restriction)
   */

  async updateCountry(countryData: CountryUpdateRequest): Promise<CountryUpdateResponse> {
    try {
      // Frontend validation with centralized messages
      if (!countryData.country || countryData.country.trim().length === 0) {
        throw new Error(FE_VALIDATION_MESSAGES.COUNTRY_IS_REQUIRED);
      }

      const response = await fetch(`${API_BASE}/user-settings/country`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(countryData)
      });

      if (!response.ok) {
        // Parse backend error response - NO LOGGING HERE
        let backendError: BackendErrorResponse | null = null;

        try {
          backendError = await response.json();
        } catch (parseError) {
          // Create synthetic network error object - NO LOGGING HERE
          throw new Error(`NETWORK_ERROR: HTTP ${response.status}: ${response.statusText}`);
        }

        // Throw parsed backend error - NO LOGGING HERE
        if (backendError) {
          throw backendError;
        }
      }

      const data: CountryUpdateResponse = await response.json();
      return data;

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // Frontend validation errors: throw as-is (no logging needed)
      if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
        throw error;
      }

      // All other errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "SettingsService", action: "updateCountry" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Upload/update profile photo
   */

  async uploadProfilePhoto(photoData: PhotoUploadRequest): Promise<string> {
    try {
      // Frontend validation with centralized messages
      if (!photoData.photoData) {
        throw new Error(FE_VALIDATION_MESSAGES.PHOTO_DATA_REQUIRED);
      }

      // Validate Base64 format
      if (!photoData.photoData.startsWith('data:image/')) {
        throw new Error(FE_VALIDATION_MESSAGES.INVALID_IMAGE_FORMAT);
      }

      // Check file size (approximate from Base64)
      const base64Data = photoData.photoData.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSizeBytes = 100 * 1024; // 100KB

      if (sizeInBytes > maxSizeBytes) {
        throw new Error(`${FE_VALIDATION_MESSAGES.IMAGE_TOO_LARGE}. Current size: ${Math.round(sizeInBytes / 1024)}KB`);
      }

      const response = await fetch(`${API_BASE}/user-settings/photo1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(photoData)
      });

      if (!response.ok) {
        // Parse backend error response - NO LOGGING HERE
        let backendError: BackendErrorResponse | null = null;

        try {
          backendError = await response.json();
        } catch (parseError) {
          // Create synthetic network error object - NO LOGGING HERE
          throw new Error(`NETWORK_ERROR: HTTP ${response.status}: ${response.statusText}`);
        }

        // Throw parsed backend error - NO LOGGING HERE
        if (backendError) {
          throw backendError;
        }
      }

      const data: ApiResponse = await response.json();
      return data.message;

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // Frontend validation errors: throw as-is (no logging needed)
      if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
        throw error;
      }

      // All other errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "SettingsService", action: "uploadProfilePhoto" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Remove profile photo
   */

  async removeProfilePhoto(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/user-settings/photo`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // Parse backend error response - NO LOGGING HERE
        let backendError: BackendErrorResponse | null = null;

        try {
          backendError = await response.json();
        } catch (parseError) {
          // Create synthetic network error object - NO LOGGING HERE
          throw new Error(`NETWORK_ERROR: HTTP ${response.status}: ${response.statusText}`);
        }

        // Throw parsed backend error - NO LOGGING HERE
        if (backendError) {
          throw backendError;
        }
      }

      const data: ApiResponse = await response.json();
      return data.message;

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // Frontend validation errors: throw as-is (no logging needed)
      if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
        throw error;
      }

      // All other errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "SettingsService", action: "removeProfilePhoto" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Delete user account (marks for deletion)
   */

  async deleteAccount(accountData: AccountDeletionRequest): Promise<string> {
    try {
      // Frontend validation with centralized messages
      if (!accountData.password) {
        throw new Error(FE_VALIDATION_MESSAGES.PASSWORD_REQUIRED_FOR_DELETION);
      }

      const response = await fetch(`${API_BASE}/user-settings/account_deletion`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(accountData)
      });

      if (!response.ok) {
        // Parse backend error response - NO LOGGING HERE
        let backendError: BackendErrorResponse | null = null;

        try {
          backendError = await response.json();
        } catch (parseError) {
          // Create synthetic network error object - NO LOGGING HERE
          throw new Error(`NETWORK_ERROR: HTTP ${response.status}: ${response.statusText}`);
        }

        // Throw parsed backend error - NO LOGGING HERE
        if (backendError) {
          throw backendError;
        }
      }

      const data: ApiResponse = await response.json();
      return data.message;

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // Frontend validation errors: throw as-is (no logging needed)
      if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
        throw error;
      }

      // All other errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "SettingsService", action: "deleteAccount" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Validate image file before upload (client-side validation)
   */
  validateImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error(FE_VALIDATION_MESSAGES.INVALID_IMAGE_TYPE));
        return;
      }

      // Check file size
      const maxSizeBytes = 100 * 1024; // 100KB
      if (file.size > maxSizeBytes) {
        reject(new Error(`${FE_VALIDATION_MESSAGES.IMAGE_TOO_LARGE}. Current size: ${Math.round(file.size / 1024)}KB`));
        return;
      }

      // Check image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width > 256 || img.height > 256) {
          reject(new Error(`${FE_VALIDATION_MESSAGES.IMAGE_DIMENSIONS_TOO_LARGE}. Current: ${img.width}x${img.height}`));
        } else {
          // Convert to Base64
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.onerror = () => {
            reject(new Error(FE_VALIDATION_MESSAGES.FAILED_TO_READ_IMAGE));
          };
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        reject(new Error(FE_VALIDATION_MESSAGES.INVALID_IMAGE_FILE));
      };
      img.src = URL.createObjectURL(file);
    });
  },
  async validatePassword(passwordData: PasswordValidationRequest): Promise<PasswordValidationResponse> {
    try {
      // Frontend validation with centralized messages
      if (!passwordData.password) {
        throw new Error(FE_VALIDATION_MESSAGES.PASSWORD_VALIDATION_REQUIRED);
      }

      const response = await fetch(`${API_BASE}/user-settings/validate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        // Parse backend error response - NO LOGGING HERE
        let backendError: BackendErrorResponse | null = null;

        try {
          backendError = await response.json();
        } catch (parseError) {
          // Create synthetic network error object - NO LOGGING HERE
          throw new Error(`NETWORK_ERROR: HTTP ${response.status}: ${response.statusText}`);
        }

        // Throw parsed backend error - NO LOGGING HERE
        if (backendError) {
          throw backendError;
        }
      }

      const data: PasswordValidationResponse = await response.json();
      return data;

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // Frontend validation errors: throw as-is (no logging needed)
      if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
        throw error;
      }

      // All other errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "SettingsService", action: "validatePassword" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  }
};