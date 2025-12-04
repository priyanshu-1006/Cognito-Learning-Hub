/**
 * User Routes
 * Handles user profile management, status updates, and user queries
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Shared utilities
const ApiResponse = require('../../shared/utils/response');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const { requireAdmin, requireModerator } = require('../../shared/middleware/roles');
const { validationRules, handleValidationErrors } = require('../../shared/middleware/validation');

const router = express.Router();
const logger = createLogger('auth-service');
const User = require('../models/User');

/**
 * @route   GET /api/users/search
 * @desc    Search users by name or email
 * @access  Private
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.userId;

    if (!query || query.trim().length < 2) {
      return ApiResponse.badRequest(res, 'Search query must be at least 2 characters');
    }

    // Search by name or email (case-insensitive), exclude current user
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name email picture role createdAt')
      .limit(20); // Limit results

    logger.info(`Search found ${users.length} users for query: ${query}`);

    return ApiResponse.success(
      res,
      {
        users: users.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          role: user.role,
        })),
      },
      'Users found successfully'
    );
  } catch (error) {
    logger.error('Search users error:', error);
    return ApiResponse.error(res, 'Failed to search users', 500);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    res.json(
      ApiResponse.success({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: user.picture,
          status: user.status,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error) {
    logger.error('Get user error:', error);
    return ApiResponse.error(res, 'Failed to fetch user', 500);
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  validationRules.updateProfile,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { name, picture } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      // Update fields
      if (name) user.name = name;
      if (picture) user.picture = picture;

      await user.save();

      logger.info(`Profile updated for user: ${user.email}`);

      res.json(
        ApiResponse.success({
          message: 'Profile updated successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            picture: user.picture,
          },
        })
      );
    } catch (error) {
      logger.error('Update profile error:', error);
      return ApiResponse.error(res, 'Failed to update profile', 500);
    }
  }
);

/**
 * @route   PUT /api/users/password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/password',
  authenticateToken,
  validationRules.changePassword,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      // Check if user has a password (not Google-only user)
      if (!user.password) {
        return res.status(400).json(
          ApiResponse.badRequest('Cannot change password for Google-authenticated users')
        );
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json(
          ApiResponse.unauthorized('Current password is incorrect')
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
      user.password = await bcrypt.hash(newPassword, salt);

      // Invalidate all refresh tokens (force re-login)
      user.refreshTokens = [];

      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      res.json(
        ApiResponse.success({
          message: 'Password changed successfully. Please login again.',
        })
      );
    } catch (error) {
      logger.error('Change password error:', error);
      return ApiResponse.error(res, 'Failed to change password', 500);
    }
  }
);

/**
 * @route   POST /api/users/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  validationRules.forgotPassword,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists
        return res.json(
          ApiResponse.success({
            message: 'If the email exists, a password reset link has been sent.',
          })
        );
      }

      // Check if user has a password (not Google-only user)
      if (user.googleId && !user.password) {
        return res.status(400).json(
          ApiResponse.badRequest('Please login with Google')
        );
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.passwordResetExpires = Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRY || 3600000);

      await user.save();

      logger.info(`Password reset requested for: ${email}`);
      logger.info(`Reset token: ${resetToken}`);

      // TODO: Send email with resetToken
      // For development, we'll return the token
      res.json(
        ApiResponse.success({
          message: 'If the email exists, a password reset link has been sent.',
          ...(process.env.NODE_ENV === 'development' && { resetToken }),
        })
      );
    } catch (error) {
      logger.error('Forgot password error:', error);
      return ApiResponse.error(res, 'Failed to process request', 500);
    }
  }
);

/**
 * @route   POST /api/users/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password/:token',
  validationRules.resetPassword,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { newPassword } = req.body;

      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      }).select('+password');

      if (!user) {
        return res.status(400).json(
          ApiResponse.badRequest('Invalid or expired reset token')
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
      user.password = await bcrypt.hash(newPassword, salt);

      // Clear reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      // Invalidate all refresh tokens
      user.refreshTokens = [];

      await user.save();

      logger.info(`Password reset successful for: ${user.email}`);

      res.json(
        ApiResponse.success({
          message: 'Password reset successfully. Please login with your new password.',
        })
      );
    } catch (error) {
      logger.error('Reset password error:', error);
      return ApiResponse.error(res, 'Failed to reset password', 500);
    }
  }
);

/**
 * @route   PUT /api/users/status
 * @desc    Update user status (online, offline, away)
 * @access  Private
 */
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.body;

    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json(
        ApiResponse.badRequest('Invalid status. Must be online, offline, or away')
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    user.status = status;
    if (status === 'offline') {
      user.lastSeen = Date.now();
    }
    await user.save();

    res.json(
      ApiResponse.success({
        message: 'Status updated successfully',
        status: user.status,
      })
    );
  } catch (error) {
    logger.error('Update status error:', error);
    return ApiResponse.error(res, 'Failed to update status', 500);
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin/Moderator only)
 * @access  Private (Admin/Moderator)
 */
router.get('/', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json(
      ApiResponse.success({
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      })
    );
  } catch (error) {
    logger.error('Get users error:', error);
    return ApiResponse.error(res, 'Failed to fetch users', 500);
  }
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['Student', 'Teacher', 'Moderator', 'Admin'].includes(role)) {
      return res.status(400).json(
        ApiResponse.badRequest('Invalid role')
      );
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    user.role = role;
    await user.save();

    logger.info(`Role updated for user ${user.email}: ${role}`);

    res.json(
      ApiResponse.success({
        message: 'User role updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    );
  } catch (error) {
    logger.error('Update role error:', error);
    return ApiResponse.error(res, 'Failed to update role', 500);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    logger.info(`User deleted: ${user.email}`);

    res.json(
      ApiResponse.success({
        message: 'User deleted successfully',
      })
    );
  } catch (error) {
    logger.error('Delete user error:', error);
    return ApiResponse.error(res, 'Failed to delete user', 500);
  }
});

module.exports = router;
