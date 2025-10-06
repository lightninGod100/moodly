// src/services/GlobalStatsService.ts

import ErrorLogger, { type BackendErrorResponse } from '../utils/ErrorLogger';
import { FE_VALIDATION_MESSAGES } from '../constants/validationMessages';
import { api } from './apiClient';


export interface GlobalMoodStats {
  Happy: number;
  Excited: number;
  Calm: number;
  Tired: number;
  Sad: number;
  Angry: number;
  Anxious: number;
}

export interface CountryMoodData {
  topMood: string;
  userCount: number;
  moods: GlobalMoodStats;
}

export interface CountryStats {
  [countryName: string]: CountryMoodData;
}

// Period mapping from frontend to backend
const periodMap: { [key: string]: string } = {
  'live': 'live',
  'today': 'today', 
  'week': 'week',
  'month': 'month'
};

/**
 * Cache entry interface for localStorage storage
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache Manager for localStorage-based caching with TTL
 */
class CacheManager {
  private static readonly TTL = 0.5 * 60 * 1000; // 1 minutes in milliseconds

  /**
   * Check if cache entry is expired (5 minutes TTL)
   */
  private static isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  /**
   * Get data from cache if valid, auto-invalidate if expired
   */
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if cache has expired (5 minutes)
      if (this.isExpired(entry.timestamp, entry.ttl)) {
        this.invalidate(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      // Handle localStorage or JSON parsing errors gracefully
      this.invalidate(key);
      return null;
    }
  }

  /**
   * Set data to cache with current timestamp
   */
  static set<T>(key: string, data: T): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: this.TTL
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      // Graceful degradation if localStorage fails (quota exceeded, etc.)
      console.warn('Cache storage failed:', error);
    }
  }

  /**
   * Remove specific cache entry
   */
  static invalidate(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  /**
   * Generate standardized cache keys
   */
  static generateKey(action: string, period: string): string {
    return `mood_stats_${action}_${period}`;
  }

}

/**
 * Fetch global mood statistics for a specific time period
 */
export const fetchGlobalStats = async (period: string): Promise<GlobalMoodStats> => {

  try {
    // Frontend validation with centralized message
    const backendPeriod = periodMap[period.toLowerCase()];
    if (!backendPeriod) {
      throw new Error(FE_VALIDATION_MESSAGES.INVALID_PERIOD);
    }

    const response = await api.get(`/world-stats/global?period=${backendPeriod}`);

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

    const data: GlobalMoodStats = await response.json();
    
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
      { service: "GlobalStatsService", action: "fetchGlobalStats" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
};

/**
 * Fetch country-wise mood statistics for a specific time period
 */
export const fetchCountryStats = async (period: string): Promise<CountryStats> => {

  try {
    // Frontend validation
    const backendPeriod = periodMap[period.toLowerCase()];
    if (!backendPeriod) {
      throw new Error(FE_VALIDATION_MESSAGES.INVALID_PERIOD);
    }

    const response = await api.get(`/world-stats/countries?period=${backendPeriod}`);

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

    const data: CountryStats = await response.json();
    
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
      { service: "GlobalStatsService", action: "fetchCountryStats" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
};

/**
 * Fetch mood frequency statistics and convert to percentages
 */
export const fetchMoodFrequency = async (period: string): Promise<GlobalMoodStats> => {


  try {
    // Frontend validation
    const backendPeriod = periodMap[period.toLowerCase()];
    if (!backendPeriod) {
      // Use consistent validation message (add to FE_VALIDATION_MESSAGES if needed)
      throw new Error(FE_VALIDATION_MESSAGES.INVALID_PERIOD);
    }

    const response = await api.get(`/world-stats/mood_frequency?period=${backendPeriod}`);

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

    const rawData: GlobalMoodStats = await response.json();
    
    // Calculate total frequency count
    const totalCount = Object.values(rawData).reduce((sum, count) => sum + count, 0);
    
    // Convert raw counts to percentages
    const percentageData: GlobalMoodStats = {} as GlobalMoodStats;
    Object.keys(rawData).forEach(mood => {
      percentageData[mood as keyof GlobalMoodStats] = totalCount > 0 
        ? Math.round((rawData[mood as keyof GlobalMoodStats] / totalCount) * 100)
        : 0;
    });

    return percentageData;

  } catch (error) {
    // 🎯 SINGLE POINT OF LOGGING - Handle ALL error types here

    // Frontend validation errors: throw as-is (no logging needed)
    if (error instanceof Error && Object.values(FE_VALIDATION_MESSAGES).includes(error.message as any)) {
      throw error;
    }
    // All other errors: backend errors, network errors, unexpected errors
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "GlobalStatsService", action: "fetchMoodFrequency" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
};

/**
 * Combined world stats interface for caching
 */
interface WorldStatsData {
  global: GlobalMoodStats;
  countries: CountryStats;
  frequency: GlobalMoodStats;
}

/**
 * Fetch global, country, and frequency stats for a specific time period
 * Uses combined caching strategy for optimal performance
 */
export const fetchWorldStats = async (period: string): Promise<WorldStatsData> => {
  // Check combined cache first
  const worldCacheKey = CacheManager.generateKey('world', period);
  const cachedWorldData = CacheManager.get<WorldStatsData>(worldCacheKey);

  if (cachedWorldData) {
    return cachedWorldData;
  }

  try {
    // Cache miss - fetch all data with forceRefresh to ensure data consistency
    const [globalStats, countryStats, frequencyStats] = await Promise.all([
      fetchGlobalStats(period),   // forceRefresh: true ensures fresh data
      fetchCountryStats(period),  //forceRefresh: true ensures fresh data
      fetchMoodFrequency(period)  // forceRefresh: true ensures fresh data
    ]);

    const worldData: WorldStatsData = {
      global: globalStats,      // First row: "X% Users" (dominant mood)
      countries: countryStats,  // Map data: country tooltips
      frequency: frequencyStats // Second row: "X% Times" (frequency percentages)
    };

    // Cache the combined result for future requests
    CacheManager.set(worldCacheKey, worldData);

    return worldData;
  } catch (error) {
    throw error;
  }
};