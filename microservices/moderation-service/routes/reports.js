const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const authMiddleware = require('../middleware/authMiddleware');
const moderatorMiddleware = require('../middleware/moderatorMiddleware');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const createReportSchema = Joi.object({
  reportedUserId: Joi.string(),
  reportedContentId: Joi.string(),
  contentType: Joi.string().valid('post', 'comment', 'user', 'quiz', 'message', 'other').required(),
  reason: Joi.string().valid(
    'spam', 'harassment', 'hate_speech', 'violence', 
    'misinformation', 'inappropriate_content', 'copyright', 
    'impersonation', 'other'
  ).required(),
  description: Joi.string().max(1000).required(),
  evidence: Joi.array().items(Joi.object({
    type: Joi.string().valid('screenshot', 'link', 'text').required(),
    data: Joi.string().required()
  }))
});

// Create a report (any authenticated user)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error } = createReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { reportedUserId, reportedContentId, contentType, reason, description, evidence } = req.body;

    // Check if user already reported this content
    const existingReport = await Report.findOne({
      reporterId: req.user.userId,
      reportedContentId,
      status: { $in: ['pending', 'reviewing'] }
    });

    if (existingReport) {
      return res.status(409).json({ error: 'You have already reported this content' });
    }

    // Auto-prioritize based on reason
    let priority = 'medium';
    if (['hate_speech', 'violence', 'harassment'].includes(reason)) {
      priority = 'high';
    } else if (reason === 'spam') {
      priority = 'low';
    }

    const report = new Report({
      reporterId: req.user.userId,
      reportedUserId,
      reportedContentId,
      contentType,
      reason,
      description,
      evidence,
      priority
    });

    await report.save();
    logger.info(`Report created: ${report._id} by user ${req.user.userId}`);

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: report._id,
      status: report.status
    });
  } catch (error) {
    logger.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get all reports (moderators only) - matching monolith format
router.get('/', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    // Get reports with quiz and user info populated
    const reports = await db.collection('reports')
      .aggregate([
        { $sort: { createdAt: -1 } }, // Newest first
        {
          $lookup: {
            from: 'quizzes',
            localField: 'quiz',
            foreignField: '_id',
            as: 'quiz'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reportedBy',
            foreignField: '_id',
            as: 'reportedBy'
          }
        },
        {
          $unwind: {
            path: '$quiz',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$reportedBy',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            quiz: {
              _id: '$quiz._id',
              title: '$quiz.title'
            },
            questionText: 1,
            reason: 1,
            description: 1,
            reportedBy: {
              _id: '$reportedBy._id',
              name: '$reportedBy.name'
            },
            status: 1,
            resolvedBy: 1,
            resolvedAt: 1,
            priority: 1,
            category: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ])
      .toArray();

    // Return reports directly as array (matching monolith format)
    res.json(reports);
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report statistics (moderators only)
router.get('/stats', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Report.aggregate([
      {
        $match: { status: { $in: ['pending', 'reviewing'] } }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const reasonStats = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      byStatus: stats,
      byPriority: priorityStats,
      topReasons: reasonStats
    });
  } catch (error) {
    logger.error('Error fetching report stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get single report details (moderators only)
router.get('/:reportId', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Update report status (moderators only)
router.patch('/:reportId/status', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { status, action, moderatorNotes } = req.body;

    if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      moderatorId: req.user.userId,
      moderatorNotes
    };

    if (action) {
      if (!['none', 'warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }
      updateData.action = action;
    }

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = new Date();
    }

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    logger.info(`Report ${report._id} updated to ${status} by moderator ${req.user.userId}`);

    res.json({
      message: 'Report status updated',
      report
    });
  } catch (error) {
    logger.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Bulk update reports (moderators only)
router.patch('/bulk/update', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { reportIds, status, action } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ error: 'Report IDs array required' });
    }

    const updateData = {
      status,
      moderatorId: req.user.userId
    };

    if (action) updateData.action = action;
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = new Date();
    }

    const result = await Report.updateMany(
      { _id: { $in: reportIds } },
      updateData
    );

    logger.info(`Bulk update: ${result.modifiedCount} reports updated by moderator ${req.user.userId}`);

    res.json({
      message: 'Reports updated',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error('Error bulk updating reports:', error);
    res.status(500).json({ error: 'Failed to bulk update reports' });
  }
});

// Get user's own reports
router.get('/user/my-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user.userId })
      .sort({ createdAt: -1 })
      .select('-moderatorNotes');

    res.json({ reports });
  } catch (error) {
    logger.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Resolve a report (matching monolith endpoint)
router.put('/:id/resolve', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const reportId = new mongoose.Types.ObjectId(req.params.id);

    const result = await db.collection('reports').findOneAndUpdate(
      { _id: reportId },
      { 
        $set: { 
          status: 'resolved', 
          resolvedBy: new mongoose.Types.ObjectId(req.user.id),
          resolvedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Report not found' });
    }

    logger.info(`Report ${req.params.id} resolved by ${req.user.id}`);
    res.json({ 
      message: 'Report resolved successfully', 
      report: result.value 
    });
  } catch (error) {
    logger.error('Error resolving report:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Dismiss a report (matching monolith endpoint)
router.put('/:id/dismiss', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const reportId = new mongoose.Types.ObjectId(req.params.id);

    const result = await db.collection('reports').findOneAndUpdate(
      { _id: reportId },
      { 
        $set: { 
          status: 'dismissed', 
          resolvedBy: new mongoose.Types.ObjectId(req.user.id),
          resolvedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Report not found' });
    }

    logger.info(`Report ${req.params.id} dismissed by ${req.user.id}`);
    res.json({ 
      message: 'Report dismissed successfully', 
      report: result.value 
    });
  } catch (error) {
    logger.error('Error dismissing report:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
