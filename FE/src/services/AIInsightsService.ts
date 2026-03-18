// src/services/AIInsightsService.ts
import ErrorLogger from '../utils/ErrorLogger';
import { api } from './apiClient';

// =====================================================
// Cache Configuration
// =====================================================

const CACHE_KEYS = {
  CURRENT_INSIGHTS: 'moodly_current_insights',
  PREVIOUS_INSIGHTS: 'moodly_previous_insights'
};

const TTL = {
  CURRENT_INSIGHTS: 48 * 60 * 60 * 1000, // 48 hours
  PREVIOUS_INSIGHTS: 30 * 60 * 1000      // 30 minutes
};

// Polling configuration
const POLL_INTERVAL_MS = 3000;  // 3 seconds between polls
const POLL_TIMEOUT_MS = 120000; // 2 minute max wait

// =====================================================
// Cache Helpers (unchanged)
// =====================================================

const isCacheValid = (cacheKey: string, ttlMs: number, useGeneratedAt: boolean = false) => {
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return false;

  const parsedCache = JSON.parse(cached);
  const now = Date.now();

  if (useGeneratedAt && parsedCache.data?.generatedAt) {
    const generatedTime = parsedCache.data.generatedAt;
    return (now - generatedTime) < ttlMs;
  } else {
    return (now - parsedCache.cachedAt) < ttlMs;
  }
};

const getValidCache = (cacheKey: string, ttlMs: number, useGeneratedAt: boolean = false) => {
  try {
    if (!isCacheValid(cacheKey, ttlMs, useGeneratedAt)) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const parsed = JSON.parse(cached);

    if (!parsed || (parsed.data === undefined && !parsed.insights)) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsed;
  } catch (error) {
    localStorage.removeItem(cacheKey);
    return null;
  }
};

// =====================================================
// Job Status Polling
// =====================================================

/**
 * Poll the job status endpoint until completed or failed
 * Resolves with the completed response data
 * Rejects on failure or timeout
 */
const pollJobStatus = (jobId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const poll = async () => {
      try {
        // Check timeout
        if (Date.now() - startTime > POLL_TIMEOUT_MS) {
          reject(new Error('Insights generation timed out. Please try again.'));
          return;
        }

        const response = await api.get(`/ai-insights/status/${jobId}`);

        if (!response.ok) {
          const error = await response.json();
          reject(new Error(error.message || 'Failed to check job status'));
          return;
        }

        const result = await response.json();

        if (result.status === 'completed') {
          resolve(result);
          return;
        }

        if (result.status === 'failed') {
          reject(new Error(result.message || 'Insights generation failed'));
          return;
        }

        // Still processing — poll again
        setTimeout(poll, POLL_INTERVAL_MS);

      } catch (error) {
        reject(error);
      }
    };

    // Start first poll
    poll();
  });
};

// =====================================================
// Public API
// =====================================================

/**
 * Generate AI insights
 * Returns cached data instantly or polls for background job completion
 */
export const generateAIInsights = async () => {
  try {
    // Check localStorage cache first
    try {
      const cachedData = getValidCache(CACHE_KEYS.CURRENT_INSIGHTS, TTL.CURRENT_INSIGHTS, true);
      if (cachedData) {
        return cachedData;
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }

    // Call POST — backend checks DB cache, then enqueues if needed
    const response = await api.post('/ai-insights', {});

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();

    // 200 — Backend returned cached insights from DB
    if (response.status === 200) {
      const cacheData = {
        ...data,
        cachedAt: Date.now()
      };
      localStorage.setItem(CACHE_KEYS.CURRENT_INSIGHTS, JSON.stringify(cacheData));
      return data;
    }

    // 202 — Job enqueued, need to poll for result
    if (response.status === 202 && data.jobId) {
      const result = await pollJobStatus(data.jobId);

      // Cache the completed result
      const completedData = {
        message: result.message,
        data: result.data,
        generatedAt: result.generatedAt,
        cachedAt: Date.now()
      };
      localStorage.setItem(CACHE_KEYS.CURRENT_INSIGHTS, JSON.stringify(completedData));

      return completedData;
    }

    // Unexpected response
    throw new Error('Unexpected response from insights endpoint');

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
    const cachedData = getValidCache(CACHE_KEYS.PREVIOUS_INSIGHTS, TTL.PREVIOUS_INSIGHTS, false);
    if (cachedData) {
      return cachedData.data;
    }

    const response = await api.get('/ai-insights/previous');

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();

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

// =====================================================
// Exports
// =====================================================

export const hasValidCurrentInsights = () => {
  return isCacheValid(CACHE_KEYS.CURRENT_INSIGHTS, TTL.CURRENT_INSIGHTS, true);
};

export const aiInsightsApiService = {
  generateInsights: generateAIInsights,
  getPreviousInsights: getPreviousInsights
};