/**
 * Redis Cache Manager for Quiz Service
 * Addresses: AI caching optimization (80% cost reduction)
 */

const RedisClient = require('../../shared/utils/redis');
const createLogger = require('../../shared/utils/logger');

const logger = createLogger('quiz-cache');

class QuizCacheManager extends RedisClient {
  constructor() {
    super('quiz-cache');

    // Cache TTLs from environment
    this.QUIZ_CACHE_TTL = parseInt(process.env.QUIZ_CACHE_TTL) || 86400; // 24 hours
    this.FILE_QUIZ_CACHE_TTL = parseInt(process.env.FILE_QUIZ_CACHE_TTL) || 604800; // 7 days
    this.ADAPTIVE_CACHE_TTL = parseInt(process.env.ADAPTIVE_CACHE_TTL) || 300; // 5 minutes
    this.GENERATION_LIMIT_TTL = 86400; // 24 hours for rate limiting
    
    // Connect to Redis using Upstash or local based on environment
    this.connect();
  }

  /**
   * Generate cache key for topic-based quiz
   */
  getTopicQuizKey(topic, numQuestions, difficulty, useAdaptive = false) {
    const normalized = topic.toLowerCase().trim().replace(/\s+/g, '-');
    return `quiz:topic:${normalized}:${numQuestions}:${difficulty}:${useAdaptive ? 'adaptive' : 'normal'}`;
  }

  /**
   * Generate cache key for file-based quiz
   */
  getFileQuizKey(fileHash, numQuestions, difficulty) {
    return `quiz:file:${fileHash}:${numQuestions}:${difficulty}`;
  }

  /**
   * Generate cache key for adaptive difficulty
   */
  getAdaptiveKey(userId) {
    return `adaptive:${userId}`;
  }

  /**
   * Generate key for user's daily generation count
   */
  getUserLimitKey(userId) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `limit:${userId}:${date}`;
  }

  /**
   * Cache generated quiz
   */
  async cacheQuiz(key, quizData, ttl = this.QUIZ_CACHE_TTL) {
    try {
      await this.set(key, JSON.stringify(quizData), ttl);
      logger.info(`Quiz cached: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Failed to cache quiz: ${key}`, error);
      return false;
    }
  }

  /**
   * Get cached quiz
   */
  async getCachedQuiz(key) {
    try {
      const cached = await this.get(key);
      if (cached) {
        logger.info(`Quiz cache HIT: ${key}`);
        return JSON.parse(cached);
      }
      logger.info(`Quiz cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Failed to get cached quiz: ${key}`, error);
      return null;
    }
  }

  /**
   * Cache adaptive difficulty data
   */
  async cacheAdaptiveData(userId, adaptiveData) {
    try {
      const key = this.getAdaptiveKey(userId);
      await this.set(key, JSON.stringify(adaptiveData), this.ADAPTIVE_CACHE_TTL);
      logger.info(`Adaptive data cached for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to cache adaptive data for user: ${userId}`, error);
      return false;
    }
  }

  /**
   * Get cached adaptive difficulty data
   */
  async getCachedAdaptiveData(userId) {
    try {
      const key = this.getAdaptiveKey(userId);
      const cached = await this.get(key);
      if (cached) {
        logger.info(`Adaptive data cache HIT: ${userId}`);
        return JSON.parse(cached);
      }
      logger.info(`Adaptive data cache MISS: ${userId}`);
      return null;
    } catch (error) {
      logger.error(`Failed to get cached adaptive data: ${userId}`, error);
      return null;
    }
  }

  /**
   * Track user's daily generation count (rate limiting)
   */
  async incrementUserGenerationCount(userId) {
    try {
      const key = this.getUserLimitKey(userId);
      const count = await this.increment(key);
      
      // Set TTL on first increment of the day
      if (count === 1) {
        await this.expire(key, this.GENERATION_LIMIT_TTL);
      }
      
      logger.info(`User ${userId} generation count: ${count}`);
      return count;
    } catch (error) {
      logger.error(`Failed to increment generation count for user: ${userId}`, error);
      return 0;
    }
  }

  /**
   * Get user's daily generation count
   */
  async getUserGenerationCount(userId) {
    try {
      const key = this.getUserLimitKey(userId);
      const count = await this.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      logger.error(`Failed to get generation count for user: ${userId}`, error);
      return 0;
    }
  }

  /**
   * Check if user has exceeded daily limit
   */
  async checkUserLimit(userId, userRole = 'Student') {
    try {
      const count = await this.getUserGenerationCount(userId);
      
      // Role-based limits
      const limits = {
        Student: parseInt(process.env.FREE_USER_DAILY_LIMIT) || 5,
        Teacher: parseInt(process.env.TEACHER_DAILY_LIMIT) || 20,
        Admin: parseInt(process.env.PREMIUM_DAILY_LIMIT) || 100,
        Moderator: parseInt(process.env.PREMIUM_DAILY_LIMIT) || 100,
      };
      
      const limit = limits[userRole] || limits.Student;
      const hasExceeded = count >= limit;
      
      if (hasExceeded) {
        logger.warn(`User ${userId} (${userRole}) exceeded daily limit: ${count}/${limit}`);
      }
      
      return {
        count,
        limit,
        remaining: Math.max(0, limit - count),
        hasExceeded,
      };
    } catch (error) {
      logger.error(`Failed to check user limit: ${userId}`, error);
      return { count: 0, limit: 0, remaining: 0, hasExceeded: false };
    }
  }

  /**
   * Invalidate quiz cache by pattern
   */
  async invalidateQuizCache(pattern = 'quiz:*') {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info(`Invalidated ${keys.length} quiz cache entries`);
      }
      return keys.length;
    } catch (error) {
      logger.error(`Failed to invalidate quiz cache: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const info = await this.client.info('stats');
      const lines = info.split('\r\n');
      const stats = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });
      
      return {
        totalKeys: await this.client.dbsize(),
        hits: stats.keyspace_hits || 0,
        misses: stats.keyspace_misses || 0,
        hitRate: stats.keyspace_hits && stats.keyspace_misses
          ? ((stats.keyspace_hits / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) * 100).toFixed(2) + '%'
          : '0%',
      };
    } catch (error) {
      logger.error('Failed to get cache stats', error);
      return null;
    }
  }
}

module.exports = new QuizCacheManager();
