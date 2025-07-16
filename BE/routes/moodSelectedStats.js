const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();


const VALID_MOODS = ['Excited', 'Happy', 'Calm', 'Tired', 'Anxious', 'Angry', 'Sad'];

// Helper function to classify mood as positive/negative
const classifyMood = (mood) => {
  const positiveMoods = ['Happy', 'Excited', 'Calm'];
  return positiveMoods.includes(mood) ? 'positive' : 'negative';
};

// Helper function to get random message from array
const getRandomMessage = (messages) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// Helper function to get weekly sentiment message
const getWeeklySentimentMessage = (sentimentType) => {
  const positiveMessages = [
    "You've had a wonderfully positive week",
    "This week brought you lots of good vibes", 
    "You've been radiating positivity all week",
    "What a beautifully uplifting week for you",
    "Your week has been filled with good energy"
  ];
  
  const negativeMessages = [
    "This week has been tough, but you're resilient",
    "You've weathered a challenging week with strength",
    "This week tested you, but you made it through",
    "Even difficult weeks teach us something valuable",
    "You've shown incredible strength this week"
  ];

  return sentimentType === 'positive' 
    ? getRandomMessage(positiveMessages)
    : getRandomMessage(negativeMessages);
};

// Helper function to get contextual frequency message
const getFrequencyMessage = (currentMood, count, weekSentiment) => {
  const currentMoodType = classifyMood(currentMood);
  
  const messages = {
    'positive_week_negative_current': [
      `${count} times feeling ${currentMood} - but this positive week shows your strength`,
      `Feeling ${currentMood} for the ${count} times - remember the good moments you've had`,
      `${count} moments of ${currentMood.toLowerCase()} in an otherwise bright week`
    ],
    'negative_week_positive_current': [
      `${count} times feeling ${currentMood} - a bright spot in a tough week!`,
      `${currentMood} for the ${count} times - you're finding light in the darkness`,
      `${count} moments of joy shining through this challenging week`
    ],
    'positive_week_positive_current': [
      `${count} times feeling ${currentMood} - you're having an amazing week!`,
      `${currentMood} for the ${count} times - this positive week suits you!`,
      `${count} moments of ${currentMood.toLowerCase()} - what a wonderful week!`
    ],
    'negative_week_negative_current': [
      `${count} times feeling ${currentMood} - this difficult week will pass`,
      `${currentMood} for the ${count} times - be gentle with yourself`,
      `${count} moments of ${currentMood.toLowerCase()} - you're not alone in this`
    ]
  };
  
  const scenario = `${weekSentiment}_week_${currentMoodType}_current`;
  return getRandomMessage(messages[scenario]);
};

router.get('/weekly-sentiment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check user account age first
    const userResult = await pool.query(
      'SELECT created_at FROM users WHERE id = $1',
      [userId]
    );
    
    const userCreatedAt = userResult.rows[0].created_at;
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - sevenDaysInMs;
    
    // Case 1: New user (< 7 days old)
    if (userCreatedAt > sevenDaysAgo) {
      return res.json({
        hasData: false,
        message: "Moodly currently doesn't have anything interesting here"
      });
    }
    
    // Get mood data for last 7 days
    const moodResult = await pool.query(
      'SELECT mood, created_at FROM moods WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC',
      [userId, sevenDaysAgo]
    );
    
    const moodEntries = moodResult.rows;
    
    // Case 2: No data in last 7 days
    if (moodEntries.length === 0) {
      return res.json({
        hasData: false,
        message: "Sorry It seems moodly wasn't there with you last week"
      });
    }
    
    // Case 3: Insufficient total entries
    if (moodEntries.length < 6) {
      return res.json({
        hasData: false,
        message: "Moodly needs a bit more time to understand your weekly patterns"
      });
    }
    
    // Check unique days with mood entries
    const uniqueDays = new Set();
    moodEntries.forEach(entry => {
      const date = new Date(entry.created_at).toDateString();
      uniqueDays.add(date);
    });
    
    // Case 4: Insufficient day coverage
    if (uniqueDays.size < 3) {
      return res.json({
        hasData: false,
        message: "Moodly needs a bit more time to understand your weekly patterns"
      });
    }
    
    // Calculate daily dominant moods
    const dailyMoods = {};
    moodEntries.forEach(entry => {
      const date = new Date(entry.created_at).toDateString();
      if (!dailyMoods[date]) {
        dailyMoods[date] = {};
      }
      if (!dailyMoods[date][entry.mood]) {
        dailyMoods[date][entry.mood] = 0;
      }
      dailyMoods[date][entry.mood]++;
    });
    
    // Get dominant mood for each day
    const dominantMoods = [];
    Object.keys(dailyMoods).forEach(date => {
      const dayMoods = dailyMoods[date];
      const dominantMood = Object.keys(dayMoods).reduce((a, b) => 
        dayMoods[a] > dayMoods[b] ? a : b
      );
      dominantMoods.push(dominantMood);
    });
    
    // Calculate week sentiment
    const positiveDays = dominantMoods.filter(mood => classifyMood(mood) === 'positive').length;
    const negativeDays = dominantMoods.filter(mood => classifyMood(mood) === 'negative').length;
    const weekSentiment = positiveDays >= negativeDays ? 'positive' : 'negative';
    
    // Get current mood (most recent entry overall)
    const currentMoodResult = await pool.query(
      'SELECT mood FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    const response = {
      hasData: true,
      weekSentiment: weekSentiment,
      sentimentMessage: getWeeklySentimentMessage(weekSentiment),
      hasCurrentMood: currentMoodResult.rows.length > 0
    };
    
    // Add frequency message if current mood exists
    if (response.hasCurrentMood) {
      const currentMood = currentMoodResult.rows[0].mood;
      const moodCount = moodEntries.filter(entry => entry.mood === currentMood).length;
      
      response.currentMood = currentMood;
      response.moodCount = moodCount;
      response.frequencyMessage = getFrequencyMessage(currentMood, moodCount, weekSentiment);
    } else {
      response.frequencyMessage = null;
    }
    
    return res.json(response);
    
  } catch (error) {
    console.error('Weekly sentiment error:', error);
    res.status(500).json({
      error: 'Moodly Seems to be tired rn, please come back later'
    });
  }
});

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