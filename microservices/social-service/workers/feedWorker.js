/**
 * Feed Worker
 * Processes feed fanout jobs
 */

const Queue = require('bull');
const feedManager = require('../services/feedManager');
const Post = require('../models/Post');
const createLogger = require('../../shared/utils/logger');

const logger = createLogger('feed-worker');

const redisUrl = process.env.QUEUE_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';
const feedQueue = new Queue('feed-fanout', redisUrl);

const concurrency = parseInt(process.env.FEED_WORKER_CONCURRENCY) || 5;

// ============================================
// FEED FANOUT PROCESSOR
// ============================================

feedQueue.process('fanout', concurrency, async (job) => {
  const { postData, followerIds } = job.data;
  
  logger.info(`Processing feed fanout for post ${postData.postId} to ${followerIds.length} followers`);
  
  try {
    // Fanout to all followers' feeds
    await feedManager.fanoutToFollowers(postData.authorId, postData, followerIds);
    
    // Update trending
    await feedManager.addToTrending(postData);
    
    logger.info(`Completed feed fanout for post ${postData.postId}`);
    return { success: true, followersCount: followerIds.length };
  } catch (error) {
    logger.error(`Error in feed fanout for post ${postData.postId}:`, error);
    throw error; // Will trigger retry
  }
});

// ============================================
// POST PERSISTENCE PROCESSOR
// ============================================

feedQueue.process('persist-post', concurrency, async (job) => {
  const postData = job.data;
  
  logger.debug(`Persisting post ${postData.postId} to database`);
  
  try {
    // Check if already exists
    const existing = await Post.findOne({ postId: postData.postId });
    
    if (existing) {
      logger.debug(`Post ${postData.postId} already exists in database`);
      return { success: true, existed: true };
    }
    
    // Create in database
    const post = new Post(postData);
    await post.save();
    
    logger.debug(`Persisted post ${postData.postId} to database`);
    return { success: true, existed: false };
  } catch (error) {
    logger.error(`Error persisting post ${postData.postId}:`, error);
    throw error;
  }
});

// ============================================
// EVENT HANDLERS
// ============================================

feedQueue.on('completed', (job, result) => {
  logger.debug(`Job ${job.id} completed:`, result);
});

feedQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

feedQueue.on('error', (error) => {
  logger.error('Feed queue error:', error);
});

logger.info('Feed worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing feed queue...');
  await feedQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing feed queue...');
  await feedQueue.close();
  process.exit(0);
});

module.exports = feedQueue;
