// config/queue.js
const { Queue } = require('bullmq');
const { getRedisConnection } = require('./redis');

// =====================================================
// Queue Name Constants
// =====================================================
const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  AI_INSIGHTS: 'ai-insights-queue',
  SCHEDULED_JOBS: 'scheduled-jobs-queue'
};

// =====================================================
// Shared Job Retention (protects Redis memory)
// =====================================================
const SHARED_RETENTION = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 }
};

// =====================================================
// Per-Queue Default Job Options
// =====================================================
const DEFAULT_JOB_OPTIONS = {
  [QUEUE_NAMES.EMAIL]: {
    ...SHARED_RETENTION,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000 // 2s → 4s → 8s
    }
  },
  [QUEUE_NAMES.AI_INSIGHTS]: {
    ...SHARED_RETENTION,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s → 10s
    }
  },
  [QUEUE_NAMES.SCHEDULED_JOBS]: {
    ...SHARED_RETENTION,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000 // 10s → 20s → 40s
    }
  }
};

// =====================================================
// Concurrency Limits (used by workers)
// =====================================================
const CONCURRENCY = {
  [QUEUE_NAMES.EMAIL]: 2,
  [QUEUE_NAMES.AI_INSIGHTS]: 1,
  [QUEUE_NAMES.SCHEDULED_JOBS]: 1
};

// =====================================================
// Queue Instances (lazy-initialized singletons)
// =====================================================
let queues = {};

const getQueue = (queueName) => {
  if (!queues[queueName]) {
    queues[queueName] = new Queue(queueName, {
      connection: getRedisConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS[queueName]
    });

    console.log(`📋 Queue initialized: ${queueName}`);
  }

  return queues[queueName];
};

// Convenience getters
const getEmailQueue = () => getQueue(QUEUE_NAMES.EMAIL);
const getAIInsightsQueue = () => getQueue(QUEUE_NAMES.AI_INSIGHTS);
const getScheduledJobsQueue = () => getQueue(QUEUE_NAMES.SCHEDULED_JOBS);

/**
 * Gracefully close all queue instances
 */
const closeAllQueues = async () => {
  for (const [name, queue] of Object.entries(queues)) {
    await queue.close();
    console.log(`📋 Queue closed: ${name}`);
  }
  queues = {};
};

module.exports = {
  QUEUE_NAMES,
  CONCURRENCY,
  DEFAULT_JOB_OPTIONS,
  getEmailQueue,
  getAIInsightsQueue,
  getScheduledJobsQueue,
  closeAllQueues
};