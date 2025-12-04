/**
 * Like Model (for tracking individual likes)
 * Uses compound index for efficient queries
 */

const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  // User who liked
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // What was liked
  targetType: {
    type: String,
    enum: ['post', 'comment'],
    required: true,
  },
  targetId: {
    type: String,
    required: true,
    index: true,
  },
  
}, {
  timestamps: true,
});

// ============================================
// INDEXES
// ============================================

// Prevent duplicate likes
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// Get likes for target
likeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// Get user's likes
likeSchema.index({ userId: 1, createdAt: -1 });

// ============================================
// STATICS
// ============================================

/**
 * Check if user liked target
 */
likeSchema.statics.hasLiked = async function(userId, targetType, targetId) {
  const like = await this.findOne({ userId, targetType, targetId }).lean();
  return !!like;
};

/**
 * Get like count for target
 */
likeSchema.statics.getLikeCount = async function(targetType, targetId) {
  return this.countDocuments({ targetType, targetId });
};

module.exports = mongoose.model('Like', likeSchema);
