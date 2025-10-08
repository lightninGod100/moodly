// src/services/AIInsightsService.ts
import ErrorLogger from '../utils/ErrorLogger';
import { api } from './apiClient';


// Add these constants at the top with other constants
const GENERATION_STATUS_KEY = 'moodly_insights_generation_status';
const GENERATION_TIMEOUT = 90 * 1000; // 90 seconds timeout

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
  try {
    if (!isCacheValid(cacheKey, ttlMs, useGeneratedAt)) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    
    // Ensure we have valid data structure
    if (!parsed || (parsed.data === undefined && !parsed.insights)) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsed;
  } catch (error) {
    // If parsing fails, clear the cache
    localStorage.removeItem(cacheKey);
    return null;
  }
};


// Add helper functions for generation status
const setGenerationInProgress = () => {
  localStorage.setItem(GENERATION_STATUS_KEY, JSON.stringify({
    inProgress: true,
    startedAt: Date.now()
  }));
};

const clearGenerationStatus = () => {
  localStorage.removeItem(GENERATION_STATUS_KEY);
};

const isGenerationInProgress = () => {
  const status = localStorage.getItem(GENERATION_STATUS_KEY);
  if (!status) return false;

  const parsed = JSON.parse(status);
  const now = Date.now();

  // Check if generation timed out
  if (now - parsed.startedAt > GENERATION_TIMEOUT) {
    clearGenerationStatus();
    return false;
  }

  return parsed.inProgress;
};

/**
 * 
 * 
 * Generate AI insights
 */

export const generateAIInsights = async () => {
  try {
    // Check cache first - add try-catch for safety
    try {
      const cachedData = getValidCache(CACHE_KEYS.CURRENT_INSIGHTS, TTL.CURRENT_INSIGHTS, true);
      if (cachedData) {
        // Clear any lingering generation status since we have valid data
        clearGenerationStatus();
        console.log('Returning cached insights:', cachedData);
        return cachedData;
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
      // Continue to generate new insights if cache fails
    }
    
    // Check if already generating
    if (isGenerationInProgress()) {
      throw new Error('Insight generation already in progress');
    }
    
    // Set generation in progress
    setGenerationInProgress();

    const response = await api.post('/ai-insights', {});
    
    // Clear generation status on success
    clearGenerationStatus();

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();
    
    // Cache the response with consistent structure
    const cacheData = {
      ...data,
      cachedAt: Date.now()
    };
    
    localStorage.setItem(CACHE_KEYS.CURRENT_INSIGHTS, JSON.stringify(cacheData));
    
    return data;
  } catch (error) {
    // Clear generation status on error
    clearGenerationStatus();
    
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

    const response = await api.get('/ai-insights/previous');

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

// Export the status check function
export const isInsightGenerationInProgress = isGenerationInProgress;