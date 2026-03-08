// config/redis.js
const Redis = require('ioredis');
require('dotenv').config();

const { ERROR_CATALOG } = require('./errorCodes');
const ErrorLogger = require('../services/errorLogger');

// Singleton connection instance
let redisConnection = null;

/**
 * Build Redis connection options from environment variables
 * Prioritizes REDIS_URL, falls back to separate host/port/password vars
 */
const getConnectionOptions = () => {
  const baseOptions = {
    maxRetriesPerRequest: null, // Required by BullMQ — infinite retries
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 500, 5000); // Exponential backoff, max 5s
      console.log(`🔄 Redis reconnection attempt ${times}, retrying in ${delay}ms...`);
      return delay;
    }
  };

  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL, options: baseOptions };
  }

  return {
    url: null,
    options: {
      ...baseOptions,
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    }
  };
};

/**
 * Get or create the shared Redis connection instance
 * Used by both BullMQ queues and workers
 */
const getRedisConnection = () => {
  if (redisConnection) return redisConnection;

  const { url, options } = getConnectionOptions();

  redisConnection = url
    ? new Redis(url, options)
    : new Redis(options);

  // Connection event logging (matches database.js pattern)
  redisConnection.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  redisConnection.on('ready', () => {
    console.log('🟢 Redis connection ready');
  });

  redisConnection.on('error', (err) => {
    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_REDIS_CONNECTION_FAILED.code,
      ERROR_CATALOG.SYS_REDIS_CONNECTION_FAILED.message,
      'REDIS_CONFIG',
      'redis connection',
      err,
      null,
      'redis-service'
    );
    console.error('❌ Redis connection error:', err.message);
  });

  redisConnection.on('close', () => {
    console.log('🔴 Redis connection closed');
  });

  redisConnection.on('reconnecting', (delay) => {
    console.log(`🔄 Redis reconnecting in ${delay}ms...`);
  });

  return redisConnection;
};

/**
 * Test Redis connectivity (matches testConnection pattern in database.js)
 */
const testRedisConnection = async () => {
  try {
    const connection = getRedisConnection();
    console.log('🔍 Testing Redis connection...');

    const result = await connection.ping();
    console.log(`✅ Redis test successful. PING response: ${result}`);
    return true;
  } catch (err) {
    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_REDIS_CONNECTION_FAILED.code,
      ERROR_CATALOG.SYS_REDIS_CONNECTION_FAILED.message,
      'REDIS_CONFIG',
      'redis connection test',
      err,
      null,
      'redis-service'
    );
    console.error('❌ Redis test failed:', err.message);
    return false;
  }
};

/**
 * Gracefully close the Redis connection
 */
const closeRedisConnection = async () => {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
    console.log('🔴 Redis connection closed gracefully');
  }
};

module.exports = { getRedisConnection, testRedisConnection, closeRedisConnection };