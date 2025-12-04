/**
 * Socket.IO Duel/Battle Event Handlers
 * Manages 1v1 quiz battles with real-time scoring
 */

const mongoose = require("mongoose");
const createLogger = require("../../shared/utils/logger");
const DuelMatch = require("../models/DuelMatch");

const logger = createLogger("duel-handlers");
const QUIZ_SERVICE_URL =
  process.env.QUIZ_SERVICE_URL || "http://localhost:3005";

/**
 * Fetch quiz from quiz service
 */
async function fetchQuiz(quizId) {
  try {
    const response = await fetch(`${QUIZ_SERVICE_URL}/api/quizzes/${quizId}`);
    if (!response.ok) {
      throw new Error("Quiz not found");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error fetching quiz:", error);
    throw error;
  }
}

/**
 * Clean up stale waiting matches on server start
 */
async function cleanupStaleMatches() {
  try {
    const result = await DuelMatch.deleteMany({
      status: "waiting",
      createdAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) }, // Older than 10 minutes
    });
    if (result.deletedCount > 0) {
      logger.info(
        `[Duel] Cleaned up ${result.deletedCount} stale waiting matches`
      );
    }
  } catch (error) {
    logger.error("[Duel] Error cleaning up stale matches:", error);
  }
}

/**
 * Initialize Duel Socket.IO handlers
 */
function initializeDuelHandlers(io) {
  // Clean up old matches on initialization
  cleanupStaleMatches();

  io.on("connection", (socket) => {
    // ============================================
    // FIND DUEL MATCH
    // ============================================
    socket.on("find-duel-match", async (data, callback) => {
      try {
        const { quizId, userId, username, avatar } = data;

        logger.info(`[Duel] ${userId} searching for match on quiz ${quizId}`);

        // Convert userId to ObjectId for consistent comparison
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const quizObjectId = new mongoose.Types.ObjectId(quizId);

        let match = null;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        // Retry loop to handle stale matches
        while (!match && retryCount < MAX_RETRIES) {
          // Find existing waiting match for this quiz (don't match with self)
          match = await DuelMatch.findOne({
            quizId: quizObjectId,
            status: "waiting",
            "player1.userId": { $ne: userObjectId },
            player2: { $exists: false }, // Ensure player2 slot is empty
          }).sort({ createdAt: 1 }); // Get oldest waiting match first

          if (match) {
            // Validate that player1 is still connected
            const player1Socket = io.sockets.sockets.get(
              match.player1.socketId
            );

            if (!player1Socket) {
              // Player1 disconnected, delete stale match and retry
              logger.warn(
                `[Duel] Stale match found (player1 disconnected): ${match.matchId}, deleting and retrying...`
              );
              await DuelMatch.deleteOne({ matchId: match.matchId });
              match = null; // Retry search
              retryCount++;
              continue;
            }

            // Use atomic update to claim the match as player2
            const updatedMatch = await DuelMatch.findOneAndUpdate(
              {
                _id: match._id,
                status: "waiting",
                player2: { $exists: false }, // Double-check player2 is still empty
              },
              {
                $set: {
                  "player2.userId": userObjectId,
                  "player2.socketId": socket.id,
                  "player2.username": username,
                  "player2.avatar": avatar,
                  "player2.score": 0,
                  "player2.correctAnswers": 0,
                  "player2.totalTime": 0,
                  "player2.answers": [],
                  "player2.isReady": false,
                  "player2.isActive": true,
                  status: "ready",
                },
              },
              { new: true } // Return updated document
            );

            if (!updatedMatch) {
              // Another player claimed this match, retry search
              logger.warn(
                `[Duel] Race condition - match already claimed, retrying...`
              );
              match = null;
              retryCount++;
              continue;
            }

            match = updatedMatch;
            break; // Successfully matched!
          } else {
            // No waiting match found
            break;
          }
        }

        if (match) {
          // Fetch quiz from quiz service
          const quiz = await fetchQuiz(match.quizId.toString());

          // Both players join the match room
          socket.join(match.matchId);
          const player1Socket = io.sockets.sockets.get(match.player1.socketId);
          if (player1Socket) {
            player1Socket.join(match.matchId);
          }

          logger.info(
            `[Duel] Match found: ${match.matchId} - ${match.player1.userId} vs ${userId}`
          );

          const matchFoundData = {
            matchId: match.matchId,
            quiz: {
              id: quiz._id,
              title: quiz.title,
              description: quiz.description,
              totalQuestions: quiz.questions.length,
            },
            opponent: {
              player1: {
                userId: match.player1.userId.toString(),
                username: match.player1.username || "Player 1",
                avatar: match.player1.avatar,
              },
              player2: {
                userId: match.player2.userId.toString(),
                username: username,
                avatar: avatar,
              },
            },
          };

          // Emit to room (for any other sockets that might be listening)
          io.to(match.matchId).emit("match-found", matchFoundData);

          // Also emit directly to both players to ensure they receive it
          if (player1Socket) {
            player1Socket.emit("match-found", matchFoundData);
            logger.info(
              `[Duel] Sent match-found to player1: ${match.player1.socketId}`
            );
          }
          socket.emit("match-found", matchFoundData);
          logger.info(`[Duel] Sent match-found to player2: ${socket.id}`);

          callback({ success: true, matchId: match.matchId, role: "player2" });
        } else {
          // Create new waiting match
          const matchId = `duel-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          match = new DuelMatch({
            matchId,
            quizId: quizObjectId,
            player1: {
              userId: userObjectId,
              socketId: socket.id,
              username,
              avatar,
              score: 0,
              correctAnswers: 0,
              totalTime: 0,
              answers: [],
              isReady: false,
              isActive: true,
            },
            status: "waiting",
          });

          await match.save();
          socket.join(matchId);

          logger.info(`[Duel] Waiting for opponent: ${matchId} - ${userId}`);

          callback({ success: true, matchId, role: "player1", waiting: true });
        }
      } catch (error) {
        logger.error("[Duel] Error finding match:", error);
        callback({ success: false, error: error.message });
      }
    });

    // ============================================
    // DUEL READY
    // ============================================
    socket.on("duel-ready", async (data, callback) => {
      try {
        const { matchId, userId } = data;

        logger.info(`[Duel] Player ready: ${userId} in ${matchId}`);

        const match = await DuelMatch.findOne({ matchId });
        if (!match) {
          return callback({ success: false, error: "Match not found" });
        }

        logger.info(`[Duel] DEBUG - Match state BEFORE marking ready:`, {
          matchId,
          hasPlayer1: !!match.player1,
          hasPlayer2: !!match.player2,
          player1Ready: match.player1?.isReady,
          player2Ready: match.player2?.isReady,
          status: match.status,
        });

        // Mark player as ready (convert to strings for comparison)
        const userIdStr = String(userId);
        const player1IdStr = match.player1?.userId
          ? String(match.player1.userId)
          : null;
        const player2IdStr = match.player2?.userId
          ? String(match.player2.userId)
          : null;

        if (player1IdStr === userIdStr) {
          match.player1.isReady = true;
        } else if (player2IdStr && player2IdStr === userIdStr) {
          match.player2.isReady = true;
        } else {
          return callback({ success: false, error: "User not in this match" });
        }

        await match.save();

        // Notify room that player is ready
        io.to(matchId).emit("player-ready", { userId });

        logger.info(
          `[Duel] Player ${userId} marked ready. Player2 exists: ${!!match.player2}, Player1 ready: ${
            match.player1.isReady
          }, Player2 ready: ${match.player2?.isReady}`
        );

        // If still waiting for opponent (player2 is null), tell player to wait
        if (!match.player2) {
          callback({
            success: true,
            status: "waiting",
            message: "Marked as ready - waiting for opponent",
          });
          return;
        }

        // Acknowledge ready
        callback({
          success: true,
          status: "ready",
          message: "Ready! Waiting for other player...",
        });

        // Re-fetch to handle race condition
        const latestMatch = await DuelMatch.findOne({ matchId });

        // Start if both ready
        if (
          latestMatch.player1.isReady &&
          latestMatch.player2 &&
          latestMatch.player2.isReady
        ) {
          logger.info(`[Duel] Both players ready! Starting ${matchId}`);

          latestMatch.status = "active";
          latestMatch.startedAt = new Date();
          latestMatch.currentQuestionIndex = 0;
          await latestMatch.save();

          // Ensure both players in room
          socket.join(matchId);
          const player1Socket = io.sockets.sockets.get(
            latestMatch.player1.socketId
          );
          const player2Socket = io.sockets.sockets.get(
            latestMatch.player2.socketId
          );

          if (player1Socket) player1Socket.join(matchId);
          if (player2Socket) player2Socket.join(matchId);

          // Fetch quiz from service
          if (!latestMatch.quizId) {
            logger.error(`[Duel] No quizId in match ${matchId}`);
            return callback({
              success: false,
              error: "Quiz not found in match",
            });
          }

          const quiz = await fetchQuiz(String(latestMatch.quizId));
          if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            logger.error(`[Duel] Quiz has no questions: ${latestMatch.quizId}`);
            return callback({ success: false, error: "Quiz has no questions" });
          }

          const currentQuestion = quiz.questions[0];

          io.to(matchId).emit("duel-started", {
            currentQuestion: {
              index: 0,
              question: currentQuestion.question,
              options: currentQuestion.options,
              timeLimit: latestMatch.timePerQuestion,
            },
          });

          logger.info(`[Duel] Match started: ${matchId}`);
        }

        callback({ success: true });
      } catch (error) {
        logger.error("[Duel] Error in ready:", error);
        callback({ success: false, error: error.message });
      }
    });

    // ============================================
    // DUEL ANSWER
    // ============================================
    socket.on("duel-answer", async (data, callback) => {
      try {
        const { matchId, userId, questionIndex, answer, timeSpent } = data;

        const match = await DuelMatch.findOne({ matchId });
        if (!match) {
          return callback({ success: false, error: "Match not found" });
        }

        // Fetch quiz from service
        if (!match.quizId) {
          return callback({ success: false, error: "Quiz not found in match" });
        }

        const quiz = await fetchQuiz(String(match.quizId));
        if (!quiz || !quiz.questions || !quiz.questions[questionIndex]) {
          return callback({ success: false, error: "Question not found" });
        }

        const question = quiz.questions[questionIndex];

        // Handle both correct_answer and correctAnswer (API response may use either)
        const correctAnswer = question.correctAnswer || question.correct_answer;

        // Normalize strings for comparison (trim whitespace)
        const normalizedUserAnswer = String(answer).trim();
        const normalizedCorrectAnswer = String(correctAnswer).trim();

        logger.info(`[Duel] Answer comparison:`, {
          userAnswer: normalizedUserAnswer,
          correctAnswer: normalizedCorrectAnswer,
          match: normalizedUserAnswer === normalizedCorrectAnswer,
          questionFields: Object.keys(question),
        });

        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        const pointsEarned = isCorrect ? 100 : 0;

        logger.info(
          `[Duel] Result: ${
            isCorrect ? "✅ CORRECT" : "❌ WRONG"
          } - Points: ${pointsEarned}`
        );

        // Record answer
        const answerRecord = {
          questionIndex,
          answer,
          isCorrect,
          timeSpent,
          timestamp: new Date(),
        };

        // Safe player identification
        const userIdStr = String(userId);
        const player1IdStr = match.player1?.userId
          ? String(match.player1.userId)
          : null;
        const player2IdStr = match.player2?.userId
          ? String(match.player2.userId)
          : null;

        let player;
        if (player1IdStr === userIdStr) {
          player = match.player1;
        } else if (player2IdStr === userIdStr) {
          player = match.player2;
        }

        if (player) {
          player.answers.push(answerRecord);
          if (isCorrect) {
            player.correctAnswers += 1;
            player.score += pointsEarned;
          }
          player.totalTime += timeSpent;
        }

        await match.save();

        callback({
          success: true,
          isCorrect,
          correctAnswer: correctAnswer,
          pointsEarned,
          explanation: question.explanation,
        });

        // Emit live score update
        io.to(matchId).emit("duel-score-update", {
          player1: {
            userId: match.player1.userId.toString(),
            score: match.player1.score,
            correctAnswers: match.player1.correctAnswers,
            answeredCount: match.player1.answers.length,
          },
          player2: {
            userId: match.player2.userId.toString(),
            score: match.player2.score,
            correctAnswers: match.player2.correctAnswers,
            answeredCount: match.player2.answers.length,
          },
        });

        // Check if player finished (use quiz data fetched earlier)
        const playerFinished = player.answers.length === quiz.questions.length;

        if (playerFinished) {
          socket.emit("player-completed", {
            message: "Waiting for opponent to finish...",
            yourScore: player.score,
            yourCorrect: player.correctAnswers,
          });

          logger.info(`[Duel] Player ${userId} completed all questions`);
        }

        // Check if BOTH finished
        const bothFinished =
          match.player1.answers.length === quiz.questions.length &&
          match.player2.answers.length === quiz.questions.length;

        if (bothFinished) {
          // Determine winner
          let winner = null;
          if (match.player1.score > match.player2.score) {
            winner = match.player1.userId.toString();
          } else if (match.player2.score > match.player1.score) {
            winner = match.player2.userId.toString();
          } else if (match.player1.totalTime < match.player2.totalTime) {
            winner = match.player1.userId.toString();
          } else if (match.player2.totalTime < match.player1.totalTime) {
            winner = match.player2.userId.toString();
          }

          match.status = "completed";
          match.completedAt = new Date();
          match.winner = winner ? new mongoose.Types.ObjectId(winner) : null;
          await match.save();

          io.to(matchId).emit("duel-ended", {
            winner,
            finalScores: {
              player1: {
                userId: match.player1.userId.toString(),
                score: match.player1.score,
                correctAnswers: match.player1.correctAnswers,
                totalTime: match.player1.totalTime,
              },
              player2: {
                userId: match.player2.userId.toString(),
                score: match.player2.score,
                correctAnswers: match.player2.correctAnswers,
                totalTime: match.player2.totalTime,
              },
            },
          });

          logger.info(
            `[Duel] Match completed: ${matchId}, Winner: ${winner || "TIE"}`
          );
        } else {
          // Move to next question for THIS player only
          const nextIndex = player.answers.length;
          if (nextIndex < quiz.questions.length) {
            const nextQuestion = quiz.questions[nextIndex];

            socket.emit("next-question", {
              currentQuestion: {
                index: nextIndex,
                question: nextQuestion.question,
                options: nextQuestion.options,
                timeLimit: match.timePerQuestion,
              },
            });
          }
        }
      } catch (error) {
        logger.error("[Duel] Error in answer:", error);
        callback({ success: false, error: error.message });
      }
    });

    // ============================================
    // DISCONNECT HANDLING
    // ============================================
    socket.on("disconnect", async () => {
      try {
        // Find any active match with this socket
        const match = await DuelMatch.findOne({
          status: { $in: ["waiting", "ready", "active"] },
          $or: [
            { "player1.socketId": socket.id },
            { "player2.socketId": socket.id },
          ],
        });

        if (match) {
          const isPlayer1 = match.player1.socketId === socket.id;
          const disconnectedUserId = isPlayer1
            ? match.player1.userId
            : match.player2?.userId;

          if (match.status === "waiting") {
            // Remove waiting match
            await DuelMatch.deleteOne({ _id: match._id });
            logger.info(`[Duel] Removed waiting match ${match.matchId}`);
          } else {
            // Declare opponent as winner
            const winnerId = isPlayer1
              ? match.player2?.userId
              : match.player1.userId;

            match.status = "completed";
            match.completedAt = new Date();
            match.winner = winnerId;
            await match.save();

            io.to(match.matchId).emit("opponent-disconnected", {
              winner: winnerId?.toString(),
              message: "Opponent disconnected",
            });

            logger.info(
              `[Duel] Player disconnected from ${match.matchId}, opponent wins`
            );
          }
        }
      } catch (error) {
        logger.error("[Duel] Error handling disconnect:", error);
      }
    });
  });
}

module.exports = { initializeDuelHandlers };
