/**
 * Quiz CRUD Routes with Optimized Queries
 */

const express = require("express");
const ApiResponse = require("../../shared/utils/response");
const createLogger = require("../../shared/utils/logger");
const HttpClient = require("../../shared/utils/httpClient");
const {
  authenticateToken,
  optionalAuth,
} = require("../../shared/middleware/auth");
const { requireTeacher } = require("../../shared/middleware/roles");
const { validateFields } = require("../../shared/middleware/inputValidation");
const Quiz = require("../models/Quiz");
const User = require("../models/User"); // Load User model for population

const router = express.Router();
const logger = createLogger("quiz-routes");

// HTTP client for Result service
const resultServiceUrl =
  process.env.RESULT_SERVICE_URL || "http://localhost:3003";
const resultClient = new HttpClient("quiz-service", resultServiceUrl);

/**
 * @route   GET /api/quizzes
 * @desc    Get all quizzes with search and filters (optimized)
 * @access  Public
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      search,
      difficulty,
      category,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const result = await Quiz.searchQuizzes({
      search,
      difficulty,
      category,
      isPublic: true,
      page,
      limit,
      sortBy,
      sortOrder: sortOrder === "asc" ? 1 : -1,
    });

    return ApiResponse.success(res, result);
  } catch (error) {
    logger.error("Get quizzes error:", error);
    return ApiResponse.error(res, "Failed to fetch quizzes", 500);
  }
});

/**
 * @route   GET /api/quizzes/my-quizzes
 * @desc    Get current user's quizzes with accurate stats from Result service
 * @access  Private
 */
router.get("/my-quizzes", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "createdAt" } = req.query;

    const result = await Quiz.searchQuizzes({
      createdBy: req.user.userId,
      page,
      limit,
      sortBy,
      sortOrder: -1,
    });

    // Fetch accurate stats from Result service
    let teacherStats = { totalAttempts: 0, uniqueStudents: 0 };

    try {
      const statsResponse = await resultClient.get(
        "/api/analytics/teacher/stats",
        {
          headers: {
            "x-auth-token": req.headers["x-auth-token"],
          },
        }
      );

      if (statsResponse.data) {
        teacherStats = statsResponse.data.stats || teacherStats;
      }
    } catch (error) {
      logger.warn(
        "Failed to fetch teacher stats from Result service:",
        error.message
      );
    }

    const stats = {
      totalQuizzes: result.pagination.total,
      totalTakes: teacherStats.totalAttempts,
      uniqueStudents: teacherStats.uniqueStudents,
    };

    return ApiResponse.success(res, {
      ...result,
      stats,
    });
  } catch (error) {
    logger.error("Get my quizzes error:", error);
    return ApiResponse.error(res, "Failed to fetch your quizzes", 500);
  }
});

/**
 * @route   GET /api/quizzes/popular
 * @desc    Get popular quizzes
 * @access  Public
 */
router.get("/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const quizzes = await Quiz.getPopularQuizzes(limit);
    return ApiResponse.success(res, { quizzes });
  } catch (error) {
    logger.error("Get popular quizzes error:", error);
    return ApiResponse.error(res, "Failed to fetch popular quizzes", 500);
  }
});

/**
 * @route   GET /api/quizzes/recent
 * @desc    Get recent quizzes
 * @access  Public
 */
router.get("/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const quizzes = await Quiz.getRecentQuizzes(limit);
    return ApiResponse.success(res, { quizzes });
  } catch (error) {
    logger.error("Get recent quizzes error:", error);
    return ApiResponse.error(res, "Failed to fetch recent quizzes", 500);
  }
});

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get quiz by ID
 * @access  Public
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "createdBy",
      "name"
    );

    if (!quiz) {
      return res.status(404).json({ msg: "Quiz not found" });
    }

    // Check if user has access to private quiz
    if (
      !quiz.isPublic &&
      (!req.user || quiz.createdBy._id.toString() !== req.user.userId)
    ) {
      return res.status(403).json({ msg: "Access denied to private quiz" });
    }

    // Convert to JSON to apply transforms (correct_answer -> correctAnswer)
    const quizJSON = quiz.toJSON();

    // Return quiz directly to match monolith format
    res.json(quizJSON);
  } catch (error) {
    logger.error("Get quiz by ID error:", error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Quiz not found" });
    }
    res.status(500).send("Server Error");
  }
});

/**
 * @route   GET /api/quizzes/:id/questions
 * @desc    Get quiz for taking (without answers)
 * @access  Private
 */
router.get("/:id/student", authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "createdBy",
      "name picture"
    );

    if (!quiz) {
      return ApiResponse.notFound(res, "Quiz not found");
    }

    const studentVersion = quiz.getStudentVersion();
    return ApiResponse.success(res, { quiz: studentVersion });
  } catch (error) {
    logger.error("Get quiz questions error:", error);
    return ApiResponse.error(res, "Failed to fetch quiz", 500);
  }
});

/**
 * @route   POST /api/quizzes
 * @desc    Create manual quiz
 * @access  Private (Teacher)
 */
router.post(
  "/",
  authenticateToken,
  requireTeacher,
  validateFields({
    title: { required: true, type: "string", minLength: 3, maxLength: 200 },
    description: { type: "string", maxLength: 1000 },
    questions: { required: true, type: "array", minLength: 1 },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard", "Expert"] },
    category: { type: "string", maxLength: 50 },
  }),
  async (req, res) => {
    try {
      const {
        title,
        description,
        questions,
        difficulty,
        category,
        tags,
        isPublic,
        gameSettings,
      } = req.body;

      const quiz = new Quiz({
        title,
        description,
        questions,
        difficulty: difficulty || "Medium",
        category: category || "General",
        tags: tags || [],
        isPublic: isPublic !== undefined ? isPublic : true,
        gameSettings: gameSettings || {},
        createdBy: req.user.userId,
        generationMetadata: {
          method: "manual",
          generatedAt: new Date(),
        },
      });

      const savedQuiz = await quiz.save();
      logger.info(
        `Manual quiz created: ${savedQuiz._id} by user ${req.user.userId}`
      );

      return ApiResponse.created(res, { quiz: savedQuiz });
    } catch (error) {
      logger.error("Create quiz error:", error);
      return ApiResponse.error(res, "Failed to create quiz", 500);
    }
  }
);

/**
 * @route   PUT /api/quizzes/:id
 * @desc    Update quiz
 * @access  Private (Owner)
 */
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return ApiResponse.notFound(res, "Quiz not found");
    }

    if (
      quiz.createdBy.toString() !== req.user.userId &&
      req.user.role !== "Admin"
    ) {
      return ApiResponse.forbidden(res, "Not authorized to update this quiz");
    }

    const {
      title,
      description,
      questions,
      difficulty,
      category,
      tags,
      isPublic,
      gameSettings,
    } = req.body;

    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions) quiz.questions = questions;
    if (difficulty) quiz.difficulty = difficulty;
    if (category) quiz.category = category;
    if (tags) quiz.tags = tags;
    if (isPublic !== undefined) quiz.isPublic = isPublic;
    if (gameSettings) quiz.gameSettings = gameSettings;

    const updatedQuiz = await quiz.save();
    logger.info(`Quiz updated: ${updatedQuiz._id}`);

    return ApiResponse.success(res, { quiz: updatedQuiz });
  } catch (error) {
    logger.error("Update quiz error:", error);
    return ApiResponse.error(res, "Failed to update quiz", 500);
  }
});

/**
 * @route   DELETE /api/quizzes/:id
 * @desc    Delete quiz
 * @access  Private (Owner/Admin)
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return ApiResponse.notFound(res, "Quiz not found");
    }

    if (
      quiz.createdBy.toString() !== req.user.userId &&
      req.user.role !== "Admin"
    ) {
      return ApiResponse.forbidden(res, "Not authorized to delete this quiz");
    }

    await quiz.deleteOne();
    logger.info(`Quiz deleted: ${req.params.id}`);

    return ApiResponse.success(res, { message: "Quiz deleted successfully" });
  } catch (error) {
    logger.error("Delete quiz error:", error);
    return ApiResponse.error(res, "Failed to delete quiz", 500);
  }
});

/**
 * @route   GET /api/quizzes/:quizId/leaderboard
 * @desc    Get quiz leaderboard (top 10 players)
 * @access  Public
 */
router.get("/:quizId/leaderboard", async (req, res) => {
  try {
    const { quizId } = req.params;
    const mongoose = require("mongoose");

    // Query database directly using monolith schema
    const leaderboard = await mongoose.connection.db
      .collection("results")
      .aggregate([
        // 1. Match all results for the specific quiz
        { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
        // 2. Sort by score (highest first) and then by time (quickest first)
        { $sort: { score: -1, createdAt: 1 } },
        // 3. Group by user, taking only their first (and best) score
        {
          $group: {
            _id: "$user",
            highestScore: { $first: "$score" },
            totalQuestions: { $first: "$totalQuestions" },
            date: { $first: "$createdAt" },
          },
        },
        // 4. Sort the unique user scores again
        { $sort: { highestScore: -1, date: 1 } },
        // 5. Limit to the top 10 players
        { $limit: 10 },
        // 6. Join with the Users collection to get the user's name
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        // 7. Reshape the output
        {
          $project: {
            _id: 0,
            score: "$highestScore",
            totalQuestions: "$totalQuestions",
            userName: { $arrayElemAt: ["$userDetails.name", 0] },
          },
        },
      ])
      .toArray();

    res.json(leaderboard);
  } catch (error) {
    logger.error("Fetch leaderboard error:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
