// services/jobProducer.js
const { getEmailQueue, getAIInsightsQueue, getScheduledJobsQueue } = require('../config/queue');
const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('./errorLogger');

/**
 * Add an email job to the email queue
 * @param {string} jobType - e.g. 'contact_form', 'account_deletion', 'forgot_password', 'verification'
 * @param {object} data - Email data (to, subject, content, etc.)
 * @returns {string} jobId
 */
const addEmailJob = async (jobType, data) => {
  try {
    const queue = getEmailQueue();
    const job = await queue.add(jobType, {
      ...data,
      createdAt: Date.now()
    });

    console.log(`📧 Email job enqueued: ${jobType} (ID: ${job.id})`);
    return job.id;
  } catch (error) {
    ErrorLogger.serverLogError(
        ERROR_CATALOG.SYS_JOB_ENQUEUE_FAILED.code,
      'Failed to enqueue email job',
      'JOB_PRODUCER',
      `enqueue email job: ${jobType}`,
      error,
      data.userId || null,
      'job-producer'
    );
    throw error;
  }
};

/**
 * Add an AI insights generation job to the ai-insights queue
 * Uses deterministic jobId per user for built-in deduplication
 * - If a job is already waiting/active/delayed → returns existing jobId (no duplicate)
 * - If a previous job is completed/failed → removes it, enqueues fresh job
 * @param {object} data - { userId }
 * @returns {string} jobId
 */
const addAIInsightsJob = async (data) => {
  try {
    const queue = getAIInsightsQueue();
    const jobId = `ai-insights-${data.userId}`;

    // Check for existing job with this deterministic ID
    const existingJob = await queue.getJob(jobId);

    if (existingJob) {
      const state = await existingJob.getState();

      if (['waiting', 'active', 'delayed'].includes(state)) {
        // Job already in progress — deduplicate
        console.log(`AI insights job already in progress for user ${data.userId} (ID: ${jobId}, state: ${state})`);
        return jobId;
      }

      // Completed or failed — remove stale job so ID slot is freed
      await existingJob.remove();
      console.log(`Removed stale AI insights job for user ${data.userId} (state: ${state})`);
    }

    // Enqueue new job with deterministic ID
    await queue.add('generate_insights', {
      ...data,
      createdAt: Date.now()
    }, { jobId });

    console.log(`🤖 AI insights job enqueued for user ${data.userId} (ID: ${jobId})`);
    return jobId;
  } catch (error) {
    ErrorLogger.serverLogError(
      ERROR_CATALOG.SYS_JOB_ENQUEUE_FAILED.code,
      'Failed to enqueue AI insights job',
      'JOB_PRODUCER',
      'enqueue AI insights job',
      error,
      data.userId || null,
      'job-producer'
    );
    throw error;
  }
};

/**
 * Add a scheduled/cron job to the scheduled-jobs queue
 * @param {string} jobType - e.g. 'account_purge'
 * @param {object} data - Job payload
 * @param {object} [options] - BullMQ job options (e.g. repeat pattern)
 * @returns {string} jobId
 */
const addScheduledJob = async (jobType, data, options = {}) => {
  try {
    const queue = getScheduledJobsQueue();
    const job = await queue.add(jobType, {
      ...data,
      createdAt: Date.now()
    }, options);

    console.log(`⏰ Scheduled job enqueued: ${jobType} (ID: ${job.id})`);
    return job.id;
  } catch (error) {
    ErrorLogger.serverLogError(
        ERROR_CATALOG.SYS_JOB_ENQUEUE_FAILED.code,
      'Failed to enqueue scheduled job',
      'JOB_PRODUCER',
      `enqueue scheduled job: ${jobType}`,
      error,
      null,
      'job-producer'
    );
    throw error;
  }
};

module.exports = { addEmailJob, addAIInsightsJob, addScheduledJob };