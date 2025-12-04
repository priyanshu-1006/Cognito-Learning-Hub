/**
 * Socket.IO Event Handlers for Live Sessions
 * Optimized with Redis session storage and batched leaderboard updates
 */

const { nanoid } = require("nanoid");
const mongoose = require("mongoose");
const createLogger = require("../../shared/utils/logger");
const sessionManager = require("../services/sessionManager");
const LiveSession = require("../models/LiveSession");

const logger = createLogger("socket-handlers");
const QUIZ_SERVICE_URL =
  process.env.QUIZ_SERVICE_URL || "http://localhost:3005";

// Batched leaderboard updates
const leaderboardUpdateQueue = new Map();
const updateInterval =
  parseInt(process.env.LEADERBOARD_UPDATE_INTERVAL) || 2000;
let ioInstance = null; // Store io instance globally

// Periodic leaderboard broadcast
setInterval(() => {
  for (const [sessionCode, needsUpdate] of leaderboardUpdateQueue.entries()) {
    if (needsUpdate && ioInstance) {
      broadcastLeaderboard(sessionCode, ioInstance);
      leaderboardUpdateQueue.set(sessionCode, false);
    }
  }
}, updateInterval);

/**
 * Broadcast leaderboard to all participants (batched)
 */
async function broadcastLeaderboard(sessionCode, io) {
  try {
    const leaderboard = await sessionManager.getLeaderboard(sessionCode);

    if (io) {
      io.to(sessionCode).emit("leaderboard-updated", { leaderboard });
    } else {
      // Use pub/sub if no io instance
      await sessionManager.publishToSession(
        sessionCode,
        "leaderboard-updated",
        { leaderboard }
      );
    }

    logger.debug(`Broadcasted leaderboard for session ${sessionCode}`);
  } catch (error) {
    logger.error("Error broadcasting leaderboard:", error);
  }
}

/**
 * Initialize Socket.IO handlers
 */
function initializeSocketHandlers(io) {
  // Store io instance globally for leaderboard broadcasting
  ioInstance = io;

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // ============================================
    // CREATE SESSION
    // ============================================
    socket.on("create-session", async (data, callback) => {
      try {
        const { quizId, hostId, settings } = data;

        if (!quizId || !hostId) {
          return callback({
            success: false,
            error: "quizId and hostId required",
          });
        }

        // Fetch quiz details from quiz service
        const quizResponse = await fetch(
          `${QUIZ_SERVICE_URL}/api/quizzes/${quizId}`
        );
        if (!quizResponse.ok) {
          return callback({ success: false, error: "Quiz not found" });
        }

        const quiz = await quizResponse.json();

        // Log quiz data structure for debugging
        logger.debug(
          `Quiz fetched - Title: ${quiz.title}, Questions: ${quiz.questions?.length}`
        );
        if (quiz.questions && quiz.questions.length > 0) {
          const firstQ = quiz.questions[0];
          logger.debug(
            `First question fields: ${Object.keys(firstQ).join(", ")}`
          );
          logger.debug(
            `First question has correctAnswer: ${!!firstQ.correctAnswer}, has correct_answer: ${!!firstQ.correct_answer}`
          );
        }

        // Generate unique session code
        const codeLength = 6;
        let sessionCode;
        let isUnique = false;

        for (let i = 0; i < 5; i++) {
          sessionCode = nanoid(codeLength).toUpperCase();
          const existing = await sessionManager.getSession(sessionCode);
          if (!existing) {
            isUnique = true;
            break;
          }
        }

        if (!isUnique) {
          return callback({
            success: false,
            error: "Failed to generate unique session code",
          });
        }

        // Create session in Redis
        const session = await sessionManager.createSession({
          sessionCode,
          quizId: new mongoose.Types.ObjectId(quizId),
          hostId: new mongoose.Types.ObjectId(hostId),
          maxParticipants: settings?.maxParticipants || 50,
          settings: settings || {
            timePerQuestion: 30,
            showLeaderboardAfterEach: true,
            allowLateJoin: false,
          },
          quizMetadata: {
            title: quiz.title,
            totalQuestions: quiz.questions?.length || 0,
            difficulty: quiz.difficulty,
          },
        });

        // Cache quiz in Redis
        await sessionManager.cacheQuiz(sessionCode, quiz);

        // Create in MongoDB (for recovery)
        const dbSession = new LiveSession({
          sessionCode,
          quizId: new mongoose.Types.ObjectId(quizId),
          hostId: new mongoose.Types.ObjectId(hostId),
          maxParticipants: session.maxParticipants,
          settings: session.settings,
          quizMetadata: session.quizMetadata,
        });
        await dbSession.save();

        // Join socket room
        socket.join(sessionCode);
        socket.sessionCode = sessionCode;

        logger.info(`Session created: ${sessionCode} by host ${hostId}`);

        callback({
          success: true,
          sessionCode,
          sessionId: dbSession._id.toString(),
          session,
        });
      } catch (error) {
        logger.error("Error creating session:", error);
        callback({
          success: false,
          error: error.message || "Failed to create session",
        });
      }
    });

    // ============================================
    // JOIN SESSION
    // ============================================
    socket.on(
      "join-session",
      async ({ sessionCode, userId, userName, userPicture }, callback) => {
        try {
          const session = await sessionManager.getSession(sessionCode);

          if (!session) {
            if (callback)
              callback({ success: false, error: "Session not found" });
            socket.emit("error", { message: "Session not found" });
            return;
          }

          // Check if session is full
          const participantCount = await sessionManager.getParticipantCount(
            sessionCode
          );
          if (participantCount >= session.maxParticipants) {
            if (callback)
              callback({ success: false, error: "Session is full" });
            socket.emit("error", { message: "Session is full" });
            return;
          }

          // Check if late join is allowed
          if (session.status === "active" && !session.settings.allowLateJoin) {
            if (callback)
              callback({
                success: false,
                error: "Session already started, late join not allowed",
              });
            socket.emit("error", {
              message: "Session already started, late join not allowed",
            });
            return;
          }

          // Add participant to Redis
          logger.info(
            `[Join] Adding participant - userId: ${userId}, userName: ${userName}, userPicture: ${userPicture}`
          );
          const participant = await sessionManager.addParticipant(sessionCode, {
            userId,
            userName,
            userPicture,
            socketId: socket.id,
          });
          logger.info(`[Join] Participant added:`, participant);

          // Join Socket.IO room
          socket.join(sessionCode);
          socket.sessionCode = sessionCode;
          socket.userId = userId;

          // Send current session state
          const currentParticipants = await sessionManager.getAllParticipants(
            sessionCode
          );
          const leaderboard = await sessionManager.getLeaderboard(sessionCode);

          logger.info(`[Join] Emitting session-joined to ${socket.id}`);
          socket.emit("session-joined", {
            session,
            participant,
            participants: currentParticipants,
            leaderboard,
          });

          // Notify others
          logger.info(
            `[Join] Broadcasting participant-joined to room ${sessionCode}:`,
            {
              participant,
              participantCount: currentParticipants.length,
            }
          );
          io.to(sessionCode).emit("participant-joined", {
            participant,
            participantCount: currentParticipants.length,
          });

          // Send success callback
          if (callback) {
            callback({
              success: true,
              session,
              participant,
            });
          }

          logger.info(`User ${userId} joined session ${sessionCode}`);
        } catch (error) {
          logger.error("Error joining session:", error);
          if (callback)
            callback({
              success: false,
              error: error.message || "Failed to join session",
            });
          socket.emit("error", { message: "Failed to join session" });
        }
      }
    );

    // ============================================
    // START SESSION (Host only)
    // ============================================
    socket.on("start-session", async ({ sessionCode, userId }) => {
      try {
        const session = await sessionManager.getSession(sessionCode);

        if (!session) {
          socket.emit("error", { message: "Session not found" });
          return;
        }

        if (session.hostId !== userId) {
          socket.emit("error", { message: "Only host can start session" });
          return;
        }

        // Update session status
        await sessionManager.updateSession(sessionCode, {
          status: "active",
          startedAt: new Date().toISOString(),
          currentQuestionIndex: 0,
        });

        // Broadcast to all participants
        io.to(sessionCode).emit("session-started", {
          message: "Session started!",
          startedAt: new Date().toISOString(),
        });

        // Start first question
        setTimeout(() => {
          startQuestion(sessionCode, 0, io);
        }, 3000); // 3 second delay

        logger.info(`Session ${sessionCode} started by host ${userId}`);
      } catch (error) {
        logger.error("Error starting session:", error);
        socket.emit("error", { message: "Failed to start session" });
      }
    });

    // ============================================
    // SUBMIT ANSWER
    // ============================================
    socket.on(
      "submit-answer",
      async ({
        sessionCode,
        userId,
        questionId,
        selectedAnswer,
        timeSpent,
      }) => {
        try {
          const session = await sessionManager.getSession(sessionCode);

          if (!session || session.status !== "active") {
            socket.emit("error", { message: "Session not active" });
            return;
          }

          // Get quiz from cache
          const quiz = await sessionManager.getCachedQuiz(sessionCode);
          if (!quiz) {
            socket.emit("error", { message: "Quiz not found" });
            return;
          }

          const question = quiz.questions.find(
            (q) => q._id.toString() === questionId.toString()
          );
          if (!question) {
            logger.error(
              `Question not found. QuestionId: ${questionId}, Available IDs: ${quiz.questions
                .map((q) => q._id)
                .join(", ")}`
            );
            socket.emit("error", { message: "Question not found" });
            return;
          }

          // Log the raw question object to debug field names
          logger.debug(
            `Raw question object keys: ${Object.keys(question).join(", ")}`
          );
          logger.debug(
            `Question data: correctAnswer="${question.correctAnswer}", correct_answer="${question.correct_answer}"`
          );

          // Check answer correctness (case-insensitive, trimmed comparison)
          // Support both correctAnswer and correct_answer field names for backward compatibility
          const correctAnswer = (
            question.correctAnswer ||
            question.correct_answer ||
            ""
          )
            .toString()
            .trim();
          const userAnswer = (selectedAnswer || "").toString().trim();
          const isCorrect =
            correctAnswer.toLowerCase() === userAnswer.toLowerCase();
          const points = isCorrect ? question.points || 10 : 0;

          logger.info(
            `Answer check - Question: ${question.question.substring(
              0,
              50
            )}..., Correct: "${correctAnswer}", User: "${userAnswer}", Match: ${isCorrect}`
          );

          // Record answer in Redis
          await sessionManager.recordAnswer(sessionCode, {
            userId,
            questionId,
            selectedAnswer,
            isCorrect,
            points,
            timeSpent,
          });

          // Update participant stats
          const participant = await sessionManager.getParticipant(
            sessionCode,
            userId
          );
          await sessionManager.updateParticipant(sessionCode, userId, {
            score: participant.score + points,
            correctAnswers: participant.correctAnswers + (isCorrect ? 1 : 0),
            incorrectAnswers:
              participant.incorrectAnswers + (isCorrect ? 0 : 1),
          });

          // Update leaderboard (atomic operation - O(log N))
          await sessionManager.updateLeaderboard(sessionCode, userId, points);

          // Send feedback to user FIRST
          socket.emit("answer-submitted", {
            isCorrect,
            points,
            correctAnswer: question.correctAnswer || question.correct_answer,
          });

          // Immediately broadcast updated leaderboard to all participants
          await broadcastLeaderboard(sessionCode, io);

          // Also mark for batched update as backup
          leaderboardUpdateQueue.set(sessionCode, true);

          logger.debug(
            `Answer submitted by ${userId} in session ${sessionCode}`
          );
        } catch (error) {
          logger.error("Error submitting answer:", error);
          socket.emit("error", { message: "Failed to submit answer" });
        }
      }
    );

    // ============================================
    // NEXT QUESTION (Host only)
    // ============================================
    socket.on("next-question", async ({ sessionCode, userId }) => {
      try {
        const session = await sessionManager.getSession(sessionCode);

        if (!session || session.hostId !== userId) {
          socket.emit("error", { message: "Only host can advance questions" });
          return;
        }

        const nextIndex = session.currentQuestionIndex + 1;
        const quiz = await sessionManager.getCachedQuiz(sessionCode);

        if (!quiz || nextIndex >= quiz.questions.length) {
          // End session
          await endSession(sessionCode, io);
          return;
        }

        // Update current question
        await sessionManager.updateSession(sessionCode, {
          currentQuestionIndex: nextIndex,
        });

        // Start next question
        startQuestion(sessionCode, nextIndex, io);

        logger.info(
          `Session ${sessionCode} advanced to question ${nextIndex + 1}`
        );
      } catch (error) {
        logger.error("Error advancing question:", error);
        socket.emit("error", { message: "Failed to advance question" });
      }
    });

    // ============================================
    // END SESSION (Host only)
    // ============================================
    socket.on("end-session", async ({ sessionCode, userId }, callback) => {
      try {
        console.log("🛑 End session requested:", { sessionCode, userId });

        const session = await sessionManager.getSession(sessionCode);

        if (!session) {
          console.log("❌ Session not found:", sessionCode);
          if (callback)
            callback({ success: false, error: "Session not found" });
          return;
        }

        console.log("✅ Session found:", {
          hostId: session.hostId,
          requestingUserId: userId,
        });

        // Check if user is the host
        if (session.hostId !== userId) {
          console.log("❌ Authorization failed: User is not the host");
          if (callback)
            callback({ success: false, error: "Only host can end session" });
          socket.emit("error", { message: "Only host can end session" });
          return;
        }

        // End the session
        console.log("✅ Ending session:", sessionCode);
        await endSession(sessionCode, io);

        if (callback) callback({ success: true });
        console.log(`✅ Session ${sessionCode} ended by host ${userId}`);
        logger.info(`Session ${sessionCode} ended by host ${userId}`);
      } catch (error) {
        console.error("❌ Error ending session:", error);
        logger.error("Error ending session:", error);
        if (callback) callback({ success: false, error: error.message });
        socket.emit("error", { message: "Failed to end session" });
      }
    });

    // ============================================
    // LEAVE SESSION
    // ============================================
    socket.on("leave-session", async ({ sessionCode, userId }) => {
      try {
        await handleLeaveSession(socket, sessionCode, userId, io);
      } catch (error) {
        logger.error("Error leaving session:", error);
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on("disconnect", async () => {
      try {
        if (socket.sessionCode && socket.userId) {
          await handleLeaveSession(
            socket,
            socket.sessionCode,
            socket.userId,
            io
          );
        }

        logger.info(`Socket disconnected: ${socket.id}`);
      } catch (error) {
        logger.error("Error handling disconnect:", error);
      }
    });
  });

  return io;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Start a question (with timer)
 */
async function startQuestion(sessionCode, questionIndex, io) {
  try {
    const quiz = await sessionManager.getCachedQuiz(sessionCode);
    const session = await sessionManager.getSession(sessionCode);

    if (!quiz || !session) {
      return;
    }

    const question = quiz.questions[questionIndex];
    const timeLimit = session.settings.timePerQuestion || 30;

    // Send question to all participants (without correct answer)
    io.to(sessionCode).emit("question-started", {
      questionIndex,
      question: {
        _id: question._id,
        question: question.question,
        options: question.options,
        points: question.points,
      },
      timeLimit,
      totalQuestions: quiz.questions.length,
    });

    // Auto-advance after time limit
    setTimeout(async () => {
      const currentSession = await sessionManager.getSession(sessionCode);

      // Only auto-advance if still on this question
      if (
        currentSession &&
        currentSession.currentQuestionIndex === questionIndex
      ) {
        // Broadcast leaderboard before next question
        await broadcastLeaderboard(sessionCode, io);

        io.to(sessionCode).emit("question-ended", {
          questionIndex,
          correctAnswer: question.correctAnswer || question.correct_answer,
        });
      }
    }, timeLimit * 1000);

    logger.debug(
      `Started question ${questionIndex + 1} in session ${sessionCode}`
    );
  } catch (error) {
    logger.error("Error starting question:", error);
  }
}

/**
 * End session
 */
async function endSession(sessionCode, io) {
  try {
    // Update session status
    await sessionManager.updateSession(sessionCode, {
      status: "completed",
      endedAt: new Date().toISOString(),
    });

    // Get final leaderboard
    const leaderboard = await sessionManager.getLeaderboard(sessionCode);

    // Broadcast session end
    io.to(sessionCode).emit("session-ended", {
      message: "Session completed!",
      leaderboard,
    });

    // Sync to MongoDB for persistence
    await syncSessionToDatabase(sessionCode);

    // Notify gamification service (non-blocking)
    const axios = require("axios");
    const GAMIFICATION_URL =
      process.env.GAMIFICATION_SERVICE_URL || "http://localhost:3007";
    const session = await sessionManager.getSession(sessionCode);
    const participants = await sessionManager.getAllParticipants(sessionCode);

    const participantData = Object.values(participants).map((p, index) => ({
      userId: p.userId,
      points: p.score || 0,
      bonusPoints: 0,
      rank: index + 1,
      accuracy:
        p.correctAnswers && p.correctAnswers + p.incorrectAnswers > 0
          ? (p.correctAnswers / (p.correctAnswers + p.incorrectAnswers)) * 100
          : 0,
      totalTime: session.quizMetadata?.totalTime || 0,
      experience: Math.round((p.score || 0) / 5),
    }));

    axios
      .post(`${GAMIFICATION_URL}/api/events/live-session-ended`, {
        sessionId: sessionCode,
        participants: participantData,
      })
      .catch((err) => {
        logger.error("Gamification notification failed:", err.message);
      });

    logger.info(`Session ${sessionCode} ended`);
  } catch (error) {
    logger.error("Error ending session:", error);
  }
}

/**
 * Handle participant leaving
 */
async function handleLeaveSession(socket, sessionCode, userId, io) {
  try {
    // Update participant status
    await sessionManager.updateParticipant(sessionCode, userId, {
      isActive: false,
      leftAt: new Date().toISOString(),
    });

    // Leave Socket.IO room
    socket.leave(sessionCode);

    // Notify others
    const participantCount = await sessionManager.getParticipantCount(
      sessionCode
    );
    io.to(sessionCode).emit("participant-left", {
      userId,
      participantCount,
    });

    logger.info(`User ${userId} left session ${sessionCode}`);
  } catch (error) {
    logger.error("Error handling leave:", error);
  }
}

/**
 * Sync Redis session to MongoDB (periodic)
 */
async function syncSessionToDatabase(sessionCode) {
  try {
    const session = await sessionManager.getSession(sessionCode);
    const participants = await sessionManager.getAllParticipants(sessionCode);
    const answers = await sessionManager.getAllAnswers(sessionCode);

    // Find or create MongoDB document
    let dbSession = await LiveSession.findByCode(sessionCode);

    if (!dbSession) {
      dbSession = new LiveSession({
        sessionCode: session.sessionCode,
        quizId: session.quizId,
        hostId: session.hostId,
        quizMetadata: session.quizMetadata,
        settings: session.settings,
        maxParticipants: session.maxParticipants,
      });
    }

    // Update with Redis data
    dbSession.status = session.status;
    dbSession.currentQuestionIndex = session.currentQuestionIndex;
    dbSession.startedAt = session.startedAt
      ? new Date(session.startedAt)
      : null;
    dbSession.endedAt = session.endedAt ? new Date(session.endedAt) : null;
    dbSession.participants = participants;
    dbSession.answers = answers;

    await dbSession.save();
    logger.info(`Synced session ${sessionCode} to database`);

    return dbSession;
  } catch (error) {
    logger.error("Error syncing to database:", error);
    return null;
  }
}

module.exports = {
  initializeSocketHandlers,
  syncSessionToDatabase,
  broadcastLeaderboard,
};
