// workers/deadLetterHandler.js
// Handles jobs that have permanently failed (all retries exhausted)

const { ERROR_CATALOG } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');

/**
 * Handle a permanently failed job
 * @param {string} queueName - Which queue the job came from
 * @param {import('bullmq').Job} job - The failed job
 * @param {Error} error - The final error
 */
const handleDeadLetter = (queueName, job, error) => {
  console.error(`💀 [${queueName}] PERMANENT FAILURE — Job ${job.id} (${job.name}) exhausted all ${job.attemptsMade} attempts`);
  console.error(`   Final error: ${error.message}`);
  console.error(`   Job data:`, JSON.stringify(job.data, null, 2));

  ErrorLogger.serverLogError(
    ERROR_CATALOG.SYS_JOB_ENQUEUE_FAILED.code,
    `Job permanently failed after ${job.attemptsMade} attempts: ${job.name}`,
    `WORKER_${queueName.toUpperCase()}`,
    `process job: ${job.name} (ID: ${job.id})`,
    error,
    job.data.userId || null,
    'dead-letter-handler'
  );
};

module.exports = { handleDeadLetter };