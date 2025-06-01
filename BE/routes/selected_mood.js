
const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Register new user
router.post('/moods', async (req, res) => {
  try {
    const {user_id, mood} = req.body;


    // Create user
    const newMood = await pool.query(
      'INSERT INTO moods (user_id, mood) VALUES ($1, $2) RETURNING id,user_id, mood,created_at',
      [user_id, mood]
    );


    res.status(201).json({
      message: 'User Mood registered successfully',
      user: {
        id: newMood.rows[0].id,
        user_id: newMood.rows[0].user_id,
        mood: newMood.rows[0].mood,
        createdAt: newMood.rows[0].created_at
      },
    });

  } catch (error) {
    console.error('Moods registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});




module.exports = selectedMoodRoutes;