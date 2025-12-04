/**
 * Input Validation Middleware
 * Provides common validation schemas and sanitization
 */

const { body, validationResult } = require('express-validator');
const ApiResponse = require('../utils/response');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return ApiResponse.badRequest(res, 'Validation failed', errorMessages);
  }
  next();
};

// Common validation rules
const validationRules = {
  email: body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),

  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  objectId: (fieldName) =>
    body(fieldName)
      .trim()
      .isMongoId()
      .withMessage(`${fieldName} must be a valid ID`),

  role: body('role')
    .optional()
    .isIn(['Student', 'Teacher', 'Moderator', 'Admin'])
    .withMessage('Invalid role'),

  difficulty: body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard', 'Expert'])
    .withMessage('Invalid difficulty level'),

  numQuestions: body('numQuestions')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of questions must be between 1 and 50'),

  // Auth-specific validations
  register: [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['Student', 'Teacher']).withMessage('Invalid role'),
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  updateProfile: [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('picture').optional().isURL().withMessage('Picture must be a valid URL'),
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],

  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],

  resetPassword: [
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
};

// Sanitize input to prevent NoSQL injection
const sanitizeInput = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/^\$/, '').replace(/^\./g, '');
      } else if (typeof obj[key] === 'object') {
        sanitizeInput(obj[key]);
      }
    }
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.startsWith('.')) {
        delete obj[key];
      }
    });
  }
  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

module.exports = {
  handleValidationErrors,
  validationRules,
  sanitizeMiddleware,
};
