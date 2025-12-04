/**
 * Moderator Routes
 * Dashboard stats and quiz management for moderators
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const moderatorMiddleware = require('../middleware/moderatorMiddleware');
const logger = require('../utils/logger');

/**
 * GET /api/moderator/stats
 * Get moderator dashboard statistics
 */
router.get('/stats', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    // Query directly from database using monolith schema
    const db = mongoose.connection.db;
    
    // Get total quizzes count
    const totalQuizzes = await db.collection('quizzes').countDocuments();
    
    // Get pending reports count
    const pendingReports = await db.collection('reports').countDocuments({ 
      status: 'pending' 
    });
    
    res.json({ 
      totalQuizzes, 
      pendingReports 
    });
  } catch (error) {
    logger.error('Error fetching moderator stats:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * GET /api/moderator/quizzes
 * Get all quizzes for moderation with search and pagination
 */
router.get('/quizzes', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const db = mongoose.connection.db;
    
    // Build query
    const query = search ? { title: { $regex: search, $options: 'i' } } : {};
    
    // Get quizzes with pagination
    const quizzes = await db.collection('quizzes')
      .aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdByUser'
          }
        },
        {
          $unwind: {
            path: '$createdByUser',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            category: 1,
            difficulty: 1,
            isPublic: 1,
            createdAt: 1,
            updatedAt: 1,
            questions: 1, // Include questions array for length
            'createdBy': {
              _id: '$createdByUser._id',
              name: '$createdByUser.name'
            }
          }
        }
      ])
      .toArray();
    
    // Get total count for pagination
    const count = await db.collection('quizzes').countDocuments(query);
    
    res.json({
      quizzes,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    logger.error('Error fetching moderator quizzes:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * DELETE /api/moderator/quizzes/:id
 * Delete a quiz (moderator action)
 */
router.delete('/quizzes/:id', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const quizId = new mongoose.Types.ObjectId(req.params.id);
    const db = mongoose.connection.db;
    
    // Delete the quiz
    await db.collection('quizzes').deleteOne({ _id: quizId });
    
    // Delete associated results
    await db.collection('results').deleteMany({ quiz: quizId });
    
    logger.info(`Quiz ${quizId} removed by moderator ${req.user.id}`);
    
    res.json({ msg: 'Quiz removed by moderator' });
  } catch (error) {
    logger.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
