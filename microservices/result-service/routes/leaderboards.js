/**
 * Leaderboard Routes with Redis Caching
 * Optimized for fast queries with cache-first strategy
 */

const express = require('express');
const ApiResponse = require('../../shared/utils/response');
const createLogger = require('../../shared/utils/logger');
const { optionalAuth } = require('../../shared/middleware/auth');
const Result = require('../models/Result');
const cacheManager = require('../services/cacheManager');

const router = express.Router();
const logger = createLogger('leaderboard-routes');

/**
 * @route   GET /api/leaderboards/quiz/:quizId
 * @desc    Get quiz leaderboard (cached)
 * @access  Public
 */
router.get('/quiz/:quizId', optionalAuth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Check cache first
    let leaderboard = await cacheManager.getCachedQuizLeaderboard(quizId, limit);

    if (!leaderboard) {
      // Cache miss - query database
      logger.debug(`Querying quiz leaderboard for ${quizId}`);
      leaderboard = await Result.getQuizLeaderboard(quizId, limit);

      // Add rank numbers
      leaderboard = leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      // Cache the result
      await cacheManager.cacheQuizLeaderboard(quizId, leaderboard, limit);
    }

    res.json(
      ApiResponse.success({
        leaderboard,
        cached: !!leaderboard,
        limit,
      })
    );
  } catch (error) {
    logger.error('Get quiz leaderboard error:', error);
    return ApiResponse.error(res, 'Failed to fetch leaderboard', 500);
  }
});

/**
 * @route   GET /api/leaderboards/global
 * @desc    Get global leaderboard (all quizzes)
 * @access  Public
 */
router.get('/global', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    // Check cache first
    let leaderboard = await cacheManager.getCachedGlobalLeaderboard(limit);

    if (!leaderboard) {
      // Cache miss - query database
      logger.debug('Querying global leaderboard');
      leaderboard = await Result.getGlobalLeaderboard(limit);

      // Add rank numbers
      leaderboard = leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      // Cache the result
      await cacheManager.cacheGlobalLeaderboard(leaderboard, limit);
    }

    res.json(
      ApiResponse.success({
        leaderboard,
        cached: !!leaderboard,
        limit,
      })
    );
  } catch (error) {
    logger.error('Get global leaderboard error:', error);
    return ApiResponse.error(res, 'Failed to fetch global leaderboard', 500);
  }
});

/**
 * @route   GET /api/leaderboards/user/:userId/rank
 * @desc    Get user's rank in specific quiz
 * @access  Public
 */
router.get('/user/:userId/rank', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { quizId } = req.query;

    if (!quizId) {
      return ApiResponse.badRequest(res, 'quizId query parameter required');
    }

    // Find user's best attempt for this quiz
    const userResult = await Result.findOne({ userId, quizId })
      .sort({ score: -1, totalTimeSpent: 1 })
      .lean();

    if (!userResult) {
      return res.json(
        ApiResponse.success({
          rank: null,
          message: 'User has not attempted this quiz',
        })
      );
    }

    // Count how many users scored higher (or same score but faster)
    const rank = await Result.countDocuments({
      quizId,
      $or: [
        { score: { $gt: userResult.score } },
        {
          score: userResult.score,
          totalTimeSpent: { $lt: userResult.totalTimeSpent },
        },
      ],
    }) + 1;

    res.json(
      ApiResponse.success({
        rank,
        score: userResult.score,
        maxScore: userResult.maxScore,
        percentage: userResult.percentage,
        totalAttempts: await Result.countDocuments({ quizId }),
      })
    );
  } catch (error) {
    logger.error('Get rank error:', error);
    return ApiResponse.error(res, 'Failed to fetch rank', 500);
  }
});

module.exports = router;
