/**
 * Result Submission Routes
 * Handles quiz result submission with cache invalidation
 */

const express = require('express');
const ApiResponse = require('../../shared/utils/response');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const { validateFields } = require('../../shared/middleware/inputValidation');
const Result = require('../models/Result');
const cacheManager = require('../services/cacheManager');

const router = express.Router();
const logger = createLogger('submission-routes');

/**
 * @route   POST /api/results/submit
 * @desc    Submit quiz result
 * @access  Private
 */
router.post(
  '/submit',
  authenticateToken,
  validateFields({
    quizId: { required: true, type: 'objectId' },
    answers: { required: true, type: 'array', minLength: 1 },
    startedAt: { required: true, type: 'string' },
    completedAt: { required: true, type: 'string' },
    sessionId: { type: 'objectId' },
  }),
  async (req, res) => {
    try {
      const {
        quizId,
        sessionId,
        answers,
        startedAt,
        completedAt,
        quizMetadata,
      } = req.body;

    // Calculate metrics
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(ans => ans.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const score = answers.reduce((sum, ans) => sum + (ans.points || 0), 0);
    const maxScore = answers.reduce((sum, ans) => sum + (ans.points || 10), 0); // Assume 10 if not provided
    
    const startTime = new Date(startedAt);
    const endTime = new Date(completedAt);
    const totalTimeSpent = endTime - startTime;
    
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

    // Create result
    const result = new Result({
      userId: req.user.userId,
      quizId,
      sessionId: sessionId || null,
      isMultiplayer: !!sessionId,
      score,
      maxScore,
      percentage,
      correctAnswers,
      incorrectAnswers,
      totalQuestions,
      startedAt: startTime,
      completedAt: endTime,
      totalTimeSpent,
      averageTimePerQuestion,
      answers,
      quizMetadata: quizMetadata || {},
    });

    await result.save();
    logger.info(`Result submitted: ${result._id} by user ${req.user.userId} for quiz ${quizId}`);

    // Notify gamification service (non-blocking)
    const axios = require('axios');
    const GAMIFICATION_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3007';
    axios.post(`${GAMIFICATION_URL}/api/events/quiz-completed`, {
      userId: req.user.userId,
      quizId,
      resultData: {
        percentage: (correctAnswers / totalQuestions) * 100,
        pointsEarned: score,
        bonusPoints: 0,
        totalTimeTaken: totalTimeSpent / 1000, // Convert to seconds
        passed: correctAnswers / totalQuestions >= 0.6, // 60% passing
        experienceGained: Math.round(score / 10),
        category: quizMetadata?.category || 'General'
      }
    }).catch(err => {
      logger.error('Gamification notification failed:', err.message);
    });

    // Invalidate related caches asynchronously (don't block response)
    cacheManager.invalidateResultCaches(req.user.userId, quizId)
      .catch(err => logger.error('Cache invalidation error:', err));

    res.status(201).json(
      ApiResponse.created({
        result: result.getSummary(),
        analysis: result.getDetailedAnalysis(),
      })
    );
  } catch (error) {
    logger.error('Submit result error:', error);
    return ApiResponse.error(res, 'Failed to submit result', 500);
  }
});

/**
 * @route   POST /api/results/batch-submit
 * @desc    Batch submit results (for multiplayer sessions)
 * @access  Private (Server-to-server)
 */
router.post('/batch-submit', authenticateToken, async (req, res) => {
  try {
    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return ApiResponse.badRequest(res, 'Results array required');
    }

    // Validate and prepare results
    const preparedResults = results.map(r => {
      const totalQuestions = r.answers.length;
      const correctAnswers = r.answers.filter(ans => ans.isCorrect).length;
      const score = r.answers.reduce((sum, ans) => sum + (ans.points || 0), 0);
      const maxScore = r.answers.reduce((sum, ans) => sum + (ans.points || 10), 0);
      const totalTimeSpent = new Date(r.completedAt) - new Date(r.startedAt);
      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;
      
      return {
        userId: r.userId,
        quizId: r.quizId,
        sessionId: r.sessionId,
        isMultiplayer: true,
        score,
        maxScore,
        percentage,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        totalQuestions,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        totalTimeSpent,
        averageTimePerQuestion,
        answers: r.answers,
        quizMetadata: r.quizMetadata || {},
      };
    });

    // Batch insert
    const savedResults = await Result.batchInsert(preparedResults);
    logger.info(`Batch inserted ${savedResults.length} results`);

    // Notify gamification service about batch results (non-blocking)
    const axios = require('axios');
    const GAMIFICATION_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3007';
    for (const result of results) {
      axios.post(`${GAMIFICATION_URL}/api/events/result-saved`, {
        userId: result.userId,
        resultId: result._id,
        resultData: {
          category: result.quizMetadata?.category || 'General',
          totalPoints: result.score
        }
      }).catch(err => {
        logger.error('Gamification leaderboard update failed:', err.message);
      });
    }

    // Invalidate caches for affected quizzes and users
    const uniqueQuizIds = [...new Set(results.map(r => r.quizId))];
    const uniqueUserIds = [...new Set(results.map(r => r.userId))];
    
    Promise.all([
      ...uniqueQuizIds.map(qid => cacheManager.invalidateQuizLeaderboard(qid)),
      ...uniqueQuizIds.map(qid => cacheManager.invalidateQuizAnalytics(qid)),
      ...uniqueUserIds.map(uid => cacheManager.invalidateUserStats(uid)),
      cacheManager.invalidateGlobalLeaderboard(),
    ]).catch(err => logger.error('Batch cache invalidation error:', err));

    res.status(201).json(
      ApiResponse.created({
        message: `Successfully saved ${savedResults.length} results`,
        count: savedResults.length,
      })
    );
  } catch (error) {
    logger.error('Batch submit error:', error);
    return ApiResponse.error(res, 'Failed to batch submit results', 500);
  }
});

/**
 * @route   GET /api/results/my-results
 * @desc    Get user's quiz results
 * @access  Private
 */
router.get('/my-results', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const mongoose = require('mongoose');

    // Query database directly using monolith field names 'user' and 'quiz'
    const results = await mongoose.connection.db.collection('results')
      .aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'quizzes',
            localField: 'quiz',
            foreignField: '_id',
            as: 'quiz'
          }
        },
        { $unwind: { path: '$quiz', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            quiz: { _id: 1, title: 1 },
            score: 1,
            totalQuestions: 1,
            percentage: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ]).toArray();

    res.json(results);
  } catch (error) {
    logger.error('Fetch my-results error:', error);
    return ApiResponse.error(res, 'Failed to fetch results', 500);
  }
});

module.exports = router;
