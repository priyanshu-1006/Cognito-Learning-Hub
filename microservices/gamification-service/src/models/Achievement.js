const mongoose = require('mongoose');

/**
 * Achievement Schema - Defines achievement types and criteria
 */
const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '🎉',
  },
  type: {
    type: String,
    enum: [
      'quiz_completion',
      'score_achievement',
      'streak',
      'speed',
      'category_master',
      'special',
    ],
    required: true,
  },
  criteria: {
    target: Number, // Target value (e.g., 10 quizzes, 90% score)
    category: String, // For category-specific achievements
    score: Number, // Minimum score required
    timeLimit: Number, // Maximum time allowed (seconds)
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  points: {
    type: Number,
    default: 10,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
achievementSchema.index({ type: 1, isActive: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ name: 1 });

/**
 * User Achievement Schema - Tracks user's achievement progress
 */
const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true,
  },
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, isCompleted: 1 });
userAchievementSchema.index({ user: 1, unlockedAt: -1 });

/**
 * User Stats Schema - Comprehensive user statistics
 */
const userStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  totalQuizzesTaken: {
    type: Number,
    default: 0,
  },
  totalQuizzesCreated: {
    type: Number,
    default: 0,
  },
  totalPoints: {
    type: Number,
    default: 0,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  lastQuizDate: {
    type: Date,
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  totalTimeSpent: {
    type: Number,
    default: 0, // In minutes
  },
  level: {
    type: Number,
    default: 1,
  },
  experience: {
    type: Number,
    default: 0,
  },
  favoriteCategories: [{
    type: String,
  }],
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAchievement',
  }],
  badges: [{
    name: String,
    earnedAt: Date,
  }],
}, {
  timestamps: true,
});

// Indexes for efficient queries
userStatsSchema.index({ user: 1 });
userStatsSchema.index({ totalPoints: -1 });
userStatsSchema.index({ level: -1 });
userStatsSchema.index({ currentStreak: -1 });
userStatsSchema.index({ longestStreak: -1 });
userStatsSchema.index({ averageScore: -1 });
userStatsSchema.index({ lastQuizDate: -1 });

// Virtual for rank calculation
userStatsSchema.virtual('rank').get(function() {
  return this._rank || null;
});

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
const UserStats = mongoose.model('UserStats', userStatsSchema);

module.exports = {
  Achievement,
  UserAchievement,
  UserStats,
};
