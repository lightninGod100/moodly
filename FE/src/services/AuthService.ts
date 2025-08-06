// src/services/AuthService.ts

// Types for API requests
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  country: string;
  gender: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Types for API responses
export interface AuthUser {
  id: number;
  email: string;
  country: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

export interface RegisterResponse extends AuthResponse {}
export interface LoginResponse extends AuthResponse {}

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
  token: string;
  attempts: number;
  userId?: number;
}

// API configuration
const API_BASE = 'http://localhost:5000/api';

// Helper function to handle API errors (consistent with other services)
const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = 'Something went wrong. Please try again.';
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorData.message || errorMessage;
  } catch {
    // If response is not JSON, use status-based messages
    if (response.status === 401) {
      errorMessage = 'Invalid credentials. Please check your email and password.';
    } else if (response.status === 409) {
      errorMessage = 'Account already exists with this email.';
    } else if (response.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
  }
  
  throw new Error(errorMessage);
};

// Token management utilities
const tokenManager = {
  /**
   * Store authentication tokens
   */
  setTokens(authToken: string, refreshToken?: string): void {
    localStorage.setItem('authToken', authToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  /**
   * Get stored authentication token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  },

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Remove all authentication tokens
   */
  clearTokens(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
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
let retryInterval: NodeJS.Timeout | null = null;

// ✅ NEW: Calculate retry delay with exponential backoff
const calculateRetryDelay = (): number => {
  const pendingData = localStorage.getItem('pendingLogout');
  if (!pendingData) return 30000; // 30 seconds default
  
  const pending: PendingLogout = JSON.parse(pendingData);
  
  // Exponential backoff: 30s, 1min, 2min, 4min, 8min, max 10min
  const baseDelay = 30000; // 30 seconds
  const maxDelay = 600000; // 10 minutes
  const delay = Math.min(baseDelay * Math.pow(2, pending.attempts - 1), maxDelay);
  
  console.log(`⏰ Next logout retry in ${delay / 1000} seconds`);
  return delay;
};

// ✅ NEW: Background retry mechanism for failed logouts
const startLogoutRetryMechanism = (): void => {
  // Prevent multiple retry intervals
  if (retryInterval) return;
  
  console.log('🔄 Starting logout retry mechanism');
  
  retryInterval = setInterval(async () => {
    const pendingData = localStorage.getItem('pendingLogout');
    
    if (!pendingData) {
      console.log('✅ No pending logout, stopping retry mechanism');
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
      console.warn('❌ Logout retry timeout - giving up');
      localStorage.removeItem('pendingLogout');
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
      return;
    }
    
    try {
      console.log(`🔄 Logout retry attempt #${pending.attempts}`);
      
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pending.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: pending.timestamp,
          retryAttempt: pending.attempts
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Logout retry #${pending.attempts} successful:`, data.message);
        
        localStorage.removeItem('pendingLogout');
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
      } else if (response.status === 429) {
        console.log(`⏰ Logout retry #${pending.attempts} rate limited, will retry`);
        pending.attempts += 1;
        localStorage.setItem('pendingLogout', JSON.stringify(pending));
      } else {
        console.warn(`⚠️ Logout retry #${pending.attempts} failed:`, response.status);
        pending.attempts += 1;
        localStorage.setItem('pendingLogout', JSON.stringify(pending));
      }
      
    } catch (error) {
      console.error(`❌ Logout retry #${pending.attempts} error:`, error);
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
      // Basic validation
      if (!userData.username || !userData.email || !userData.password || !userData.country || !userData.gender) {
        throw new Error('All fields are required');
      }

      if (userData.username.length < 3 || userData.username.length > 16) {
        throw new Error('Username must be between 3 and 16 characters');
      }

      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format');
      }

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          country: userData.country,
          gender: userData.gender
        })
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data: AuthResponse = await response.json();

      // Store tokens and user data
      tokenManager.setTokens(data.token);
      userDataManager.setUserData(data.user);

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Basic validation
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error('Invalid email format');
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data: AuthResponse = await response.json();

      // Store tokens and user data
      tokenManager.setTokens(data.token);
      userDataManager.setUserData(data.user);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * ✅ UPDATED: Hybrid logout with retry mechanism
   * Immediately clears local tokens but ensures server-side logging
   */
  async logout(): Promise<void> {
    const logoutTimestamp = Date.now(); // Capture REAL logout time
    const token = tokenManager.getAuthToken();
    
    if (!token) {
      // No token, just clear local data
      tokenManager.clearTokens();
      userDataManager.clearUserData();
      console.log('Local logout completed (no token)');
      return;
    }

    try {
      // Attempt immediate server logout
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: logoutTimestamp // Send original logout time
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Immediate logout successful:', data.message);
        
        // Clear any pending logout (in case of duplicate calls)
        localStorage.removeItem('pendingLogout');
      } else {
        // Server logout failed - queue for retry
        throw new Error(`Server logout failed: ${response.status}`);
      }
      
    } catch (error) {
      console.warn('⚠️ Immediate logout failed, queuing for retry:', error);
      
      // Store failed logout for background retry
      const pendingLogout: PendingLogout = {
        timestamp: logoutTimestamp,
        token: token,
        attempts: 1
      };
      
      localStorage.setItem('pendingLogout', JSON.stringify(pendingLogout));
      
      // Start retry mechanism if not already running
      startLogoutRetryMechanism();
    } finally {
      // ALWAYS clear local tokens for immediate UX
      tokenManager.clearTokens();
      userDataManager.clearUserData();
      console.log('🔓 Local logout completed');
    }
  },

  /**
   * ✅ NEW: Initialize logout retry mechanism on app start
   */
  initializeLogoutRetry(): void {
    const pending = localStorage.getItem('pendingLogout');
    if (pending) {
      console.log('📤 Found pending logout, starting retry mechanism');
      startLogoutRetryMechanism();
    }
  },

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    const token = tokenManager.getAuthToken();
    const user = userDataManager.getUserData();
    
    return {
      isAuthenticated: !!token && !!user,
      user: user,
      token: token
    };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  },

  /**
   * Get stored user data
   */
  getCurrentUser(): AuthUser | null {
    return userDataManager.getUserData();
  },

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return tokenManager.getAuthToken();
  },

  // Future authentication methods (placeholders for planned features)
  
  /**
   * Request password reset (Future implementation)
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // TODO: Implement when backend supports password reset
    throw new Error('Password reset feature not yet implemented');
  },

  /**
   * Reset password with token (Future implementation)
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // TODO: Implement when backend supports password reset
    throw new Error('Password reset feature not yet implemented');
  },

  /**
   * Verify email address (Future implementation)
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // TODO: Implement when backend supports email verification
    throw new Error('Email verification feature not yet implemented');
  },

  /**
   * Refresh authentication token (Future implementation)
   */
  async refreshToken(): Promise<AuthResponse> {
    // TODO: Implement when backend supports token refresh
    throw new Error('Token refresh feature not yet implemented');
  },

  /**
   * Enable two-factor authentication (Future implementation)
   */
  async enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
    // TODO: Implement when backend supports 2FA
    throw new Error('Two-factor authentication feature not yet implemented');
  }
};

// Export utilities for external use
export { tokenManager, userDataManager };