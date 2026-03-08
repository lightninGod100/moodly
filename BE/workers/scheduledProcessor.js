// workers/scheduledProcessor.js
// Processor for scheduled-jobs-queue jobs
// Real logic will be wired in during Phase 1D

/**
 * @param {import('bullmq').Job} job
 */
const scheduledProcessor = async (job) => {
    console.log(`⏰ Processing scheduled job: ${job.name} (ID: ${job.id})`);
    console.log(`   Data:`, JSON.stringify(job.data, null, 2));
  
    // TODO: Phase 1D — wire in account purge and other cron jobs
  
    return { status: 'placeholder', processedAt: Date.now() };
  };
  
  module.exports = scheduledProcessor;
