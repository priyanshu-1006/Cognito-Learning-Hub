/**
 * Input Validation and Sanitization Middleware
 * Prevents XSS, MongoDB injection, and validates input formats
 */

const validator = require('validator');
const { Types } = require('mongoose');
const createLogger = require('../utils/logger');

const logger = createLogger('input-validation');

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove HTML tags
  let sanitized = validator.escape(str);
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  
  return sanitized;
}

/**
 * Validate and sanitize MongoDB ObjectId
 */
function validateObjectId(id, fieldName = 'id') {
  if (!id) {
    throw new Error(`${fieldName} is required`);
  }
  
  // Prevent MongoDB injection
  if (typeof id !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  // Validate ObjectId format
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName} format`);
  }
  
  return id;
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Prevent MongoDB injection operators
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip MongoDB operators
    if (key.startsWith('$')) {
      logger.warn(`Blocked MongoDB operator: ${key}`);
      continue;
    }
    
    if (typeof value === 'string') {
      cleaned[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware to sanitize query parameters
 */
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Middleware to sanitize params
 */
function sanitizeParams(req, res, next) {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Combined sanitization middleware
 */
function sanitizeAll(req, res, next) {
  sanitizeBody(req, res, () => {});
  sanitizeQuery(req, res, () => {});
  sanitizeParams(req, res, () => {});
  next();
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  return email.toLowerCase().trim();
}

/**
 * Validate URL format
 */
function validateURL(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required');
  }
  
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    throw new Error('Invalid URL format');
  }
  
  return url;
}

/**
 * Validate pagination parameters
 */
function validatePagination(page, limit) {
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 20;
  
  if (parsedPage < 1) {
    throw new Error('Page must be greater than 0');
  }
  
  if (parsedLimit < 1 || parsedLimit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  return { page: parsedPage, limit: parsedLimit };
}

/**
 * Validate string length
 */
function validateLength(str, fieldName, min, max) {
  if (typeof str !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  const length = str.trim().length;
  
  if (length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters`);
  }
  
  if (max && length > max) {
    throw new Error(`${fieldName} must not exceed ${max} characters`);
  }
  
  return str.trim();
}

/**
 * Validate and sanitize search query
 */
function validateSearchQuery(search) {
  if (!search || typeof search !== 'string') {
    return '';
  }
  
  // Limit length
  let sanitized = search.trim().substring(0, 100);
  
  // Escape regex special characters for MongoDB
  sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  return sanitized;
}

/**
 * Validate array of ObjectIds
 */
function validateObjectIdArray(arr, fieldName = 'items') {
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} must be an array`);
  }
  
  if (arr.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  
  return arr.map((id, index) => 
    validateObjectId(id, `${fieldName}[${index}]`)
  );
}

/**
 * Validate difficulty level
 */
function validateDifficulty(difficulty) {
  const validLevels = ['Easy', 'Medium', 'Hard'];
  
  if (!validLevels.includes(difficulty)) {
    throw new Error(`Difficulty must be one of: ${validLevels.join(', ')}`);
  }
  
  return difficulty;
}

/**
 * Validate role
 */
function validateRole(role) {
  const validRoles = ['Student', 'Teacher', 'Moderator', 'Admin'];
  
  if (!validRoles.includes(role)) {
    throw new Error(`Role must be one of: ${validRoles.join(', ')}`);
  }
  
  return role;
}

/**
 * Validate positive integer
 */
function validatePositiveInteger(value, fieldName) {
  const parsed = parseInt(value);
  
  if (isNaN(parsed) || parsed < 1) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  
  return parsed;
}

/**
 * Validate score (0-100)
 */
function validateScore(score) {
  const parsed = parseFloat(score);
  
  if (isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error('Score must be between 0 and 100');
  }
  
  return parsed;
}

/**
 * Middleware factory for validating specific fields
 */
function validateFields(schema) {
  return (req, res, next) => {
    try {
      const errors = [];
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field] || req.query[field] || req.params[field];
        
        // Check required
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }
        
        // Skip validation if optional and not provided
        if (!rules.required && (value === undefined || value === null)) {
          continue;
        }
        
        // Type validation
        if (rules.type) {
          switch (rules.type) {
            case 'email':
              try {
                validateEmail(value);
              } catch (err) {
                errors.push(err.message);
              }
              break;
            case 'objectId':
              try {
                validateObjectId(value, field);
              } catch (err) {
                errors.push(err.message);
              }
              break;
            case 'url':
              try {
                validateURL(value);
              } catch (err) {
                errors.push(err.message);
              }
              break;
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`${field} must be a string`);
              } else if (rules.minLength || rules.maxLength) {
                try {
                  validateLength(value, field, rules.minLength || 0, rules.maxLength);
                } catch (err) {
                  errors.push(err.message);
                }
              }
              break;
            case 'number':
              if (typeof value !== 'number' && isNaN(Number(value))) {
                errors.push(`${field} must be a number`);
              }
              break;
            case 'array':
              if (!Array.isArray(value)) {
                errors.push(`${field} must be an array`);
              }
              break;
          }
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      
      next();
    } catch (error) {
      logger.error('Validation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message,
      });
    }
  };
}

module.exports = {
  // Sanitization
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  
  // Validation
  validateObjectId,
  validateEmail,
  validateURL,
  validatePagination,
  validateLength,
  validateSearchQuery,
  validateObjectIdArray,
  validateDifficulty,
  validateRole,
  validatePositiveInteger,
  validateScore,
  
  // Middleware
  validateFields,
};
