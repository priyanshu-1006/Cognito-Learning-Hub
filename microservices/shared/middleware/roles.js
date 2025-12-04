/**
 * Role-Based Access Control Middleware
 * Enforces role permissions across microservices
 */

const ApiResponse = require('../utils/response');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

// Specific role middlewares
const requireAdmin = requireRole('Admin');
const requireModerator = requireRole('Moderator', 'Admin');
const requireTeacher = requireRole('Teacher', 'Admin');
const requireStudent = requireRole('Student', 'Teacher', 'Moderator', 'Admin');

module.exports = {
  requireRole,
  requireAdmin,
  requireModerator,
  requireTeacher,
  requireStudent,
};
