/**
 * Users Routes (Search users, get user info)
 */

const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const axios = require('axios');

const logger = createLogger('users-routes');

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

/**
 * Search users for adding friends
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.userId;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters' 
      });
    }

    // Fetch users from auth service
    const response = await axios.get(`${AUTH_SERVICE}/api/users/search`, {
      params: { query },
      headers: {
        'x-auth-token': req.headers['x-auth-token'],
      },
    });

    // Handle ApiResponse wrapper
    const users = response.data?.data?.users || response.data?.users || [];

    // Check friendship/follow status for each user
    const usersWithStatus = await Promise.all(
      users
        .filter(user => user._id !== userId) // Exclude current user
        .map(async (user) => {
          // Check if mutual follows exist (friendship)
          const userFollowsMe = await Follow.findOne({
            followerId: user._id,
            followingId: userId,
          });

          const iFollowUser = await Follow.findOne({
            followerId: userId,
            followingId: user._id,
          });

          let friendshipStatus = 'none';
          let friendshipId = null;

          if (userFollowsMe && iFollowUser) {
            friendshipStatus = 'accepted'; // Mutual follows = friends
            friendshipId = iFollowUser._id;
          } else if (iFollowUser) {
            friendshipStatus = 'pending'; // I follow them, waiting for follow back
            friendshipId = iFollowUser._id;
          } else if (userFollowsMe) {
            friendshipStatus = 'requested'; // They follow me, I can follow back
            friendshipId = userFollowsMe._id;
          }

          return {
            ...user,
            friendshipStatus,
            friendshipId,
          };
        })
    );

    res.json({ users: usersWithStatus });
  } catch (error) {
    logger.error('Error searching users:', error.message || 'Unknown error');
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// ============================================
// UPDATE USER STATUS
// ============================================
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.userId;

    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be online, offline, or away' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: status,
        lastActivity: new Date(),
        lastSeen: status === 'offline' ? new Date() : undefined,
      },
      { new: true, select: 'status lastSeen lastActivity' }
    );

    res.json({
      message: 'Status updated successfully',
      user: user,
    });
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// ============================================
// GET FRIENDS STATUS
// ============================================
router.get('/friends-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's friends
    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    }).populate('requester recipient', 'name status lastSeen lastActivity');

    // Extract friend info with status
    const friendsStatus = friendships.map((friendship) => {
      const friend =
        friendship.requester._id.toString() === userId
          ? friendship.recipient
          : friendship.requester;

      return {
        friendId: friend._id,
        name: friend.name,
        status: friend.status || 'offline',
        lastSeen: friend.lastSeen,
        lastActivity: friend.lastActivity,
        isOnline:
          friend.status === 'online' &&
          friend.lastActivity &&
          new Date() - new Date(friend.lastActivity) < 5 * 60 * 1000, // 5 minutes
      };
    });

    res.json({ friends: friendsStatus });
  } catch (error) {
    logger.error('Error fetching friends status:', error);
    res.status(500).json({ message: 'Failed to fetch friends status' });
  }
});

// ============================================
// GET USER STATS (for achievement dashboard)
// ============================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    // Find or create user stats
    let userStats = await db.collection('userstats').findOne({ 
      user: new mongoose.Types.ObjectId(userId) 
    });

    if (!userStats) {
      // Create initial stats for new user
      const newStats = {
        user: new mongoose.Types.ObjectId(userId),
        totalQuizzesTaken: 0,
        totalQuizzesCreated: 0,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        level: 1,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('userstats').insertOne(newStats);
      userStats = newStats;
    }

    // Get recent achievements
    const recentAchievements = await db.collection('userachievements')
      .aggregate([
        { 
          $match: { 
            user: new mongoose.Types.ObjectId(userId) 
          } 
        },
        { $sort: { unlockedAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'achievements',
            localField: 'achievement',
            foreignField: '_id',
            as: 'achievement'
          }
        },
        {
          $unwind: {
            path: '$achievement',
            preserveNullAndEmptyArrays: true
          }
        }
      ])
      .toArray();

    res.json({
      stats: userStats,
      recentAchievements: recentAchievements
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics.' });
  }
});

module.exports = router;
