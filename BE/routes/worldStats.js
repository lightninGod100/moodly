// routes/worldStats.js
const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();
// ADD: Rate limiting import
const { mediumUsage } = require('../middleware/rateLimiting');
// Valid mood values (matching your frontend)
const VALID_MOODS = ['Excited', 'Happy', 'Calm', 'Tired', 'Anxious', 'Angry', 'Sad'];

// Time period calculations
const getTimePeriodFilter = (period) => {
  const now = Date.now();
  
  switch (period) {
    case 'live':
      return now - (10 * 60 * 1000); // 10 minutes
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

// GET /api/world-stats/global?period=live|today|week|month
router.get('/global', mediumUsage, async (req, res) => {
  try {
    const { period } = req.query;
    
    // Validate period
    if (!period || !['live', 'today', 'week', 'month'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period parameter',
        validPeriods: ['live', 'today', 'week', 'month']
      });
    }

    const timeFilter = getTimePeriodFilter(period);

    // Query to get most recent mood per user within time period
    const query = `
      WITH user_mood_counts AS (
  -- Count each mood frequency per user in timeframe
  SELECT 
    user_id,
    mood,
    COUNT(*) as mood_count,
    MAX(created_at) as latest_occurrence
  FROM moods 
  WHERE created_at >= $1
  GROUP BY user_id, mood
),
user_max_counts AS (
  -- Find the maximum count per user
  SELECT 
    user_id,
    MAX(mood_count) as max_count
  FROM user_mood_counts
  GROUP BY user_id
),
user_dominant_moods AS (
  -- Get dominant mood, break ties by most recent
  SELECT DISTINCT ON (umc.user_id)
    umc.user_id,
    umc.mood as dominant_mood
  FROM user_mood_counts umc
  INNER JOIN user_max_counts umx ON umc.user_id = umx.user_id 
  WHERE umc.mood_count = umx.max_count
  ORDER BY umc.user_id, umc.latest_occurrence DESC
),
mood_counts AS (
  SELECT 
    dominant_mood as mood,
    COUNT(*) as count
  FROM user_dominant_moods
  GROUP BY dominant_mood
),
total_users AS (
  SELECT COUNT(*) as total FROM user_dominant_moods
)
SELECT 
  mc.mood,
  mc.count,
  tu.total,
  CASE 
    WHEN tu.total > 0 THEN ROUND((mc.count::numeric / tu.total::numeric) * 100)
    ELSE 0
  END as percentage
FROM mood_counts mc
CROSS JOIN total_users tu
    `;

    const result = await pool.query(query, [timeFilter]);
    
    // Initialize response with all moods at 0%
    const response = {};
    VALID_MOODS.forEach(mood => {
      response[mood] = 0;
    });

    // Fill in actual percentages
    result.rows.forEach(row => {
      response[row.mood] = parseInt(row.percentage);
    });

    res.json(response);

  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching global stats'
    });
  }
});

// GET /api/world-stats/countries?period=live|today|week|month
router.get('/countries', mediumUsage, async (req, res) => {
  try {
    const { period } = req.query;
    
    // Validate period
    if (!period || !['live', 'today', 'week', 'month'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period parameter',
        validPeriods: ['live', 'today', 'week', 'month']
      });
    }

    const timeFilter = getTimePeriodFilter(period);

    // Query to get country-wise mood data
    const query = `
      WITH user_mood_counts AS (
  -- Count each mood frequency per user in timeframe
  SELECT 
    m.user_id,
    u.country,
    m.mood,
    COUNT(*) as mood_count,
    MAX(m.created_at) as latest_occurrence
  FROM moods m
  INNER JOIN users u ON m.user_id = u.id  -- Still need this for country!
  WHERE m.created_at >= $1
  GROUP BY m.user_id, u.country, m.mood
),
user_max_counts AS (
  -- Find the maximum count per user
  SELECT 
    user_id,
    MAX(mood_count) as max_count
  FROM user_mood_counts
  GROUP BY user_id
),
user_dominant_moods AS (
  -- Get dominant mood per user, break ties by most recent
  SELECT DISTINCT ON (umc.user_id)
    umc.user_id,
    umc.country,
    umc.mood as dominant_mood
  FROM user_mood_counts umc
  INNER JOIN user_max_counts umx ON umc.user_id = umx.user_id 
  WHERE umc.mood_count = umx.max_count
  ORDER BY umc.user_id, umc.latest_occurrence DESC
),
country_mood_counts AS (
  SELECT 
    country,
    dominant_mood as mood,
    COUNT(*) as count
  FROM user_dominant_moods
  GROUP BY country, dominant_mood
),
country_totals AS (
  SELECT 
    country,
    COUNT(*) as total_users
  FROM user_dominant_moods
  GROUP BY country
),
country_mood_percentages AS (
  SELECT 
    cmc.country,
    cmc.mood,
    cmc.count,
    ct.total_users,
    CASE 
      WHEN ct.total_users > 0 THEN ROUND((cmc.count::numeric / ct.total_users::numeric) * 100)
      ELSE 0
    END as percentage
  FROM country_mood_counts cmc
  INNER JOIN country_totals ct ON cmc.country = ct.country
),
top_moods AS (
  SELECT DISTINCT ON (country)
    country,
    mood as top_mood
  FROM country_mood_percentages
  ORDER BY country, percentage DESC, count DESC
)
SELECT 
  cmp.country,
  cmp.mood,
  cmp.percentage,
  cmp.count,
  ct.total_users,
  tm.top_mood
FROM country_mood_percentages cmp
INNER JOIN country_totals ct ON cmp.country = ct.country
INNER JOIN top_moods tm ON cmp.country = tm.country
ORDER BY cmp.country, cmp.percentage DESC
    `;

    const result = await pool.query(query, [timeFilter]);
    
    // Process results into the required format
    const response = {};
    
    result.rows.forEach(row => {
      if (!response[row.country]) {
        response[row.country] = {
          topMood: row.top_mood,
          userCount: parseInt(row.total_users),
          moods: {}
        };
        
        // Initialize all moods to 0%
        VALID_MOODS.forEach(mood => {
          response[row.country].moods[mood] = 0;
        });
      }
      
      // Set actual percentage for this mood
      response[row.country].moods[row.mood] = parseInt(row.percentage);
    });

    res.json(response);

  } catch (error) {
    console.error('Country stats error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching country stats'
    });
  }
});

// GET /api/world-stats/mood_frequency?period=live|today|week|month
router.get('/mood_frequency', mediumUsage, async (req, res) => {
  try {
    const { period } = req.query;
    
    // Validate period
    if (!period || !['live', 'today', 'week', 'month'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period parameter',
        validPeriods: ['live', 'today', 'week', 'month']
      });
    }

    const timeFilter = getTimePeriodFilter(period);

    // Simple query to count mood frequency in timeframe
    const query = `
      SELECT 
        mood,
        COUNT(*) as count
      FROM moods 
      WHERE created_at >= $1
      GROUP BY mood
    `;

    const result = await pool.query(query, [timeFilter]);
    
    // Initialize response with all moods at 0
    const response = {};
    VALID_MOODS.forEach(mood => {
      response[mood] = 0;
    });

    // Fill in actual counts
    result.rows.forEach(row => {
      response[row.mood] = parseInt(row.count);
    });

    res.json(response);

  } catch (error) {
    console.error('Mood frequency stats error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching mood frequency stats'
    });
  }
});

module.exports = router;