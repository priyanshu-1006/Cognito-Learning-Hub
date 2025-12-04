/**
 * Follow Relationship Model
 * Optimized for follower/following queries
 */

const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  // Follower (who follows)
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Following (who is being followed)
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Denormalized for quick checks
  followerName: String,
  followingName: String,
  
  // Notification settings
  notifyOnPost: {
    type: Boolean,
    default: true,
  },
  
}, {
  timestamps: true,
});

// ============================================
// INDEXES
// ============================================

// Compound unique index (prevents duplicate follows)
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Get followers
followSchema.index({ followingId: 1, createdAt: -1 });

// Get following
followSchema.index({ followerId: 1, createdAt: -1 });

// Mutual follows check
followSchema.index({ followerId: 1, followingId: 1 });

// ============================================
// STATICS
// ============================================

/**
 * Check if user follows another
 */
followSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({ followerId, followingId }).lean();
  return !!follow;
};

/**
 * Get follower count
 */
followSchema.statics.getFollowerCount = async function(userId) {
  return this.countDocuments({ followingId: userId });
};

/**
 * Get following count
 */
followSchema.statics.getFollowingCount = async function(userId) {
  return this.countDocuments({ followerId: userId });
};

/**
 * Get mutual follows
 */
followSchema.statics.getMutualFollows = async function(userId1, userId2) {
  const follows = await this.find({
    $or: [
      { followerId: userId1, followingId: userId2 },
      { followerId: userId2, followingId: userId1 },
    ],
  }).lean();
  
  return follows.length === 2; // Both follow each other
};

/**
 * Get followers list (paginated)
 */
followSchema.statics.getFollowers = async function(userId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ followingId: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('followerId followerName createdAt')
    .lean();
};

/**
 * Get following list (paginated)
 */
followSchema.statics.getFollowing = async function(userId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ followerId: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('followingId followingName createdAt')
    .lean();
};

module.exports = mongoose.model('Follow', followSchema);
