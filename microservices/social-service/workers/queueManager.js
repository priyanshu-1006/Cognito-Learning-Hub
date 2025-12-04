/**
 * Bull Queue Manager
 * Handles async processing for feed fanout and notifications
 */

const Queue = require("bull");
const createLogger = require("../../shared/utils/logger");

const logger = createLogger("queue-manager");

class QueueManager {
  constructor() {
    this.feedQueue = null;
    this.notificationQueue = null;
  }

  /**
   * Initialize queues
   */
  init() {
    const redisUrl =
      process.env.QUEUE_REDIS_URL ||
      process.env.REDIS_URL ||
      "redis://localhost:6379";

    // Feed fanout queue
    this.feedQueue = new Queue("feed-fanout", redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    // Notification queue
    this.notificationQueue = new Queue("notifications", redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    logger.info("Bull queues initialized");
  }

  /**
   * Add feed fanout job
   */
  async addFeedFanout(postData, followerIds) {
    try {
      await this.feedQueue.add(
        "fanout",
        {
          postData,
          followerIds,
        },
        {
          priority: 1,
        }
      );

      logger.debug(`Added feed fanout job for post ${postData.postId}`);
      return true;
    } catch (error) {
      logger.error("Error adding feed fanout job:", error);
      return false;
    }
  }

  /**
   * Add single notification job
   */
  async addNotification(notificationData) {
    try {
      await this.notificationQueue.add("single", notificationData, {
        priority: notificationData.priority === "high" ? 1 : 2,
      });

      return true;
    } catch (error) {
      logger.error("Error adding notification job:", error);
      return false;
    }
  }

  /**
   * Add batch notification job
   */
  async addBatchNotifications(notifications) {
    try {
      await this.notificationQueue.add(
        "batch",
        {
          notifications,
        },
        {
          priority: 2,
        }
      );

      logger.debug(
        `Added batch notification job for ${notifications.length} notifications`
      );
      return true;
    } catch (error) {
      logger.error("Error adding batch notification job:", error);
      return false;
    }
  }

  /**
   * Add post to database job (async persistence)
   */
  async addPostPersistence(postData) {
    try {
      await this.feedQueue.add("persist-post", postData, {
        priority: 3,
      });

      return true;
    } catch (error) {
      logger.error("Error adding post persistence job:", error);
      return false;
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    try {
      if (!this.feedQueue || !this.notificationQueue) {
        return { status: "not initialized" };
      }

      const feedStats = await this.feedQueue.getJobCounts();
      const notificationStats = await this.notificationQueue.getJobCounts();

      return {
        feed: feedStats,
        notifications: notificationStats,
      };
    } catch (error) {
      logger.error("Error getting queue stats:", error.message);
      // Return safe error object without circular references
      return {
        status: "error",
        message: error.message || "Failed to get queue stats",
      };
    }
  }

  /**
   * Close queues
   */
  async close() {
    if (this.feedQueue) await this.feedQueue.close();
    if (this.notificationQueue) await this.notificationQueue.close();
    logger.info("Bull queues closed");
  }
}

module.exports = new QueueManager();
