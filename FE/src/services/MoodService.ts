// src/services/moodService.ts
import { api } from './apiClient';
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



// Mood API service functions
export const moodApiService = {
  /**
   * Get user's last mood entry
   * Calls GET /api/moods/last
   */
  async getLastMood(): Promise<LastMoodResponse['mood']> {
    try {
      const response = await api.get('/moods/last');

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
    // Frontend - Get timestamp in PostgreSQL format with timezone offset
    function getLocalTimestampWithOffset() {
      const now = new Date();

      // Get timezone offset in minutes
      const offset = -now.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(offset) / 60);
      const offsetMinutes = Math.abs(offset) % 60;
      const offsetSign = offset >= 0 ? '+' : '-';
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

      // Format: YYYY-MM-DD HH:mm:ss.SSS
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}${offsetString}`;
    }

    function getTimePeriod(): string {
      const hour = new Date().getHours(); // 0-23

      if (hour >= 5 && hour < 12) {
        return 'morning';
      } else if (hour >= 12 && hour < 17) {
        return 'afternoon';
      } else if (hour >= 17 && hour < 21) {
        return 'evening';
      } else {
        return 'night'; // 22-4
      }
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {

      const response = await api.post('/moods2', {
        mood,
        local_timestamp: getLocalTimestampWithOffset(), // "2025-01-15 15:30:45.123+05:30"
        day_view: getTimePeriod() // Morning Afternoon Evening Night
      }, {
        headers: {
          'Timezone': timezone
        }
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

