// src/services/UserStatsService.ts

import { api } from './apiClient';
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
      throw new Error(`Failed to fetch dominant mood: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching dominant mood:', error);
    throw error;
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
      throw new Error(`Failed to fetch happiness index: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching happiness index:', error);
    throw error;
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
      throw new Error(`Failed to fetch mood frequency: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching mood frequency:', error);
    throw error;
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
      throw new Error(`Failed to fetch through day view: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching through day view:', error);
    throw error;
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

    // Cache miss or stale - fetch from API
    const response = await api.get('/user-stats/mood-history');

    if (!response.ok) {
      throw new Error(`Failed to fetch mood history: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching mood history:', error);
    throw error;
  }
},
  async getAllUserStats() {
    try {
      const results = await Promise.allSettled([
        this.getDominantMood(),
        this.getHappinessIndex('month'),
        this.getMoodFrequency('today'),
        this.getThroughDayView('month'),
        this.getMoodHistory()
      ]);

      // Extract successful results, handle failures gracefully
      const dominantMood = results[0].status === 'fulfilled' ? results[0].value : null;
      const happinessIndex = results[1].status === 'fulfilled' ? results[1].value : [];
      const frequencyToday = results[2].status === 'fulfilled' ? results[2].value : null;
      const throughDayView = results[3].status === 'fulfilled' ? results[3].value : null;
      const moodHistory = results[4].status === 'fulfilled' ? results[4].value : null;
      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['dominantMood', 'happinessIndex', 'frequencyToday', 'throughDayView', 'moodHistory'];
          console.warn(`${apiNames[index]} API failed:`, result.reason);
        }
      });

      return {
        dominantMood,
        happinessIndex,
        frequencyToday,
        throughDayView,
        moodHistory
      };
    } catch (error) {
      console.error('Error fetching all user stats:', error);
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