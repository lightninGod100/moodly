// src/services/AIInsightsService.ts
import ErrorLogger from '../utils/ErrorLogger';

const API_BASE_URL = 'http://localhost:5000/api';


const CACHE_KEYS = {
  CURRENT_INSIGHTS: 'moodly_current_insights',
  PREVIOUS_INSIGHTS: 'moodly_previous_insights'
};


const TTL = {
  CURRENT_INSIGHTS: 48 * 60 * 60 * 1000, // 48 hours in milliseconds
  PREVIOUS_INSIGHTS: 30 * 60 * 1000 // 30 minutes in milliseconds
};

// Helper function to check if cached data is valid
const isCacheValid = (cacheKey: string, ttlMs: number, useGeneratedAt: boolean = false) => {
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return false;
  
  const parsedCache = JSON.parse(cached);
  const now = Date.now();
  
  if (useGeneratedAt && parsedCache.data?.generatedAt) {
    // For current insights, use generatedAt from API response
    const generatedTime = parsedCache.data.generatedAt;
    return (now - generatedTime) < ttlMs;
  } else {
    // For previous insights, use local cache timestamp
    return (now - parsedCache.cachedAt) < ttlMs;
  }
};

// Helper to get valid cache
const getValidCache = (cacheKey: string, ttlMs: number, useGeneratedAt: boolean = false) => {
  if (!isCacheValid(cacheKey, ttlMs, useGeneratedAt)) {
    localStorage.removeItem(cacheKey);
    return null;
  }
  const cached = localStorage.getItem(cacheKey);
  return cached ? JSON.parse(cached) : null;
};
/**
 * 
 * 
 * Generate AI insights
 */
export const generateAIInsights = async () => {
  try {
    // Check cache first
    const cachedData = getValidCache(CACHE_KEYS.CURRENT_INSIGHTS, TTL.CURRENT_INSIGHTS, true);
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(`${API_BASE_URL}/ai-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();
    
    // Cache the response
    localStorage.setItem(CACHE_KEYS.CURRENT_INSIGHTS, JSON.stringify({
      ...data,
      cachedAt: Date.now()
    }));
    
     // Also refresh previous insights cache in background (don't await)
    

    return data;
  } catch (error) {
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "AIInsightsService", action: "generateAIInsights" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
};

/**
 * Get previous insights report
 */
export const getPreviousInsights = async () => {
  try {
    // Check cache first
    const cachedData = getValidCache(CACHE_KEYS.PREVIOUS_INSIGHTS, TTL.PREVIOUS_INSIGHTS, false);
    if (cachedData) {
      return cachedData.data; // Return just the data part
    }

    const response = await fetch(`${API_BASE_URL}/ai-insights/previous`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();
    
    // Cache the response with current timestamp
    localStorage.setItem(CACHE_KEYS.PREVIOUS_INSIGHTS, JSON.stringify({
      data: data,
      cachedAt: Date.now()
    }));
    
    return data;
  } catch (error) {
    const uiMessage = ErrorLogger.logError(
      error,
      { service: "AIInsightsService", action: "getPreviousInsights" },
      { logToConsole: true, logToUI: true }
    );
    throw new Error(uiMessage);
  }
};

// Update the export object

export const hasValidCurrentInsights = () => {
  return isCacheValid(CACHE_KEYS.CURRENT_INSIGHTS, TTL.CURRENT_INSIGHTS, true);
};

export const aiInsightsApiService = {
  generateInsights: generateAIInsights,
  getPreviousInsights: getPreviousInsights
};