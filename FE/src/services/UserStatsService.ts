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
          headers: getAuthHeaders()
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
          method: 'GET',
          headers: getAuthHeaders()
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
          headers: getAuthHeaders()
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
    async getAllUserStats() {
      try {
        const [dominantMood, happinessIndex, frequencyToday] = await Promise.all([
          this.getDominantMood(), // Gets all periods
          this.getHappinessIndex('month'), // Default to month view
          this.getMoodFrequency('today') // Default to today
        ]);
  
        return {
          dominantMood,
          happinessIndex,
          frequencyToday
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
    MoodFrequencyData 
  };