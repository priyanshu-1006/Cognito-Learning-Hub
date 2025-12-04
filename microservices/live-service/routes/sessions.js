/**
 * HTTP Routes for Session Management
 */

const express = require('express');
const { nanoid } = require('nanoid');
const ApiResponse = require('../../shared/utils/response');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const sessionManager = require('../services/sessionManager');
const LiveSession = require('../models/LiveSession');

const router = express.Router();
const logger = createLogger('session-routes');

/**
 * @route   POST /api/sessions/create
 * @desc    Create new live session
 * @access  Private
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { quizId, maxParticipants, settings } = req.body;

    if (!quizId) {
      return ApiResponse.badRequest(res, 'quizId required');
    }

    // Fetch quiz details
    const QUIZ_SERVICE_URL = process.env.QUIZ_SERVICE_URL || 'http://localhost:3005';
    const quizResponse = await fetch(`${QUIZ_SERVICE_URL}/api/quizzes/${quizId}`);
    if (!quizResponse.ok) {
      return ApiResponse.notFound(res, 'Quiz not found');
    }
    
    const quiz = await quizResponse.json();

    // Generate unique session code
    const codeLength = parseInt(process.env.SESSION_CODE_LENGTH) || 6;
    let sessionCode;
    let isUnique = false;
    
    // Retry until unique code found
    for (let i = 0; i < 5; i++) {
      sessionCode = nanoid(codeLength).toUpperCase();
      const existing = await sessionManager.getSession(sessionCode);
      if (!existing) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      return ApiResponse.error(res, 'Failed to generate unique session code');
    }

    // Create session in Redis
    const session = await sessionManager.createSession({
      sessionCode,
      quizId,
      hostId: req.user.userId,
      maxParticipants: maxParticipants || 50,
      settings: settings || {},
      quizMetadata: {
        title: quiz.title,
        totalQuestions: quiz.questions.length,
        difficulty: quiz.difficulty,
      },
    });

    // Cache quiz in Redis
    await sessionManager.cacheQuiz(sessionCode, quiz);

    // Create in MongoDB (for recovery)
    const dbSession = new LiveSession({
      sessionCode,
      quizId,
      hostId: req.user.userId,
      maxParticipants: session.maxParticipants,
      settings: session.settings,
      quizMetadata: session.quizMetadata,
    });
    await dbSession.save();

    logger.info(`Session created: ${sessionCode} by user ${req.user.userId}`);

    res.status(201).json(
      ApiResponse.created({
        session: {
          ...session,
          joinUrl: `${req.protocol}://${req.get('host')}/join/${sessionCode}`,
        },
      })
    );
  } catch (error) {
    logger.error('Error creating session:', error);
    return ApiResponse.error(res, 'Failed to create session', 500);
  }
});

/**
 * @route   GET /api/sessions/:sessionCode
 * @desc    Get session details
 * @access  Public
 */
router.get('/:sessionCode', async (req, res) => {
  try {
    const { sessionCode } = req.params;

    // Check Redis first
    let session = await sessionManager.getSession(sessionCode);

    if (!session) {
      // Fallback to MongoDB
      const dbSession = await LiveSession.findByCode(sessionCode);
      if (!dbSession) {
        return ApiResponse.notFound(res, 'Session not found');
      }
      session = dbSession.toObject();
    }

    // Get participant count
    const participantCount = await sessionManager.getParticipantCount(sessionCode);

    res.json(
      ApiResponse.success({
        session: {
          ...session,
          participantCount,
        },
      })
    );
  } catch (error) {
    logger.error('Error getting session:', error);
    return ApiResponse.error(res, 'Failed to fetch session', 500);
  }
});

/**
 * @route   GET /api/sessions/:sessionCode/leaderboard
 * @desc    Get current leaderboard
 * @access  Public
 */
router.get('/:sessionCode/leaderboard', async (req, res) => {
  try {
    const { sessionCode } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const session = await sessionManager.getSession(sessionCode);
    if (!session) {
      return ApiResponse.notFound(res, 'Session not found');
    }

    const leaderboard = await sessionManager.getLeaderboard(sessionCode, limit);

    return ApiResponse.success(res, {
      leaderboard,
      sessionCode,
      status: session.status,
    }, 'Leaderboard fetched successfully');
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    return ApiResponse.error(res, 'Failed to fetch leaderboard', 500);
  }
});

/**
 * @route   GET /api/sessions/:sessionCode/participants
 * @desc    Get all participants
 * @access  Public
 */
router.get('/:sessionCode/participants', async (req, res) => {
  try {
    const { sessionCode } = req.params;

    const session = await sessionManager.getSession(sessionCode);
    if (!session) {
      return ApiResponse.notFound(res, 'Session not found');
    }

    const participants = await sessionManager.getAllParticipants(sessionCode);

    res.json(
      ApiResponse.success({
        participants,
        count: participants.length,
      })
    );
  } catch (error) {
    logger.error('Error getting participants:', error);
    return ApiResponse.error(res, 'Failed to fetch participants', 500);
  }
});

/**
 * @route   DELETE /api/sessions/:sessionCode
 * @desc    Delete session (host only)
 * @access  Private
 */
router.delete('/:sessionCode', authenticateToken, async (req, res) => {
  try {
    const { sessionCode } = req.params;

    const session = await sessionManager.getSession(sessionCode);
    if (!session) {
      return ApiResponse.notFound(res, 'Session not found');
    }

    // Verify host
    if (session.hostId !== req.user.userId && req.user.role !== 'Admin') {
      return ApiResponse.forbidden(res, 'Only host can delete session');
    }

    // Delete from Redis
    await sessionManager.deleteSession(sessionCode);

    // Update MongoDB
    await LiveSession.findOneAndUpdate(
      { sessionCode },
      { status: 'cancelled', endedAt: new Date() }
    );

    logger.info(`Session deleted: ${sessionCode}`);

    return ApiResponse.success(res, { message: 'Session deleted successfully' }, 'Session deleted successfully');
  } catch (error) {
    logger.error('Error deleting session:', error);
    return ApiResponse.error(res, 'Failed to delete session', 500);
  }
});

/**
 * @route   GET /api/live-sessions/teacher/history
 * @desc    Get teacher's session history
 * @access  Private (Teacher)
 */
router.get('/teacher/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return ApiResponse.unauthorized(res, 'User not authenticated');
    }

    const sessions = await LiveSession.find({ hostId: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Transform sessions to include quiz title, participant count and duration
    const transformedSessions = sessions.map(session => ({
      ...session,
      quizTitle: session.quizMetadata?.title || 'Untitled Quiz',
      participantCount: session.participants?.length || 0,
      duration: session.endedAt 
        ? Math.floor((new Date(session.endedAt) - new Date(session.startedAt || session.createdAt)) / 1000)
        : 0
    }));

    return ApiResponse.success(res, { sessions: transformedSessions, count: transformedSessions.length }, 'Sessions fetched successfully');
  } catch (error) {
    logger.error('Error getting teacher history:', error);
    return ApiResponse.error(res, 'Failed to fetch session history', 500);
  }
});

/**
 * @route   GET /api/sessions/active
 * @desc    Get all active sessions
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const sessions = await LiveSession.findActiveSessions(20);

    res.json(
      ApiResponse.success({
        sessions,
        count: sessions.length,
      })
    );
  } catch (error) {
    logger.error('Error getting active sessions:', error);
    return ApiResponse.error(res, 'Failed to fetch sessions', 500);
  }
});

/**
 * @route   GET /api/sessions/:sessionCode/stats
 * @desc    Get session statistics
 * @access  Public
 */
router.get('/:sessionCode/stats', async (req, res) => {
  try {
    const { sessionCode } = req.params;

    const stats = await sessionManager.getSessionStats(sessionCode);
    
    if (!stats) {
      return ApiResponse.notFound(res, 'Session not found');
    }

    return ApiResponse.success(res, { stats }, 'Stats fetched successfully');
  } catch (error) {
    logger.error('Error getting session stats:', error);
    return ApiResponse.error(res, 'Failed to fetch stats', 500);
  }
});

module.exports = router;
