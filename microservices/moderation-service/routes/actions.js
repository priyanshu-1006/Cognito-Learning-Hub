const express = require('express');
const router = express.Router();
const ModerationAction = require('../models/ModerationAction');
const BannedUser = require('../models/BannedUser');
const authMiddleware = require('../middleware/authMiddleware');
const moderatorMiddleware = require('../middleware/moderatorMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const logger = require('../utils/logger');
const axios = require('axios');

// Create moderation action (moderators only)
router.post('/', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { 
      targetUserId, 
      actionType, 
      reason, 
      duration, 
      relatedReportId, 
      notes, 
      severity 
    } = req.body;

    // Validate required fields
    if (!targetUserId || !actionType || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prevent self-moderation
    if (targetUserId === req.user.userId) {
      return res.status(403).json({ 
        error: 'Cannot moderate yourself',
        message: 'Moderators are not allowed to take actions against their own accounts'
      });
    }

    // Calculate expiration date if duration provided
    let expiresAt = null;
    if (duration && duration.unit !== 'permanent') {
      const now = new Date();
      switch (duration.unit) {
        case 'hours':
          expiresAt = new Date(now.getTime() + duration.value * 60 * 60 * 1000);
          break;
        case 'days':
          expiresAt = new Date(now.getTime() + duration.value * 24 * 60 * 60 * 1000);
          break;
        case 'weeks':
          expiresAt = new Date(now.getTime() + duration.value * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'months':
          expiresAt = new Date(now.setMonth(now.getMonth() + duration.value));
          break;
      }
    }

    const moderationAction = new ModerationAction({
      moderatorId: req.user.userId,
      targetUserId,
      actionType,
      reason,
      duration,
      expiresAt,
      relatedReportId,
      notes,
      severity: severity || 'moderate'
    });

    await moderationAction.save();

    // Handle ban action
    if (actionType === 'ban') {
      const bannedUser = new BannedUser({
        userId: targetUserId,
        bannedBy: req.user.userId,
        reason,
        banType: duration?.unit === 'permanent' ? 'permanent' : 'temporary',
        expiresAt,
        relatedReports: relatedReportId ? [relatedReportId] : [],
        notes
      });
      await bannedUser.save();
    }

    // Notify user service about the action
    try {
      await axios.post(`${process.env.USER_SERVICE_URL}/api/internal/moderation-action`, {
        userId: targetUserId,
        actionType,
        expiresAt,
        moderationActionId: moderationAction._id
      });
    } catch (error) {
      logger.error('Failed to notify user service:', error.message);
    }

    logger.info(`Moderation action ${actionType} applied to user ${targetUserId} by ${req.user.userId}`);

    res.status(201).json({
      message: 'Moderation action created',
      action: moderationAction
    });
  } catch (error) {
    logger.error('Error creating moderation action:', error);
    res.status(500).json({ error: 'Failed to create moderation action' });
  }
});

// Get all moderation actions (moderators only)
router.get('/', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { 
      targetUserId,
      actionType, 
      isActive,
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};
    if (targetUserId) query.targetUserId = targetUserId;
    if (actionType) query.actionType = actionType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const actions = await ModerationAction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedReportId');

    const total = await ModerationAction.countDocuments(query);

    res.json({
      actions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching moderation actions:', error);
    res.status(500).json({ error: 'Failed to fetch moderation actions' });
  }
});

// Get user's moderation history
router.get('/user/:userId', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const actions = await ModerationAction.find({ 
      targetUserId: req.params.userId 
    })
      .sort({ createdAt: -1 })
      .populate('relatedReportId');

    const activeActions = actions.filter(a => a.isActive);
    const pastActions = actions.filter(a => !a.isActive);

    res.json({
      userId: req.params.userId,
      activeActions,
      pastActions,
      totalActions: actions.length
    });
  } catch (error) {
    logger.error('Error fetching user moderation history:', error);
    res.status(500).json({ error: 'Failed to fetch moderation history' });
  }
});

// Revoke/expire moderation action (moderators only)
router.patch('/:actionId/revoke', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    const action = await ModerationAction.findByIdAndUpdate(
      req.params.actionId,
      {
        isActive: false,
        revokedBy: req.user.userId,
        revokedAt: new Date(),
        revokedReason: reason
      },
      { new: true }
    );

    if (!action) {
      return res.status(404).json({ error: 'Moderation action not found' });
    }

    // If it was a ban, remove from banned users
    if (action.actionType === 'ban') {
      await BannedUser.findOneAndDelete({ userId: action.targetUserId });
    }

    // Notify user service
    try {
      await axios.post(`${process.env.USER_SERVICE_URL}/api/internal/moderation-revoked`, {
        userId: action.targetUserId,
        actionId: action._id
      });
    } catch (error) {
      logger.error('Failed to notify user service:', error.message);
    }

    logger.info(`Moderation action ${action._id} revoked by ${req.user.userId}`);

    res.json({
      message: 'Moderation action revoked',
      action
    });
  } catch (error) {
    logger.error('Error revoking moderation action:', error);
    res.status(500).json({ error: 'Failed to revoke moderation action' });
  }
});

// Check if user is banned
router.get('/check/banned/:userId', authMiddleware, async (req, res) => {
  try {
    const bannedUser = await BannedUser.findOne({ userId: req.params.userId });

    if (!bannedUser) {
      return res.json({ isBanned: false });
    }

    // Check if temporary ban has expired
    if (bannedUser.banType === 'temporary' && bannedUser.expiresAt < new Date()) {
      await BannedUser.findByIdAndDelete(bannedUser._id);
      await ModerationAction.updateMany(
        { targetUserId: req.params.userId, actionType: 'ban', isActive: true },
        { isActive: false }
      );
      return res.json({ isBanned: false });
    }

    res.json({
      isBanned: true,
      banType: bannedUser.banType,
      reason: bannedUser.reason,
      expiresAt: bannedUser.expiresAt,
      appealStatus: bannedUser.appealStatus
    });
  } catch (error) {
    logger.error('Error checking ban status:', error);
    res.status(500).json({ error: 'Failed to check ban status' });
  }
});

// Get all banned users (admins only)
router.get('/banned/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { banType, appealStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (banType) query.banType = banType;
    if (appealStatus) query.appealStatus = appealStatus;

    const skip = (page - 1) * limit;

    const bannedUsers = await BannedUser.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BannedUser.countDocuments(query);

    res.json({
      bannedUsers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching banned users:', error);
    res.status(500).json({ error: 'Failed to fetch banned users' });
  }
});

// Expire old temporary actions (cron job endpoint)
router.post('/expire/check', async (req, res) => {
  try {
    const expiredActions = await ModerationAction.find({
      isActive: true,
      expiresAt: { $lte: new Date() }
    });

    for (const action of expiredActions) {
      action.isActive = false;
      await action.save();

      if (action.actionType === 'ban') {
        await BannedUser.findOneAndDelete({ userId: action.targetUserId });
      }

      logger.info(`Expired moderation action ${action._id} for user ${action.targetUserId}`);
    }

    res.json({
      message: 'Expired actions processed',
      expiredCount: expiredActions.length
    });
  } catch (error) {
    logger.error('Error expiring actions:', error);
    res.status(500).json({ error: 'Failed to expire actions' });
  }
});

module.exports = router;
