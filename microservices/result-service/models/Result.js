/**
 * Result Model - Optimized for Fast Aggregations
 * Stores quiz attempt results with efficient indexing for leaderboards and analytics
 */

const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedAnswer: {
    type: mongoose.Schema.Types.Mixed, // Number for MCQ, String for text
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  timeSpent: {
    type: Number, // Milliseconds
    default: 0,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index 1: User's results lookup
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true, // Index 2: Quiz attempts lookup
  },
  
  // Session context (for multiplayer)
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession',
    default: null,
    index: true, // Index 3: Session participants lookup
  },
  isMultiplayer: {
    type: Boolean,
    default: false,
  },
  
  // Scoring (denormalized for fast queries)
  score: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number, // 0-100
    required: true,
    min: 0,
    max: 100,
  },
  
  // Performance metrics
  correctAnswers: {
    type: Number,
    default: 0,
    min: 0,
  },
  incorrectAnswers: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  
  // Time tracking
  startedAt: {
    type: Date,
    required: true,
  },
  completedAt: {
    type: Date,
    required: true,
  },
  totalTimeSpent: {
    type: Number, // Milliseconds
    required: true,
  },
  averageTimePerQuestion: {
    type: Number, // Milliseconds
    required: true,
  },
  
  // Detailed answers
  answers: [answerSchema],
  
  // Performance indicators (for analytics)
  rank: {
    type: Number, // Position in leaderboard (cached)
    default: null,
  },
  performanceLevel: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'],
    default: 'Average',
  },
  
  // Metadata
  isPassed: {
    type: Boolean,
    default: false,
  },
  passingScore: {
    type: Number,
    default: 60, // 60%
  },
  
  // Denormalized quiz info (for faster queries without populate)
  quizMetadata: {
    title: String,
    difficulty: String,
    category: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ============================================
// COMPOUND INDEXES FOR OPTIMIZED QUERIES
// ============================================

// Index 4: User's quiz history (sorted by date)
resultSchema.index({ userId: 1, createdAt: -1 });

// Index 5: Quiz leaderboard (sorted by score, then time)
resultSchema.index({ quizId: 1, score: -1, totalTimeSpent: 1 });

// Index 6: Session leaderboard (multiplayer)
resultSchema.index({ sessionId: 1, score: -1, totalTimeSpent: 1 });

// Index 7: Global leaderboard (all quizzes)
resultSchema.index({ score: -1, createdAt: -1 });

// Index 8: User performance over time
resultSchema.index({ userId: 1, completedAt: -1 });

// Index 9: Quiz analytics (category performance)
resultSchema.index({ 'quizMetadata.category': 1, percentage: -1 });

// Index 10: Recent results (for feed)
resultSchema.index({ createdAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

resultSchema.virtual('accuracy').get(function() {
  return this.totalQuestions > 0 
    ? (this.correctAnswers / this.totalQuestions) * 100 
    : 0;
});

resultSchema.virtual('speedScore').get(function() {
  // Lower is better: points per second
  return this.totalTimeSpent > 0 
    ? (this.score / (this.totalTimeSpent / 1000)).toFixed(2) 
    : 0;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Calculate performance level based on percentage
 */
resultSchema.methods.calculatePerformanceLevel = function() {
  if (this.percentage >= 90) return 'Excellent';
  if (this.percentage >= 75) return 'Good';
  if (this.percentage >= 60) return 'Average';
  if (this.percentage >= 40) return 'Below Average';
  return 'Poor';
};

/**
 * Get summary for display
 */
resultSchema.methods.getSummary = function() {
  return {
    id: this._id,
    score: this.score,
    maxScore: this.maxScore,
    percentage: this.percentage,
    correctAnswers: this.correctAnswers,
    totalQuestions: this.totalQuestions,
    accuracy: this.accuracy,
    totalTimeSpent: this.totalTimeSpent,
    averageTimePerQuestion: this.averageTimePerQuestion,
    performanceLevel: this.performanceLevel,
    isPassed: this.isPassed,
    rank: this.rank,
    completedAt: this.completedAt,
  };
};

/**
 * Get detailed analysis
 */
resultSchema.methods.getDetailedAnalysis = function() {
  const fastestAnswer = this.answers.reduce((min, ans) => 
    ans.timeSpent < min.timeSpent ? ans : min, this.answers[0]);
  
  const slowestAnswer = this.answers.reduce((max, ans) => 
    ans.timeSpent > max.timeSpent ? ans : max, this.answers[0]);
  
  const correctAnswers = this.answers.filter(ans => ans.isCorrect);
  const incorrectAnswers = this.answers.filter(ans => !ans.isCorrect);
  
  return {
    summary: this.getSummary(),
    timing: {
      fastest: fastestAnswer.timeSpent,
      slowest: slowestAnswer.timeSpent,
      average: this.averageTimePerQuestion,
    },
    correctAnswersCount: correctAnswers.length,
    incorrectAnswersCount: incorrectAnswers.length,
    speedScore: this.speedScore,
  };
};

// ============================================
// STATIC METHODS (OPTIMIZED AGGREGATIONS)
// ============================================

/**
 * Get quiz leaderboard (cached in Redis)
 * @param {String} quizId - Quiz ID
 * @param {Number} limit - Top N results
 */
resultSchema.statics.getQuizLeaderboard = async function(quizId, limit = 10) {
  return this.aggregate([
    { $match: { quizId: mongoose.Types.ObjectId(quizId) } },
    { $sort: { score: -1, totalTimeSpent: 1 } }, // Higher score, faster time
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: 1,
        userName: '$user.name',
        userPicture: '$user.picture',
        score: 1,
        maxScore: 1,
        percentage: 1,
        totalTimeSpent: 1,
        completedAt: 1,
        rank: { $literal: null }, // Will be calculated
      },
    },
  ]).allowDiskUse(true);
};

/**
 * Get global leaderboard (all quizzes)
 * Uses aggregation to sum total scores per user
 */
resultSchema.statics.getGlobalLeaderboard = async function(limit = 100) {
  return this.aggregate([
    {
      $group: {
        _id: '$userId',
        totalScore: { $sum: '$score' },
        averagePercentage: { $avg: '$percentage' },
        quizzesTaken: { $sum: 1 },
        totalCorrect: { $sum: '$correctAnswers' },
        totalQuestions: { $sum: '$totalQuestions' },
      },
    },
    { $sort: { totalScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        userPicture: '$user.picture',
        totalScore: 1,
        averagePercentage: { $round: ['$averagePercentage', 2] },
        quizzesTaken: 1,
        accuracy: {
          $round: [
            { $multiply: [{ $divide: ['$totalCorrect', '$totalQuestions'] }, 100] },
            2,
          ],
        },
      },
    },
  ]).allowDiskUse(true);
};

/**
 * Get user statistics (performance over time)
 */
resultSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalQuizzes: { $sum: 1 },
              averageScore: { $avg: '$percentage' },
              totalScore: { $sum: '$score' },
              bestScore: { $max: '$percentage' },
              worstScore: { $min: '$percentage' },
              totalCorrect: { $sum: '$correctAnswers' },
              totalQuestions: { $sum: '$totalQuestions' },
              averageTime: { $avg: '$averageTimePerQuestion' },
            },
          },
        ],
        byCategory: [
          {
            $group: {
              _id: '$quizMetadata.category',
              count: { $sum: 1 },
              avgScore: { $avg: '$percentage' },
            },
          },
          { $sort: { count: -1 } },
        ],
        recentTrend: [
          { $sort: { completedAt: -1 } },
          { $limit: 10 },
          {
            $project: {
              date: '$completedAt',
              percentage: 1,
              category: '$quizMetadata.category',
            },
          },
        ],
      },
    },
  ]);

  return stats[0];
};

/**
 * Get quiz analytics (for quiz creators)
 */
resultSchema.statics.getQuizAnalytics = async function(quizId) {
  return this.aggregate([
    { $match: { quizId: mongoose.Types.ObjectId(quizId) } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$percentage' },
        highestScore: { $max: '$percentage' },
        lowestScore: { $min: '$percentage' },
        averageTime: { $avg: '$totalTimeSpent' },
        passRate: {
          $avg: { $cond: ['$isPassed', 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalAttempts: 1,
        averageScore: { $round: ['$averageScore', 2] },
        highestScore: 1,
        lowestScore: 1,
        averageTime: { $round: ['$averageTime', 0] },
        passRate: { $multiply: ['$passRate', 100] },
      },
    },
  ]);
};

/**
 * Batch insert results (for multiplayer sessions)
 */
resultSchema.statics.batchInsert = async function(results) {
  return this.insertMany(results, { ordered: false });
};

// ============================================
// PRE-SAVE HOOKS
// ============================================

resultSchema.pre('save', function(next) {
  // Calculate percentage
  this.percentage = this.maxScore > 0 
    ? Math.round((this.score / this.maxScore) * 100) 
    : 0;
  
  // Calculate average time per question
  this.averageTimePerQuestion = this.totalQuestions > 0
    ? Math.round(this.totalTimeSpent / this.totalQuestions)
    : 0;
  
  // Set performance level
  this.performanceLevel = this.calculatePerformanceLevel();
  
  // Check if passed
  this.isPassed = this.percentage >= this.passingScore;
  
  next();
});

module.exports = mongoose.model('Result', resultSchema);
