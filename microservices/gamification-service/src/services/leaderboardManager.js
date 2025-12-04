const { UserStats } = require('../models/Achievement');
const {
  getLeaderboard,
  getUserRank,
  updateLeaderboard,
  REDIS_KEYS,
  getRedisClient,
} = require('../config/redis');

/**
 * Leaderboard Manager - Manages global and category leaderboards using Redis Sorted Sets
 */
class LeaderboardManager {
  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(start = 0, limit = 100) {
    try {
      // Try Redis first
      const leaderboard = await getLeaderboard(
        REDIS_KEYS.LEADERBOARD_GLOBAL,
        start,
        start + limit - 1
      );

      if (leaderboard.length === 0) {
        // Fallback to database and rebuild cache
        return await this.rebuildGlobalLeaderboard(start, limit);
      }

      // Populate user details
      const userIds = leaderboard.map(entry => entry.userId);
      const users = await this.getUserDetailsBatch(userIds);

      return leaderboard.map(entry => ({
        ...entry,
        user: users.get(entry.userId) || { name: 'Unknown User' },
      }));
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get category-specific leaderboard
   */
  async getCategoryLeaderboard(category, start = 0, limit = 100) {
    try {
      const key = REDIS_KEYS.LEADERBOARD_CATEGORY(category);
      const leaderboard = await getLeaderboard(key, start, start + limit - 1);

      if (leaderboard.length === 0) {
        return await this.rebuildCategoryLeaderboard(category, start, limit);
      }

      const userIds = leaderboard.map(entry => entry.userId);
      const users = await this.getUserDetailsBatch(userIds);

      return leaderboard.map(entry => ({
        ...entry,
        user: users.get(entry.userId),
      }));
    } catch (error) {
      console.error('Error getting category leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get weekly leaderboard
   */
  async getWeeklyLeaderboard(start = 0, limit = 100) {
    try {
      const leaderboard = await getLeaderboard(
        REDIS_KEYS.LEADERBOARD_WEEKLY,
        start,
        start + limit - 1
      );

      const userIds = leaderboard.map(entry => entry.userId);
      const users = await this.getUserDetailsBatch(userIds);

      return leaderboard.map(entry => ({
        ...entry,
        user: users.get(entry.userId),
      }));
    } catch (error) {
      console.error('Error getting weekly leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get monthly leaderboard
   */
  async getMonthlyLeaderboard(start = 0, limit = 100) {
    try {
      const leaderboard = await getLeaderboard(
        REDIS_KEYS.LEADERBOARD_MONTHLY,
        start,
        start + limit - 1
      );

      const userIds = leaderboard.map(entry => entry.userId);
      const users = await this.getUserDetailsBatch(userIds);

      return leaderboard.map(entry => ({
        ...entry,
        user: users.get(entry.userId),
      }));
    } catch (error) {
      console.error('Error getting monthly leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user's rank in global leaderboard
   */
  async getUserGlobalRank(userId) {
    try {
      const rankData = await getUserRank(REDIS_KEYS.LEADERBOARD_GLOBAL, userId);
      
      if (rankData.rank === null) {
        // User not in cache, check database
        const stats = await UserStats.findOne({ user: userId }).lean();
        if (stats && stats.totalPoints > 0) {
          await updateLeaderboard(REDIS_KEYS.LEADERBOARD_GLOBAL, userId, stats.totalPoints);
          return await getUserRank(REDIS_KEYS.LEADERBOARD_GLOBAL, userId);
        }
        return { rank: null, score: 0 };
      }

      return rankData;
    } catch (error) {
      console.error('Error getting user global rank:', error);
      throw error;
    }
  }

  /**
   * Get user's rank in category leaderboard
   */
  async getUserCategoryRank(userId, category) {
    try {
      const key = REDIS_KEYS.LEADERBOARD_CATEGORY(category);
      return await getUserRank(key, userId);
    } catch (error) {
      console.error('Error getting user category rank:', error);
      throw error;
    }
  }

  /**
   * Update user score in leaderboards
   */
  async updateUserScore(userId, points, category = null) {
    try {
      // Update global leaderboard
      await updateLeaderboard(REDIS_KEYS.LEADERBOARD_GLOBAL, userId, points);

      // Update weekly leaderboard
      await updateLeaderboard(REDIS_KEYS.LEADERBOARD_WEEKLY, userId, points);

      // Update monthly leaderboard
      await updateLeaderboard(REDIS_KEYS.LEADERBOARD_MONTHLY, userId, points);

      // Update category leaderboard if provided
      if (category) {
        const key = REDIS_KEYS.LEADERBOARD_CATEGORY(category);
        await updateLeaderboard(key, userId, points);
      }

      console.log(`Updated leaderboard scores for user ${userId}`);
    } catch (error) {
      console.error('Error updating user score:', error);
      throw error;
    }
  }

  /**
   * Rebuild global leaderboard from database
   */
  async rebuildGlobalLeaderboard(start = 0, limit = 100) {
    try {
      console.log('Rebuilding global leaderboard from database...');
      
      const users = await UserStats.find()
        .sort({ totalPoints: -1 })
        .skip(start)
        .limit(limit)
        .populate('user', 'name email')
        .lean();

      const redis = getRedisClient();
      const pipeline = redis.pipeline();

      // Rebuild Redis Sorted Set
      for (const userStat of users) {
        pipeline.zadd(
          REDIS_KEYS.LEADERBOARD_GLOBAL,
          userStat.totalPoints,
          userStat.user._id.toString()
        );
      }

      await pipeline.exec();

      return users.map((userStat, index) => ({
        rank: start + index + 1,
        userId: userStat.user._id.toString(),
        score: userStat.totalPoints,
        user: {
          name: userStat.user.name,
          email: userStat.user.email,
        },
      }));
    } catch (error) {
      console.error('Error rebuilding global leaderboard:', error);
      throw error;
    }
  }

  /**
   * Rebuild category leaderboard from database
   */
  async rebuildCategoryLeaderboard(category, start = 0, limit = 100) {
    try {
      console.log(`Rebuilding ${category} leaderboard from database...`);
      
      const users = await UserStats.find({ favoriteCategories: category })
        .sort({ totalPoints: -1 })
        .skip(start)
        .limit(limit)
        .populate('user', 'name email')
        .lean();

      const redis = getRedisClient();
      const key = REDIS_KEYS.LEADERBOARD_CATEGORY(category);
      const pipeline = redis.pipeline();

      for (const userStat of users) {
        pipeline.zadd(key, userStat.totalPoints, userStat.user._id.toString());
      }

      await pipeline.exec();

      return users.map((userStat, index) => ({
        rank: start + index + 1,
        userId: userStat.user._id.toString(),
        score: userStat.totalPoints,
        user: {
          name: userStat.user.name,
          email: userStat.user.email,
        },
      }));
    } catch (error) {
      console.error('Error rebuilding category leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user details in batch (optimization)
   */
  async getUserDetailsBatch(userIds) {
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      
      const users = await User.find({ _id: { $in: userIds } })
        .select('name email')
        .lean();

      const userMap = new Map();
      users.forEach(user => {
        userMap.set(user._id.toString(), user);
      });

      return userMap;
    } catch (error) {
      console.error('Error getting user details batch:', error);
      return new Map();
    }
  }

  /**
   * Reset weekly leaderboard (called by cron)
   */
  async resetWeeklyLeaderboard() {
    try {
      const redis = getRedisClient();
      await redis.del(REDIS_KEYS.LEADERBOARD_WEEKLY);
      console.log('✅ Weekly leaderboard reset');
    } catch (error) {
      console.error('Error resetting weekly leaderboard:', error);
    }
  }

  /**
   * Reset monthly leaderboard (called by cron)
   */
  async resetMonthlyLeaderboard() {
    try {
      const redis = getRedisClient();
      await redis.del(REDIS_KEYS.LEADERBOARD_MONTHLY);
      console.log('✅ Monthly leaderboard reset');
    } catch (error) {
      console.error('Error resetting monthly leaderboard:', error);
    }
  }

  /**
   * Get surrounding users in leaderboard (e.g., +5 and -5 from user's rank)
   */
  async getSurroundingUsers(userId, range = 5) {
    try {
      const rankData = await this.getUserGlobalRank(userId);
      
      if (rankData.rank === null) {
        return [];
      }

      const start = Math.max(0, rankData.rank - range - 1);
      const end = rankData.rank + range - 1;

      return await this.getGlobalLeaderboard(start, range * 2 + 1);
    } catch (error) {
      console.error('Error getting surrounding users:', error);
      throw error;
    }
  }
}

module.exports = new LeaderboardManager();
