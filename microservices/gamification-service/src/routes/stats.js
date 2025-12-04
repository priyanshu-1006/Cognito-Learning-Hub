const express = require('express');
const router = express.Router();
const statsManager = require('../services/statsManager');
const { authenticateToken, adminMiddleware } = require('../../../shared/middleware/auth');

/**
 * GET /api/stats/:userId
 * Get user stats
 */
router.get('/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Authorization: Users can only view their own stats unless admin
    if (userId !== req.user.userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view other users stats',
      });
    }

    const stats = await statsManager.getStats(userId);

    res.json({
      success: true,
      userId,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/top/:statField
 * Get top users by a specific stat field
 */
router.get('/top/:statField', authenticateToken, async (req, res, next) => {
  try {
    const { statField } = req.params;
    const { limit = 10 } = req.query;

    const topUsers = await statsManager.getTopUsers(statField, parseInt(limit));

    res.json({
      success: true,
      statField,
      limit: parseInt(limit),
      count: topUsers.length,
      topUsers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stats/:userId/sync (Admin)
 * Force sync stats to database
 */
router.post('/:userId/sync', authenticateToken, adminMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const syncedStats = await statsManager.syncToDatabase(userId);

    res.json({
      success: true,
      userId,
      stats: syncedStats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/stats/:userId
 * Update user stats (manual override - admin only)
 */
router.put('/:userId', authenticateToken, adminMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const { UserStats } = require('../models/Achievement');
    const stats = await UserStats.findOneAndUpdate(
      { user: userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    // Update cache
    const { cacheUserStats } = require('../config/redis');
    await cacheUserStats(userId, stats.toObject());

    res.json({
      success: true,
      userId,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stats/bulk-update (Admin)
 * Bulk update stats for multiple users
 */
router.post('/bulk-update', authenticateToken, adminMiddleware, async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { userId, data }

    const result = await statsManager.bulkUpdateStats(updates);

    res.json({
      success: true,
      message: 'Bulk update complete',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
