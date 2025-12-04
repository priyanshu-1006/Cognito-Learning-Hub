const cron = require('node-cron');
const { UserStats } = require('../models/Achievement');
const statsManager = require('../services/statsManager');

/**
 * Daily Streak Checker - Resets streaks for inactive users
 * Runs every day at midnight
 */
function startStreakCronJob() {
  // Run at 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running daily streak check...');

    try {
      const users = await UserStats.find({ currentStreak: { $gt: 0 } }).lean();
      
      let resetCount = 0;

      for (const user of users) {
        const wasReset = await statsManager.checkAndResetStreak(user.user.toString());
        if (wasReset) {
          resetCount++;
        }
      }

      console.log(`✅ Streak check complete. Reset ${resetCount} streaks.`);
    } catch (error) {
      console.error('Error in streak checker cron job:', error);
    }
  });

  console.log('✅ Streak checker cron job scheduled (daily at midnight)');
}

module.exports = { startStreakCronJob };
