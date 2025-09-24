// src/services/AuthService.ts

import ErrorLogger, { type BackendErrorResponse } from '../utils/ErrorLogger';
import { FE_VALIDATION_MESSAGES } from '../constants/validationMessages';
import { deviceService } from './DeviceService';
import { api } from './apiClient';

// Types for API requests
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  country: string;
  gender: string;
  deviceId?: string;     // Added
  deviceInfo?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;     // Added
  deviceInfo?: any;      // Added
}

// Types for API responses
export interface AuthUser {
  username: string;  // Add username
  email: string;
  country: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

export interface RegisterResponse extends AuthResponse { }
export interface LoginResponse extends AuthResponse { }

// Types for service operations
export interface AuthTokens {
  authToken: string;
  refreshToken?: string; // Future use
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}

// ✅ NEW: Interface for pending logout (hybrid approach)
interface PendingLogout {
  timestamp: number;
  attempts: number;
}

// API configuration
const API_BASE = 'http://localhost:5000/api';


const tokenManager = {


  isAuthenticated(): boolean {
    // Can't check HttpOnly cookies from JS
    // Will rely on API responses to determine auth status
    return !!userDataManager.getUserData();
  }
};

// User data management utilities
const userDataManager = {
  /**
   * Store user data
   */
  setUserData(user: AuthUser): void {
    localStorage.setItem('userData', JSON.stringify(user));
  },


  /**
   * Get stored user data
   */
  getUserData(): AuthUser | null {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  /**
   * Clear stored user data
   */
  clearUserData(): void {
    localStorage.removeItem('userData');
  }
};

// ✅ NEW: Hybrid logout retry mechanism variables
let retryInterval: number | null = null;

// ✅ NEW: Calculate retry delay with exponential backoff
const calculateRetryDelay = (): number => {
  const pendingData = localStorage.getItem('pendingLogout');
  if (!pendingData) return 30000; // 30 seconds default

  const pending: PendingLogout = JSON.parse(pendingData);

  // Exponential backoff: 30s, 1min, 2min, 4min, 8min, max 10min
  const baseDelay = 30000; // 30 seconds
  const maxDelay = 600000; // 10 minutes
  const delay = Math.min(baseDelay * Math.pow(2, pending.attempts - 1), maxDelay);

  return delay;
};

// ✅ NEW: Background retry mechanism for failed logouts
// Updated startLogoutRetryMechanism with proper console logging
const startLogoutRetryMechanism = (): void => {
  // Prevent multiple retry intervals
  if (retryInterval) return;

  // Only log when retry mechanism starts for the first time (not for pending)
  const pending = localStorage.getItem('pendingLogout');
  if (pending) {
    const pendingData: PendingLogout = JSON.parse(pending);
    if (pendingData.attempts === 1) {
      console.warn('🔄 Retry mechanism started');
    }
  }

  retryInterval = setInterval(async () => {
    const pendingData = localStorage.getItem('pendingLogout');

    if (!pendingData) {
      // No pending logout, stop retry mechanism (no console message)
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
      return;
    }

    const pending: PendingLogout = JSON.parse(pendingData);
    const now = Date.now();

    // Give up after 24 hours or 10 attempts
    if (now - pending.timestamp > 24 * 60 * 60 * 1000 || pending.attempts > 10) {
      console.error('Failed to register previous logout to server');
      localStorage.removeItem('pendingLogout');
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
      return;
    }

    try {
      const response = await api.post('/auth/logout', {
        timestamp: pending.timestamp,
        retryAttempt: pending.attempts
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

      // Success: Server logout successful (retry) - NO CONSOLE MESSAGE

      localStorage.removeItem('pendingLogout');
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }

    } catch (error) {
      // Silent retry error - no console logging to prevent spam
      // Just increment attempts and continue
      pending.attempts += 1;
      localStorage.setItem('pendingLogout', JSON.stringify(pending));
    }

  }, calculateRetryDelay());
};

// Authentication API service functions
export const authApiService = {
  /**
   * Register new user account
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Frontend validation with centralized messages
      if (!userData.username || !userData.email || !userData.password || !userData.country || !userData.gender) {
        throw new Error(FE_VALIDATION_MESSAGES.REGISTRATION_FIELDS_REQUIRED);
      }

      if (userData.username.length < 3 || userData.username.length > 16) {
        if (userData.username.length < 3) {
          throw new Error(FE_VALIDATION_MESSAGES.USERNAME_TOO_SHORT);
        } else {
          throw new Error(FE_VALIDATION_MESSAGES.USERNAME_TOO_LONG);
        }
      }

      if (userData.password.length < 6) {
        throw new Error(FE_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT);
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error(FE_VALIDATION_MESSAGES.EMAIL_INVALID);
      }

      // Get device fingerprint
      const deviceId = await deviceService.getDeviceId();
      const deviceInfo = deviceService.getDeviceInfo();


      const response = await api.post('/auth/register', {
        ...userData,
        deviceId,
        deviceInfo
      }, { skipRefresh: true }); // Skip refresh for auth endpoint

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

      const data: AuthResponse = await response.json();

      // Store tokens and user data

      userDataManager.setUserData(data.user);

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
        { service: "AuthService", action: "userRegister" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Login user with email and password
   */
  // Updated login method with Single Point Logging pattern
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Frontend validation with centralized messages
      if (!credentials.email || !credentials.password) {
        throw new Error(FE_VALIDATION_MESSAGES.LOGIN_CREDENTIALS_REQUIRED);
      }

      if (!credentials.email.trim()) {
        throw new Error(FE_VALIDATION_MESSAGES.EMAIL_REQUIRED);
      }

      if (!credentials.password.trim()) {
        throw new Error(FE_VALIDATION_MESSAGES.PASSWORD_REQUIRED);
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error(FE_VALIDATION_MESSAGES.EMAIL_INVALID);
      }
      // Get device fingerprint
      const deviceId = await deviceService.getDeviceId();
      const deviceInfo = deviceService.getDeviceInfo();

      const response = await api.post('/auth/login', {
        ...credentials,
        deviceId,
        deviceInfo
      }, { skipRefresh: true }); // Skip refresh for auth end

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

      const data: AuthResponse = await response.json();

      // Store tokens and user data
      userDataManager.setUserData(data.user);
      window.location.href = '/mood';

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
        { service: "AuthService", action: "userLogin" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * ✅ UPDATED: Hybrid logout with retry mechanism
   * Immediately clears local tokens but ensures server-side logging
   */
  // Updated logout method with Single Point Logging pattern
  async logout(): Promise<void> {
    const logoutTimestamp = Date.now(); // Capture REAL logout time


    try {
      // Attempt immediate server logout
      const response = await api.post('/auth/logout', {
        timestamp: logoutTimestamp
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

      // Success: Log server logout success only
      const data = await response.json();
      console.info('✅ Server logout successful:', data.message);

      // Clear any pending logout (in case of duplicate calls)
      localStorage.removeItem('pendingLogout');

    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Server logout failed

      // Log server logout failure with ErrorLogger (console only)
      ErrorLogger.logError(
        error,
        { service: "AuthService", action: "userLogout" },
        { logToConsole: true, logToUI: false }
      );

      // Store failed logout for background retry
      const pendingLogout: PendingLogout = {
        timestamp: logoutTimestamp,
        attempts: 1
      };

      localStorage.setItem('pendingLogout', JSON.stringify(pendingLogout));

      // Start retry mechanism if not already running
      startLogoutRetryMechanism();

    } finally {
      // Only clear user data, cookies cleared by backend
      userDataManager.clearUserData();
      console.info('🔓 Local logout completed');
    }
  },

  /**
   * ✅ NEW: Initialize logout retry mechanism on app start
   */
  initializeLogoutRetry(): void {
    const pending = localStorage.getItem('pendingLogout');
    if (pending) {
      startLogoutRetryMechanism();
    }
  },
  /* Verify if user is authenticated via cookie
  * @returns username if authenticated, null otherwise
  */
  async verifyAuth(): Promise<string | null> {
    try {
      const response = await api.get('/auth/verify', { skipRefresh: true });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.username) {
          return data.username;
        }
      }
      return null;
    } catch (error) {
      console.warn('Auth verification failed:', error);
      return null;
    }
  },
  /**
 * Logout from all devices
 */
  async logoutAllDevices(): Promise<void> {
    try {
      const response = await api.post('/auth/logout-all');

      if (!response.ok) {
        throw new Error('Logout from all devices failed');
      }

      const data = await response.json();

      // Clear local data
      userDataManager.clearUserData();
      deviceService.clearDeviceData();

      console.log(`✅ Logged out from ${data.devicesAffected} devices`);

    } catch (error) {
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "AuthService", action: "logoutAllDevices" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  }
};

// Export utilities for external use
export { tokenManager, userDataManager };