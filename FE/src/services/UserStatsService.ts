// src/services/UserStatsService.ts

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
// API configuration
const API_BASE = 'http://localhost:5000/api';



// User Stats API service functions
export const userStatsApiService = {
  /**
   * Get user's dominant mood statistics
   * @param period - Optional: 'today', 'week', or 'month'. If not provided, returns all three.
   */
  async getDominantMood(period?: 'today' | 'week' | 'month'): Promise<DominantMoodResponse> {
    try {
      const url = period
        ? `${API_BASE}/user-stats/dominant-mood?period=${period}`
        : `${API_BASE}/user-stats/dominant-mood`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dominant mood: ${response.status} ${response.statusText}`);
      }

      const data: DominantMoodResponse = await response.json();
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
  async getHappinessIndex(period: 'week' | 'month'): Promise<HappinessDataPoint[]> {
    try {
      const response = await fetch(`${API_BASE}/user-stats/happiness-index?period=${period}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch happiness index: ${response.status} ${response.statusText}`);
      }

      const data: HappinessDataPoint[] = await response.json();
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
  async getMoodFrequency(period: 'today' | 'week' | 'month'): Promise<MoodFrequencyData> {
    try {
      const response = await fetch(`${API_BASE}/user-stats/frequency?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch mood frequency: ${response.status} ${response.statusText}`);
      }

      const data: MoodFrequencyData = await response.json();
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
  async getThroughDayView(period: 'week' | 'month'): Promise<ThroughDayViewData> {
    try {
      const response = await fetch(`${API_BASE}/user-stats/through-day-view?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch through day view: ${response.status} ${response.statusText}`);
      }

      const data: ThroughDayViewData = await response.json();
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
    const response = await fetch(`${API_BASE}/user-stats/mood-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch mood history: ${response.status} ${response.statusText}`);
    }

    const data: MoodHistoryResponse = await response.json();
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