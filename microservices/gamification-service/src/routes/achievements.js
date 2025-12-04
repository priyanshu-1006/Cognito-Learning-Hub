const express = require('express');
const router = express.Router();
const achievementProcessor = require('../services/achievementProcessor');
const { Achievement } = require('../models/Achievement');
const { authenticateToken, adminMiddleware } = require('../../../shared/middleware/auth');

/**
 * GET /api/achievements
 * Get all available achievements
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { type, rarity, isActive = 'true' } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (rarity) filter.rarity = rarity;
    if (isActive) filter.isActive = isActive === 'true';

    const achievements = await Achievement.find(filter)
      .sort({ rarity: -1, points: -1 })
      .lean();

    res.json({
      success: true,
      count: achievements.length,
      achievements,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/achievements/:userId
 * Get user's achievements
 */
router.get('/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Authorization: Users can only view their own achievements unless admin
    if (userId !== req.user.userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view other users achievements',
      });
    }
    const { completedOnly } = req.query;

    const achievements = await achievementProcessor.getUserAchievements(userId, {
      completedOnly: completedOnly === 'true',
    });

    res.json({
      success: true,
      userId,
      count: achievements.length,
      achievements,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/achievements/:userId/:achievementId/progress
 * Get achievement progress for a user
 */
router.get('/:userId/:achievementId/progress', authenticateToken, async (req, res, next) => {
  try {
    const { userId, achievementId } = req.params;

    const progress = await achievementProcessor.getAchievementProgress(userId, achievementId);

    res.json({
      success: true,
      userId,
      achievementId,
      progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/achievements (Admin)
 * Create a new achievement
 */
router.post('/', authenticateToken, adminMiddleware, async (req, res, next) => {
  try {
    const achievement = await achievementProcessor.createAchievement(req.body);

    res.status(201).json({
      success: true,
      achievement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/achievements/seed (Admin)
 * Seed default achievements
 */
router.post('/seed', authenticateToken, adminMiddleware, async (req, res, next) => {
  try {
    await achievementProcessor.seedDefaultAchievements();

    res.json({
      success: true,
      message: 'Default achievements seeded',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/achievements/:achievementId
 * Update achievement
 */
router.put('/:achievementId', authenticateToken, adminMiddleware, async (req, res, next) => {
  try {
    const { achievementId } = req.params;

    const achievement = await Achievement.findByIdAndUpdate(
      achievementId,
      req.body,
      { new: true }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    res.json({
      success: true,
      achievement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/achievements/:achievementId
 * Delete achievement
 */
router.delete('/:achievementId', authenticateToken, adminMiddleware, async (req, res, next) => {
  try {
    const { achievementId } = req.params;

    const achievement = await Achievement.findByIdAndDelete(achievementId);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    res.json({
      success: true,
      message: 'Achievement deleted',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
