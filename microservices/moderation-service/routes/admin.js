/**
 * Admin Routes
 * Dashboard stats, user management, and quiz management for admins
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const logger = require('../utils/logger');

/**
 * GET /api/admin/users
 * Get all users with search and pagination
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const db = mongoose.connection.db;
    
    // Build query
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    
    // Get users with pagination
    const users = await db.collection('users')
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();
    
    // Get total count
    const count = await db.collection('users').countDocuments(query);
    
    // Get total counts for all roles
    const totalUsers = await db.collection('users').countDocuments();
    const totalStudents = await db.collection('users').countDocuments({ role: 'Student' });
    const totalTeachers = await db.collection('users').countDocuments({ role: 'Teacher' });
    const totalModerators = await db.collection('users').countDocuments({ role: 'Moderator' });
    const totalAdmins = await db.collection('users').countDocuments({ role: 'Admin' });
    
    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalModerators,
        totalAdmins
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * GET /api/admin/quizzes
 * Get all quizzes with search and pagination
 */
router.get('/quizzes', authMiddleware, adminMiddleware, async (req, res) => {
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
            questions: 1,
            'createdBy': {
              _id: '$createdByUser._id',
              name: '$createdByUser.name'
            }
          }
        }
      ])
      .toArray();
    
    // Get total count
    const count = await db.collection('quizzes').countDocuments(query);
    const totalQuizzes = await db.collection('quizzes').countDocuments();
    
    res.json({
      quizzes,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalQuizzes
    });
  } catch (error) {
    logger.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * GET /api/admin/analytics
 * Get site analytics (user signups last 7 days)
 */
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const userSignups = await db.collection('users')
      .aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();
    
    res.json({ userSignups });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const db = mongoose.connection.db;
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: userId },
      { $set: { role } },
      { returnDocument: 'after', projection: { password: 0 } }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User ${userId} role updated to ${role} by admin ${req.user.id}`);
    res.json(result.value);
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * DELETE /api/admin/quizzes/:id
 * Delete a quiz (admin action)
 */
router.delete('/quizzes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const quizId = new mongoose.Types.ObjectId(req.params.id);
    const db = mongoose.connection.db;
    
    // Delete the quiz
    await db.collection('quizzes').deleteOne({ _id: quizId });
    
    // Delete associated results
    await db.collection('results').deleteMany({ quiz: quizId });
    
    logger.info(`Quiz ${quizId} removed by admin ${req.user.id}`);
    
    res.json({ msg: 'Quiz removed by admin' });
  } catch (error) {
    logger.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
