// workers/aiInsightsProcessor.js
// Processor for ai-insights-queue jobs
// Handles Gemini API call, response parsing, validation, and DB save

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('../config/database');
const ErrorLogger = require('../services/errorLogger');
const { ERROR_CATALOG } = require('../config/errorCodes');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// =====================================================
// Helper Functions (moved from routes/aiInsights.js)
// =====================================================

/**
 * Clean and extract JSON from AI response
 */
function cleanAIResponse(rawResponse) {
  try {
    const parsed = JSON.parse(rawResponse);
    return parsed;
  } catch (firstAttempt) {
    let cleaned = rawResponse;

    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    cleaned = cleaned.replace(/^json\s*/i, '');
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (secondAttempt) {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (thirdAttempt) {
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

/**
 * Validate and ensure correct insights structure
 */
function validateInsightsStructure(parsedData) {
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

  if (!parsedData || typeof parsedData !== 'object') {
    return { valid: false, data: expectedStructure, error: 'Invalid or null data' };
  }

  if (!parsedData.weekly || !parsedData.monthly) {
    let weekly = parsedData.weekly || parsedData.week || parsedData.last_7_days || {};
    let monthly = parsedData.monthly || parsedData.month || parsedData.last_30_days || {};
    parsedData = { weekly, monthly };
  }

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

/**
 * Save insights to ai_insights_reports table
 */
async function saveInsightsToCache(userId, insightsData) {
  const query = `
    INSERT INTO ai_insights_reports (user_id, insights_data, created_at, created_at_local)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, created_at, created_at_local
  `;

  const epochTime = Date.now();
  const result = await pool.query(query, [userId, JSON.stringify(insightsData), epochTime]);
  return result.rows[0];
}

// =====================================================
// Main Processor
// =====================================================

/**
 * @param {import('bullmq').Job} job
 * @returns {object} — stored as job.returnvalue for status endpoint
 */
const aiInsightsProcessor = async (job) => {
  const { userId } = job.data;
  console.log(`🤖 [ai-insights] Processing job ${job.id} for user ${userId}`);

  // Step 1: Validate user exists
  const userCheck = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [userId]
  );

  if (userCheck.rows.length === 0) {
    throw new Error(`User ${userId} not found — aborting insights generation`);
  }

  // Step 2: Fetch mood data (last 30 days)
  await job.updateProgress(10);

  const moodQuery = `
    SELECT mood, created_at_local 
    FROM moods 
    WHERE user_id = $1 
      AND created_at_local >= NOW() - INTERVAL '30 days'
    ORDER BY created_at_local DESC
  `;

  const moodResult = await pool.query(moodQuery, [userId]);

  if (moodResult.rows.length === 0) {
    throw new Error('No mood data found for the last 30 days');
  }

  const moodData = moodResult.rows;
  console.log(`   Fetched ${moodData.length} mood entries for user ${userId}`);

  // Step 3: Build prompt and call Gemini
  await job.updateProgress(25);

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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  const result = await model.generateContent(prompt);
  const aiResponse = result.response.text();

  console.log(`   Gemini response received (${aiResponse.length} chars)`);

  // Step 4: Parse and validate response
  await job.updateProgress(70);

  let parsedInsights;

  try {
    const cleanedResponse = cleanAIResponse(aiResponse);

    if (cleanedResponse) {
      const validationResult = validateInsightsStructure(cleanedResponse);

      if (!validationResult.valid) {
        console.warn(`   AI response validation warning: ${validationResult.error}`);
      }

      // Use structured data whether fully valid or not
      parsedInsights = validationResult.data;
    } else {
      throw new Error('Unable to extract JSON from AI response');
    }
  } catch (parseError) {
    console.error(`   AI response parsing failed: ${parseError.message}`);

    // Last resort fallback
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
        findings: [aiResponse.substring(0, 500)],
        dominantMood: null,
        moodVariety: null,
        trend: 'unclear',
        recommendation: null
      }
    };
  }

  // Step 5: Save to database
  await job.updateProgress(90);

  const responseData = {
    insights: parsedInsights,
    moodDataCount: moodData.length,
    analysisDate: new Date().toISOString()
  };

  let savedRecord;
  try {
    savedRecord = await saveInsightsToCache(userId, responseData);
  } catch (cacheError) {
    // Log but don't fail the job — the insights were generated successfully
    console.error(`   Failed to cache insights for user ${userId}:`, cacheError.message);

    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_DATABASE_ERROR.code,
      'Failed to save AI insights to database',
      'WORKER_AI_INSIGHTS',
      'save insights to cache',
      cacheError,
      userId,
      'ai-insights-worker'
    );
  }

  await job.updateProgress(100);

  console.log(`   Insights saved for user ${userId} (record: ${savedRecord?.id || 'save failed'})`);

  // Return value is stored in job.returnvalue — read by status endpoint
  return {
    message: 'AI insights generated successfully',
    data: responseData,
    generatedAt: savedRecord?.created_at || Date.now(),
    userId
  };
};

module.exports = aiInsightsProcessor;