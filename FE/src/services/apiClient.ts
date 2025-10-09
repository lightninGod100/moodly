// src/services/apiClient.ts

import { deviceService } from './DeviceService';

const API_BASE = import.meta.env.deployment.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  skipRefresh?: boolean; // Flag to prevent infinite refresh loops
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  /**
   * Enhanced fetch with automatic token refresh
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    // Always include credentials for cookies
    const enhancedOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    try {
      // Make the initial request
      let response = await fetch(url, enhancedOptions);

      // If we get a 401 and this isn't already a refresh attempt
      if (response.status === 401 && !options.skipRefresh) {
        console.log('🔄 Access token expired, attempting refresh...');
        
        // Try to refresh the token
        const refreshSuccess = await this.refreshToken();
        
        if (refreshSuccess) {
          // Retry the original request with new token
          console.log('✅ Token refreshed, retrying original request...');
          response = await fetch(url, enhancedOptions);
        } else {
          // Refresh failed, redirect to login
          console.log('❌ Token refresh failed, redirecting to login...');
          this.handleAuthFailure();
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshToken(): Promise<boolean> {
    // If already refreshing, wait for the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('⏳ Refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    // Start new refresh process
    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Actual refresh logic
   */
  private async doRefresh(): Promise<boolean> {
    try {
      // Get device info for refresh
      const deviceId = await deviceService.getDeviceId();
      const deviceInfo = deviceService.getDeviceInfo();

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          deviceInfo
        })
      });

      if (response.ok) {
        console.log('✅ Token refresh successful');
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Token refresh failed:', error);
        
        // Check if refresh token is expired or revoked
        if (response.status === 401) {
          const errorCode = error?.sys_error_code;
          if (errorCode === 'AUTH_REFRESH_TOKEN_EXPIRED' || 
              errorCode === 'AUTH_REFRESH_TOKEN_REVOKED' ||
              errorCode === 'AUTH_REFRESH_TOKEN_INVALID') {
            // Refresh token is dead, need full re-login
            return false;
          }
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh network error:', error);
      return false;
    }
  }

  /**
   * Handle authentication failure (redirect to login)
   */
  private handleAuthFailure(): void {
    // Clear local storage
    localStorage.removeItem('userData');
    
    // Clear device service cache (but keep device ID)
    deviceService.clearDeviceData();
    
    // Redirect to login page
    //window.location.href = '/';
    
    // Trigger navigation in the app (if needed)
    window.dispatchEvent(new CustomEvent('auth:expired', { 
      detail: { message: 'Your session has expired. Please login again.' }
    }));
  }

  /**
   * Make a GET request
   */
  async get(endpoint: string, options?: FetchOptions): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    return this.fetch(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * Make a POST request
   */
  async post(endpoint: string, data?: any, options?: FetchOptions): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a PUT request
   */
  async put(endpoint: string, data?: any, options?: FetchOptions): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint: string, options?: FetchOptions): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    return this.fetch(url, {
      ...options,
      method: 'DELETE'
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience functions
export const api = {
  get: (endpoint: string, options?: FetchOptions) => apiClient.get(endpoint, options),
  post: (endpoint: string, data?: any, options?: FetchOptions) => apiClient.post(endpoint, data, options),
  put: (endpoint: string, data?: any, options?: FetchOptions) => apiClient.put(endpoint, data, options),
  delete: (endpoint: string, options?: FetchOptions) => apiClient.delete(endpoint, options),
};