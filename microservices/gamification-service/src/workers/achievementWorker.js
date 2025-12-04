const achievementProcessor = require('../services/achievementProcessor');
const { queueAchievementCheck } = require('../config/queue');

/**
 * Achievement Worker - Processes achievement checks from Bull queue
 */
module.exports = function(achievementQueue) {
  achievementQueue.process('check-achievements', async (job) => {
    const { userId, eventData } = job.data;

    console.log(`Processing achievement check for user ${userId}`);

    try {
      // Check and unlock achievements
      const unlockedAchievements = await achievementProcessor.checkAchievements(
        userId,
        eventData
      );

      if (unlockedAchievements.length > 0) {
        console.log(`🎉 Unlocked ${unlockedAchievements.length} achievement(s) for user ${userId}`);
        
        // Notify social service about unlocked achievements
        await notifySocialService(userId, unlockedAchievements);
      }

      return {
        success: true,
        unlockedCount: unlockedAchievements.length,
        achievements: unlockedAchievements.map(a => a.achievement.name),
      };
    } catch (error) {
      console.error('Achievement check failed:', error);
      throw error; // Will trigger retry
    }
  });

  console.log('✅ Achievement worker started');
};

/**
 * Notify social service about achievement unlocks
 */
async function notifySocialService(userId, unlockedAchievements) {
  try {
    const axios = require('axios');
    const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3006';

    for (const { achievement } of unlockedAchievements) {
      await axios.post(`${SOCIAL_SERVICE_URL}/api/events/achievement-unlocked`, {
        userId,
        achievement: {
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          points: achievement.points,
        },
      }).catch(err => {
        console.error('Failed to notify social service:', err.message);
      });
    }
  } catch (error) {
    console.error('Error notifying social service:', error);
  }
}
