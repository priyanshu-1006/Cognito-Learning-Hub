const express = require('express');
const router = express.Router();
const Appeal = require('../models/Appeal');
const ModerationAction = require('../models/ModerationAction');
const authMiddleware = require('../middleware/authMiddleware');
const moderatorMiddleware = require('../middleware/moderatorMiddleware');
const logger = require('../utils/logger');

// Submit an appeal (authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { actionId, reason } = req.body;

    if (!actionId || !reason) {
      return res.status(400).json({ error: 'Action ID and reason required' });
    }

    // Check if action exists and belongs to user
    const action = await ModerationAction.findById(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Moderation action not found' });
    }

    if (action.targetUserId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only appeal your own actions' });
    }

    if (!action.metadata?.appealAllowed) {
      return res.status(403).json({ error: 'This action cannot be appealed' });
    }

    // Check if appeal already exists
    const existingAppeal = await Appeal.findOne({
      actionId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingAppeal) {
      return res.status(409).json({ error: 'An appeal is already pending for this action' });
    }

    const appeal = new Appeal({
      userId: req.user.userId,
      actionId,
      reason
    });

    await appeal.save();
    logger.info(`Appeal submitted by user ${req.user.userId} for action ${actionId}`);

    res.status(201).json({
      message: 'Appeal submitted successfully',
      appeal
    });
  } catch (error) {
    logger.error('Error submitting appeal:', error);
    res.status(500).json({ error: 'Failed to submit appeal' });
  }
});

// Get all appeals (moderators only)
router.get('/', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const appeals = await Appeal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('actionId');

    const total = await Appeal.countDocuments(query);

    res.json({
      appeals,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching appeals:', error);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

// Get user's own appeals
router.get('/my-appeals', authMiddleware, async (req, res) => {
  try {
    const appeals = await Appeal.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('actionId');

    res.json({ appeals });
  } catch (error) {
    logger.error('Error fetching user appeals:', error);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

// Review appeal (moderators only)
router.patch('/:appealId/review', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
    }

    const appeal = await Appeal.findByIdAndUpdate(
      req.params.appealId,
      {
        status,
        reviewNotes,
        reviewedBy: req.user.userId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('actionId');

    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    // If approved, revoke the original action
    if (status === 'approved') {
      await ModerationAction.findByIdAndUpdate(
        appeal.actionId._id,
        {
          isActive: false,
          revokedBy: req.user.userId,
          revokedAt: new Date(),
          revokedReason: 'Appeal approved'
        }
      );
    }

    logger.info(`Appeal ${appeal._id} ${status} by moderator ${req.user.userId}`);

    res.json({
      message: `Appeal ${status}`,
      appeal
    });
  } catch (error) {
    logger.error('Error reviewing appeal:', error);
    res.status(500).json({ error: 'Failed to review appeal' });
  }
});

module.exports = router;
