/**
 * Post Routes
 * Optimized with Redis caching and async fanout
 */

const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Post = require('../models/Post');
const Like = require('../models/Like');
const Follow = require('../models/Follow');
const feedManager = require('../services/feedManager');
const queueManager = require('../workers/queueManager');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const { validateFields } = require('../../shared/middleware/inputValidation');

const logger = createLogger('post-routes');

// ============================================
// CREATE POST
// ============================================

router.post(
  '/create',
  authenticateToken,
  validateFields({
    content: { required: true, type: 'string', minLength: 1, maxLength: 5000 },
    type: { type: 'string', enum: ['text', 'image', 'quiz', 'achievement'] },
    visibility: { type: 'string', enum: ['public', 'followers', 'private'] },
  }),
  async (req, res) => {
    try {
      const {
        authorId,
        authorName,
        authorPicture,
        content,
        images,
        type,
        visibility,
        relatedQuiz,
        relatedAchievement,
        hashtags,
        mentions,
      } = req.body;

      // Authorization: Ensure user can only create posts as themselves
      if (authorId && authorId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot create posts for other users',
        });
      }

      // Use authenticated user ID if not provided
      const actualAuthorId = authorId || req.user.userId;

    const postId = nanoid(12);

    const postData = {
      postId,
      authorId: actualAuthorId,
      authorName,
      authorPicture,
      content,
      images: images || [],
      type: type || 'text',
      visibility: visibility || 'public',
      relatedQuiz,
      relatedAchievement,
      hashtags: hashtags || [],
      mentions: mentions || [],
      likes: 0,
      comments: 0,
      shares: 0,
      isDeleted: false,
      createdAt: new Date(),
    };

    // Get followers
    const followers = await feedManager.getFollowers(actualAuthorId);
    
    // Queue async operations:
    // 1. Fanout to followers' feeds
    await queueManager.addFeedFanout(postData, followers);
    
    // 2. Persist to database
    await queueManager.addPostPersistence(postData);
    
    // 3. Cache post
    await feedManager.cachePost(postId, postData);
    
    // 4. Add to author's own feed
    await feedManager.addToFeed(actualAuthorId, postData);

    logger.info(`Post ${postId} created by ${actualAuthorId} (${followers.length} followers)`);

    res.status(201).json({
      success: true,
      post: {
        postId,
        authorId: actualAuthorId,
        content,
        type,
        visibility,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: postData.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
    });
  }
});

// ============================================
// GET POST
// ============================================

router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    // Try cache first
    let post = await feedManager.getCachedPost(postId);

    if (!post) {
      // Fallback to database
      post = await Post.findOne({ postId, isDeleted: false }).lean();

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }

      // Cache for next time
      await feedManager.cachePost(postId, post);
    }

    // Check if user liked (if userId provided)
    let hasLiked = false;
    if (userId) {
      hasLiked = await Like.hasLiked(userId, 'post', postId);
    }

    res.json({
      success: true,
      post: {
        ...post,
        hasLiked,
      },
    });
  } catch (error) {
    logger.error('Error getting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post',
    });
  }
});

// ============================================
// GET USER FEED
// ============================================

router.get('/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Get feed from Redis
    const feedItems = await feedManager.getFeed(userId, parseInt(page), parseInt(limit));

    // Get full post data (batch)
    const postIds = feedItems.map(item => item.postId);
    const posts = await Post.find({ postId: { $in: postIds }, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      posts,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: feedItems.length === parseInt(limit),
    });
  } catch (error) {
    logger.error('Error getting feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feed',
    });
  }
});

// ============================================
// GET TRENDING POSTS
// ============================================

router.get('/trending/posts', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Get trending post IDs from Redis
    const postIds = await feedManager.getTrending(parseInt(limit));

    // Get full post data
    const posts = await Post.find({ postId: { $in: postIds }, isDeleted: false })
      .lean();

    // Sort by trending score (likes + comments*2 + shares*3)
    posts.sort((a, b) => {
      const scoreA = a.likes + a.comments * 2 + a.shares * 3;
      const scoreB = b.likes + b.comments * 2 + b.shares * 3;
      return scoreB - scoreA;
    });

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    logger.error('Error getting trending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending posts',
    });
  }
});

// ============================================
// LIKE POST
// ============================================

router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId; // Use authenticated user

    // Check if already liked
    const existing = await Like.findOne({ userId, targetType: 'post', targetId: postId });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already liked',
      });
    }

    // Create like
    const like = new Like({
      userId,
      targetType: 'post',
      targetId: postId,
    });
    await like.save();

    // Increment post likes (atomic)
    const post = await Post.findOneAndUpdate(
      { postId },
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Update trending score
    await feedManager.updateTrendingScore(postId, 1);

    // Invalidate cache
    await feedManager.invalidatePostCache(postId);

    // TODO: Queue notification to post author

    res.json({
      success: true,
      likes: post.likes,
    });
  } catch (error) {
    logger.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post',
    });
  }
});

// ============================================
// UNLIKE POST
// ============================================

router.delete('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId; // Use authenticated user

    // Remove like
    const result = await Like.deleteOne({ userId, targetType: 'post', targetId: postId });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Like not found',
      });
    }

    // Decrement post likes (atomic)
    const post = await Post.findOneAndUpdate(
      { postId },
      { $inc: { likes: -1 } },
      { new: true }
    );

    // Update trending score
    await feedManager.updateTrendingScore(postId, -1);

    // Invalidate cache
    await feedManager.invalidatePostCache(postId);

    res.json({
      success: true,
      likes: post?.likes || 0,
    });
  } catch (error) {
    logger.error('Error unliking post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike post',
    });
  }
});

// ============================================
// DELETE POST
// ============================================

router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({ postId });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Authorization: Only post owner or Admin/Moderator can delete
    if (post.authorId.toString() !== req.user.userId && 
        !['Admin', 'Moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Soft delete
    post.isDeleted = true;
    await post.save();

    // Invalidate cache
    await feedManager.invalidatePostCache(postId);

    res.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
    });
  }
});

// ============================================
// SEARCH BY HASHTAG
// ============================================

router.get('/search/hashtag/:hashtag', async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.searchByHashtag(hashtag, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      posts,
      hashtag,
    });
  } catch (error) {
    logger.error('Error searching by hashtag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search posts',
    });
  }
});

module.exports = router;
