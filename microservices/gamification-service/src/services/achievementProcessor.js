const { Achievement, UserAchievement, UserStats } = require('../models/Achievement');
const { getRedisClient, REDIS_KEYS } = require('../config/redis');

/**
 * Achievement Processor - Evaluates achievement criteria and unlocks achievements
 */
class AchievementProcessor {
  /**
   * Check and unlock achievements for a user based on event data
   */
  async checkAchievements(userId, eventData) {
    try {
      const unlockedAchievements = [];
      const userStats = await UserStats.findOne({ user: userId }).lean();

      if (!userStats) {
        console.log(`No stats found for user ${userId}`);
        return unlockedAchievements;
      }

      // Get all active achievements
      const achievements = await Achievement.find({ isActive: true }).lean();

      for (const achievement of achievements) {
        // Check if user already has this achievement
        const existingAchievement = await UserAchievement.findOne({
          user: userId,
          achievement: achievement._id,
          isCompleted: true,
        });

        if (existingAchievement) {
          continue; // Already unlocked
        }

        // Evaluate criteria
        const meetsRequirements = await this.evaluateCriteria(
          achievement,
          userStats,
          eventData
        );

        if (meetsRequirements) {
          // Unlock achievement
          const userAchievement = await this.unlockAchievement(userId, achievement);
          unlockedAchievements.push({
            achievement,
            userAchievement,
          });
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  /**
   * Evaluate if achievement criteria is met
   */
  async evaluateCriteria(achievement, userStats, eventData) {
    const { type, criteria } = achievement;

    switch (type) {
      case 'quiz_completion':
        return this.checkQuizCompletion(criteria, userStats);

      case 'score_achievement':
        return this.checkScoreAchievement(criteria, eventData);

      case 'streak':
        return this.checkStreak(criteria, userStats);

      case 'speed':
        return this.checkSpeed(criteria, eventData);

      case 'category_master':
        return this.checkCategoryMaster(criteria, userStats, eventData);

      case 'special':
        return this.checkSpecialAchievement(criteria, userStats);

      default:
        return false;
    }
  }

  /**
   * Check quiz completion achievements
   */
  checkQuizCompletion(criteria, userStats) {
    if (!criteria.target) return false;
    return userStats.totalQuizzesTaken >= criteria.target;
  }

  /**
   * Check score achievements
   */
  checkScoreAchievement(criteria, eventData) {
    if (!criteria.score || !eventData.percentage) return false;
    return eventData.percentage >= criteria.score;
  }

  /**
   * Check streak achievements
   */
  checkStreak(criteria, userStats) {
    if (!criteria.target) return false;
    return userStats.currentStreak >= criteria.target;
  }

  /**
   * Check speed achievements
   */
  checkSpeed(criteria, eventData) {
    if (!criteria.timeLimit || !eventData.totalTimeTaken) return false;
    return eventData.totalTimeTaken <= criteria.timeLimit;
  }

  /**
   * Check category mastery achievements
   */
  checkCategoryMaster(criteria, userStats, eventData) {
    if (!criteria.category || !criteria.target) return false;
    
    // Check if user has completed enough quizzes in this category
    const categoryCount = userStats.favoriteCategories?.filter(
      cat => cat === criteria.category
    ).length || 0;

    return categoryCount >= criteria.target && eventData.category === criteria.category;
  }

  /**
   * Check special achievements
   */
  checkSpecialAchievement(criteria, userStats) {
    if (criteria.target) {
      // Could be points, level, or other special metrics
      if (criteria.type === 'points') {
        return userStats.totalPoints >= criteria.target;
      } else if (criteria.type === 'level') {
        return userStats.level >= criteria.target;
      }
    }
    return false;
  }

  /**
   * Unlock achievement for user
   */
  async unlockAchievement(userId, achievement) {
    try {
      const userAchievement = new UserAchievement({
        user: userId,
        achievement: achievement._id,
        isCompleted: true,
        progress: 100,
        unlockedAt: new Date(),
      });

      await userAchievement.save();

      // Add to user's achievements array
      await UserStats.findOneAndUpdate(
        { user: userId },
        { $addToSet: { achievements: userAchievement._id } }
      );

      // Cache in Redis
      const redis = getRedisClient();
      await redis.sadd(REDIS_KEYS.USER_ACHIEVEMENTS(userId), achievement._id.toString());

      console.log(`🏆 Unlocked achievement "${achievement.name}" for user ${userId}`);
      
      return userAchievement;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  /**
   * Update achievement progress (for progressive achievements)
   */
  async updateProgress(userId, achievementId, progress) {
    try {
      const userAchievement = await UserAchievement.findOneAndUpdate(
        { user: userId, achievement: achievementId },
        { 
          $set: { 
            progress: Math.min(progress, 100),
            isCompleted: progress >= 100,
          }
        },
        { new: true, upsert: true }
      );

      // Update Redis cache
      const redis = getRedisClient();
      await redis.hset(
        REDIS_KEYS.ACHIEVEMENT_PROGRESS(userId, achievementId),
        'progress',
        progress
      );

      return userAchievement;
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      throw error;
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId, options = {}) {
    try {
      const query = { user: userId };
      
      if (options.completedOnly) {
        query.isCompleted = true;
      }

      const achievements = await UserAchievement.find(query)
        .populate('achievement')
        .sort({ unlockedAt: -1 })
        .lean();

      return achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  /**
   * Get achievement progress
   */
  async getAchievementProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOne({
        user: userId,
        achievement: achievementId,
      }).lean();

      return {
        progress: userAchievement?.progress || 0,
        isCompleted: userAchievement?.isCompleted || false,
        unlockedAt: userAchievement?.unlockedAt || null,
      };
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      throw error;
    }
  }

  /**
   * Create new achievement (admin)
   */
  async createAchievement(data) {
    try {
      const achievement = new Achievement(data);
      await achievement.save();
      console.log(`Created new achievement: ${achievement.name}`);
      return achievement;
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }
  }

  /**
   * Seed default achievements
   */
  async seedDefaultAchievements() {
    const defaultAchievements = [
      {
        name: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎯',
        type: 'quiz_completion',
        criteria: { target: 1 },
        rarity: 'common',
        points: 10,
      },
      {
        name: 'Quiz Enthusiast',
        description: 'Complete 10 quizzes',
        icon: '📚',
        type: 'quiz_completion',
        criteria: { target: 10 },
        rarity: 'common',
        points: 50,
      },
      {
        name: 'Quiz Master',
        description: 'Complete 50 quizzes',
        icon: '🎓',
        type: 'quiz_completion',
        criteria: { target: 50 },
        rarity: 'rare',
        points: 200,
      },
      {
        name: 'Perfect Score',
        description: 'Score 100% on a quiz',
        icon: '💯',
        type: 'score_achievement',
        criteria: { score: 100 },
        rarity: 'epic',
        points: 100,
      },
      {
        name: 'Excellence',
        description: 'Score 90% or higher',
        icon: '⭐',
        type: 'score_achievement',
        criteria: { score: 90 },
        rarity: 'rare',
        points: 50,
      },
      {
        name: 'On Fire',
        description: 'Achieve a 5-day streak',
        icon: '🔥',
        type: 'streak',
        criteria: { target: 5 },
        rarity: 'rare',
        points: 75,
      },
      {
        name: 'Unstoppable',
        description: 'Achieve a 10-day streak',
        icon: '🚀',
        type: 'streak',
        criteria: { target: 10 },
        rarity: 'epic',
        points: 150,
      },
      {
        name: 'Speed Demon',
        description: 'Complete a quiz in under 2 minutes',
        icon: '⚡',
        type: 'speed',
        criteria: { timeLimit: 120 },
        rarity: 'rare',
        points: 60,
      },
      {
        name: 'Point Collector',
        description: 'Earn 1000 total points',
        icon: '💎',
        type: 'special',
        criteria: { target: 1000, type: 'points' },
        rarity: 'rare',
        points: 100,
      },
      {
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '🌟',
        type: 'special',
        criteria: { target: 5, type: 'level' },
        rarity: 'rare',
        points: 80,
      },
      {
        name: 'Champion',
        description: 'Reach level 10',
        icon: '👑',
        type: 'special',
        criteria: { target: 10, type: 'level' },
        rarity: 'epic',
        points: 200,
      },
      {
        name: 'Legend',
        description: 'Reach level 20',
        icon: '🏆',
        type: 'special',
        criteria: { target: 20, type: 'level' },
        rarity: 'legendary',
        points: 500,
      },
    ];

    try {
      for (const achData of defaultAchievements) {
        const exists = await Achievement.findOne({ name: achData.name });
        if (!exists) {
          await this.createAchievement(achData);
        }
      }
      console.log('✅ Default achievements seeded');
    } catch (error) {
      console.error('Error seeding achievements:', error);
    }
  }
}

module.exports = new AchievementProcessor();
