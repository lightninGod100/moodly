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

// Helper function to group moods by local date
const groupMoodsByLocalDate = (moods, timezone) => {
  const grouped = {};
  moods.forEach(mood => {
    const localDate = new Date(mood.created_at).toLocaleDateString('en-CA', { 
      timeZone: timezone 
    });
    if (!grouped[localDate]) {
      grouped[localDate] = [];
    }
    grouped[localDate].push(mood);
  });
  return grouped;
};

// Helper function to get today's date in user timezone
const getTodayInTimezone = (timezone) => {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
};

// Helper function to calculate current consecutive streak
const calculateCurrentConsecutiveStreak = (moods, timezone) => {
  if (moods.length === 0) return 0;
  
  const moodsByDate = groupMoodsByLocalDate(moods, timezone);
  const today = getTodayInTimezone(timezone);
  
  let streak = 0;
  let currentDate = new Date();
  
  // Set to today in user's timezone
  const todayParts = today.split('-');
  currentDate = new Date(parseInt(todayParts[0]), parseInt(todayParts[1]) - 1, parseInt(todayParts[2]));
  
  while (true) {
    const dateString = currentDate.toLocaleDateString('en-CA', { timeZone: timezone });
    
    if (moodsByDate[dateString] && moodsByDate[dateString].length > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// Calculate anniversary achievement
const calculateAnniversaryAchievement = (userCreatedAt) => {
  const daysSinceSignup = Math.floor((Date.now() - userCreatedAt) / (24 * 60 * 60 * 1000));
  
  if (daysSinceSignup >= 365) {
    return { name: "Moodly Master", message: "1 year with Moodly - What an incredible journey together!" };
  }
  if (daysSinceSignup >= 180) {
    return { name: "Moodly Veteran", message: "6 months with Moodly - Thank you for the journey!" };
  }
  if (daysSinceSignup >= 90) {
    return { name: "Moodly Regular", message: "3 months with Moodly - Building great habits!" };
  }
  if (daysSinceSignup >= 30) {
    return { name: "Moodly Newbie", message: "1 month with Moodly - You're getting the hang of it!" };
  }
  
  return null;
};

// Calculate first mood of day achievement
const calculateFirstMoodTodayAchievement = (moods, timezone) => {
  const today = getTodayInTimezone(timezone);
  const moodsByDate = groupMoodsByLocalDate(moods, timezone);
  
  if (moodsByDate[today] && moodsByDate[today].length > 0) {
    return { name: "Let's Go", message: "First mood of the day recorded!" };
  }
  
  return null;
};

// Calculate streak achievement
const calculateStreakAchievement = (moods, timezone) => {
  const currentStreak = calculateCurrentConsecutiveStreak(moods, timezone);
  
  if (currentStreak >= 30) {
    return { 
      name: "Consistency Champion (30+ days)", 
      message: `${currentStreak} day streak active!` 
    };
  }
  if (currentStreak >= 7) {
    return { 
      name: "Week Warrior (7+ days)", 
      message: `${currentStreak} day streak active!` 
    };
  }
  if (currentStreak >= 3) {
    return { 
      name: "Getting Started (3+ days)", 
      message: `${currentStreak} day streak active!` 
    };
  }
  
  return null;
};

// Calculate expert logger achievement (5 moods in a day)
const calculateExpertLoggerAchievement = (moods, timezone) => {
  const moodsByDate = groupMoodsByLocalDate(moods, timezone);
  
  for (const [date, dayMoods] of Object.entries(moodsByDate)) {
    if (dayMoods.length >= 5) {
      return { name: "Expert Logger", message: "5 moods in a day recorded!" };
    }
  }
  
  return null;
};

// Calculate rainbow achievement (all 7 moods in one day)
const calculateRainbowAchievement = (moods, timezone) => {
  const moodsByDate = groupMoodsByLocalDate(moods, timezone);
  
  for (const [date, dayMoods] of Object.entries(moodsByDate)) {
    const uniqueMoodsInDay = new Set(dayMoods.map(mood => mood.mood));
    if (uniqueMoodsInDay.size === 7) {
      return { name: "Rainbow", message: "All 7 moods in one day!" };
    }
  }
  
  return null;
};

const calculateDoraAchievement = (moods, timezone) => {
  // Check if user has all 7 moods total
  const allTimeMoods = new Set(moods.map(mood => mood.mood));
  if (allTimeMoods.size !== 7) {
    return null; // Doesn't have all 7 moods yet
  }
  
  // Get today's date
  const today = getTodayInTimezone(timezone);
  
  // Check if user had all 7 moods BEFORE today
  const moodsBeforeToday = moods.filter(mood => {
    const moodDate = new Date(mood.created_at).toLocaleDateString('en-CA', { timeZone: timezone });
    return moodDate !== today;
  });
  
  const uniqueMoodsBeforeToday = new Set(moodsBeforeToday.map(mood => mood.mood));
  
  // If user had fewer than 7 unique moods before today, then completed today
  if (uniqueMoodsBeforeToday.size < 7) {
    return { name: "Dora the Explorer", message: "All moods unlocked!" };
  }
  
  return null;
};

// Calculate mood count milestone
const calculateMoodCountMilestone = (totalMoods) => {
  if (totalMoods == 1000) {
    return { name: "Mood Legend", message: "1000 moods recorded!" };
  }
  if (totalMoods == 500) {
    return { name: "The Elite", message: "500 moods recorded!" };
  }
  if (totalMoods == 250) {
    return { name: "Quarter Master", message: "250 moods recorded!" };
  }
  if (totalMoods == 100) {
    return { name: "The Centurion", message: "Centurion - 100 moods recorded!" };
  }
  if (totalMoods == 50) {
    return { name: "Half Century", message: "50 moods recorded!" };
  }
  
  return null;
};

// GET /api/mood-selected-stats/achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userTimezone = req.headers['timezone'] || 'UTC';
    
    // Get user creation date (timezone-independent)
    const userResult = await pool.query(
      'SELECT created_at FROM users WHERE id = $1',
      [userId]
    );
    const userCreatedAt = userResult.rows[0].created_at;
    
    // Get all user moods
    const moodResult = await pool.query(
      'SELECT mood, created_at FROM moods WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const moods = moodResult.rows;
    const totalMoods = moods.length;
    
    // Calculate all achievements (in priority order)
    const achievements = [
      // 1. Anniversary (highest priority)
      calculateAnniversaryAchievement(userCreatedAt),
      
      // 2. First mood of day
      calculateFirstMoodTodayAchievement(moods, userTimezone),
      
      // 3. Streaks
      calculateStreakAchievement(moods, userTimezone),
      
      // 4. Expert Logger (5 moods in a day)
      calculateExpertLoggerAchievement(moods, userTimezone),
      
      // 5. Rainbow (all 7 moods in one day)
      calculateRainbowAchievement(moods, userTimezone),
      
      // 6. Dora the Explorer (all moods unlocked)
      calculateDoraAchievement(moods),
      
      // 7. Mood count milestones (lowest priority)
      calculateMoodCountMilestone(totalMoods)
    ].filter(achievement => achievement !== null);
    
    // Return highest priority achievement or fallback message
    if (achievements.length > 0) {
      return res.json({
        hasAchievement: true,
        achievements: achievements // All achievements in priority order
      });
    } else {
      return res.json({
        hasAchievement: false,
        message: "Keep using Moodly to unlock achievements and milestones"
      });
    }
    
  } catch (error) {
    console.error('Achievements calculation error:', error);
    res.status(500).json({
      error: 'Moodly Seems to be tired rn, please come back later'
    });
  }
});

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
      
      if (currentMood === previousMood) {
        // Same mood - no transition
        return res.json({
          transition: false,
          message: `You are still feeling ${currentMood}`
        });
      } else {
        // Different mood - actual transition
        return res.json({
          transition: true,
          message: `Your mood changed from ${previousMood} to ${currentMood}`
        });
      }
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