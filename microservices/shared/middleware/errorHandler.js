/**
 * Centralized Error Handler Middleware
 * Catches and formats errors consistently across all services
 */

const createLogger = require('../utils/logger');
const ApiResponse = require('../utils/response');

const errorHandler = (serviceName) => {
  const logger = createLogger(serviceName);

  return (err, req, res, next) => {
    // Log the error
    logger.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return ApiResponse.conflict(res, `${field} already exists`);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired');
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      return ApiResponse.badRequest(res, 'Invalid ID format');
    }

    // Default server error
    return ApiResponse.serverError(
      res,
      err.message || 'Internal server error',
      err
    );
  };
};

module.exports = errorHandler;
