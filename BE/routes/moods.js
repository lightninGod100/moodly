const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
// ADD: Rate limiting imports
const { arl_moodCreation, arl_moodRetrievalLast } = require('../middleware/rateLimiting');

const { ERROR_CATALOG, getError } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

const router = express.Router();

// Valid mood values (matching your frontend)
const VALID_MOODS = ['Excited', 'Happy', 'Calm', 'Tired', 'Anxious', 'Angry', 'Sad'];

// POST /api/moods - Create new mood entry
router.post('/', arl_moodCreation, authenticateToken, async (req, res) => {
  try {
    const { mood } = req.body;
    const userId = req.user.id;

    // Validate mood value - NO SERVER LOGGING (validation errors)
    if (!mood) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.MOOD_REQUIRED.code,
        ERROR_CATALOG.MOOD_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    if (!VALID_MOODS.includes(mood)) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.MOOD_INVALID_VALUE.code,
        ERROR_CATALOG.MOOD_INVALID_VALUE.message
      );
      return res.status(400).json(errorResponse);
    }

    // Insert mood into database
    const now = Date.now();
    const newMood = await pool.query(
      'INSERT INTO moods (user_id, mood, created_at, created_at_utc) VALUES ($1, $2, $3, to_timestamp($3::bigint/1000.0)) RETURNING id, user_id, mood, created_at, created_at_utc',
      [userId, mood, now]
    );

    res.status(201).json({
      message: 'Mood recorded successfully',
      mood: {
        id: newMood.rows[0].id,
        userId: newMood.rows[0].user_id,
        mood: newMood.rows[0].mood,
        createdAt: newMood.rows[0].created_at
      }
    });

  } catch (error) {
    // Single operation endpoint - we know it's the INSERT that failed
    // Remove conditional checking - all catch errors are server errors
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.MOOD_CREATION_ERROR.code,
      ERROR_CATALOG.MOOD_CREATION_ERROR.message,
      'POST /api/moods',
      'write to database', // Specific context - only INSERT operation can fail
      error,
      userId
    );
    res.status(500).json(errorResponse);
  }
});

router.get('/last', arl_moodRetrievalLast, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the last mood entry for the user
    const lastMoodResult = await pool.query(
      'SELECT id, user_id, mood, created_at FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    // Handle case where user has no moods yet
    if (lastMoodResult.rows.length === 0) {
      return res.status(200).json({
        message: 'No mood history found',
        hasMood: false,
        mood: null
      });
    }

    const lastMood = lastMoodResult.rows[0];

    // Calculate if within 10 minutes
    const now = Date.now();
    const moodTime = lastMood.created_at;
    const tenMinutesInMs = 10 * 60 * 1000;
    const isWithin10Minutes = (now - moodTime) <= tenMinutesInMs;

    res.status(200).json({
      message: 'Last mood retrieved successfully',
      hasMood: true,
      isWithin10Minutes,
      mood: {
        id: lastMood.id,
        userId: lastMood.user_id,
        mood: lastMood.mood,
        createdAt: lastMood.created_at
      }
    });

  } catch (error) {
    // Single operation endpoint - we know it's the SELECT that failed
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.MOOD_RETRIEVAL_ERROR.code,
      ERROR_CATALOG.MOOD_RETRIEVAL_ERROR.message,
      'GET /api/moods/last',
      'read from database', // Specific context - only SELECT operation can fail
      error,
      userId
    );
    res.status(500).json(errorResponse);
  }
});

// router.get('/current', lowUsage, authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const currentMoodResult = await pool.query(
//       'SELECT id, mood, created_at FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
//       [userId]
//     );

//     // Edge case (shouldn't happen due to routing logic)
//     if (currentMoodResult.rows.length === 0) {
//       console.warn(`Unexpected: /current called for user ${userId} with no moods`);
//       return res.status(404).json({
//         error: 'No current mood found'
//       });
//     }

//     const currentMood = currentMoodResult.rows[0];

//     res.status(200).json({
//       mood: currentMood.mood,
//       createdAt: currentMood.created_at
//     });

//   } catch (error) {
//     console.error('Current mood retrieval error:', error);
//     res.status(500).json({
//       error: 'Internal server error while retrieving current mood'
//     });
//   }
// });

module.exports = router;