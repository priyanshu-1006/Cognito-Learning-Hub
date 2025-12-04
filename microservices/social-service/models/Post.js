/**
 * Social Post Model
 * Optimized with proper indexes and lean queries
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Author info
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  authorName: String,
  authorPicture: String,
  
  // Content
  content: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  
  // Media attachments
  images: [{
    url: String,
    width: Number,
    height: Number,
    thumbnailUrl: String,
  }],
  
  // Post type
  type: {
    type: String,
    enum: ['text', 'image', 'achievement', 'quiz-result', 'challenge'],
    default: 'text',
    index: true,
  },
  
  // Related entities
  relatedQuiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  },
  relatedAchievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
  },
  
  // Engagement metrics (denormalized for performance)
  likes: {
    type: Number,
    default: 0,
    index: true,
  },
  comments: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
  
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public',
    index: true,
  },
  
  // Moderation
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  
  // Hashtags (for discovery)
  hashtags: [{
    type: String,
    lowercase: true,
  }],
  
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
}, {
  timestamps: true,
});

// ============================================
// INDEXES
// ============================================

// Feed queries (most common)
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 }); // Global feed
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });

// Discovery
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });

// Engagement sorting
postSchema.index({ likes: -1, createdAt: -1 }); // Trending
postSchema.index({ authorId: 1, likes: -1 });

// Text search
postSchema.index({ content: 'text', authorName: 'text' });

// TTL for deleted posts (auto-cleanup after 30 days)
postSchema.index({ isDeleted: 1, updatedAt: 1 }, {
  expireAfterSeconds: 2592000, // 30 days
  partialFilterExpression: { isDeleted: true },
});

// ============================================
// METHODS
// ============================================

/**
 * Increment like count (atomic)
 */
postSchema.methods.incrementLikes = async function() {
  this.likes += 1;
  await this.save();
  return this.likes;
};

/**
 * Decrement like count (atomic)
 */
postSchema.methods.decrementLikes = async function() {
  this.likes = Math.max(0, this.likes - 1);
  await this.save();
  return this.likes;
};

/**
 * Increment comment count (atomic)
 */
postSchema.methods.incrementComments = async function() {
  this.comments += 1;
  await this.save();
  return this.comments;
};

/**
 * Soft delete
 */
postSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  await this.save();
};

// ============================================
// STATICS
// ============================================

/**
 * Get user feed (optimized)
 */
postSchema.statics.getUserFeed = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    authorId: userId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v')
    .lean(); // Read-only optimization
};

/**
 * Get trending posts (cached externally)
 */
postSchema.statics.getTrendingPosts = async function(hours = 24, limit = 50) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    createdAt: { $gte: cutoffDate },
    isDeleted: false,
    visibility: 'public',
  })
    .sort({ likes: -1, createdAt: -1 })
    .limit(limit)
    .select('-__v')
    .lean();
};

/**
 * Search posts by hashtag
 */
postSchema.statics.searchByHashtag = async function(hashtag, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    hashtags: hashtag.toLowerCase(),
    isDeleted: false,
    visibility: 'public',
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v')
    .lean();
};

module.exports = mongoose.model('Post', postSchema);
