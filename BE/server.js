// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/database');
const userStatsRoutes = require('./routes/userStats');

// Import routes
const authRoutes = require('./routes/auth');
const MoodsRoutes = require('./routes/moods');
const worldStatsRoutes = require('./routes/worldStats');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Moodly Backend API is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    res.json({
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      server: 'running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test database query route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users LIMIT 5');
    res.json({
      message: 'Database query successful',
      userCount: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database query failed',
      details: error.message
    });
  }
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/moods', MoodsRoutes);
app.use('/api/world-stats', worldStatsRoutes);
app.use('/api/user-stats', userStatsRoutes);

// Protected route example (requires authentication)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Successfully accessed protected route',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching user data'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server function
const startServer = async () => {
  try {
    // Test database connection first
    console.log('🚀 Starting Moodly Backend Server...');
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;