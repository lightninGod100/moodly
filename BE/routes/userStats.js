// routes/userStats.js
const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
// ADD: Rate limiting import
const { arl_user_stats } = require('../middleware/rateLimiting');
const router = express.Router();

// Mood to happiness score mapping (matching frontend)
const MOOD_SCORES = {
  'Happy': 1,
  'Excited': 0.67,
  'Calm': 0.33,
  'Tired': -0.1,
  'Anxious': -0.4,
  'Angry': -0.7,
  'Sad': -1
};

// Valid mood values
const VALID_MOODS = ['Excited', 'Happy', 'Calm', 'Tired', 'Anxious', 'Angry', 'Sad'];

// Time period calculations (returns UNIX timestamp)
const getTimePeriodFilter = (period) => {
  const now = Date.now();
  
  switch (period) {
    case 'today':
      return now - (24 * 60 * 60 * 1000); // 24 hours
    case 'week':
      return now - (7 * 24 * 60 * 60 * 1000); // 7 days
    case 'month':
      return now - (30 * 24 * 60 * 60 * 1000); // 30 days
    default:
      throw new Error('Invalid time period');
  }
};

// GET /api/user-stats/dominant-mood?period=today|week|month
router.get('/dominant-mood', arl_user_stats, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period } = req.query;
    
    // If no period specified, return all three
    const periods = period ? [period] : ['today', 'week', 'month'];
    
    // Validate period
    if (period && !['today', 'week', 'month'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period parameter',
        validPeriods: ['today', 'week', 'month']
      });
    }

    const result = {};

    for (const p of periods) {
      const timeFilter = getTimePeriodFilter(p);
      
      // Query to get most frequent mood for user in time period
      const query = `
        WITH mood_counts AS (
          SELECT 
            mood,
            COUNT(*) as count
          FROM moods 
          WHERE user_id = $1 AND created_at >= $2
          GROUP BY mood
        ),
        total_count AS (
          SELECT SUM(count) as total FROM mood_counts
        )
        SELECT 
          mc.mood,
          mc.count,
          CASE 
            WHEN tc.total > 0 THEN ROUND((mc.count::numeric / tc.total::numeric) * 100)
            ELSE 0
          END as percentage
        FROM mood_counts mc
        CROSS JOIN total_count tc
        ORDER BY mc.count DESC, mc.mood
        LIMIT 1
      `;

      const moodResult = await pool.query(query, [userId, timeFilter]);
      
      if (moodResult.rows.length > 0) {
        result[p] = {
          mood: moodResult.rows[0].mood,
          percentage: parseInt(moodResult.rows[0].percentage)
        };
      } else {
        // No moods in this period
        result[p] = {
          mood: null,
          percentage: 0
        };
      }
    }

    res.json(result);

  } catch (error) {
    console.error('Dominant mood error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching dominant mood stats'
    });
  }
});

// GET /api/user-stats/happiness-index?period=week|month
router.get('/happiness-index', arl_user_stats, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period } = req.query;
    
    // Validate period
    if (!period || !['week', 'month'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period parameter',
        validPeriods: ['week', 'month']
      });
    }

    const timeFilter = getTimePeriodFilter(period);
    
    // Query to get moods and calculate happiness scores by date
    const query = `
      WITH daily_moods AS (
        SELECT 
          DATE(to_timestamp(created_at::bigint / 1000.0)) as mood_date,
          mood,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY DATE(to_timestamp(created_at::bigint / 1000.0)) ORDER BY created_at DESC) as rn
        FROM moods 
        WHERE user_id = $1 AND created_at >= $2
      )
      SELECT 
        mood_date,
        mood
      FROM daily_moods
      WHERE rn = 1
      ORDER BY mood_date DESC
    `;

    const moodsResult = await pool.query(query, [userId, timeFilter]);
    
    // Convert to happiness scores
    const happinessData = moodsResult.rows.map(row => ({
      date: row.mood_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      score: MOOD_SCORES[row.mood] || 0
    }));

    // Fill in missing dates with null scores if needed
    const days = period === 'week' ? 7 : 30;
    const filledData = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingData = happinessData.find(d => d.date === dateStr);
      filledData.push(existingData || { date: dateStr, score: null });
    }

    res.json(filledData.reverse()); // Chronological order

  } catch (error) {
    console.error('Happiness index error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching happiness index'
    });
  }
});

// GET /api/user-stats/frequency?period=today|week|month
router.get('/frequency', arl_user_stats, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period } = req.query;
    
    // Validate period
    if (!period || !['today', 'week', 'month'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period parameter',
        validPeriods: ['today', 'week', 'month']
      });
    }

    const timeFilter = getTimePeriodFilter(period);
    
    // Query to count mood frequency
    const query = `
      SELECT 
        mood,
        COUNT(*) as count
      FROM moods 
      WHERE user_id = $1 AND created_at >= $2
      GROUP BY mood
    `;

    const result = await pool.query(query, [userId, timeFilter]);
    
    // Initialize response with all moods at 0
    const frequency = {};
    VALID_MOODS.forEach(mood => {
      frequency[mood] = 0;
    });

    // Fill in actual counts
    result.rows.forEach(row => {
      frequency[row.mood] = parseInt(row.count);
    });

    res.json(frequency);

  } catch (error) {
    console.error('Mood frequency error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching mood frequency'
    });
  }
});

// Test route to verify routing
router.get('/test', arl_user_stats, authenticateToken, (req, res) => {
  res.json({
    message: 'User stats routes are working',
    user: req.user
  });
});

module.exports = router;