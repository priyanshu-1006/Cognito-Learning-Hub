/**
 * Notification Worker
 * Processes notification jobs and persists to database
 */

const Queue = require('bull');
const notificationManager = require('../services/notificationManager');
const Notification = require('../models/Notification');
const createLogger = require('../../shared/utils/logger');

const logger = createLogger('notification-worker');

const redisUrl = process.env.QUEUE_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';
const notificationQueue = new Queue('notifications', redisUrl);

const concurrency = parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY) || 10;

// ============================================
// SINGLE NOTIFICATION PROCESSOR
// ============================================

notificationQueue.process('single', concurrency, async (job) => {
  const notificationData = job.data;
  
  logger.debug(`Processing single notification for user ${notificationData.userId}`);
  
  try {
    // Create in Redis (fast)
    const notification = await notificationManager.createNotification(notificationData);
    
    // Persist to database (async)
    const dbNotification = new Notification(notification);
    await dbNotification.save();
    
    logger.debug(`Processed notification ${notification.notificationId}`);
    return { success: true, notificationId: notification.notificationId };
  } catch (error) {
    logger.error(`Error processing single notification:`, error);
    throw error;
  }
});

// ============================================
// BATCH NOTIFICATION PROCESSOR
// ============================================

notificationQueue.process('batch', concurrency, async (job) => {
  const { notifications } = job.data;
  
  logger.info(`Processing batch of ${notifications.length} notifications`);
  
  try {
    // Create in Redis (fast)
    await notificationManager.batchCreateNotifications(notifications);
    
    // Persist to database in bulk (async)
    const dbNotifications = notifications.map(n => ({
      ...n,
      notificationId: require('nanoid').nanoid(12),
      isRead: false,
      createdAt: new Date(),
    }));
    
    await Notification.insertMany(dbNotifications, { ordered: false });
    
    logger.info(`Processed batch of ${notifications.length} notifications`);
    return { success: true, count: notifications.length };
  } catch (error) {
    logger.error(`Error processing batch notifications:`, error);
    throw error;
  }
});

// ============================================
// EVENT HANDLERS
// ============================================

notificationQueue.on('completed', (job, result) => {
  logger.debug(`Job ${job.id} completed:`, result);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

notificationQueue.on('error', (error) => {
  logger.error('Notification queue error:', error);
});

logger.info('Notification worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing notification queue...');
  await notificationQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing notification queue...');
  await notificationQueue.close();
  process.exit(0);
});

module.exports = notificationQueue;
