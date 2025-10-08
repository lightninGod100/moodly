// src/services/UserStatsService.ts

import { api } from './apiClient';
import { notificationBridge } from './NotificationBridge';
import ErrorLogger from '../utils/ErrorLogger';
import type { BackendErrorResponse } from '../utils/ErrorLogger';
// Types for API responses
interface DominantMoodData {
  mood: string | null;
  percentage: number;
}

interface DominantMoodResponse {
  today?: DominantMoodData;
  week?: DominantMoodData;
  month?: DominantMoodData;
}

interface HappinessDataPoint {
  date: string;
  score: number | null;
}

interface MoodFrequencyData {
  Happy: number;
  Excited: number;
  Calm: number;
  Tired: number;
  Sad: number;
  Angry: number;
  Anxious: number;
}

interface ThroughDayViewData {
  morning: MoodFrequencyData;
  afternoon: MoodFrequencyData;
  evening: MoodFrequencyData;
  night: MoodFrequencyData;
}


// Types for API response
interface MoodHistoryResponse {
  message: string;
  count: number;
  moods: Array<{
    mood: string;
    createdAt: number;
  }>;
}

// User Stats API service functions
export const userStatsApiService = {
  /**
   * Get user's dominant mood statistics
   * @param period - Optional: 'today', 'week', or 'month'. If not provided, returns all three.
   */
// src/services/UserStatsService.ts - getDominantMood with caching

async getDominantMood(period?: 'today' | 'week' | 'month'): Promise<DominantMoodResponse> {
  try {
    // Get last mood timestamp
    const latestMoodDataStr = localStorage.getItem('latestMoodData');
    const latestMoodTimestamp = latestMoodDataStr 
      ? JSON.parse(latestMoodDataStr).timestamp 
      : 0;

    // Get cached data
    const cacheKey = 'user_stats_dominant_mood';
    const cachedStr = localStorage.getItem(cacheKey);
    const cached = cachedStr ? JSON.parse(cachedStr) : {};

    // Determine what to fetch
    const periodKey = period || 'all';
    
    // Check if we have valid cache for requested period
    if (cached[periodKey] && 
        cached[periodKey].timestamp >= latestMoodTimestamp) {
      // Cache is fresh, return it
      return period 
        ? { [period]: cached[periodKey].data } as DominantMoodResponse
        : cached[periodKey].data;
    }

    // Cache miss or stale - fetch from API
    const endpoint = period
      ? `/user-stats/dominant-mood?period=${period}`
      : `/user-stats/dominant-mood`;
    
    const response = await api.get(endpoint);

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

    const data: DominantMoodResponse = await response.json();
    
    // Update cache based on what was fetched
    const now = Date.now();
    
    if (period) {
      // Single period - update just that period
      cached[period] = {
        data: data[period],
        timestamp: now
      };
    } else {
      // All periods fetched - update all entries
      cached.all = {
        data: data,
        timestamp: now
      };
      
      // Also update individual period caches
      if (data.today) {
        cached.today = {
          data: data.today,
          timestamp: now
        };
      }
      if (data.week) {
        cached.week = {
          data: data.week,
          timestamp: now
        };
      }
      if (data.month) {
        cached.month = {
          data: data.month,
          timestamp: now
        };
      }
    }
    
    // Save updated cache
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    
    return data;
  } catch (error) {
    // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "UserStatsService", action: "getDominantMood" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
},

  /**
   * Get user's happiness index over time
   * @param period - 'week' (7 days) or 'month' (30 days)
   */
// src/services/UserStatsService.ts - getHappinessIndex with caching

async getHappinessIndex(period: 'week' | 'month'): Promise<HappinessDataPoint[]> {
  try {
    // Get last mood timestamp
    const latestMoodDataStr = localStorage.getItem('latestMoodData');
    const latestMoodTimestamp = latestMoodDataStr 
      ? JSON.parse(latestMoodDataStr).timestamp 
      : 0;

    // Get cached data
    const cacheKey = 'user_stats_happiness_index';
    const cachedStr = localStorage.getItem(cacheKey);
    const cached = cachedStr ? JSON.parse(cachedStr) : {};

    // Check if we have valid cache for requested period
    if (cached[period] && 
        cached[period].timestamp >= latestMoodTimestamp) {
      // Cache is fresh, return it
      return cached[period].data;
    }

    // Cache miss or stale - fetch from API
    const response = await api.get(`/user-stats/happiness-index?period=${period}`);

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

    const data: HappinessDataPoint[] = await response.json();
    
    // Update cache for this period
    const now = Date.now();
    cached[period] = {
      data: data,
      timestamp: now
    };
    
    // Save updated cache
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    
    return data;
  } catch (error) {
    // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "UserStatsService", action: "getHappinessIndex" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
},

  /**
   * Get mood frequency counts for a specific period
   * @param period - 'today', 'week', or 'month'
   */
// src/services/UserStatsService.ts - getMoodFrequency with caching

async getMoodFrequency(period: 'today' | 'week' | 'month'): Promise<MoodFrequencyData> {
  try {
    // Get latest mood timestamp
    const latestMoodDataStr = localStorage.getItem('latestMoodData');
    const latestMoodTimestamp = latestMoodDataStr 
      ? JSON.parse(latestMoodDataStr).timestamp 
      : 0;

    // Get cached data
    const cacheKey = 'user_stats_mood_frequency';
    const cachedStr = localStorage.getItem(cacheKey);
    const cached = cachedStr ? JSON.parse(cachedStr) : {};

    // Check if we have valid cache for requested period
    if (cached[period] && 
        cached[period].timestamp >= latestMoodTimestamp) {
      // Cache is fresh, return it
      return cached[period].data;
    }

    // Cache miss or stale - fetch from API
    const response = await api.get(`/user-stats/frequency?period=${period}`);

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

    const data: MoodFrequencyData = await response.json();
    
    // Update cache for this period
    const now = Date.now();
    cached[period] = {
      data: data,
      timestamp: now
    };
    
    // Save updated cache
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    
    return data;
  } catch (error) {
    // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "UserStatsService", action: "getMoodFrequency" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
},

  /**
   * Get all user statistics for the dashboard
   * Fetches dominant mood (all periods), happiness index (month), and initial frequency (today)
   */
// src/services/UserStatsService.ts - getThroughDayView with caching

async getThroughDayView(period: 'week' | 'month'): Promise<ThroughDayViewData> {
  try {
    // Get latest mood timestamp
    const latestMoodDataStr = localStorage.getItem('latestMoodData');
    const latestMoodTimestamp = latestMoodDataStr 
      ? JSON.parse(latestMoodDataStr).timestamp 
      : 0;

    // Get cached data
    const cacheKey = 'user_stats_through_day_view';
    const cachedStr = localStorage.getItem(cacheKey);
    const cached = cachedStr ? JSON.parse(cachedStr) : {};

    // Check if we have valid cache for requested period
    if (cached[period] && 
        cached[period].timestamp >= latestMoodTimestamp) {
      // Cache is fresh, return it
      return cached[period].data;
    }

    // Cache miss or stale - fetch from API
    const response = await api.get(`/user-stats/through-day-view?period=${period}`);
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

    const data: ThroughDayViewData = await response.json();
    
    // Update cache for this period
    const now = Date.now();
    cached[period] = {
      data: data,
      timestamp: now
    };
    
    // Save updated cache
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    
    return data;
  } catch (error) {
    // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "UserStatsService", action: "getThroughDayView" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
},

  /**
 * Get user's last 20 moods (latest to oldest)
 * Calls GET /api/user-stats/mood-history
 */
async getMoodHistory(): Promise<MoodHistoryResponse> {
  try {
    // Get latest mood timestamp
    const latestMoodDataStr = localStorage.getItem('latestMoodData');
    const latestMoodTimestamp = latestMoodDataStr 
      ? JSON.parse(latestMoodDataStr).timestamp 
      : 0;

    // Get cached data
    const cacheKey = 'user_stats_mood_history';
    const cachedStr = localStorage.getItem(cacheKey);
    const cached = cachedStr ? JSON.parse(cachedStr) : null;

    // Check if we have valid cache
    if (cached && cached.timestamp >= latestMoodTimestamp) {
      // Cache is fresh, return it
      return cached.data;
    }


    const response = await api.get('/user-stats/mood-history');

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

    const data: MoodHistoryResponse = await response.json();
    
    // Update cache
    const now = Date.now();
    const cacheEntry = {
      data: data,
      timestamp: now
    };
    
    // Save updated cache
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    
    return data;
  } catch (error) {
    // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "UserStatsService", action: "getMoodHistory" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
},
  async getAllUserStats() {
  try {
    const results = await Promise.allSettled([
      this.getDominantMood(),
      this.getHappinessIndex('month'),
      this.getMoodFrequency('month'),
      this.getThroughDayView('month'),
      this.getMoodHistory()
    ]);

    // Extract successful results, handle failures gracefully
    const dominantMood = results[0].status === 'fulfilled' ? results[0].value : null;
    const happinessIndex = results[1].status === 'fulfilled' ? results[1].value : null;
    const frequencyToday = results[2].status === 'fulfilled' ? results[2].value : null;
    const throughDayView = results[3].status === 'fulfilled' ? results[3].value : null;
    const moodHistory = results[4].status === 'fulfilled' ? results[4].value : null;

    // Collect all failures for analysis
    const failures = results
      .map((result, index) => ({
        index,
        apiName: ['dominantMood', 'happinessIndex', 'frequencyToday', 'throughDayView', 'moodHistory'][index],
        result
      }))
      .filter(item => item.result.status === 'rejected');

    // If all APIs failed - catastrophic failure, notify user
    if (failures.length === results.length) {
      console.error('All user stats APIs failed');
      
      
      // Notify via bridge
      notificationBridge.notify({
        type: 'error',
        message: 'Unable to load dashboard data. Please refresh the page or come back later.',
        duration: 5000
      });
    } 
    // If some APIs failed but not all - check if we should notify
    else if (failures.length > 0) {
          // Notify for critical errors
          notificationBridge.notify({
            type: 'warning',
            message:'Some dashboard data could not be loaded.',
            duration: 5000
          });

    }

    return {
      dominantMood,
      happinessIndex,
      frequencyToday,
      throughDayView,
      moodHistory
    };
  } catch (error) {
    // This should rarely happen with Promise.allSettled, but handle it
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "UserStatsService", action: "getAllUserStats" },
      { logToConsole: true, logToUI: true }
    );
    
    notificationBridge.notify({
      type: 'error',
      message: uiMessage || 'Unable to load dashboard. Please refresh the page.',
      duration: 7000
    });
    
    throw error;
  }
}
};

// Export types for use in components
export type {
  DominantMoodData,
  DominantMoodResponse,
  HappinessDataPoint,
  MoodFrequencyData,
  ThroughDayViewData,
  MoodHistoryResponse
};