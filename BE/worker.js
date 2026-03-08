// worker.js
// Separate Node.js process — run via: node worker.js
require('dotenv').config();

const { Worker } = require('bullmq');
const { getRedisConnection, closeRedisConnection } = require('./config/redis');
const { QUEUE_NAMES, CONCURRENCY } = require('./config/queue');
const emailProcessor = require('./workers/emailProcessor');
const aiInsightsProcessor = require('./workers/aiInsightsProcessor');
const scheduledProcessor = require('./workers/scheduledProcessor');

const workers = [];

/**
 * Create a worker for a given queue with event logging
 */
const createWorker = (queueName, processor, concurrency) => {
  const worker = new Worker(queueName, processor, {
    connection: getRedisConnection(),
    concurrency
  });

  worker.on('completed', (job) => {
    console.log(`✅ [${queueName}] Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`❌ [${queueName}] Job ${job?.id} (${job?.name}) failed: ${error.message}`);
  });

  worker.on('error', (error) => {
    console.error(`⚠️ [${queueName}] Worker error: ${error.message}`);
  });

  workers.push(worker);
  console.log(`🔧 Worker registered: ${queueName} (concurrency: ${concurrency})`);

  return worker;
};

/**
 * Start all workers
 */
const startWorkers = () => {
  console.log('🚀 Starting Moodly Worker Process...');

  createWorker(QUEUE_NAMES.EMAIL, emailProcessor, CONCURRENCY[QUEUE_NAMES.EMAIL]);
  createWorker(QUEUE_NAMES.AI_INSIGHTS, aiInsightsProcessor, CONCURRENCY[QUEUE_NAMES.AI_INSIGHTS]);
  createWorker(QUEUE_NAMES.SCHEDULED_JOBS, scheduledProcessor, CONCURRENCY[QUEUE_NAMES.SCHEDULED_JOBS]);

  console.log(`✅ All workers running. Listening for jobs...`);
};

/**
 * Graceful shutdown — close all workers and Redis connection
 */
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down workers gracefully...`);

  for (const worker of workers) {
    await worker.close();
  }
  console.log('📋 All workers closed');

  await closeRedisConnection();
  console.log('🔴 Redis connection closed');

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start
startWorkers();