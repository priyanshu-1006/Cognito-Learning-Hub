/**
 * Follow Routes
 * Optimized with Redis for fast follow/unfollow
 */

const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const feedManager = require('../services/feedManager');
const notificationManager = require('../services/notificationManager');
const queueManager = require('../workers/queueManager');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const { validateFields } = require('../../shared/middleware/inputValidation');

const logger = createLogger('follow-routes');

// ============================================
// FOLLOW USER
// ============================================

router.post(
  '/follow',
  authenticateToken,
  validateFields({
    followingId: { required: true, type: 'string' },
  }),
  async (req, res) => {
    try {
      const { followerId, followerName, followingId, followingName } = req.body;

      // Authorization: User can only follow as themselves
      if (followerId && followerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot follow as another user',
        });
      }

      const actualFollowerId = followerId || req.user.userId;

      if (actualFollowerId === followingId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot follow yourself',
        });
      }

    // Check if already following
    const existing = await Follow.findOne({ followerId: actualFollowerId, followingId });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already following',
      });
    }

    // Create follow relationship
    const follow = new Follow({
      followerId: actualFollowerId,
      followerName,
      followingId,
      followingName,
      notifyOnPost: true,
    });
    await follow.save();

    // Update Redis
    await feedManager.addFollower(followingId, actualFollowerId);

    // Queue follow notification
    await queueManager.addNotification({
      userId: followingId,
      type: 'follow',
      actorId: actualFollowerId,
      actorName: followerName,
      message: `${followerName} started following you`,
      actionUrl: `/profile/${actualFollowerId}`,
      priority: 'high',
    });

    logger.info(`User ${actualFollowerId} followed ${followingId}`);

    res.json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error) {
    logger.error('Error following user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow user',
    });
  }
});

// ============================================
// UNFOLLOW USER
// ============================================

router.delete(
  '/follow',
  authenticateToken,
  validateFields({
    followingId: { required: true, type: 'string' },
  }),
  async (req, res) => {
    try {
      const { followerId, followingId } = req.body;

      // Authorization: User can only unfollow as themselves
      if (followerId && followerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot unfollow as another user',
        });
      }

      const actualFollowerId = followerId || req.user.userId;

      // Remove follow relationship
      const result = await Follow.deleteOne({ followerId: actualFollowerId, followingId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Follow relationship not found',
      });
    }

    // Update Redis
    await feedManager.removeFollower(followingId, actualFollowerId);

    logger.info(`User ${actualFollowerId} unfollowed ${followingId}`);

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    logger.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user',
    });
  }
});

// ============================================
// GET FOLLOWERS
// ============================================

router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const followers = await Follow.getFollowers(userId, parseInt(page), parseInt(limit));
    const totalCount = await Follow.getFollowerCount(userId);

    res.json({
      success: true,
      followers,
      totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Error getting followers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get followers',
    });
  }
});

// ============================================
// GET FOLLOWING
// ============================================

router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const following = await Follow.getFollowing(userId, parseInt(page), parseInt(limit));
    const totalCount = await Follow.getFollowingCount(userId);

    res.json({
      success: true,
      following,
      totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Error getting following:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get following',
    });
  }
});

// ============================================
// CHECK IF FOLLOWING
// ============================================

router.get('/check/:followerId/:followingId', async (req, res) => {
  try {
    const { followerId, followingId } = req.params;

    // Check Redis first (fast)
    const isFollowing = await feedManager.isFollowing(followerId, followingId);

    res.json({
      success: true,
      isFollowing,
    });
  } catch (error) {
    logger.error('Error checking follow status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check follow status',
    });
  }
});

// ============================================
// GET FOLLOW STATS
// ============================================

router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get counts from Redis (fast O(1) operations)
    const followerCount = await feedManager.getFollowerCount(userId);
    const followingCount = await feedManager.getFollowingCount(userId);

    res.json({
      success: true,
      stats: {
        followers: followerCount,
        following: followingCount,
      },
    });
  } catch (error) {
    logger.error('Error getting follow stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get follow stats',
    });
  }
});

module.exports = router;
