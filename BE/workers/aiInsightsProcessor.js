// workers/aiInsightsProcessor.js
// Processor for ai-insights-queue jobs
// Real logic will be wired in during Phase 1C

/**
 * @param {import('bullmq').Job} job
 */
const aiInsightsProcessor = async (job) => {
    console.log(`🤖 Processing AI insights job (ID: ${job.id})`);
    console.log(`   User: ${job.data.userId}`);
  
    // TODO: Phase 1C — wire in Gemini API call, save results to DB
  
    return { status: 'placeholder', processedAt: Date.now() };
  };
  
  module.exports = aiInsightsProcessor;