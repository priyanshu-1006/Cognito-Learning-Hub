/**
 * Shared Library Index
 * Centralized exports for easy imports across microservices
 */

// Utilities
const createLogger = require('./utils/logger');
const DatabaseConnection = require('./utils/database');
const RedisClient = require('./utils/redis');
const ApiResponse = require('./utils/response');
const EventBus = require('./utils/eventBus');
const HttpClient = require('./utils/httpClient');
const HealthChecker = require('./utils/healthCheck');

// Middleware
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const {
  requireRole,
  requireAdmin,
  requireModerator,
  requireTeacher,
  requireStudent,
} = require('./middleware/roles');
const errorHandler = require('./middleware/errorHandler');
const {
  generalLimiter,
  authLimiter,
  heavyLimiter,
} = require('./middleware/rateLimiter');
const {
  handleValidationErrors,
  validationRules,
  sanitizeMiddleware,
} = require('./middleware/validation');

// Configuration
const constants = require('./config/constants');
const { SERVICES, getServiceUrl } = require('./config/services');

module.exports = {
  // Utilities
  createLogger,
  DatabaseConnection,
  RedisClient,
  ApiResponse,
  EventBus,
  HttpClient,
  HealthChecker,

  // Middleware
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireModerator,
  requireTeacher,
  requireStudent,
  errorHandler,
  generalLimiter,
  authLimiter,
  heavyLimiter,
  handleValidationErrors,
  validationRules,
  sanitizeMiddleware,

  // Configuration
  constants,
  SERVICES,
  getServiceUrl,
};
