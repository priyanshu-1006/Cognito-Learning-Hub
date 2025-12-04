/**
 * DuelMatch Model
 * Tracks 1v1 quiz battles between players
 */

const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    socketId: String,
    username: String,
    avatar: String,
    score: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 }, // milliseconds
    answers: [
      {
        questionIndex: Number,
        answer: String,
        isCorrect: Boolean,
        timeSpent: Number,
        timestamp: Date,
      },
    ],
    isReady: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const DuelMatchSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true, unique: true, index: true },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Quiz",
      index: true,
    },
    player1: { type: PlayerSchema, required: true },
    player2: { type: PlayerSchema },
    status: {
      type: String,
      enum: ["waiting", "ready", "active", "completed", "cancelled"],
      default: "waiting",
      index: true,
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timePerQuestion: { type: Number, default: 30 }, // seconds
    currentQuestionIndex: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for finding waiting matches
DuelMatchSchema.index({ quizId: 1, status: 1, "player1.userId": 1 });

// Compound index for efficient matchmaking (find waiting matches without player2)
DuelMatchSchema.index({ quizId: 1, status: 1, player2: 1, createdAt: 1 });

// Auto-expire waiting matches after 5 minutes
DuelMatchSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 300, partialFilterExpression: { status: "waiting" } }
);

// Auto-expire completed matches after 7 days
DuelMatchSchema.index(
  { completedAt: 1 },
  {
    expireAfterSeconds: 604800,
    partialFilterExpression: { status: "completed" },
  }
);

module.exports = mongoose.model("DuelMatch", DuelMatchSchema);
