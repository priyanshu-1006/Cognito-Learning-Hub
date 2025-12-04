/**
 * Authentication Middleware
 * Validates JWT tokens across all microservices
 */

const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
  // Get token from header - support both formats
  let token = req.header('x-auth-token');

  // Check for Bearer token format
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  // Check if token exists
  if (!token) {
    return ApiResponse.unauthorized(res, 'No token, authorization denied');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user; // Attach user info to request
    next();
  } catch (err) {
    return ApiResponse.unauthorized(res, 'Token is not valid');
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  let token = req.header('x-auth-token');

  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user;
    } catch (err) {
      // Token invalid but continue anyway
      req.user = null;
    }
  }

  next();
};

// Admin middleware - requires Admin role
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }
  
  if (req.user.role !== 'Admin') {
    return ApiResponse.forbidden(res, 'Admin access required');
  }
  
  next();
};

// Moderator middleware - requires Moderator or Admin role
const moderatorMiddleware = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }
  
  if (!['Moderator', 'Admin'].includes(req.user.role)) {
    return ApiResponse.forbidden(res, 'Moderator access required');
  }
  
  next();
};

module.exports = { authenticateToken, optionalAuth, adminMiddleware, moderatorMiddleware };
