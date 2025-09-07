// src/services/MoodSelectedStatsService.ts
import ErrorLogger, { type BackendErrorResponse } from '../utils/ErrorLogger';
// Types for API responses
interface MoodTransitionResponse {
  transition: boolean;
  message: string;
}

interface GlobalPercentageResponse {
  percentage: number;
  message: string;
}

interface WeeklySentimentResponse {
  hasData: boolean;
  message?: string; // For edge cases
  weekSentiment?: string;
  sentimentMessage?: string;
  hasCurrentMood?: boolean;
  currentMood?: string;
  moodCount?: number;
  frequencyMessage?: string;
}

interface Achievement {
  name: string;
  message: string;
}

interface AchievementsResponse {
  hasAchievement: boolean;
  message?: string; // For fallback case
  achievements?: Achievement[];
}

// Combined response type for all mood selected stats
interface MoodSelectedStatsData {
  moodTransition: MoodTransitionResponse;
  globalPercentage: GlobalPercentageResponse;
  weeklySentiment: WeeklySentimentResponse;
  achievements: AchievementsResponse;
}

// API configuration
const API_BASE = 'http://localhost:5000/api';

// Helper function to get headers with timezone
const getHeaders = (): HeadersInit => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    'Content-Type': 'application/json',
    'Timezone': timezone
  };
};

// Individual API service functions
export const moodSelectedStatsApiService = {
  /**
   * Get mood transition data
   * Calls GET /api/mood-selected-stats/mood-transition
   */
  async getMoodTransition(): Promise<MoodTransitionResponse> {
    try {
      const response = await fetch(`${API_BASE}/mood-selected-stats/mood-transition`, {
        method: 'GET',
        headers: getHeaders(),
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

      const data: MoodTransitionResponse = await response.json();
      return data;
    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // All errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "MoodSelectedStatsService", action: "getMoodTransition" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Get global percentage for specific mood
   * Calls GET /api/mood-selected-stats/global-percentage?mood={mood}
   */
  async getGlobalPercentage(mood: string): Promise<GlobalPercentageResponse> {
    try {
      const response = await fetch(`${API_BASE}/mood-selected-stats/global-percentage?mood=${encodeURIComponent(mood)}`, {
        method: 'GET',
        headers: getHeaders(),
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

      const data: GlobalPercentageResponse = await response.json();
      return data;
    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // All errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "MoodSelectedStatsService", action: "getGlobalPercentage" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Get weekly sentiment analysis
   * Calls GET /api/mood-selected-stats/weekly-sentiment
   */
  async getWeeklySentiment(): Promise<WeeklySentimentResponse> {
    try {
      const response = await fetch(`${API_BASE}/mood-selected-stats/weekly-sentiment`, {
        method: 'GET',
        headers: getHeaders(),
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

      const data: WeeklySentimentResponse = await response.json();
      return data;
    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // All errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "MoodSelectedStatsService", action: "getWeeklySentiment" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Get user achievements and milestones
   * Calls GET /api/mood-selected-stats/achievements
   */
  async getAchievements(): Promise<AchievementsResponse> {
    try {
      const response = await fetch(`${API_BASE}/mood-selected-stats/achievements`, {
        method: 'GET',
        headers: getHeaders(),
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

      const data: AchievementsResponse = await response.json();
      return data;
    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

      // All errors: backend errors, network errors, unexpected errors
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "MoodSelectedStatsService", action: "getAchievements" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  },

  /**
   * Get all mood selected statistics
   * Uses Promise.all to fetch all data simultaneously (following your established pattern)
   */
  async getAllMoodSelectedStats(currentMood: string): Promise<MoodSelectedStatsData> {
    try {
      const results = await Promise.allSettled([
        this.getMoodTransition(),
        this.getGlobalPercentage(currentMood),
        this.getWeeklySentiment(),
        this.getAchievements()
      ]);

      // Extract successful results, provide fallbacks for failures
      const moodTransition = results[0].status === 'fulfilled'
        ? results[0].value
        : { transition: false, message: "Unable to load mood transition data" };

      const globalPercentage = results[1].status === 'fulfilled'
        ? results[1].value
        : { percentage: 0, message: "Unable to load global percentage data" };

      const weeklySentiment = results[2].status === 'fulfilled'
        ? results[2].value
        : { hasData: false, message: "Unable to load weekly sentiment data" };

      const achievements = results[3].status === 'fulfilled'
        ? results[3].value
        : { hasAchievement: false, message: "Unable to load achievements data" };


      return {
        moodTransition,
        globalPercentage,
        weeklySentiment,
        achievements
      };
    } catch (error) {
      // 🎯 SINGLE POINT OF LOGGING - Handle unexpected errors in Promise.allSettled
      const uiMessage = ErrorLogger.logError(
        error,
        { service: "MoodSelectedStatsService", action: "getAllMoodSelectedStats" },
        { logToConsole: true, logToUI: true }
      );
      throw new Error(uiMessage);
    }
  }
};

// Export types for use in components
export type {
  MoodTransitionResponse,
  GlobalPercentageResponse,
  WeeklySentimentResponse,
  Achievement,
  AchievementsResponse,
  MoodSelectedStatsData
};