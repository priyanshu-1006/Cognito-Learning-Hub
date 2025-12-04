/**
 * Comment Routes
 * Optimized comment operations
 */

const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Like = require('../models/Like');
const feedManager = require('../services/feedManager');
const queueManager = require('../workers/queueManager');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const { validateFields } = require('../../shared/middleware/inputValidation');

const logger = createLogger('comment-routes');

// ============================================
// CREATE COMMENT
// ============================================

router.post(
  '/create',
  authenticateToken,
  validateFields({
    postId: { required: true, type: 'string' },
    content: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
  }),
  async (req, res) => {
    try {
      const {
        postId,
        authorId,
        authorName,
        authorPicture,
        content,
        parentCommentId,
      } = req.body;

      // Authorization: Ensure user can only comment as themselves
      if (authorId && authorId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot create comments for other users',
        });
      }

      const actualAuthorId = authorId || req.user.userId;

    // Verify post exists
    const post = await Post.findOne({ postId, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    const commentId = nanoid(12);

    // Create comment
    const comment = new Comment({
      commentId,
      postId,
      authorId: actualAuthorId,
      authorName,
      authorPicture,
      content,
      parentCommentId: parentCommentId || null,
      likes: 0,
      isDeleted: false,
    });

    await comment.save();

    // Increment post comment count (atomic)
    await Post.findOneAndUpdate(
      { postId },
      { $inc: { comments: 1 } }
    );

    // Update trending score
    await feedManager.updateTrendingScore(postId, 2); // Comments worth 2 points

    // Invalidate post cache
    await feedManager.invalidatePostCache(postId);

    // Queue notification to post author
    if (post.authorId.toString() !== actualAuthorId) {
      await queueManager.addNotification({
        userId: post.authorId,
        type: 'comment',
        actorId: actualAuthorId,
        actorName: authorName,
        actorPicture: authorPicture,
        message: `${authorName} commented on your post`,
        relatedPostId: postId,
        relatedCommentId: commentId,
        actionUrl: `/posts/${postId}#comment-${commentId}`,
        priority: 'high',
      });
    }

    logger.info(`Comment ${commentId} created on post ${postId}`);

    res.status(201).json({
      success: true,
      comment: {
        commentId,
        postId,
        authorId,
        authorName,
        content,
        parentCommentId,
        likes: 0,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment',
    });
  }
});

// ============================================
// GET POST COMMENTS
// ============================================

router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50 } = req.query;

    const comments = await Comment.getPostComments(postId, parseInt(limit));

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    logger.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comments',
    });
  }
});

// ============================================
// GET COMMENT REPLIES
// ============================================

router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { limit = 20 } = req.query;

    const replies = await Comment.getCommentReplies(commentId, parseInt(limit));

    res.json({
      success: true,
      replies,
    });
  } catch (error) {
    logger.error('Error getting replies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get replies',
    });
  }
});

// ============================================
// LIKE COMMENT
// ============================================

router.post('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId; // Use authenticated user

    // Check if already liked
    const existing = await Like.findOne({ userId, targetType: 'comment', targetId: commentId });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already liked',
      });
    }

    // Create like
    const like = new Like({
      userId,
      targetType: 'comment',
      targetId: commentId,
    });
    await like.save();

    // Increment comment likes
    const comment = await Comment.findOneAndUpdate(
      { commentId },
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    res.json({
      success: true,
      likes: comment.likes,
    });
  } catch (error) {
    logger.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like comment',
    });
  }
});

// ============================================
// DELETE COMMENT
// ============================================

router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findOne({ commentId });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    // Authorization: Only comment owner or Admin/Moderator can delete
    if (comment.authorId.toString() !== req.user.userId && 
        !['Admin', 'Moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Soft delete
    comment.isDeleted = true;
    await comment.save();

    // Decrement post comment count
    await Post.findOneAndUpdate(
      { postId: comment.postId },
      { $inc: { comments: -1 } }
    );

    // Invalidate post cache
    await feedManager.invalidatePostCache(comment.postId);

    res.json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
});

module.exports = router;
