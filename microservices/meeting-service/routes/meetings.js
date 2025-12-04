/**
 * Meeting HTTP Routes
 * CRUD operations for meetings
 */

const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Meeting = require('../models/Meeting');
const meetingManager = require('../services/meetingManager');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const { validateFields } = require('../../shared/middleware/inputValidation');

const logger = createLogger('meeting-routes');

// ============================================
// CREATE MEETING
// ============================================

router.post(
  '/create',
  authenticateToken,
  validateFields({
    title: { required: true, type: 'string', minLength: 3, maxLength: 200 },
    description: { type: 'string', maxLength: 1000 },
    hostId: { required: true, type: 'objectId' },
    hostName: { type: 'string', maxLength: 100 },
    scheduledAt: { type: 'string' },
  }),
  async (req, res) => {
    try {
      const {
        title,
        description,
        hostId,
        hostName,
        scheduledAt,
        settings,
      } = req.body;

    // Generate unique room ID
    const roomId = nanoid(10);

    // Create meeting in database
    const meeting = new Meeting({
      roomId,
      title,
      description,
      hostId,
      hostName,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'active',
      settings: {
        maxParticipants: settings?.maxParticipants || 50,
        isRecordingEnabled: settings?.isRecordingEnabled || false,
        isChatEnabled: settings?.isChatEnabled !== false,
        isScreenShareEnabled: settings?.isScreenShareEnabled !== false,
        requireApproval: settings?.requireApproval || false,
        allowedDomains: settings?.allowedDomains || [],
      },
    });

    await meeting.save();

    logger.info(`Meeting created: ${roomId} by ${hostId}`);

    res.status(201).json({
      success: true,
      meeting: {
        roomId: meeting.roomId,
        title: meeting.title,
        description: meeting.description,
        hostId: meeting.hostId,
        scheduledAt: meeting.scheduledAt,
        status: meeting.status,
        settings: meeting.settings,
        createdAt: meeting.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting',
    });
  }
});

// ============================================
// GET MEETING
// ============================================

router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Try Redis first
    let meeting = await meetingManager.getMeeting(roomId);

    if (!meeting) {
      // Fallback to database
      const dbMeeting = await Meeting.findOne({ roomId });

      if (!dbMeeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found',
        });
      }

      meeting = {
        roomId: dbMeeting.roomId,
        title: dbMeeting.title,
        description: dbMeeting.description,
        hostId: dbMeeting.hostId,
        status: dbMeeting.status,
        settings: dbMeeting.settings,
        createdAt: dbMeeting.createdAt,
        startedAt: dbMeeting.startedAt,
        endedAt: dbMeeting.endedAt,
      };
    }

    // Get participant count from Redis
    const participantCount = await meetingManager.getParticipantCount(roomId);

    res.json({
      success: true,
      meeting: {
        ...meeting,
        participantCount,
      },
    });
  } catch (error) {
    logger.error('Error getting meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get meeting',
    });
  }
});

// ============================================
// GET PARTICIPANTS
// ============================================

router.get('/:roomId/participants', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get participants from Redis
    const participants = await meetingManager.getAllParticipants(roomId);

    res.json({
      success: true,
      participants: participants.map(p => ({
        userId: p.userId,
        userName: p.userName,
        userPicture: p.userPicture,
        isConnected: p.isConnected,
        isAudioEnabled: p.isAudioEnabled,
        isVideoEnabled: p.isVideoEnabled,
        isScreenSharing: p.isScreenSharing,
        joinedAt: p.joinedAt,
      })),
      count: participants.length,
    });
  } catch (error) {
    logger.error('Error getting participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participants',
    });
  }
});

// ============================================
// UPDATE MEETING
// ============================================

router.put('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title, description, settings } = req.body;

    // Update database
    const meeting = await Meeting.findOneAndUpdate(
      { roomId },
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(settings && { settings }),
      },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    // Update Redis if meeting is active
    const redisMeeting = await meetingManager.getMeeting(roomId);
    if (redisMeeting) {
      await meetingManager.updateMeeting(roomId, {
        ...(title && { title }),
        ...(settings && { settings }),
      });
    }

    res.json({
      success: true,
      meeting: {
        roomId: meeting.roomId,
        title: meeting.title,
        description: meeting.description,
        settings: meeting.settings,
      },
    });
  } catch (error) {
    logger.error('Error updating meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update meeting',
    });
  }
});

// ============================================
// END MEETING
// ============================================

router.post('/:roomId/end', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get meeting
    const meeting = await Meeting.findOne({ roomId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    // Verify host - use authenticated user ID
    if (meeting.hostId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only host can end meeting',
      });
    }

    // Get participants before ending
    const participants = await meetingManager.getAllParticipants(roomId);

    // Update meeting analytics
    meeting.status = 'completed';
    meeting.endedAt = new Date();
    meeting.analytics.totalParticipantsJoined = participants.length;
    meeting.analytics.peakParticipants = Math.max(
      meeting.analytics.peakParticipants,
      participants.length
    );

    if (meeting.startedAt) {
      const duration = (meeting.endedAt - meeting.startedAt) / 1000 / 60; // minutes
      meeting.analytics.duration = Math.round(duration);
    }

    await meeting.save();

    // Delete from Redis
    await meetingManager.deleteMeeting(roomId);

    logger.info(`Meeting ${roomId} ended by host ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Meeting ended',
      analytics: meeting.analytics,
    });
  } catch (error) {
    logger.error('Error ending meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end meeting',
    });
  }
});

// ============================================
// GET MEETING STATS
// ============================================

router.get('/:roomId/stats', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const stats = await meetingManager.getMeetingStats(roomId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error getting meeting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get meeting stats',
    });
  }
});

// ============================================
// GET USER MEETINGS
// ============================================

router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Authorization: Users can only view their own meetings unless admin
    if (userId !== req.user.userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view other users meetings',
      });
    }
    const { status, limit = 20, skip = 0 } = req.query;

    const query = {
      $or: [
        { hostId: userId },
        { 'participants.userId': userId },
      ],
    };

    if (status) {
      query.status = status;
    }

    const meetings = await Meeting.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('roomId title description hostId status scheduledAt createdAt startedAt endedAt analytics');

    const total = await Meeting.countDocuments(query);

    res.json({
      success: true,
      meetings,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    logger.error('Error getting user meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user meetings',
    });
  }
});

// ============================================
// DELETE MEETING
// ============================================

router.delete('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({ roomId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    // Verify host - use authenticated user ID
    if (meeting.hostId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only host can delete meeting',
      });
    }

    // Can only delete scheduled/waiting meetings
    if (meeting.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete active meeting. End it first.',
      });
    }

    await Meeting.deleteOne({ roomId });
    await meetingManager.deleteMeeting(roomId);

    logger.info(`Meeting ${roomId} deleted by host ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Meeting deleted',
    });
  } catch (error) {
    logger.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete meeting',
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health/check', async (req, res) => {
  try {
    const redisConnected = meetingManager.isConnected();

    res.json({
      success: true,
      service: 'meeting-service',
      redis: redisConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

module.exports = router;
