const Queue = require('bull');
const { getRedisClient } = require('./redis');

let achievementQueue = null;
let statsQueue = null;

/**
 * Initialize Bull queues
 */
function initializeQueues() {
  const redisClient = getRedisClient();
  
  const queueOptions = {
    createClient: (type) => {
      switch (type) {
        case 'client':
          return redisClient;
        case 'subscriber':
          return redisClient.duplicate();
        case 'bclient':
          return redisClient.duplicate();
        default:
          return redisClient.duplicate();
      }
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 3,
    },
  };

  // Achievement processing queue
  achievementQueue = new Queue('achievement-processing', queueOptions);

  // Stats sync queue
  statsQueue = new Queue('stats-sync', queueOptions);

  // Queue event handlers
  achievementQueue.on('completed', (job) => {
    console.log(`✅ Achievement job ${job.id} completed`);
  });

  achievementQueue.on('failed', (job, err) => {
    console.error(`❌ Achievement job ${job.id} failed:`, err.message);
  });

  statsQueue.on('completed', (job) => {
    console.log(`✅ Stats sync job ${job.id} completed`);
  });

  statsQueue.on('failed', (job, err) => {
    console.error(`❌ Stats sync job ${job.id} failed:`, err.message);
  });

  // Start workers
  require('../workers/achievementWorker')(achievementQueue);
  require('../workers/statsWorker')(statsQueue);

  console.log('Bull queues initialized with workers');
}

/**
 * Add achievement check job to queue
 */
async function queueAchievementCheck(userId, eventData) {
  if (!achievementQueue) {
    throw new Error('Achievement queue not initialized');
  }

  return await achievementQueue.add(
    'check-achievements',
    { userId, eventData },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

/**
 * Add stats sync job to queue
 */
async function queueStatsSync(userId) {
  if (!statsQueue) {
    throw new Error('Stats queue not initialized');
  }

  return await statsQueue.add(
    'sync-stats',
    { userId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

/**
 * Get queue status
 */
async function getQueueStatus() {
  const achievementCounts = await achievementQueue.getJobCounts();
  const statsCounts = await statsQueue.getJobCounts();

  return {
    achievement: achievementCounts,
    stats: statsCounts,
  };
}

module.exports = {
  initializeQueues,
  queueAchievementCheck,
  queueStatsSync,
  getQueueStatus,
  getAchievementQueue: () => achievementQueue,
  getStatsQueue: () => statsQueue,
};
