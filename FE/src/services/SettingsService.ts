// src/services/SettingsService.ts

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
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  // Helper function to handle API errors
  const handleApiError = async (response: Response): Promise<never> => {
    let errorMessage = 'Something went wrong. Please try again.';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use status-based messages
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (response.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    }
    
    throw new Error(errorMessage);
  };
  
  // Settings API service functions
  export const settingsApiService = {
    /**
     * Get current user settings
     */
    async getUserSettings(): Promise<UserSettings> {
      try {
        const response = await fetch(`${API_BASE}/user-settings`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          await handleApiError(response);
        }
  
        const data: UserSettingsResponse = await response.json();
        console.log(data.settings);
        return data.settings;
      } catch (error) {
        console.error('Error fetching user settings:', error);
        throw error;
      }
    },
  
    /**
     * Change user password
     */
    async updatePassword(passwordData: PasswordChangeRequest): Promise<string> {
      try {
        // Basic validation
        if (!passwordData.currentPassword || !passwordData.newPassword) {
          throw new Error('Both current and new passwords are required');
        }
  
        if (passwordData.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long');
        }
  
        if (passwordData.currentPassword === passwordData.newPassword) {
          throw new Error('New password must be different from current password');
        }
  
        const response = await fetch(`${API_BASE}/user-settings/password_change`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(passwordData)
        });
  
        if (!response.ok) {
          await handleApiError(response);
        }
  
        const data: ApiResponse = await response.json();
        return data.message;
      } catch (error) {
        console.error('Error updating password:', error);
        throw error;
      }
    },
  
    /**
     * Update user country (with 30-day restriction)
     */
    async updateCountry(countryData: CountryUpdateRequest): Promise<CountryUpdateResponse> {
      try {
        // Basic validation
        if (!countryData.country || countryData.country.trim().length === 0) {
          throw new Error('Country is required');
        }
  
        const response = await fetch(`${API_BASE}/user-settings/country`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(countryData)
        });
  
        if (!response.ok) {
          await handleApiError(response);
        }
  
        const data: CountryUpdateResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error updating country:', error);
        throw error;
      }
    },
  
    /**
     * Upload/update profile photo
     */
    async uploadProfilePhoto(photoData: PhotoUploadRequest): Promise<string> {
      try {
        // Basic validation
        if (!photoData.photoData) {
          throw new Error('Photo data is required');
        }
  
        // Validate Base64 format
        if (!photoData.photoData.startsWith('data:image/')) {
          throw new Error('Invalid image format');
        }
  
        // Check file size (approximate from Base64)
        const base64Data = photoData.photoData.split(',')[1];
        const sizeInBytes = (base64Data.length * 3) / 4;
        const maxSizeBytes = 100 * 1024; // 100KB
  
        if (sizeInBytes > maxSizeBytes) {
          throw new Error(`Image size must be less than 100KB. Current size: ${Math.round(sizeInBytes / 1024)}KB`);
        }
  
        const response = await fetch(`${API_BASE}/user-settings/photo`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(photoData)
        });
  
        if (!response.ok) {
          await handleApiError(response);
        }
  
        const data: ApiResponse = await response.json();
        return data.message;
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        throw error;
      }
    },
  
    /**
     * Remove profile photo
     */
    async removeProfilePhoto(): Promise<string> {
      try {
        const response = await fetch(`${API_BASE}/user-settings/photo`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          await handleApiError(response);
        }
  
        const data: ApiResponse = await response.json();
        return data.message;
      } catch (error) {
        console.error('Error removing profile photo:', error);
        throw error;
      }
    },
  
    /**
     * Delete user account (marks for deletion)
     */
    async deleteAccount(accountData: AccountDeletionRequest): Promise<string> {
      try {
        // Basic validation
        if (!accountData.password) {
          throw new Error('Password is required to delete account');
        }
  
        const response = await fetch(`${API_BASE}/user-settings/account_deletion`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify(accountData)
        });
  
        if (!response.ok) {
          await handleApiError(response);
        }
  
        const data: ApiResponse = await response.json();
        return data.message;
      } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
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
          reject(new Error('Only PNG and JPEG images are allowed'));
          return;
        }
  
        // Check file size
        const maxSizeBytes = 100 * 1024; // 100KB
        if (file.size > maxSizeBytes) {
          reject(new Error(`Image size must be less than 100KB. Current size: ${Math.round(file.size / 1024)}KB`));
          return;
        }
  
        // Check image dimensions
        const img = new Image();
        img.onload = () => {
          if (img.width > 256 || img.height > 256) {
            reject(new Error(`Image dimensions must be 256x256 pixels or smaller. Current: ${img.width}x${img.height}`));
          } else {
            // Convert to Base64
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve(e.target?.result as string);
            };
            reader.onerror = () => {
              reject(new Error('Failed to read image file'));
            };
            reader.readAsDataURL(file);
          }
        };
        img.onerror = () => {
          reject(new Error('Invalid image file'));
        };
        img.src = URL.createObjectURL(file);
      });
    },
    async validatePassword(passwordData: PasswordValidationRequest): Promise<PasswordValidationResponse> {
      try {
        // Basic validation
        if (!passwordData.password) {
          throw new Error('Password is required');
        }
    
        const response = await fetch(`${API_BASE}/user-settings/validate-password`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(passwordData)
        });
    
        if (!response.ok) {
          await handleApiError(response);
        }
    
        const data: PasswordValidationResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error validating password:', error);
        throw error;
      }
    }
  };