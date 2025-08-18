// src/services/WorldStatsService.ts

import ErrorLogger, { type BackendErrorResponse } from '../utils/ErrorLogger';
import { FE_VALIDATION_MESSAGES } from '../constants/validationMessages';

const API_BASE_URL = 'http://localhost:5000/api';

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
 * Fetch global mood statistics for a specific time period
 */
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

    const response = await fetch(
      `${API_BASE_URL}/world-stats/global?period=${backendPeriod}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

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

    const response = await fetch(
      `${API_BASE_URL}/world-stats/countries?period=${backendPeriod}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

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

    const response = await fetch(
      `${API_BASE_URL}/world-stats/mood_frequency?period=${backendPeriod}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

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
 * Fetch global, country, and frequency stats for a specific time period
 */
export const fetchWorldStats = async (period: string) => {
  try {
    const [globalStats, countryStats, frequencyStats] = await Promise.all([
      fetchGlobalStats(period),
      fetchCountryStats(period),
      fetchMoodFrequency(period)
    ]);

    return {
      global: globalStats,      // First row: "X% Users" (dominant mood)
      countries: countryStats,  // Map data: country tooltips
      frequency: frequencyStats // Second row: "X% Times" (frequency percentages)
    };
  } catch (error) {
    throw error;
  }
};