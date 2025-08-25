// src/services/moodService.ts
import ErrorLogger, { type BackendErrorResponse } from '../utils/ErrorLogger';
// Types for API responses
interface LastMoodResponse {
    message: string;
    hasMood: boolean;
    isWithin10Minutes: boolean;
    mood: {
      id: number;
      userId: number;
      mood: string;
      createdAt: string;
    } | null;
  }
  
  interface CreateMoodResponse {
    message: string;
    mood: {
      id: number;
      userId: number;
      mood: string;
      createdAt: string;
    };
  }
  
  // interface CurrentMoodResponse {
  //   mood: string;
  //   createdAt: string;
  // }
  
  // API configuration
  const API_BASE = 'http://localhost:5000/api';
  
  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  // Mood API service functions
  export const moodApiService = {
    /**
     * Get user's last mood entry
     * Calls GET /api/moods/last
     */
    async getLastMood(): Promise<LastMoodResponse['mood']> {
      try {
        const response = await fetch(`${API_BASE}/moods/last`, {
          method: 'GET',
          headers: getAuthHeaders()
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

        const data: LastMoodResponse = await response.json();
        return data.mood;
      } catch (error) {
        // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

        // All errors: backend errors, network errors, unexpected errors
        const uiMessage = ErrorLogger.logError(
          error,
          { service: "MoodService", action: "getLastMood" },
          { logToConsole: true, logToUI: true }
        );
        throw new Error(uiMessage);
      }
    },
  
    /**
     * Create a new mood entry
     * Calls POST /api/moods
     */
    async createMood(mood: string): Promise<CreateMoodResponse['mood']> {
      try {
        const response = await fetch(`${API_BASE}/moods`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ mood })
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

        const data: CreateMoodResponse = await response.json();
        return data.mood;
      } catch (error) {
        // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

        // All errors: backend errors, network errors, unexpected errors
        const uiMessage = ErrorLogger.logError(
          error,
          { service: "MoodService", action: "createMood" },
          { logToConsole: true, logToUI: true }
        );
        throw new Error(uiMessage);
      }
    }
  
    /**
     * Get user's current mood (most recent)
     * Calls GET /api/moods/current
     */
    // async getCurrentMood(): Promise<{mood: string, createdAt: string}> {
    //   try {
    //     const response = await fetch(`${API_BASE}/moods/current`, {
    //       method: 'GET',
    //       headers: getAuthHeaders()
    //     });
  
    //     if (!response.ok) {
    //       throw new Error(`Failed to fetch current mood: ${response.status} ${response.statusText}`);
    //     }
  
    //     const data: CurrentMoodResponse = await response.json();
    //     return data;
    //   } catch (error) {
    //     console.error('Error fetching current mood:', error);
    //     throw error;
    //   }
    // }
  };
  
