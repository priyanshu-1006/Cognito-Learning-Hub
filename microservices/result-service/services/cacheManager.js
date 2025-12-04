/**
 * Cache Manager for Result Service
 * Handles Redis caching for leaderboards, stats, and analytics
 */

const Redis = require("ioredis");
const createLogger = require("../../shared/utils/logger");

const logger = createLogger("cache-manager");

class CacheManager {
  constructor() {
    this.redis = null;
    this.connected = false;

    // TTL values from env (seconds)
    this.ttls = {
      leaderboard: parseInt(process.env.CACHE_TTL_LEADERBOARD) || 300, // 5 min
      userStats: parseInt(process.env.CACHE_TTL_USER_STATS) || 3600, // 1 hour
      quizAnalytics: parseInt(process.env.CACHE_TTL_QUIZ_ANALYTICS) || 1800, // 30 min
      globalStats: parseInt(process.env.CACHE_TTL_GLOBAL_STATS) || 600, // 10 min
    };
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
      } else {
        // Fallback to local Redis
        logger.info("Connecting to local Redis...");

        this.redis = new Redis(
          process.env.REDIS_URL || "redis://localhost:6379",
          {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
          }
        );
      }

      this.redis.on("connect", () => {
        this.connected = true;
        logger.info("Redis connected");
      });

      this.redis.on("error", (err) => {
        logger.error("Redis error:", err);
        this.connected = false;
      });

      this.redis.on("close", () => {
        this.connected = false;
        logger.warn("Redis connection closed");
      });

      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.connected = false;
      logger.info("Redis disconnected");
    }
  }

  /**
   * Check if Redis is connected
   */
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
  // CACHE KEY GENERATORS
  // ============================================

  getQuizLeaderboardKey(quizId, limit = 10) {
    return `leaderboard:quiz:${quizId}:top${limit}`;
  }

  getGlobalLeaderboardKey(limit = 100) {
    return `leaderboard:global:top${limit}`;
  }

  getUserStatsKey(userId) {
    return `stats:user:${userId}`;
  }

  getQuizAnalyticsKey(quizId) {
    return `analytics:quiz:${quizId}`;
  }

  getUserRankKey(userId, quizId) {
    return `rank:user:${userId}:quiz:${quizId}`;
  }

  // ============================================
  // LEADERBOARD CACHING (Most Critical)
  // ============================================

  /**
   * Cache quiz leaderboard
   * @param {String} quizId
   * @param {Array} leaderboard
   * @param {Number} limit
   */
  async cacheQuizLeaderboard(quizId, leaderboard, limit = 10) {
    try {
      const key = this.getQuizLeaderboardKey(quizId, limit);
      await this.redis.setex(
        key,
        this.ttls.leaderboard,
        JSON.stringify(leaderboard)
      );
      logger.debug(`Cached quiz leaderboard: ${key}`);
      return true;
    } catch (error) {
      logger.error("Error caching quiz leaderboard:", error);
      return false;
    }
  }

  /**
   * Get cached quiz leaderboard
   */
  async getCachedQuizLeaderboard(quizId, limit = 10) {
    try {
      const key = this.getQuizLeaderboardKey(quizId, limit);
      const cached = await this.redis.get(key);

      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error("Error getting cached quiz leaderboard:", error);
      return null;
    }
  }

  /**
   * Cache global leaderboard
   */
  async cacheGlobalLeaderboard(leaderboard, limit = 100) {
    try {
      const key = this.getGlobalLeaderboardKey(limit);
      await this.redis.setex(
        key,
        this.ttls.globalStats,
        JSON.stringify(leaderboard)
      );
      logger.debug(`Cached global leaderboard: ${key}`);
      return true;
    } catch (error) {
      logger.error("Error caching global leaderboard:", error);
      return false;
    }
  }

  /**
   * Get cached global leaderboard
   */
  async getCachedGlobalLeaderboard(limit = 100) {
    try {
      const key = this.getGlobalLeaderboardKey(limit);
      const cached = await this.redis.get(key);

      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error("Error getting cached global leaderboard:", error);
      return null;
    }
  }

  /**
   * Invalidate quiz leaderboard cache (when new result submitted)
   */
  async invalidateQuizLeaderboard(quizId) {
    try {
      const pattern = `leaderboard:quiz:${quizId}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(
          `Invalidated ${keys.length} leaderboard cache keys for quiz ${quizId}`
        );
      }

      return true;
    } catch (error) {
      logger.error("Error invalidating quiz leaderboard:", error);
      return false;
    }
  }

  /**
   * Invalidate global leaderboard cache
   */
  async invalidateGlobalLeaderboard() {
    try {
      const pattern = "leaderboard:global:*";
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(
          `Invalidated ${keys.length} global leaderboard cache keys`
        );
      }

      return true;
    } catch (error) {
      logger.error("Error invalidating global leaderboard:", error);
      return false;
    }
  }

  // ============================================
  // USER STATS CACHING
  // ============================================

  /**
   * Cache user statistics
   */
  async cacheUserStats(userId, stats) {
    try {
      const key = this.getUserStatsKey(userId);
      await this.redis.setex(key, this.ttls.userStats, JSON.stringify(stats));
      logger.debug(`Cached user stats: ${key}`);
      return true;
    } catch (error) {
      logger.error("Error caching user stats:", error);
      return false;
    }
  }

  /**
   * Get cached user statistics
   */
  async getCachedUserStats(userId) {
    try {
      const key = this.getUserStatsKey(userId);
      const cached = await this.redis.get(key);

      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error("Error getting cached user stats:", error);
      return null;
    }
  }

  /**
   * Invalidate user stats (when they complete a new quiz)
   */
  async invalidateUserStats(userId) {
    try {
      const key = this.getUserStatsKey(userId);
      await this.redis.del(key);
      logger.debug(`Invalidated user stats: ${key}`);
      return true;
    } catch (error) {
      logger.error("Error invalidating user stats:", error);
      return false;
    }
  }

  // ============================================
  // QUIZ ANALYTICS CACHING
  // ============================================

  /**
   * Cache quiz analytics (for quiz creators)
   */
  async cacheQuizAnalytics(quizId, analytics) {
    try {
      const key = this.getQuizAnalyticsKey(quizId);
      await this.redis.setex(
        key,
        this.ttls.quizAnalytics,
        JSON.stringify(analytics)
      );
      logger.debug(`Cached quiz analytics: ${key}`);
      return true;
    } catch (error) {
      logger.error("Error caching quiz analytics:", error);
      return false;
    }
  }

  /**
   * Get cached quiz analytics
   */
  async getCachedQuizAnalytics(quizId) {
    try {
      const key = this.getQuizAnalyticsKey(quizId);
      const cached = await this.redis.get(key);

      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error("Error getting cached quiz analytics:", error);
      return null;
    }
  }

  /**
   * Invalidate quiz analytics (when new attempt submitted)
   */
  async invalidateQuizAnalytics(quizId) {
    try {
      const key = this.getQuizAnalyticsKey(quizId);
      await this.redis.del(key);
      logger.debug(`Invalidated quiz analytics: ${key}`);
      return true;
    } catch (error) {
      logger.error("Error invalidating quiz analytics:", error);
      return false;
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Invalidate all related caches when a result is submitted
   */
  async invalidateResultCaches(userId, quizId) {
    try {
      await Promise.all([
        this.invalidateQuizLeaderboard(quizId),
        this.invalidateGlobalLeaderboard(),
        this.invalidateUserStats(userId),
        this.invalidateQuizAnalytics(quizId),
      ]);

      logger.info(`Invalidated all caches for user ${userId}, quiz ${quizId}`);
      return true;
    } catch (error) {
      logger.error("Error invalidating result caches:", error);
      return false;
    }
  }

  /**
   * Get cache statistics (for monitoring)
   */
  async getCacheStats() {
    try {
      const info = await this.redis.info("stats");
      const keyspaceInfo = await this.redis.info("keyspace");

      // Parse Redis INFO output
      const stats = {
        connected: this.connected,
        totalKeys: 0,
        hits: 0,
        misses: 0,
      };

      // Extract stats from INFO output
      const lines = info.split("\r\n");
      for (const line of lines) {
        if (line.startsWith("keyspace_hits:")) {
          stats.hits = parseInt(line.split(":")[1]);
        }
        if (line.startsWith("keyspace_misses:")) {
          stats.misses = parseInt(line.split(":")[1]);
        }
      }

      stats.hitRate =
        stats.hits + stats.misses > 0
          ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + "%"
          : "0%";

      return stats;
    } catch (error) {
      logger.error("Error getting cache stats:", error);
      return null;
    }
  }
}

module.exports = new CacheManager();
