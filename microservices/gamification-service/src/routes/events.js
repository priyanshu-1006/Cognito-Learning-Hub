const express = require('express');
const router = express.Router();
const statsManager = require('../services/statsManager');
const leaderboardManager = require('../services/leaderboardManager');
const { queueAchievementCheck } = require('../config/queue');

/**
 * POST /api/events/quiz-completed
 * Event from Quiz Service when a quiz is completed
 */
router.post('/quiz-completed', async (req, res, next) => {
  try {
    const { userId, quizId, resultData } = req.body;

    if (!userId || !resultData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, resultData',
      });
    }

    // Update stats (non-blocking)
    const statsPromise = statsManager.updateStats(userId, resultData);

    // Update average score
    const avgScorePromise = statsManager.updateAverageScore(userId, resultData.percentage);

    // Record activity for streak tracking
    const activityPromise = statsManager.recordActivity(userId);

    // Queue achievement check (async)
    const achievementPromise = queueAchievementCheck(userId, {
      type: 'quiz_completed',
      quizId,
      ...resultData,
    });

    // Wait for all operations
    await Promise.all([
      statsPromise,
      avgScorePromise,
      activityPromise,
      achievementPromise,
    ]);

    res.json({
      success: true,
      message: 'Quiz completion event processed',
    });
  } catch (error) {
    console.error('Error processing quiz completion event:', error);
    next(error);
  }
});

/**
 * POST /api/events/result-saved
 * Event from Result Service when results are saved
 */
router.post('/result-saved', async (req, res, next) => {
  try {
    const { userId, resultId, resultData } = req.body;

    if (!userId || !resultData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, resultData',
      });
    }

    // Update leaderboards
    const stats = await statsManager.getStats(userId);
    await leaderboardManager.updateUserScore(
      userId,
      stats.totalPoints,
      resultData.category
    );

    res.json({
      success: true,
      message: 'Result saved event processed',
    });
  } catch (error) {
    console.error('Error processing result saved event:', error);
    next(error);
  }
});

/**
 * POST /api/events/live-session-ended
 * Event from Live Service when a live session ends
 */
router.post('/live-session-ended', async (req, res, next) => {
  try {
    const { sessionId, participants } = req.body;

    if (!sessionId || !participants) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, participants',
      });
    }

    // Update stats for all participants
    for (const participant of participants) {
      await statsManager.updateStats(participant.userId, {
        pointsEarned: participant.points || 0,
        bonusPoints: participant.bonusPoints || 0,
        passed: participant.rank <= 3, // Top 3 considered "passed"
        percentage: participant.accuracy || 0,
        totalTimeTaken: participant.totalTime || 0,
        experienceGained: participant.experience || 0,
      });

      // Queue achievement check
      await queueAchievementCheck(participant.userId, {
        type: 'live_session',
        sessionId,
        rank: participant.rank,
        points: participant.points,
      });
    }

    res.json({
      success: true,
      message: 'Live session ended event processed',
      participantsProcessed: participants.length,
    });
  } catch (error) {
    console.error('Error processing live session ended event:', error);
    next(error);
  }
});

/**
 * POST /api/events/quiz-created
 * Event when user creates a quiz
 */
router.post('/quiz-created', async (req, res, next) => {
  try {
    const { userId, quizId, category } = req.body;

    if (!userId || !quizId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, quizId',
      });
    }

    // Update stats
    const { UserStats } = require('../models/Achievement');
    await UserStats.findOneAndUpdate(
      { user: userId },
      { $inc: { totalQuizzesCreated: 1 } },
      { upsert: true }
    );

    // Queue achievement check for quiz creation
    await queueAchievementCheck(userId, {
      type: 'quiz_created',
      quizId,
      category,
    });

    res.json({
      success: true,
      message: 'Quiz created event processed',
    });
  } catch (error) {
    console.error('Error processing quiz created event:', error);
    next(error);
  }
});

/**
 * POST /api/events/social-interaction
 * Event from Social Service (likes, comments, shares)
 */
router.post('/social-interaction', async (req, res, next) => {
  try {
    const { userId, interactionType } = req.body;

    if (!userId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, interactionType',
      });
    }

    // Queue achievement check for social interactions
    await queueAchievementCheck(userId, {
      type: 'social_interaction',
      interactionType,
    });

    res.json({
      success: true,
      message: 'Social interaction event processed',
    });
  } catch (error) {
    console.error('Error processing social interaction event:', error);
    next(error);
  }
});

/**
 * GET /api/events/health
 * Check event handler health
 */
router.get('/health', async (req, res) => {
  const { getQueueStatus } = require('../config/queue');
  
  try {
    const queueStatus = await getQueueStatus();

    res.json({
      success: true,
      service: 'event-handlers',
      queues: queueStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking event handler health',
      error: error.message,
    });
  }
});

module.exports = router;
