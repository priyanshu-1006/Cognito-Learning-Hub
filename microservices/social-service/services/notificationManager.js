/**
 * Notification Manager
 * Redis-based notification system with batching
 */

const Redis = require('ioredis');
const { nanoid } = require('nanoid');
const createLogger = require('../../shared/utils/logger');

const logger = createLogger('notification-manager');

class NotificationManager {
  constructor() {
    this.redis = null;
    this.connected = false;
    
    this.keyPrefix = process.env.REDIS_KEY_PREFIX || 'social:';
    this.notificationCacheTTL = parseInt(process.env.NOTIFICATION_CACHE_TTL) || 600; // 10 minutes
    this.batchSize = parseInt(process.env.NOTIFICATION_BATCH_SIZE) || 50;
  }

  async connect() {
    try {
      let redisConfig;
      
      // Check if Upstash Redis is configured
      if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
        logger.info('Connecting to Upstash Redis (cloud)...');
        
        const url = new URL(process.env.UPSTASH_REDIS_URL);
        
        redisConfig = {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: process.env.UPSTASH_REDIS_TOKEN,
          tls: {
            rejectUnauthorized: false
          },
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        };
        
        this.redis = new Redis(redisConfig);
      } else {
        // Fallback to local Redis
        logger.info('Connecting to local Redis...');
        
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      }

      this.redis.on('connect', () => {
        this.connected = true;
        logger.info('Redis connected');
      });

      this.redis.on('error', (err) => {
        logger.error('Redis error:', err);
        this.connected = false;
      });

      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.redis) await this.redis.quit();
    this.connected = false;
    logger.info('Redis disconnected');
  }

  isConnected() {
    return this.connected;
  }

  // ============================================
  // KEY GENERATORS
  // ============================================

  getNotificationListKey(userId) {
    return `${this.keyPrefix}notifications:${userId}`;
  }

  getUnreadCountKey(userId) {
    return `${this.keyPrefix}unread-count:${userId}`;
  }

  getNotificationKey(notificationId) {
    return `${this.keyPrefix}notification:${notificationId}`;
  }

  // ============================================
  // NOTIFICATION OPERATIONS
  // ============================================

  /**
   * Create notification
   * Stores in Redis and queues for database persistence
   */
  async createNotification(notificationData) {
    try {
      const notificationId = nanoid(12);
      
      const notification = {
        notificationId,
        userId: notificationData.userId,
        type: notificationData.type,
        actorId: notificationData.actorId || null,
        actorName: notificationData.actorName || null,
        actorPicture: notificationData.actorPicture || null,
        title: notificationData.title || '',
        message: notificationData.message,
        relatedPostId: notificationData.relatedPostId || null,
        relatedCommentId: notificationData.relatedCommentId || null,
        relatedQuizId: notificationData.relatedQuizId || null,
        actionUrl: notificationData.actionUrl || null,
        isRead: false,
        priority: notificationData.priority || 'normal',
        createdAt: new Date().toISOString(),
      };

      // Store in Redis list (most recent first)
      const listKey = this.getNotificationListKey(notification.userId);
      await this.redis.lpush(listKey, JSON.stringify(notification));
      
      // Keep only last 100 notifications in Redis
      await this.redis.ltrim(listKey, 0, 99);
      
      // Set TTL
      await this.redis.expire(listKey, this.notificationCacheTTL);
      
      // Cache individual notification
      const notificationKey = this.getNotificationKey(notificationId);
      await this.redis.setex(notificationKey, this.notificationCacheTTL, JSON.stringify(notification));
      
      // Increment unread count
      await this.incrementUnreadCount(notification.userId);
      
      logger.debug(`Created notification ${notificationId} for user ${notification.userId}`);
      
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications (paginated)
   */
  async getNotifications(userId, page = 1, limit = 50) {
    try {
      const key = this.getNotificationListKey(userId);
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      const items = await this.redis.lrange(key, start, end);
      
      const notifications = items.map(item => JSON.parse(item));
      
      return notifications;
    } catch (error) {
      logger.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    try {
      const key = this.getUnreadCountKey(userId);
      const count = await this.redis.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Increment unread count
   */
  async incrementUnreadCount(userId) {
    try {
      const key = this.getUnreadCountKey(userId);
      await this.redis.incr(key);
      await this.redis.expire(key, this.notificationCacheTTL);
      return true;
    } catch (error) {
      logger.error('Error incrementing unread count:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const key = this.getNotificationKey(notificationId);
      const data = await this.redis.get(key);
      
      if (!data) return false;
      
      const notification = JSON.parse(data);
      
      if (!notification.isRead) {
        notification.isRead = true;
        await this.redis.setex(key, this.notificationCacheTTL, JSON.stringify(notification));
        
        // Decrement unread count
        const countKey = this.getUnreadCountKey(notification.userId);
        await this.redis.decr(countKey);
      }
      
      return true;
    } catch (error) {
      logger.error('Error marking as read:', error);
      return false;
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    try {
      const key = this.getUnreadCountKey(userId);
      await this.redis.set(key, 0);
      await this.redis.expire(key, this.notificationCacheTTL);
      return true;
    } catch (error) {
      logger.error('Error marking all as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const key = this.getNotificationKey(notificationId);
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return false;
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Batch create notifications (for multiple users)
   * Optimized for fanout scenarios (e.g., someone with many followers posts)
   */
  async batchCreateNotifications(notifications) {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const notificationData of notifications) {
        const notificationId = nanoid(12);
        
        const notification = {
          notificationId,
          ...notificationData,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        const listKey = this.getNotificationListKey(notification.userId);
        pipeline.lpush(listKey, JSON.stringify(notification));
        pipeline.ltrim(listKey, 0, 99);
        pipeline.expire(listKey, this.notificationCacheTTL);
        
        const notificationKey = this.getNotificationKey(notificationId);
        pipeline.setex(notificationKey, this.notificationCacheTTL, JSON.stringify(notification));
        
        const countKey = this.getUnreadCountKey(notification.userId);
        pipeline.incr(countKey);
        pipeline.expire(countKey, this.notificationCacheTTL);
      }
      
      await pipeline.exec();
      
      logger.info(`Batch created ${notifications.length} notifications`);
      return true;
    } catch (error) {
      logger.error('Error batch creating notifications:', error);
      return false;
    }
  }

  // ============================================
  // NOTIFICATION TEMPLATES
  // ============================================

  /**
   * Create like notification
   */
  async notifyLike(userId, actorId, actorName, actorPicture, postId) {
    return this.createNotification({
      userId,
      type: 'like',
      actorId,
      actorName,
      actorPicture,
      message: `${actorName} liked your post`,
      relatedPostId: postId,
      actionUrl: `/posts/${postId}`,
      priority: 'normal',
    });
  }

  /**
   * Create comment notification
   */
  async notifyComment(userId, actorId, actorName, actorPicture, postId, commentId) {
    return this.createNotification({
      userId,
      type: 'comment',
      actorId,
      actorName,
      actorPicture,
      message: `${actorName} commented on your post`,
      relatedPostId: postId,
      relatedCommentId: commentId,
      actionUrl: `/posts/${postId}#comment-${commentId}`,
      priority: 'high',
    });
  }

  /**
   * Create follow notification
   */
  async notifyFollow(userId, actorId, actorName, actorPicture) {
    return this.createNotification({
      userId,
      type: 'follow',
      actorId,
      actorName,
      actorPicture,
      message: `${actorName} started following you`,
      actionUrl: `/profile/${actorId}`,
      priority: 'high',
    });
  }

  /**
   * Create mention notification
   */
  async notifyMention(userId, actorId, actorName, actorPicture, postId) {
    return this.createNotification({
      userId,
      type: 'mention',
      actorId,
      actorName,
      actorPicture,
      message: `${actorName} mentioned you in a post`,
      relatedPostId: postId,
      actionUrl: `/posts/${postId}`,
      priority: 'high',
    });
  }

  /**
   * Create achievement notification
   */
  async notifyAchievement(userId, title, message, achievementId) {
    return this.createNotification({
      userId,
      type: 'achievement',
      title,
      message,
      actionUrl: `/achievements/${achievementId}`,
      priority: 'high',
    });
  }
}

module.exports = new NotificationManager();
