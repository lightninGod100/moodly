// routes/aiInsights.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

const router = express.Router();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Function to clean and extract JSON from AI response
function cleanAIResponse(rawResponse) {
  try {
    // First, try parsing as-is (in case it's already clean JSON)
    const parsed = JSON.parse(rawResponse);
    return parsed;
  } catch (firstAttempt) {
    // If direct parsing fails, try cleaning the response
    let cleaned = rawResponse;

    // Remove markdown code blocks (```json or ```)
    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    // Remove any "json" prefix that might appear
    cleaned = cleaned.replace(/^json\s*/i, '');

    // Remove HTML tags if any
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    // Remove any text before the first { and after the last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // Remove any escape characters that might interfere
    cleaned = cleaned.replace(/\\"/g, '"');

    // Trim whitespace
    cleaned = cleaned.trim();

    try {
      // Attempt to parse the cleaned response
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (secondAttempt) {
      // If still failing, try to extract JSON using regex
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (thirdAttempt) {
          // Log the cleaning attempts for debugging
          console.error('Failed to parse AI response after cleaning attempts:', {
            original: rawResponse.substring(0, 200),
            cleaned: cleaned.substring(0, 200),
            error: thirdAttempt.message
          });
          return null;
        }
      }
      return null;
    }
  }
}

// Function to validate and ensure correct structure
function validateInsightsStructure(parsedData) {
  // Define the expected structure
  const expectedStructure = {
    weekly: {
      period: 'last_7_days',
      totalMoods: 0,
      dataQuality: 'insufficient',
      findings: [],
      dominantMood: null,
      moodVariety: null,
      recommendation: null
    },
    monthly: {
      period: 'last_30_days',
      totalMoods: 0,
      dataQuality: 'insufficient',
      findings: [],
      dominantMood: null,
      moodVariety: null,
      trend: 'unclear',
      recommendation: null
    }
  };

  // If parsedData is null or not an object, return expected structure
  if (!parsedData || typeof parsedData !== 'object') {
    return { valid: false, data: expectedStructure, error: 'Invalid or null data' };
  }

  // Check if it has the main required keys
  if (!parsedData.weekly || !parsedData.monthly) {
    // Try to find weekly and monthly data in different locations
    let weekly = parsedData.weekly || parsedData.week || parsedData.last_7_days || {};
    let monthly = parsedData.monthly || parsedData.month || parsedData.last_30_days || {};

    parsedData = { weekly, monthly };
  }

  // Validate and clean weekly data
  const validatedWeekly = {
    period: parsedData.weekly.period || 'last_7_days',
    totalMoods: typeof parsedData.weekly.totalMoods === 'number'
      ? parsedData.weekly.totalMoods
      : 0,
    dataQuality: ['sufficient', 'limited', 'insufficient'].includes(parsedData.weekly.dataQuality)
      ? parsedData.weekly.dataQuality
      : 'insufficient',
    findings: Array.isArray(parsedData.weekly.findings)
      ? parsedData.weekly.findings.filter(f => typeof f === 'string')
      : [],
    dominantMood: typeof parsedData.weekly.dominantMood === 'string'
      ? parsedData.weekly.dominantMood
      : null,
    moodVariety: typeof parsedData.weekly.moodVariety === 'number'
      ? parsedData.weekly.moodVariety
      : null,
    recommendation: typeof parsedData.weekly.recommendation === 'string'
      ? parsedData.weekly.recommendation
      : null
  };

  // Validate and clean monthly data
  const validatedMonthly = {
    period: parsedData.monthly.period || 'last_30_days',
    totalMoods: typeof parsedData.monthly.totalMoods === 'number'
      ? parsedData.monthly.totalMoods
      : 0,
    dataQuality: ['sufficient', 'limited', 'insufficient'].includes(parsedData.monthly.dataQuality)
      ? parsedData.monthly.dataQuality
      : 'insufficient',
    findings: Array.isArray(parsedData.monthly.findings)
      ? parsedData.monthly.findings.filter(f => typeof f === 'string')
      : [],
    dominantMood: typeof parsedData.monthly.dominantMood === 'string'
      ? parsedData.monthly.dominantMood
      : null,
    moodVariety: typeof parsedData.monthly.moodVariety === 'number'
      ? parsedData.monthly.moodVariety
      : null,
    trend: ['improving', 'stable', 'declining', 'unclear'].includes(parsedData.monthly.trend)
      ? parsedData.monthly.trend
      : 'unclear',
    recommendation: typeof parsedData.monthly.recommendation === 'string'
      ? parsedData.monthly.recommendation
      : null
  };

  // Check if the structure is mostly valid
  const isValid = validatedWeekly.findings.length > 0 || validatedMonthly.findings.length > 0;

  return {
    valid: isValid,
    data: {
      weekly: validatedWeekly,
      monthly: validatedMonthly
    },
    error: isValid ? null : 'No meaningful findings extracted'
  };
}

//check and return insights for last 48 hours (Current insights)
async function getRecentInsights(userId, pool) {
  const query = `
    SELECT insights_data, created_at
    FROM ai_insights_reports
    WHERE user_id = $1 
      AND created_at_local > NOW() - INTERVAL '48 hours'
    ORDER BY created_at_local DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

// Function to get the previous insights report(not in current 48 hour window)
async function getPreviousInsights(userId, pool) {
  const query = `
    SELECT insights_data, created_at
    FROM ai_insights_reports
    WHERE user_id = $1
      AND created_at_local < (CURRENT_TIMESTAMP - INTERVAL '48 hours')
    ORDER BY created_at_local DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

// Function to save insights to cache
async function saveInsightsToCache(userId, insightsData, pool) {
  const query = `
    INSERT INTO ai_insights_reports (user_id, insights_data, created_at, created_at_local)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, created_at, created_at_local
  `;

  const epochTime = Date.now(); // Current time in milliseconds
  const result = await pool.query(query, [userId, JSON.stringify(insightsData), epochTime]);
  return result.rows[0];
}
// POST /api/ai-insights - Generate AI insights for user's mood data
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const recentInsights = await getRecentInsights(userId, pool);

    if (recentInsights) {
      // Return cached insights
      return res.json({
        message: 'AI insights retrieved from cache',
        data: recentInsights.insights_data,
        generatedAt: recentInsights.created_at
      });
    }

    // Fetch user's mood data for last 30 days
    const moodQuery = `
      SELECT mood, created_at_local 
      FROM moods 
      WHERE user_id = $1 
        AND created_at_local >= NOW() - INTERVAL '30 days'
      ORDER BY created_at_local DESC
    `;

    const moodResult = await pool.query(moodQuery, [userId]);

    // Check if user has mood data
    if (moodResult.rows.length === 0) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.MOOD_RETRIEVAL_ERROR,
        'No mood data found for the last 30 days'
      );
      return res.status(404).json(errorResponse);
    }

    // Prepare mood data for AI
    const moodData = moodResult.rows;

    // Create your prompt here (you can customize this)
    const prompt = `
    You are analyzing mood tracking data from Moodly, an app where users log their emotional states (Excited, Happy, Calm, Tired, Anxious, Angry, Sad).
    DATA SPECIFICATIONS:
    
    Mood Data:
    ${JSON.stringify(moodData, null, 2)}
    
    The data is only last 30 days of mood data
    Each entry has: mood, created_at_local (timestamp)
    Multiple mood logs per day are common
    
    TIME PERIOD DEFINITIONS:
    Extract hour from created_at_local timestamp:
    
    Morning: 6:00 AM - 12:00 PM
    Afternoon: 12:00 PM - 6:00 PM
    Evening: 6:00 PM - 10:00 PM
    Night: 10:00 PM - 6:00 AM
    
    ANALYSIS SCOPE:
    
    Monthly Analysis: Use all provided data (already filtered to last 30 days)
    Weekly Analysis: Filter to last 7 days from current date (Date.now() - 7 days to today)
    
    REQUIRED ANALYSIS FOCUS:
    1. TEMPORAL BEHAVIORAL PATTERNS (Priority):
    
    Time-of-Day Variations: Mood variety/consistency across morning, afternoon, evening, night
    Daily Progression: Mood changes within same calendar dates (early vs late day)
    Weekly Timeline Trends: Compare early week vs late week patterns chronologically
    
    2. MEANINGFUL INSIGHTS (Focus on WHY/WHEN):
    Target these findings:
    
    "Afternoon showed wide mood variety (4 different moods), suggesting external factors played crucial role"
    "You experienced increasing tiredness toward later half of the day on multiple occasions"
    "Your mood patterns were more positive in the early part of the week"
    "Evening hours showed high mood variability, indicating responsiveness to circumstances"
    
    Avoid surface counting:
    
    "Happy appeared 5 times"
    "Tired was your most common mood"
    Simple frequency statements without behavioral context
    
    3. DATA QUALITY THRESHOLDS:
    
    Weekly: <7 moods = insufficient, ≥7 = sufficient/limited
    Monthly: <20 moods = limited, ≥20 = sufficient
    <5 total moods = insufficient for any analysis
    
    CRITICAL OUTPUT INSTRUCTIONS:
    DO NOT include any markdown formatting
    DO NOT use triple backticks
    DO NOT add code block indicators
    DO NOT include the word "json" before or after the output
    DO NOT add any explanations, comments, or text outside the JSON structure
    DO NOT use HTML tags or any other formatting
    
    RESPOND WITH ONLY THE RAW JSON OBJECT - starting with { and ending with }
    
    Return this exact structure as plain text JSON:
    {
      "weekly": {
        "period": "last_7_days",
        "totalMoods": <number>,
        "dataQuality": "sufficient|limited|insufficient", 
        "findings": [
          <temporal pattern insights or ["Insufficient data for weekly analysis"]>
        ],
        "dominantMood": "<most frequent mood>" or null,
        "moodVariety": <unique mood count> or null,
        "recommendation": "<actionable suggestion based on patterns>" or null
      },
      "monthly": {
        "period": "last_30_days",
        "totalMoods": <number>, 
        "dataQuality": "sufficient|limited|insufficient",
        "findings": [
          <temporal pattern insights or ["Insufficient data for monthly analysis"]>
        ],
        "dominantMood": "<most frequent mood>" or null,
        "moodVariety": <unique mood count> or null,
        "trend": "improving|stable|declining|unclear",
        "recommendation": "<actionable suggestion based on patterns>" or null
      }
    }
    
    KEY PRINCIPLES:
    
    Prioritize behavioral correlations over raw counts
    Connect mood patterns to time-based triggers
    Identify genuine temporal trends, don't force patterns
    Provide actionable insights about mood-time relationships
    Acknowledge data limitations honestly
    
    FINAL REMINDER: Your entire response must be valid JSON that starts with { and ends with } with no additional text or formatting whatsoever.
    `;

    // Call Google Generative AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Try to parse AI response as JSON, fallback to plain text
    let parsedInsights;
    let validationResult;

    try {
      // Step 1: Clean the AI response
      const cleanedResponse = cleanAIResponse(aiResponse);

      if (cleanedResponse) {
        // Step 2: Validate and ensure correct structure
        validationResult = validateInsightsStructure(cleanedResponse);

        if (validationResult.valid) {
          parsedInsights = validationResult.data;
        } else {
          // Log validation failure for monitoring
          console.warn('AI response validation failed:', validationResult.error);

          // Use the structured data even if not fully valid
          parsedInsights = validationResult.data;
        }
      } else {
        // Cleaning failed completely - use fallback
        throw new Error('Unable to extract JSON from AI response');
      }
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);

      // Last resort fallback - try to extract some value from raw text
      parsedInsights = {
        weekly: {
          period: 'last_7_days',
          totalMoods: moodData.filter(m => {
            const date = new Date(m.created_at_local);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          }).length,
          dataQuality: 'limited',
          findings: ['Unable to fully process AI analysis. Raw insights available below.'],
          dominantMood: null,
          moodVariety: null,
          recommendation: 'Please try generating insights again for detailed analysis.'
        },
        monthly: {
          period: 'last_30_days',
          totalMoods: moodData.length,
          dataQuality: 'limited',
          findings: [aiResponse.substring(0, 500)], // Include part of raw response
          dominantMood: null,
          moodVariety: null,
          trend: 'unclear',
          recommendation: null
        }
      };
    }

    // Prepare complete response data
    const responseData = {
      insights: parsedInsights,
      moodDataCount: moodData.length,
      analysisDate: new Date().toISOString()
    };

    let savedRecord;
    // Save to cache
    try {
      savedRecord = await saveInsightsToCache(userId, responseData, pool);
    } catch (cacheError) {
      // Log but don't fail the request if caching fails
      console.error('Failed to cache insights:', cacheError);
    }
    // Return success response
    // Return success response
    res.json({
      message: 'AI insights generated successfully',
      data: responseData,
      generatedAt: savedRecord.created_at,
    });

  } catch (error) {

    // Handle different types of errors
    if (error.message && error.message.includes('API_KEY')) {
      const errorResponse = ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.AUTH_INVALID_CREDENTIALS.code,
        'Invalid API configuration',
        'POST /api/ai-insights',
        'authenticate with AI service',
        error,
        req.user?.id || null
      );

      return res.status(401).json(errorResponse);
    }

    // General server error (similar pattern)
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      ERROR_CATALOG.SYS_INTERNAL_ERROR.message,
      'POST /api/ai-insights',
      'generate AI insights',
      error,
      req.user?.id || null
    );

    res.status(500).json(errorResponse);
  }
});

// GET /api/ai-insights/previous - Get most recent previous report
router.get('/previous', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const previousReport = await getPreviousInsights(userId, pool);

    if (!previousReport) {
      // Return success with null data instead of 404 error
      return res.json({
        message: 'No previous insights found',
        data: null,
        generatedAt: null
      });
    }

    res.json({
      message: 'Previous insights retrieved successfully',
      data: previousReport.insights_data,
      generatedAt: previousReport.created_at,
    });

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      'Failed to retrieve previous insights',
      'GET /api/ai-insights/previous',
      'fetch previous insights',
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

// GET /api/ai-insights/check-recent - Check if user has recent insights report (last 24 hours)
// GET /api/ai-insights/check-recent - Check report status for user
router.get('/check-recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recentInsights = await getRecentInsights(userId, pool);
    
    if (recentInsights) {
      return res.json({
        message: 'Report status check completed',
        report_status: 'generated'
      });
    }

    // Check if user has sufficient mood data
    const moodQuery = `
      SELECT COUNT(*) as mood_count
      FROM moods 
      WHERE user_id = $1 
        AND created_at_local >= NOW() - INTERVAL '30 days'
    `;
    
    const moodResult = await pool.query(moodQuery, [userId]);
    const moodCount = parseInt(moodResult.rows[0].mood_count);
    
    const reportStatus = moodCount === 20 ? 'insufficient_data' : 'to_generate';
    
    res.json({
      message: 'Report status check completed',
      report_status: reportStatus
    });

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      'Failed to check report status',
      'GET /api/ai-insights/check-recent',
      'check report status',
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

module.exports = router;