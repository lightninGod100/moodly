// src/services/moodService.ts

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
      id: number;
      userId: number;
      mood: string;
      createdAt: string;
    };
  }
  
  interface CurrentMoodResponse {
    mood: string;
    createdAt: string;
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
  
  // Mood API service functions
  export const moodApiService = {
    /**
     * Get user's last mood entry
     * Calls GET /api/moods/last
     */
    async getLastMood(): Promise<LastMoodResponse['mood']> {
      try {
        const response = await fetch(`${API_BASE}/moods/last`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch last mood: ${response.status} ${response.statusText}`);
        }
  
        const data: LastMoodResponse = await response.json();
        return data.mood;
      } catch (error) {
        console.error('Error fetching last mood:', error);
        throw error;
      }
    },
  
    /**
     * Create a new mood entry
     * Calls POST /api/moods
     */
    async createMood(mood: string): Promise<CreateMoodResponse['mood']> {
      try {
        const response = await fetch(`${API_BASE}/moods`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ mood })
        });
  
        if (!response.ok) {
          throw new Error(`Failed to create mood: ${response.status} ${response.statusText}`);
        }
  
        const data: CreateMoodResponse = await response.json();
        return data.mood;
      } catch (error) {
        console.error('Error creating mood:', error);
        throw error;
      }
    },
  
    /**
     * Get user's current mood (most recent)
     * Calls GET /api/moods/current
     */
    async getCurrentMood(): Promise<{mood: string, createdAt: string}> {
      try {
        const response = await fetch(`${API_BASE}/moods/current`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch current mood: ${response.status} ${response.statusText}`);
        }
  
        const data: CurrentMoodResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching current mood:', error);
        throw error;
      }
    }
  };
  
