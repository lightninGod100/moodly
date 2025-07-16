const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();


const VALID_MOODS = ['Excited', 'Happy', 'Calm', 'Tired', 'Anxious', 'Angry', 'Sad'];

// GET /api/mood-selected-stats/mood-transition
router.get('/mood-transition', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's last 2 mood entries
    const moodResult = await pool.query(
      'SELECT mood, created_at FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 2',
      [userId]
    );

    const moods = moodResult.rows;

    // Determine response based on mood count
    if (moods.length >= 2) {
      // Normal case: show transition
      const currentMood = moods[0].mood;
      const previousMood = moods[1].mood;
      
      return res.json({
        transition: true,
        message: `Your mood changed from ${previousMood} to ${currentMood}`
      });
    } else if (moods.length === 1) {
      // First mood case
      const currentMood = moods[0].mood;
      
      return res.json({
        transition: false,
        message: `You are feeling ${currentMood} right now`
      });
    } else {
      // No moods case (bug scenario)
      return res.json({
        transition: false,
        message: "Interesting Something seems off here"
      });
    }

  } catch (error) {
    console.error('Mood transition error:', error);
    res.status(500).json({
      error: 'Moodly Seems to be tired rn, please come back later'
    });
  }
});

router.get('/global-percentage', authenticateToken, async (req, res) => {
    try {
      const { mood } = req.query;
  
      // Validate mood parameter
      if (!mood) {
        return res.status(400).json({
          error: 'Mood parameter is required'
        });
      }
  
      if (!VALID_MOODS.includes(mood)) {
        return res.status(400).json({
          error: 'Invalid mood value',
          validMoods: VALID_MOODS
        });
      }
  
      // Calculate time filter for last 10 minutes
      const now = Date.now();
      const tenMinutesAgo = now - (10 * 60 * 1000);
  
      // Get count of users with specific mood in last 10 minutes
      const moodCountResult = await pool.query(
        'SELECT COUNT(DISTINCT user_id) as count FROM moods WHERE mood = $1::VARCHAR AND created_at >= $2',
        [mood, tenMinutesAgo]
      );
  
      // Get total count of active users in last 10 minutes
      const totalCountResult = await pool.query(
        'SELECT COUNT(DISTINCT user_id) as count FROM moods WHERE created_at >= $1',
        [tenMinutesAgo]
      );
  
      const moodCount = parseInt(moodCountResult.rows[0].count);
      const totalCount = parseInt(totalCountResult.rows[0].count);
  
      const adjustedMoodCount = moodCount + 1;  // Current user + others with same mood
const adjustedTotalCount = Math.max(totalCount + 1, 1);  // Ensure at least 1 total user

// Calculate percentage
const percentage = Math.round((adjustedMoodCount / adjustedTotalCount) * 100);
  
      return res.json({
        percentage: percentage,
        message: `You are among ${percentage}% of users feeling ${mood} right now`
      });
  
    } catch (error) {
      console.error('Global percentage error:', error);
      res.status(500).json({
        error: 'Moodly Seems to be tired rn, please come back later'
      });
    }
  });

  
module.exports = router;