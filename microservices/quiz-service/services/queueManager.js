/**
 * Bull Queue Configuration for Async Quiz Generation
 * Addresses: Blocking AI calls issue from optimization analysis
 */

const Queue = require('bull');
const createLogger = require('../../shared/utils/logger');

const logger = createLogger('quiz-queue');

// Initialize Redis connection for Bull
let redisConfig;

// Check if Upstash Redis is configured (recommended for production)
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  logger.info('Configuring queue with Upstash Redis');
  
  // Parse Upstash URL
  const url = new URL(process.env.UPSTASH_REDIS_URL);
  
  redisConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: process.env.UPSTASH_REDIS_TOKEN,
    tls: {
      rejectUnauthorized: false
    },
    maxRetriesPerRequest: null,  // Required for Bull queue compatibility
    enableReadyCheck: false,      // Required for Bull queue compatibility
  };
} else {
  // Fallback to local Redis
  logger.info('Configuring queue with local Redis');
  
  redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    maxRetriesPerRequest: null,  // Required for Bull queue compatibility
    enableReadyCheck: false,      // Required for Bull queue compatibility
  };
}

// Create quiz generation queue
const quizGenerationQueue = new Queue('quiz-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS) || 3,
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.QUEUE_BACKOFF_DELAY) || 5000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
    timeout: 30000, // 30 seconds max per job
  },
});

// Queue event listeners for monitoring
quizGenerationQueue.on('active', (job) => {
  logger.info(`Job ${job.id} started: ${job.data.method}`);
});

quizGenerationQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed successfully`, {
    method: job.data.method,
    quizId: result.quizId,
    duration: Date.now() - job.timestamp,
  });
});

quizGenerationQueue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed:`, {
    method: job.data.method,
    error: error.message,
    attempts: job.attemptsMade,
  });
});

quizGenerationQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled:`, job.data.method);
});

quizGenerationQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

/**
 * Add quiz generation job to queue
 */
async function addQuizGenerationJob(jobData, options = {}) {
  try {
    const job = await quizGenerationQueue.add(jobData, {
      ...options,
      jobId: jobData.jobId || undefined, // Allow custom job ID for deduplication
    });
    
    logger.info(`Quiz generation job added: ${job.id}`, {
      method: jobData.method,
      userId: jobData.userId,
    });
    
    return job;
  } catch (error) {
    logger.error('Failed to add quiz generation job:', error);
    throw error;
  }
}

/**
 * Get job status and result
 */
async function getJobStatus(jobId) {
  try {
    const job = await quizGenerationQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not-found' };
    }
    
    const state = await job.getState();
    const progress = job.progress();
    
    let result = null;
    if (state === 'completed') {
      // Bull stores return value in job.returnvalue (lowercase 'v')
      // Access it directly from the Redis data
      result = await job.finished();
      logger.info(`Job ${jobId} completed - result:`, result ? 'Found' : 'NULL');
    }
    
    let error = null;
    if (state === 'failed') {
      error = job.failedReason;
    }
    
    return {
      status: state,
      progress,
      result,
      error,
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } catch (error) {
    logger.error(`Failed to get job status: ${jobId}`, error);
    throw error;
  }
}

/**
 * Cancel/remove a job
 */
async function cancelJob(jobId) {
  try {
    const job = await quizGenerationQueue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} cancelled`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to cancel job: ${jobId}`, error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      quizGenerationQueue.getWaitingCount(),
      quizGenerationQueue.getActiveCount(),
      quizGenerationQueue.getCompletedCount(),
      quizGenerationQueue.getFailedCount(),
      quizGenerationQueue.getDelayedCount(),
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    return null;
  }
}

/**
 * Clean up old jobs
 */
async function cleanQueue(grace = 86400000) {
  try {
    // Remove completed jobs older than grace period (default 24 hours)
    await quizGenerationQueue.clean(grace, 'completed');
    await quizGenerationQueue.clean(grace, 'failed');
    
    logger.info(`Queue cleaned: removed jobs older than ${grace}ms`);
  } catch (error) {
    logger.error('Failed to clean queue:', error);
  }
}

/**
 * Close queue connection gracefully
 */
async function closeQueue() {
  try {
    await quizGenerationQueue.close();
    logger.info('Quiz generation queue closed');
  } catch (error) {
    logger.error('Failed to close queue:', error);
  }
}

module.exports = {
  quizGenerationQueue,
  addQuizGenerationJob,
  getJobStatus,
  cancelJob,
  getQueueStats,
  cleanQueue,
  closeQueue,
};
