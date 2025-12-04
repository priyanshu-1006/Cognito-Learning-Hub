const { UserStats } = require('../models/Achievement');
const { 
  incrementUserStats, 
  getUserStatsFromCache, 
  cacheUserStats,
  updateLeaderboard,
  REDIS_KEYS,
} = require('../config/redis');
const { queueStatsSync } = require('../config/queue');

/**
 * Stats Manager - Handles user stats with Redis caching and DB sync
 */
class StatsManager {
  /**
   * Update user stats after quiz completion
   * Uses Redis for atomic increments, queues DB sync
   */
  async updateStats(userId, resultData) {
    try {
      // Calculate updates
      const updates = {
        totalQuizzesTaken: 1,
        totalPoints: (resultData.pointsEarned || 0) + (resultData.bonusPoints || 0),
        totalTimeSpent: Math.round((resultData.totalTimeTaken || 0) / 60), // Convert to minutes
        experience: resultData.experienceGained || 0,
      };

      // Handle streak logic
      if (resultData.passed) {
        const currentStreak = await this.getCurrentStreak(userId);
        updates.currentStreak = currentStreak + 1;
        
        const longestStreak = await this.getLongestStreak(userId);
        if (updates.currentStreak > longestStreak) {
          updates.longestStreak = updates.currentStreak;
        }
      } else {
        updates.currentStreak = 0;
      }

      // Atomic increment in Redis
      await incrementUserStats(userId, updates);

      // Update leaderboards
      const cachedStats = await getUserStatsFromCache(userId);
      if (cachedStats) {
        await updateLeaderboard(REDIS_KEYS.LEADERBOARD_GLOBAL, userId, cachedStats.totalPoints);
        
        // Calculate and update level
        const level = Math.floor(cachedStats.experience / 100) + 1;
        if (level !== cachedStats.level) {
          await this.updateLevel(userId, level);
        }
      }

      // Queue stats sync to MongoDB (non-blocking)
      await queueStatsSync(userId);

      return cachedStats;
    } catch (error) {
      console.error('Error updating stats:', error);
      throw error;
    }
  }

  /**
   * Get user stats (Redis cache first, fallback to DB)
   */
  async getStats(userId) {
    try {
      // Try Redis first
      let stats = await getUserStatsFromCache(userId);
      
      if (!stats) {
        // Fallback to MongoDB
        const dbStats = await UserStats.findOne({ user: userId })
          .populate('achievements')
          .lean();
        
        if (dbStats) {
          // Cache to Redis
          await cacheUserStats(userId, dbStats);
          stats = dbStats;
        } else {
          // Create new stats document
          const newStats = new UserStats({ user: userId });
          await newStats.save();
          await cacheUserStats(userId, newStats.toObject());
          stats = newStats.toObject();
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Sync Redis stats to MongoDB
   */
  async syncToDatabase(userId) {
    try {
      const cachedStats = await getUserStatsFromCache(userId);
      if (!cachedStats) {
        return null;
      }

      let userStats = await UserStats.findOne({ user: userId });
      
      if (!userStats) {
        userStats = new UserStats({ user: userId });
      }

      // Update fields
      userStats.totalQuizzesTaken = cachedStats.totalQuizzesTaken;
      userStats.totalPoints = cachedStats.totalPoints;
      userStats.totalTimeSpent = cachedStats.totalTimeSpent;
      userStats.currentStreak = cachedStats.currentStreak;
      userStats.longestStreak = cachedStats.longestStreak;
      userStats.experience = cachedStats.experience;
      userStats.level = cachedStats.level;
      userStats.averageScore = cachedStats.averageScore;
      userStats.lastQuizDate = new Date();

      await userStats.save();
      console.log(`✅ Synced stats to DB for user ${userId}`);
      
      return userStats;
    } catch (error) {
      console.error('Error syncing stats to DB:', error);
      throw error;
    }
  }

  /**
   * Update average score
   */
  async updateAverageScore(userId, newScore) {
    try {
      const stats = await this.getStats(userId);
      const totalQuizzes = stats.totalQuizzesTaken || 1;
      const currentAvg = stats.averageScore || 0;
      
      const newAverage = Math.round(
        (currentAvg * (totalQuizzes - 1) + newScore) / totalQuizzes
      );

      const { getRedisClient, REDIS_KEYS } = require('../config/redis');
      const redis = getRedisClient();
      await redis.hset(REDIS_KEYS.USER_STATS(userId), 'averageScore', newAverage);
      
      return newAverage;
    } catch (error) {
      console.error('Error updating average score:', error);
      throw error;
    }
  }

  /**
   * Get current streak from Redis
   */
  async getCurrentStreak(userId) {
    const { getRedisClient, REDIS_KEYS } = require('../config/redis');
    const redis = getRedisClient();
    const streak = await redis.hget(REDIS_KEYS.USER_STATS(userId), 'currentStreak');
    return parseInt(streak) || 0;
  }

  /**
   * Get longest streak from Redis
   */
  async getLongestStreak(userId) {
    const { getRedisClient, REDIS_KEYS } = require('../config/redis');
    const redis = getRedisClient();
    const streak = await redis.hget(REDIS_KEYS.USER_STATS(userId), 'longestStreak');
    return parseInt(streak) || 0;
  }

  /**
   * Update user level
   */
  async updateLevel(userId, newLevel) {
    const { getRedisClient, REDIS_KEYS } = require('../config/redis');
    const redis = getRedisClient();
    await redis.hset(REDIS_KEYS.USER_STATS(userId), 'level', newLevel);
  }

  /**
   * Record last activity timestamp
   */
  async recordActivity(userId) {
    const { getRedisClient, REDIS_KEYS } = require('../config/redis');
    const redis = getRedisClient();
    await redis.set(REDIS_KEYS.LAST_ACTIVITY(userId), Date.now(), 'EX', 86400 * 7); // 7 days TTL
  }

  /**
   * Check if user was active in last 24 hours
   */
  async wasActiveRecently(userId) {
    const { getRedisClient, REDIS_KEYS } = require('../config/redis');
    const redis = getRedisClient();
    const lastActivity = await redis.get(REDIS_KEYS.LAST_ACTIVITY(userId));
    
    if (!lastActivity) return false;
    
    const hoursSinceActivity = (Date.now() - parseInt(lastActivity)) / (1000 * 60 * 60);
    return hoursSinceActivity < 24;
  }

  /**
   * Reset streak if inactive for >24 hours
   */
  async checkAndResetStreak(userId) {
    const wasActive = await this.wasActiveRecently(userId);
    
    if (!wasActive) {
      const { getRedisClient, REDIS_KEYS } = require('../config/redis');
      const redis = getRedisClient();
      await redis.hset(REDIS_KEYS.USER_STATS(userId), 'currentStreak', 0);
      console.log(`Reset streak for user ${userId} due to inactivity`);
      return true;
    }
    
    return false;
  }

  /**
   * Get top users by stat
   */
  async getTopUsers(statField = 'totalPoints', limit = 10) {
    try {
      const users = await UserStats.find()
        .sort({ [statField]: -1 })
        .limit(limit)
        .populate('user', 'name email')
        .lean();
      
      return users.map((user, index) => ({
        rank: index + 1,
        ...user,
      }));
    } catch (error) {
      console.error('Error getting top users:', error);
      throw error;
    }
  }

  /**
   * Bulk update stats for multiple users (for migrations)
   */
  async bulkUpdateStats(updates) {
    try {
      const operations = updates.map(({ userId, data }) => ({
        updateOne: {
          filter: { user: userId },
          update: { $inc: data },
          upsert: true,
        },
      }));

      const result = await UserStats.bulkWrite(operations);
      console.log(`Bulk updated ${result.modifiedCount} user stats`);
      return result;
    } catch (error) {
      console.error('Error bulk updating stats:', error);
      throw error;
    }
  }
}

module.exports = new StatsManager();
