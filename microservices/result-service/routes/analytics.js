/**
 * Analytics Routes
 * User statistics and quiz analytics with caching
 */

const express = require("express");
const mongoose = require("mongoose");
const ApiResponse = require("../../shared/utils/response");
const createLogger = require("../../shared/utils/logger");
const { authenticateToken } = require("../../shared/middleware/auth");
const Result = require("../models/Result");
const cacheManager = require("../services/cacheManager");

const router = express.Router();
const logger = createLogger("analytics-routes");

/**
 * @route   GET /api/analytics/user/:userId/stats
 * @desc    Get user performance statistics (cached)
 * @access  Private
 */
router.get("/user/:userId/stats", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can only access their own stats (unless admin)
    if (userId !== req.user.userId && req.user.role !== "Admin") {
      return ApiResponse.forbidden(res, "Access denied");
    }

    // Check cache first
    let stats = await cacheManager.getCachedUserStats(userId);

    if (!stats) {
      // Cache miss - query database
      logger.debug(`Querying user stats for ${userId}`);
      stats = await Result.getUserStats(userId);

      // Cache the result
      await cacheManager.cacheUserStats(userId, stats);
    }

    res.json(
      ApiResponse.success({
        stats,
        cached: !!stats,
      })
    );
  } catch (error) {
    logger.error("Get user statistics error:", error);
    return ApiResponse.error(res, "Failed to fetch user statistics", 500);
  }
});

/**
 * @route   GET /api/analytics/user/:userId/history
 * @desc    Get user's quiz attempt history
 * @access  Private
 */
router.get("/user/:userId/history", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify access
    if (userId !== req.user.userId && req.user.role !== "Admin") {
      return ApiResponse.forbidden(res, "Access denied");
    }

    // Query with pagination
    const results = await Result.find({ userId })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("quizId", "title difficulty category")
      .lean();

    const total = await Result.countDocuments({ userId });

    res.json(
      ApiResponse.success({
        results,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      })
    );
  } catch (error) {
    logger.error("Get user history error:", error);
    return ApiResponse.error(res, "Failed to fetch history", 500);
  }
});

/**
 * @route   GET /api/analytics/quiz/:quizId
 * @desc    Get quiz analytics (for quiz creators)
 * @access  Private
 */
router.get("/quiz/:quizId", authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;

    // Check cache first
    let analytics = await cacheManager.getCachedQuizAnalytics(quizId);

    if (!analytics) {
      // Cache miss - query database
      logger.debug(`Querying quiz analytics for ${quizId}`);
      const result = await Result.getQuizAnalytics(quizId);
      analytics = result[0] || null;

      if (analytics) {
        // Cache the result
        await cacheManager.cacheQuizAnalytics(quizId, analytics);
      }
    }

    if (!analytics) {
      return res.json(
        ApiResponse.success({
          message: "No attempts yet for this quiz",
          analytics: null,
        })
      );
    }

    res.json(
      ApiResponse.success({
        analytics,
        cached: !!analytics,
      })
    );
  } catch (error) {
    logger.error("Get quiz analytics error:", error);
    return ApiResponse.error(res, "Failed to fetch quiz analytics", 500);
  }
});

/**
 * @route   GET /api/analytics/result/:resultId
 * @desc    Get detailed result analysis
 * @access  Private
 */
router.get("/result/:resultId", authenticateToken, async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId)
      .populate("quizId", "title difficulty category questions")
      .populate("userId", "name email picture");

    if (!result) {
      return ApiResponse.notFound(res, "Result not found");
    }

    // Verify access
    if (
      result.userId._id.toString() !== req.user.userId &&
      req.user.role !== "Admin"
    ) {
      return ApiResponse.forbidden(res, "Access denied");
    }

    const analysis = result.getDetailedAnalysis();

    res.json(
      ApiResponse.success({
        result: {
          ...result.toObject(),
          analysis,
        },
      })
    );
  } catch (error) {
    logger.error("Get result detail error:", error);
    return ApiResponse.error(res, "Failed to fetch result", 500);
  }
});

/**
 * @route   GET /api/analytics/comparison
 * @desc    Compare user performance across quizzes
 * @access  Private
 */
router.get("/comparison", authenticateToken, async (req, res) => {
  try {
    const { userId, quizIds } = req.query;

    if (!userId || !quizIds) {
      return res
        .status(400)
        .json(
          ApiResponse.badRequest("userId and quizIds query parameters required")
        );
    }

    // Verify access
    if (userId !== req.user.userId && req.user.role !== "Admin") {
      return ApiResponse.forbidden(res, "Access denied");
    }

    const quizIdArray = quizIds.split(",");

    const comparison = await Result.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          quizId: { $in: quizIdArray.map((id) => mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: "$quizId",
          attempts: { $sum: 1 },
          bestScore: { $max: "$percentage" },
          averageScore: { $avg: "$percentage" },
          totalTime: { $sum: "$totalTimeSpent" },
          avgTime: { $avg: "$totalTimeSpent" },
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "_id",
          as: "quiz",
        },
      },
      { $unwind: "$quiz" },
      {
        $project: {
          quizId: "$_id",
          quizTitle: "$quiz.title",
          attempts: 1,
          bestScore: { $round: ["$bestScore", 2] },
          averageScore: { $round: ["$averageScore", 2] },
          totalTime: 1,
          avgTime: { $round: ["$avgTime", 0] },
        },
      },
    ]);

    res.json(ApiResponse.success({ comparison }));
  } catch (error) {
    logger.error("Get comparison error:", error);
    return ApiResponse.error(res, "Failed to fetch comparison", 500);
  }
});

/**
 * @route   GET /api/analytics/teacher/stats
 * @desc    Get teacher's overall statistics across all their quizzes
 * @access  Private (Teacher only)
 */
router.get("/teacher/stats", authenticateToken, async (req, res) => {
  try {
    const creatorId = req.user.userId;

    // Convert to ObjectId if it's a string
    const creatorObjectId = mongoose.Types.ObjectId.isValid(creatorId)
      ? typeof creatorId === "string"
        ? new mongoose.Types.ObjectId(creatorId)
        : creatorId
      : creatorId;

    // Get all results for this teacher's quizzes
    // IMPORTANT: Handle both old (user, quiz) and new (userId, quizId) field names for backward compatibility
    const stats = await Result.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId", // Try new field name first
          foreignField: "_id",
          as: "quizNew",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz", // Also try old field name
          foreignField: "_id",
          as: "quizOld",
        },
      },
      {
        $addFields: {
          // Use whichever lookup succeeded
          quizData: {
            $cond: {
              if: { $gt: [{ $size: "$quizNew" }, 0] },
              then: { $arrayElemAt: ["$quizNew", 0] },
              else: { $arrayElemAt: ["$quizOld", 0] },
            },
          },
          // Handle both userId and user fields
          studentId: {
            $ifNull: ["$userId", "$user"],
          },
        },
      },
      {
        $match: {
          "quizData.createdBy": creatorObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          uniqueStudents: { $addToSet: "$studentId" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAttempts: 1,
          uniqueStudents: { $size: "$uniqueStudents" },
        },
      },
    ]);

    const result = stats[0] || { totalAttempts: 0, uniqueStudents: 0 };

    logger.info(`Teacher stats for ${creatorId}:`, result);

    return ApiResponse.success(res, { stats: result });
  } catch (error) {
    logger.error("Get teacher stats error:", error);
    return ApiResponse.error(res, "Failed to fetch teacher statistics", 500);
  }
});
module.exports = router;
