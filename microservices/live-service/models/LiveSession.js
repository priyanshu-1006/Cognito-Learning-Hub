/**
 * LiveSession Model - Persistence Layer Only
 * Active sessions stored in Redis, MongoDB for history/recovery
 */

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
    default: 'Anonymous',
  },
  userPicture: String,
  score: {
    type: Number,
    default: 0,
  },
  correctAnswers: {
    type: Number,
    default: 0,
  },
  incorrectAnswers: {
    type: Number,
    default: 0,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  socketId: String,
}, { _id: false });

const answerRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: {
    type: Boolean,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
  timeSpent: Number, // Milliseconds
}, { _id: false });

const liveSessionSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true,
  },
  
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Session state
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed', 'cancelled'],
    default: 'waiting',
    index: true,
  },
  
  currentQuestionIndex: {
    type: Number,
    default: -1, // -1 = not started
  },
  
  // Participants
  participants: [participantSchema],
  maxParticipants: {
    type: Number,
    default: 50,
  },
  
  // Answer records
  answers: [answerRecordSchema],
  
  // Timing
  startedAt: Date,
  endedAt: Date,
  questionStartedAt: Date,
  
  // Settings
  settings: {
    timePerQuestion: {
      type: Number,
      default: 30, // seconds
    },
    showLeaderboard: {
      type: Boolean,
      default: true,
    },
    allowLateJoin: {
      type: Boolean,
      default: true,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
  },
  
  // Denormalized quiz info (for faster access)
  quizMetadata: {
    title: String,
    totalQuestions: Number,
    difficulty: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ============================================
// INDEXES
// ============================================

// Index 1: Find active sessions
liveSessionSchema.index({ status: 1, createdAt: -1 });

// Index 2: Find user's sessions
liveSessionSchema.index({ hostId: 1, createdAt: -1 });

// Index 3: Find sessions by quiz
liveSessionSchema.index({ quizId: 1, createdAt: -1 });

// Index 4: Cleanup old sessions
liveSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days

// ============================================
// VIRTUALS
// ============================================

liveSessionSchema.virtual('participantCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

liveSessionSchema.virtual('isInProgress').get(function() {
  return this.status === 'active';
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Get session summary (for list views)
 */
liveSessionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    sessionCode: this.sessionCode,
    quizTitle: this.quizMetadata?.title,
    status: this.status,
    participantCount: this.participantCount,
    maxParticipants: this.maxParticipants,
    currentQuestion: this.currentQuestionIndex + 1,
    totalQuestions: this.quizMetadata?.totalQuestions,
    startedAt: this.startedAt,
    createdAt: this.createdAt,
  };
};

/**
 * Get final leaderboard (for completed sessions)
 */
liveSessionSchema.methods.getFinalLeaderboard = function() {
  return this.participants
    .filter(p => p.isActive)
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      userName: p.userName,
      userPicture: p.userPicture,
      score: p.score,
      correctAnswers: p.correctAnswers,
      incorrectAnswers: p.incorrectAnswers,
    }));
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find active sessions
 */
liveSessionSchema.statics.findActiveSessions = function(limit = 20) {
  return this.find({ status: { $in: ['waiting', 'active'] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('sessionCode quizMetadata status participantCount createdAt')
    .lean();
};

/**
 * Find session by code
 */
liveSessionSchema.statics.findByCode = function(sessionCode) {
  return this.findOne({ sessionCode: sessionCode.toUpperCase() });
};

/**
 * Cleanup old sessions
 */
liveSessionSchema.statics.cleanupOldSessions = async function() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const result = await this.deleteMany({
    status: { $in: ['completed', 'cancelled'] },
    updatedAt: { $lt: threeDaysAgo },
  });
  return result.deletedCount;
};

module.exports = mongoose.model('LiveSession', liveSessionSchema);
