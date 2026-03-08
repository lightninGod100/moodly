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
 * @param {object} data - { userId, moodData, timezone, etc. }
 * @returns {string} jobId
 */
const addAIInsightsJob = async (data) => {
  try {
    const queue = getAIInsightsQueue();
    const job = await queue.add('generate_insights', {
      ...data,
      createdAt: Date.now()
    });

    console.log(`🤖 AI insights job enqueued for user ${data.userId} (ID: ${job.id})`);
    return job.id;
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