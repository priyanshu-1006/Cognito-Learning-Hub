/**
 * Friends Routes (Using Friendship model like monolith)
 */

const express = require('express');
const router = express.Router();
const Friendship = require('../models/Friendship');
const Notification = require('../models/Notification');
const User = require('../models/User');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');

const logger = createLogger('friends-routes');

/**
 * Get user's friends list (accepted friendships only)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    })
      .populate('requester', 'name email role profilePicture status lastSeen lastActivity')
      .populate('recipient', 'name email role profilePicture status lastSeen lastActivity')
      .sort({ acceptedAt: -1 });

    const friends = friendships.map(friendship => {
      const friend = friendship.requester._id.toString() === userId
        ? friendship.recipient
        : friendship.requester;

      return {
        friendshipId: friendship._id,
        friend,
        since: friendship.acceptedAt,
      };
    });

    res.json({ friends });
  } catch (error) {
    logger.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
});

/**
 * Get suggested friends
 */
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Simple suggestion: return empty for now
    res.json({ success: true, data: [] });
  } catch (error) {
    logger.error('Error fetching friend suggestions:', error);
    res.status(500).json({ success: true, data: [] });
  }
});

/**
 * Send friend request
 */
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.userId;

    if (requesterId === recipientId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Friendship request already exists' });
    }

    const friendship = new Friendship({
      requester: requesterId,
      recipient: recipientId,
    });

    await friendship.save();

    // Create notification
    const notification = new Notification({
      recipient: recipientId,
      sender: requesterId,
      type: 'friend-request',
      title: 'New Friend Request',
      message: `${req.user.name} sent you a friend request`,
      metadata: { friendshipId: friendship._id },
    });

    await notification.save();

    res.status(201).json({ message: 'Friend request sent successfully', friendship });
  } catch (error) {
    logger.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Failed to send friend request' });
  }
});

/**
 * Accept/Decline friend request
 */
router.post('/respond', authenticateToken, async (req, res) => {
  try {
    const { requesterId, action } = req.body;
    const userId = req.user.userId;

    if (!requesterId || !action) {
      return res.status(400).json({ message: 'Requester ID and action are required' });
    }

    const friendship = await Friendship.findOne({
      requester: requesterId,
      recipient: userId,
      status: 'pending',
    })
      .populate('requester', 'name')
      .populate('recipient', 'name');

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (action === 'accept') {
      friendship.status = 'accepted';
      friendship.acceptedAt = new Date();
      await friendship.save();

      // Create notification for requester
      const notification = new Notification({
        recipient: requesterId,
        sender: userId,
        type: 'friend-accepted',
        title: 'Friend Request Accepted',
        message: `${req.user.name} accepted your friend request`,
        metadata: { friendshipId: friendship._id },
      });
      await notification.save();

      res.json({ message: 'Friend request accepted' });
    } else if (action === 'decline') {
      friendship.status = 'declined';
      await friendship.save();
      res.json({ message: 'Friend request declined' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    logger.error('Error responding to friend request:', error);
    res.status(500).json({ message: 'Failed to respond to friend request' });
  }
});

/**
 * Respond to friend request (PUT endpoint for frontend compatibility)
 */
router.put('/respond/:friendshipId', authenticateToken, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { action } = req.body;
    const userId = req.user.userId;

    const friendship = await Friendship.findById(friendshipId)
      .populate('requester', 'name')
      .populate('recipient', 'name');

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendship.recipient._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already responded to' });
    }

    if (action === 'accept') {
      friendship.status = 'accepted';
      friendship.acceptedAt = new Date();
      await friendship.save();

      // Create notification for requester
      const notification = new Notification({
        recipient: friendship.requester._id,
        sender: userId,
        type: 'friend-accepted',
        title: 'Friend Request Accepted',
        message: `${req.user.name} accepted your friend request`,
        metadata: { friendshipId: friendship._id },
      });
      await notification.save();

      res.json({ message: 'Friend request accepted' });
    } else if (action === 'decline') {
      friendship.status = 'declined';
      await friendship.save();
      res.json({ message: 'Friend request declined' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    logger.error('Error responding to friend request:', error);
    res.status(500).json({ message: 'Failed to respond to friend request' });
  }
});

/**
 * Remove friend
 */
router.delete('/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Delete friendship
    await Friendship.deleteMany({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: 'accepted',
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    logger.error('Error removing friend:', error);
    res.status(500).json({ message: 'Failed to remove friend' });
  }
});

module.exports = router;
