// routes/aiInsights.js
const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');
const { addAIInsightsJob } = require('../services/jobProducer');
const { getAIInsightsQueue } = require('../config/queue');

const router = express.Router();



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

// POST /api/ai-insights - Generate AI insights for user's mood data
// POST /api/ai-insights - Generate AI insights for user's mood data
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check for recent cached insights (within 48 hours)
    const recentInsights = await getRecentInsights(userId, pool);

    if (recentInsights) {
      return res.json({
        message: 'AI insights retrieved from cache',
        data: recentInsights.insights_data,
        generatedAt: recentInsights.created_at
      });
    }

    // No cached insights — enqueue background job
    const jobId = await addAIInsightsJob({ userId });

    res.status(202).json({
      message: 'AI insights generation started',
      jobId,
      status: 'processing'
    });

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      ERROR_CATALOG.SYS_INTERNAL_ERROR.message,
      'POST /api/ai-insights',
      'enqueue AI insights job',
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


// GET /api/ai-insights/status/:jobId - Check job status and retrieve result
router.get('/status/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const queue = getAIInsightsQueue();
    const job = await queue.getJob(jobId);

    // Job not found (expired from retention or invalid ID)
    if (!job) {
      return res.status(404).json({
        message: 'Job not found',
        status: 'not_found'
      });
    }

    // Security: verify job belongs to requesting user
    if (job.data.userId !== userId) {
      return res.status(403).json({
        message: 'Unauthorized access to this job',
        status: 'forbidden'
      });
    }

    // Get current job state
    const state = await job.getState();

    // Base response
    const response = {
      jobId,
      status: state,
      progress: job.progress || 0
    };

    if (state === 'completed') {
      response.data = job.returnvalue?.data || null;
      response.generatedAt = job.returnvalue?.generatedAt || null;
      response.message = 'AI insights generated successfully';
    } else if (state === 'failed') {
      response.message = job.failedReason || 'Insights generation failed';
    } else {
      // waiting, active, delayed
      response.message = 'AI insights generation in progress';
    }

    res.json(response);

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      'Failed to check job status',
      'GET /api/ai-insights/status/:jobId',
      'check AI insights job status',
      error,
      req.user?.id || null
    );
    res.status(500).json(errorResponse);
  }
});

module.exports = router;