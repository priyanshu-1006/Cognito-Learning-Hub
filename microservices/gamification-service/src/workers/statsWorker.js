const statsManager = require('../services/statsManager');

/**
 * Stats Worker - Syncs Redis stats to MongoDB
 */
module.exports = function(statsQueue) {
  statsQueue.process('sync-stats', async (job) => {
    const { userId } = job.data;

    console.log(`Syncing stats to database for user ${userId}`);

    try {
      const syncedStats = await statsManager.syncToDatabase(userId);

      return {
        success: true,
        userId,
        stats: syncedStats,
      };
    } catch (error) {
      console.error('Stats sync failed:', error);
      throw error; // Will trigger retry
    }
  });

  console.log('✅ Stats sync worker started');
};
