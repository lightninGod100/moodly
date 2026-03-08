// workers/emailProcessor.js
// Processor for email-queue jobs
// Real logic will be wired in during Phase 1C

/**
 * @param {import('bullmq').Job} job
 */
const emailProcessor = async (job) => {
    console.log(`📧 Processing email job: ${job.name} (ID: ${job.id})`);
    console.log(`   Data:`, JSON.stringify(job.data, null, 2));
  
    // TODO: Phase 1C — wire in actual email sending logic
    // Job types: 'contact_form', 'account_deletion', 'forgot_password', 'verification'
  
    return { status: 'placeholder', processedAt: Date.now() };
  };
  
  module.exports = emailProcessor;