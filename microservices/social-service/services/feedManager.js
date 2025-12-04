/**
 * Redis Feed Manager
 * Optimized feed generation with Redis caching and pub/sub
 */

const Redis = require("ioredis");
const createLogger = require("../../shared/utils/logger");

const logger = createLogger("feed-manager");

class FeedManager {
  constructor() {
    this.redis = null;
    this.subscriber = null;
    this.connected = false;

    this.keyPrefix = process.env.REDIS_KEY_PREFIX || "social:";
    this.feedCacheTTL = parseInt(process.env.FEED_CACHE_TTL) || 300; // 5 minutes
    this.maxFeedItems = parseInt(process.env.MAX_FEED_ITEMS) || 1000;
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      let redisConfig;

      // Check if Upstash Redis is configured
      if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
        logger.info("Connecting to Upstash Redis (cloud)...");

        const url = new URL(process.env.UPSTASH_REDIS_URL);

        redisConfig = {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: process.env.UPSTASH_REDIS_TOKEN,
          tls: {
            rejectUnauthorized: false,
          },
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        };

        this.redis = new Redis(redisConfig);
        this.subscriber = new Redis(redisConfig);
      } else {
        // Fallback to local Redis
        logger.info("Connecting to local Redis...");

        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.subscriber = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      }

      this.redis.on("connect", () => {
        this.connected = true;
        logger.info("Redis connected");
      });

      this.redis.on("error", (err) => {
        logger.error("Redis error:", err);
        this.connected = false;
      });

      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.redis) await this.redis.quit();
    if (this.subscriber) await this.subscriber.quit();
    this.connected = false;
    logger.info("Redis disconnected");
  }

  isConnected() {
    return this.connected;
  }

  /**
   * Check if Redis is healthy (connected and ready)
   */
  isHealthy() {
    return this.connected && this.redis && this.redis.status === "ready";
  }

  // ============================================
  // KEY GENERATORS
  // ============================================

  getUserFeedKey(userId) {
    return `${this.keyPrefix}feed:${userId}`;
  }

  getFollowersKey(userId) {
    return `${this.keyPrefix}followers:${userId}`;
  }

  getFollowingKey(userId) {
    return `${this.keyPrefix}following:${userId}`;
  }

  getTrendingKey() {
    return `${this.keyPrefix}trending`;
  }

  getPostCacheKey(postId) {
    return `${this.keyPrefix}post:${postId}`;
  }

  getFeedChannelKey(userId) {
    return `${this.keyPrefix}feed-updates:${userId}`;
  }

  // ============================================
  // FEED OPERATIONS (Redis Sorted Set)
  // ============================================

  /**
   * Add post to user's feed
   * Uses Redis Sorted Set with timestamp as score
   */
  async addToFeed(userId, postData) {
    try {
      const key = this.getUserFeedKey(userId);
      const score = Date.now(); // Timestamp as score for chronological ordering

      // Store post ID with metadata
      const feedItem = JSON.stringify({
        postId: postData.postId,
        authorId: postData.authorId,
        authorName: postData.authorName,
        type: postData.type,
        timestamp: score,
      });

      // Add to sorted set
      await this.redis.zadd(key, score, feedItem);

      // Trim to max items (keep most recent)
      await this.redis.zremrangebyrank(key, 0, -(this.maxFeedItems + 1));

      // Set TTL
      await this.redis.expire(key, this.feedCacheTTL);

      return true;
    } catch (error) {
      logger.error("Error adding to feed:", error);
      return false;
    }
  }

  /**
   * Get user's feed (paginated)
   * Returns feed items in reverse chronological order
   */
  async getFeed(userId, page = 1, limit = 20) {
    try {
      const key = this.getUserFeedKey(userId);
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      // Get items in reverse order (most recent first)
      const items = await this.redis.zrevrange(key, start, end);

      const feedItems = items.map((item) => JSON.parse(item));

      logger.debug(
        `Retrieved ${feedItems.length} feed items for user ${userId}`
      );
      return feedItems;
    } catch (error) {
      logger.error("Error getting feed:", error);
      return [];
    }
  }

  /**
   * Remove post from user's feed
   */
  async removeFromFeed(userId, postId) {
    try {
      const key = this.getUserFeedKey(userId);

      // Get all items
      const items = await this.redis.zrange(key, 0, -1);

      // Find and remove the post
      for (const item of items) {
        const feedItem = JSON.parse(item);
        if (feedItem.postId === postId) {
          await this.redis.zrem(key, item);
          break;
        }
      }

      return true;
    } catch (error) {
      logger.error("Error removing from feed:", error);
      return false;
    }
  }

  /**
   * Fanout post to all followers' feeds
   * Called when a user creates a post
   */
  async fanoutToFollowers(authorId, postData, followerIds) {
    try {
      const pipeline = this.redis.pipeline();

      // Add to each follower's feed
      for (const followerId of followerIds) {
        const key = this.getUserFeedKey(followerId);
        const score = Date.now();

        const feedItem = JSON.stringify({
          postId: postData.postId,
          authorId: postData.authorId,
          authorName: postData.authorName,
          type: postData.type,
          timestamp: score,
        });

        pipeline.zadd(key, score, feedItem);
        pipeline.zremrangebyrank(key, 0, -(this.maxFeedItems + 1));
        pipeline.expire(key, this.feedCacheTTL);
      }

      await pipeline.exec();

      logger.info(
        `Fanned out post ${postData.postId} to ${followerIds.length} followers`
      );
      return true;
    } catch (error) {
      logger.error("Error in fanout:", error);
      return false;
    }
  }

  // ============================================
  // FOLLOWER/FOLLOWING TRACKING (Redis Sets)
  // ============================================

  /**
   * Add follower relationship
   */
  async addFollower(userId, followerId) {
    try {
      const followersKey = this.getFollowersKey(userId);
      const followingKey = this.getFollowingKey(followerId);

      const pipeline = this.redis.pipeline();
      pipeline.sadd(followersKey, followerId);
      pipeline.sadd(followingKey, userId);
      await pipeline.exec();

      return true;
    } catch (error) {
      logger.error("Error adding follower:", error);
      return false;
    }
  }

  /**
   * Remove follower relationship
   */
  async removeFollower(userId, followerId) {
    try {
      const followersKey = this.getFollowersKey(userId);
      const followingKey = this.getFollowingKey(followerId);

      const pipeline = this.redis.pipeline();
      pipeline.srem(followersKey, followerId);
      pipeline.srem(followingKey, userId);
      await pipeline.exec();

      return true;
    } catch (error) {
      logger.error("Error removing follower:", error);
      return false;
    }
  }

  /**
   * Get all followers
   */
  async getFollowers(userId) {
    try {
      const key = this.getFollowersKey(userId);
      return await this.redis.smembers(key);
    } catch (error) {
      logger.error("Error getting followers:", error);
      return [];
    }
  }

  /**
   * Get follower count (fast O(1) operation)
   */
  async getFollowerCount(userId) {
    try {
      const key = this.getFollowersKey(userId);
      return await this.redis.scard(key);
    } catch (error) {
      logger.error("Error getting follower count:", error);
      return 0;
    }
  }

  /**
   * Get following count
   */
  async getFollowingCount(userId) {
    try {
      const key = this.getFollowingKey(userId);
      return await this.redis.scard(key);
    } catch (error) {
      logger.error("Error getting following count:", error);
      return 0;
    }
  }

  /**
   * Check if user is following another
   */
  async isFollowing(userId, targetUserId) {
    try {
      const key = this.getFollowingKey(userId);
      const result = await this.redis.sismember(key, targetUserId);
      return result === 1;
    } catch (error) {
      logger.error("Error checking follow status:", error);
      return false;
    }
  }

  // ============================================
  // TRENDING POSTS (Redis Sorted Set by Score)
  // ============================================

  /**
   * Add post to trending
   * Score = likes + (comments * 2) + (shares * 3)
   */
  async addToTrending(postData) {
    try {
      const key = this.getTrendingKey();
      const score =
        postData.likes + postData.comments * 2 + postData.shares * 3;

      await this.redis.zadd(key, score, postData.postId);

      // Keep only top 100 trending posts
      await this.redis.zremrangebyrank(key, 0, -101);

      // Expire after 24 hours
      await this.redis.expire(key, 86400);

      return true;
    } catch (error) {
      logger.error("Error adding to trending:", error);
      return false;
    }
  }

  /**
   * Get trending posts
   */
  async getTrending(limit = 50) {
    try {
      const key = this.getTrendingKey();

      // Get top posts by score
      const postIds = await this.redis.zrevrange(key, 0, limit - 1);

      return postIds;
    } catch (error) {
      logger.error("Error getting trending:", error);
      return [];
    }
  }

  /**
   * Update trending score (on like/comment/share)
   */
  async updateTrendingScore(postId, increment) {
    try {
      const key = this.getTrendingKey();
      await this.redis.zincrby(key, increment, postId);
      return true;
    } catch (error) {
      logger.error("Error updating trending score:", error);
      return false;
    }
  }

  // ============================================
  // POST CACHING
  // ============================================

  /**
   * Cache post data
   */
  async cachePost(postId, postData) {
    try {
      const key = this.getPostCacheKey(postId);
      await this.redis.setex(key, this.feedCacheTTL, JSON.stringify(postData));
      return true;
    } catch (error) {
      logger.error("Error caching post:", error);
      return false;
    }
  }

  /**
   * Get cached post
   */
  async getCachedPost(postId) {
    try {
      const key = this.getPostCacheKey(postId);
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Error getting cached post:", error);
      return null;
    }
  }

  /**
   * Invalidate post cache
   */
  async invalidatePostCache(postId) {
    try {
      const key = this.getPostCacheKey(postId);
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error("Error invalidating post cache:", error);
      return false;
    }
  }

  // ============================================
  // PUB/SUB FOR REAL-TIME UPDATES
  // ============================================

  /**
   * Publish feed update to user
   */
  async publishFeedUpdate(userId, event, data) {
    try {
      const channel = this.getFeedChannelKey(userId);
      const message = JSON.stringify({ event, data, timestamp: Date.now() });

      await this.redis.publish(channel, message);
      return true;
    } catch (error) {
      logger.error("Error publishing feed update:", error);
      return false;
    }
  }

  /**
   * Subscribe to user's feed updates
   */
  subscribeToFeed(userId, callback) {
    try {
      const channel = this.getFeedChannelKey(userId);

      this.subscriber.subscribe(channel, (err) => {
        if (err) {
          logger.error("Error subscribing to feed:", err);
        } else {
          logger.debug(`Subscribed to feed updates for user ${userId}`);
        }
      });

      this.subscriber.on("message", (ch, message) => {
        if (ch === channel) {
          const data = JSON.parse(message);
          callback(data);
        }
      });

      return true;
    } catch (error) {
      logger.error("Error subscribing to feed:", error);
      return false;
    }
  }

  /**
   * Unsubscribe from feed
   */
  unsubscribeFromFeed(userId) {
    try {
      const channel = this.getFeedChannelKey(userId);
      this.subscriber.unsubscribe(channel);
      return true;
    } catch (error) {
      logger.error("Error unsubscribing from feed:", error);
      return false;
    }
  }
}

module.exports = new FeedManager();
