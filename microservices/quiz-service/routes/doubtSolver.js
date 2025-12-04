/**
 * Doubt Solver Routes
 * AI-powered doubt solving for students
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Shared utilities
const ApiResponse = require('../../shared/utils/response');
const createLogger = require('../../shared/utils/logger');
const { optionalAuth } = require('../../shared/middleware/auth');
const { generalLimiter } = require('../../shared/middleware/rateLimiter');

// Service imports
const aiService = require('../services/aiService');

const router = express.Router();
const logger = createLogger('doubt-solver');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['pdf', 'txt', 'jpg', 'jpeg', 'png'];
    const ext = path.extname(file.originalname).substring(1).toLowerCase();
    
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} not allowed. Allowed: ${allowed.join(', ')}`));
    }
  },
});

/**
 * @route   POST /api/doubt-solver
 * @desc    Solve student doubts using AI (with optional file upload)
 * @access  Public (with optional auth)
 */
router.post('/', optionalAuth, generalLimiter, upload.array('files', 10), async (req, res) => {
  try {
    const { message } = req.body;
    const files = req.files || [];

    // Validate input
    if (!message && files.length === 0) {
      return ApiResponse.badRequest(res, 'No message or files provided');
    }

    logger.info(`Doubt solver request: ${message ? message.substring(0, 50) : 'file upload'}`);

    let prompt;

    // If files are provided, handle file analysis
    if (files.length > 0) {
      const fileInfo = files
        .map((f) => `${f.originalname} (${f.mimetype})`)
        .join(', ');
      
      prompt = `
You are a friendly and encouraging AI tutor for students. 
Your name is Cognito Learning Hub AI Assistant.
A student has uploaded files: ${fileInfo}
They also said: "${message || 'Please analyze these files'}"
Provide a clear, helpful, and concise response suitable for a high school student.
For mathematical formulas and equations, use LaTeX notation wrapped in $ for inline math or $$ for block math.
For example: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
Do not answer questions that are not academic or educational in nature.
      `.trim();

      // Clean up uploaded files after processing
      setTimeout(() => {
        files.forEach((file) => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (err) {
            logger.error('Error deleting file:', err);
          }
        });
      }, 5000);
    } else {
      // Regular text-based doubt solving
      prompt = `
You are a friendly and encouraging AI tutor for students. 
Your name is Cognito Learning Hub AI Assistant.
A student has asked the following question: "${message}".
Provide a clear, helpful, and concise answer suitable for a high school student.
For mathematical formulas and equations, use LaTeX notation wrapped in $ for inline math or $$ for block math.
For example: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
Do not answer questions that are not academic or educational in nature.
      `.trim();
    }

    // Generate AI response using aiService
    const result = await aiService.generateContent(prompt);
    
    if (!result || !result.text) {
      throw new Error('Failed to generate AI response');
    }

    return ApiResponse.success(res, { reply: result.text }, 'Doubt solved successfully');

  } catch (error) {
    logger.error('Doubt solver error:', error);
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          logger.error('Error deleting file on error:', err);
        }
      });
    }

    return ApiResponse.error(res, 'An error occurred while solving your doubt', 500);
  }
});

module.exports = router;
