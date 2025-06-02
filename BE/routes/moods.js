const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Valid mood values (matching your frontend)
const VALID_MOODS = ['Excited', 'Happy', 'Calm', 'Tired', 'Anxious', 'Angry', 'Sad'];

// POST /api/moods - Create new mood entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { mood } = req.body;
    const userId = req.user.id; // ✅ Extract from JWT token

    // Validate mood value
    if (!mood) {
      return res.status(400).json({
        error: 'Mood is required'
      });
    }

    if (!VALID_MOODS.includes(mood)) {
      return res.status(400).json({
        error: 'Invalid mood value',
        validMoods: VALID_MOODS
      });
    }

    // Insert mood into database
    const newMood = await pool.query(
      'INSERT INTO moods (user_id, mood) VALUES ($1, $2) RETURNING id, user_id, mood, created_at',
      [userId, mood]
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
    console.error('Mood creation error:', error);
    
    // Handle database constraint errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({
        error: 'Invalid user reference'
      });
    }

    res.status(500).json({
      error: 'Internal server error while recording mood'
    });
  }
});

router.get('/last', authenticateToken, async (req, res) => {
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
    
    // Calculate if within 10 minutes (matching your frontend logic)
    const now = Date.now();
    const moodTime = new Date(lastMood.created_at).getTime();
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
    console.error('Last mood retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving mood'
    });
  }
});

router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const currentMoodResult = await pool.query(
      'SELECT id, mood, created_at FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    // Edge case (shouldn't happen due to routing logic)
    if (currentMoodResult.rows.length === 0) {
      console.warn(`Unexpected: /current called for user ${userId} with no moods`);
      return res.status(404).json({
        error: 'No current mood found'
      });
    }

    const currentMood = currentMoodResult.rows[0];

    res.status(200).json({
      mood: currentMood.mood,
      createdAt: currentMood.created_at
    });

  } catch (error) {
    console.error('Current mood retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving current mood'
    });
  }
});

module.exports = router;