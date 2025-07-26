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
     * Logout user (clear local storage)
     */
    async logout(): Promise<void> {
        try {
          // Get token before clearing it
          const token = tokenManager.getAuthToken();
          
          if (token) {
            // Call backend logout endpoint to log activity
            const response = await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
      
            if (response.ok) {
              const data = await response.json();
              console.log('Logout logged successfully:', data.message);
            } else {
              console.warn('Logout logging failed, but proceeding with local logout');
            }
          }
        } catch (error) {
          console.error('Logout API error (proceeding with local logout):', error);
          // Continue with logout even if API call fails
        } finally {
          // Always clear local storage regardless of API call result
          tokenManager.clearTokens();
          userDataManager.clearUserData();
          console.log('Local logout completed');
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