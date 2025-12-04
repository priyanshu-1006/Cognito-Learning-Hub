const cron = require('node-cron');
const { UserStats } = require('../models/Achievement');
const { getUserStatsFromCache } = require('../config/redis');
const statsManager = require('../services/statsManager');

/**
 * Stats Sync Job - Periodically syncs all cached stats to MongoDB
 * Runs every 5 minutes
 */
function startStatsSyncJob() {
  const syncInterval = process.env.STATS_SYNC_INTERVAL_MS || 300000; // 5 minutes

  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running periodic stats sync...');

    try {
      // Get all users with cached stats
      const users = await UserStats.find().select('user').lean();
      
      let syncCount = 0;

      for (const user of users) {
        const userId = user.user.toString();
        const cachedStats = await getUserStatsFromCache(userId);
        
        if (cachedStats) {
          await statsManager.syncToDatabase(userId);
          syncCount++;
        }
      }

      console.log(`✅ Periodic stats sync complete. Synced ${syncCount} users.`);
    } catch (error) {
      console.error('Error in stats sync cron job:', error);
    }
  });

  console.log('✅ Stats sync cron job scheduled (every 5 minutes)');
}

module.exports = { startStatsSyncJob };
