/**
 * Notification Routes (Using monolith schema)
 */

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');

const logger = createLogger('notification-routes');

// ============================================
// GET USER NOTIFICATIONS
// ============================================

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name email')
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// ============================================
// GET UNREAD COUNT
// ============================================

router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// ============================================
// MARK AS READ
// ============================================

router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking as read:', error);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

// ============================================
// MARK ALL AS READ
// ============================================

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// ============================================
// DELETE NOTIFICATION
// ============================================

router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

module.exports = router;
