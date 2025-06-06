// src/services/WorldStatsService.ts
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
export const fetchGlobalStats = async (period: string): Promise<GlobalMoodStats> => {
  try {
    // Map frontend period to backend period
    const backendPeriod = periodMap[period.toLowerCase()];
    if (!backendPeriod) {
      throw new Error(`Invalid period: ${period}`);
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
      if (response.status >= 500) {
        throw new Error('Something seems wrong, please refresh or come back later');
      } else if (response.status >= 400) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Invalid request parameters');
      }
      throw new Error('Something seems wrong, please refresh or come back later');
    }

    const data: GlobalMoodStats = await response.json();
    return data;

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Something seems wrong, please refresh or come back later');
    }
    throw error;
  }
};

/**
 * Fetch country-wise mood statistics for a specific time period
 */
export const fetchCountryStats = async (period: string): Promise<CountryStats> => {
  try {
    // Map frontend period to backend period
    const backendPeriod = periodMap[period.toLowerCase()];
    if (!backendPeriod) {
      throw new Error(`Invalid period: ${period}`);
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
      if (response.status >= 500) {
        throw new Error('Something seems wrong, please refresh or come back later');
      } else if (response.status >= 400) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Invalid request parameters');
      }
      throw new Error('Something seems wrong, please refresh or come back later');
    }

    const data: CountryStats = await response.json();
    return data;

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Something seems wrong, please refresh or come back later');
    }
    throw error;
  }
};

/**
 * Fetch mood frequency statistics and convert to percentages
 */
export const fetchMoodFrequency = async (period: string): Promise<GlobalMoodStats> => {
  try {
    // Map frontend period to backend period
    const backendPeriod = periodMap[period.toLowerCase()];
    if (!backendPeriod) {
      throw new Error(`Invalid period: ${period}`);
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
      if (response.status >= 500) {
        throw new Error('Something seems wrong, please refresh or come back later');
      } else if (response.status >= 400) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Invalid request parameters');
      }
      throw new Error('Something seems wrong, please refresh or come back later');
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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Something seems wrong, please refresh or come back later');
    }
    throw error;
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