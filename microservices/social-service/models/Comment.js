/**
 * Comment Model
 * Optimized for nested comment queries
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  commentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Post reference
  postId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Author info (denormalized)
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
    maxlength: 2000,
  },
  
  // Nested comments (replies)
  parentCommentId: {
    type: String,
    index: true,
  },
  
  // Engagement
  likes: {
    type: Number,
    default: 0,
  },
  
  // Moderation
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  
}, {
  timestamps: true,
});

// ============================================
// INDEXES
// ============================================

// Get comments for a post
commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ postId: 1, parentCommentId: 1, createdAt: 1 });

// Get user's comments
commentSchema.index({ authorId: 1, createdAt: -1 });

// TTL for deleted comments
commentSchema.index({ isDeleted: 1, updatedAt: 1 }, {
  expireAfterSeconds: 2592000, // 30 days
  partialFilterExpression: { isDeleted: true },
});

// ============================================
// STATICS
// ============================================

/**
 * Get comments for post (optimized)
 */
commentSchema.statics.getPostComments = async function(postId, limit = 50) {
  return this.find({
    postId,
    parentCommentId: null, // Top-level only
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select('-__v')
    .lean();
};

/**
 * Get replies to comment
 */
commentSchema.statics.getCommentReplies = async function(commentId, limit = 20) {
  return this.find({
    parentCommentId: commentId,
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select('-__v')
    .lean();
};

module.exports = mongoose.model('Comment', commentSchema);
