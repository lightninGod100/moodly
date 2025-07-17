// src/services/MoodSelectedStatsService.ts

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
  
  // Helper function to get auth headers with timezone
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return {
      'Authorization': `Bearer ${token}`,
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
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch mood transition: ${response.status} ${response.statusText}`);
        }
  
        const data: MoodTransitionResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching mood transition:', error);
        throw error;
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
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch global percentage: ${response.status} ${response.statusText}`);
        }
  
        const data: GlobalPercentageResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching global percentage:', error);
        throw error;
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
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch weekly sentiment: ${response.status} ${response.statusText}`);
        }
  
        const data: WeeklySentimentResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching weekly sentiment:', error);
        throw error;
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
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch achievements: ${response.status} ${response.statusText}`);
        }
  
        const data: AchievementsResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching achievements:', error);
        throw error;
      }
    },
  
    /**
     * Get all mood selected statistics
     * Uses Promise.all to fetch all data simultaneously (following your established pattern)
     */
    async getAllMoodSelectedStats(currentMood: string): Promise<MoodSelectedStatsData> {
      try {
        const [moodTransition, globalPercentage, weeklySentiment, achievements] = await Promise.all([
          this.getMoodTransition(),
          this.getGlobalPercentage(currentMood),
          this.getWeeklySentiment(),
          this.getAchievements()
        ]);
  
        return {
          moodTransition,
          globalPercentage,
          weeklySentiment,
          achievements
        };
      } catch (error) {
        console.error('Error fetching all mood selected stats:', error);
        throw error;
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