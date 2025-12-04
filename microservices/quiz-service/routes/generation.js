/**
 * Quiz Generation Routes
 * Handles async AI quiz generation with job queue
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const crypto = require('crypto');

// Shared utilities
const ApiResponse = require('../../shared/utils/response');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const { requireTeacher } = require('../../shared/middleware/roles');
const { heavyLimiter } = require('../../shared/middleware/rateLimiter');
const { validateFields } = require('../../shared/middleware/inputValidation');

// Service imports
const { addQuizGenerationJob, getJobStatus } = require('../services/queueManager');
const cacheManager = require('../services/cacheManager');
const aiService = require('../services/aiService');

const router = express.Router();
const logger = createLogger('quiz-generation');

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
    const allowed = (process.env.ALLOWED_FILE_TYPES || 'pdf,txt').split(',');
    const ext = path.extname(file.originalname).substring(1).toLowerCase();
    
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} not allowed. Allowed: ${allowed.join(', ')}`));
    }
  },
});

/**
 * @route   POST /api/generate/topic
 * @desc    Generate quiz from topic (async with job queue)
 * @access  Private (Teacher)
 */
router.post(
  '/topic',
  authenticateToken,
  requireTeacher,
  heavyLimiter,
  validateFields({
    topic: { required: true, type: 'string', minLength: 3, maxLength: 200 },
    numQuestions: { type: 'number', min: 1, max: 50 },
    difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard', 'Expert'] },
    useAdaptive: { type: 'boolean' },
    isPublic: { type: 'boolean' },
  }),
  async (req, res) => {
    try {
      const { topic, numQuestions = 5, difficulty = 'Medium', useAdaptive = false, isPublic = true } = req.body;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Check user's daily generation limit
      const limitCheck = await cacheManager.checkUserLimit(userId, userRole);
      if (limitCheck.hasExceeded) {
        return res.status(429).json(
          ApiResponse.error(
            `Daily generation limit reached (${limitCheck.count}/${limitCheck.limit}). Try again tomorrow.`,
            429,
            { limitInfo: limitCheck }
          )
        );
      }

      // Get adaptive context if needed
      let adaptiveContext = null;
      if (useAdaptive) {
        adaptiveContext = await cacheManager.getCachedAdaptiveData(userId);
        if (!adaptiveContext) {
          // If not cached, you'd typically fetch from Result service here
          logger.info(`Adaptive data not cached for user: ${userId}`);
        }
      }

      // Generate job ID for deduplication
      const jobId = `topic-${userId}-${crypto.createHash('md5').update(`${topic}-${numQuestions}-${difficulty}`).digest('hex')}`;

      // Add job to queue
      const job = await addQuizGenerationJob({
        jobId,
        method: 'topic',
        userId,
        userRole,
        data: {
          topic,
          numQuestions: parseInt(numQuestions),
          difficulty,
          useAdaptive,
          userId,
          adaptiveContext,
          isPublic,
        },
      });

      logger.info(`Quiz generation job created: ${job.id} for topic: ${topic}`);

      return ApiResponse.success(res, {
        message: 'Quiz generation started',
        jobId: job.id,
        status: 'queued',
        limitInfo: limitCheck,
        checkStatusUrl: `/api/generate/status/${job.id}`,
      }, 'Quiz generation started', 202);
    } catch (error) {
      logger.error('Topic generation error:', error);
      return ApiResponse.error(res, 'Failed to start quiz generation', 500);
    }
  }
);

/**
 * @route   POST /api/generate/file
 * @desc    Generate quiz from uploaded file (async with job queue)
 * @access  Private (Teacher)
 */
router.post(
  '/file',
  authenticateToken,
  requireTeacher,
  heavyLimiter,
  upload.single('quizFile'),
  async (req, res) => {
    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json(
          ApiResponse.badRequest('No file uploaded')
        );
      }

      filePath = req.file.path;
      const { numQuestions = 5, difficulty = 'Medium', useAdaptive = false, isPublic = true } = req.body;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Check user's daily generation limit
      const limitCheck = await cacheManager.checkUserLimit(userId, userRole);
      if (limitCheck.hasExceeded) {
        return res.status(429).json(
          ApiResponse.error(
            `Daily generation limit reached (${limitCheck.count}/${limitCheck.limit}). Try again tomorrow.`,
            429,
            { limitInfo: limitCheck }
          )
        );
      }

      // Extract text from file
      let extractedText = '';
      if (req.file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        extractedText = data.text;
      } else {
        extractedText = fs.readFileSync(filePath, 'utf8');
      }

      if (!extractedText.trim()) {
        return res.status(400).json(
          ApiResponse.badRequest('Could not extract text from file')
        );
      }

      logger.info(`Extracted ${extractedText.length} characters from ${req.file.originalname}`);

      // Get adaptive context if needed
      let adaptiveContext = null;
      if (useAdaptive) {
        adaptiveContext = await cacheManager.getCachedAdaptiveData(userId);
      }

      // Generate job ID
      const fileHash = aiService.generateFileHash(extractedText);
      const jobId = `file-${userId}-${fileHash.substring(0, 16)}`;

      // Add job to queue
      const job = await addQuizGenerationJob({
        jobId,
        method: 'file',
        userId,
        userRole,
        data: {
          extractedText,
          fileName: req.file.originalname,
          numQuestions: parseInt(numQuestions),
          difficulty,
          useAdaptive,
          userId,
          adaptiveContext,
          isPublic,
        },
      });

      // Clean up file immediately (worker doesn't need it)
      fs.unlinkSync(filePath);
      filePath = null;

      logger.info(`File quiz generation job created: ${job.id}`);

      return ApiResponse.success(res, {
        message: 'Quiz generation started from file',
        jobId: job.id,
        status: 'queued',
        fileName: req.file.originalname,
        limitInfo: limitCheck,
        checkStatusUrl: `/api/generate/status/${job.id}`,
      }, 'Quiz generation started from file', 202);
    } catch (error) {
      logger.error('File generation error:', error);
      
      // Clean up file on error
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return ApiResponse.error(res, 'Failed to start quiz generation from file', 500);
    }
  }
);

/**
 * @route   GET /api/generate/status/:jobId
 * @desc    Check status of quiz generation job
 * @access  Private
 */
router.get(
  '/status/:jobId',
  authenticateToken,
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const status = await getJobStatus(jobId);

      if (status.status === 'not-found') {
        return res.status(404).json(
          ApiResponse.notFound('Job not found')
        );
      }

      return ApiResponse.success(res, {
        jobId,
        status: status.status,
        progress: status.progress,
        result: status.result,
        error: status.error,
        attempts: status.attempts,
        timestamps: {
          created: status.timestamp,
          processed: status.processedOn,
          finished: status.finishedOn,
        },
      });
    } catch (error) {
      logger.error('Job status check error:', error);
      return ApiResponse.error(res, 'Failed to check job status', 500);
    }
  }
);

/**
 * @route   GET /api/generate/limits
 * @desc    Get user's generation limits and usage
 * @access  Private
 */
router.get(
  '/limits',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      const limitInfo = await cacheManager.checkUserLimit(userId, userRole);

      return ApiResponse.success(res, {
        usage: limitInfo.count,
        limit: limitInfo.limit,
        remaining: limitInfo.remaining,
        hasExceeded: limitInfo.hasExceeded,
        role: userRole,
      });
    } catch (error) {
      logger.error('Limit check error:', error);
      return ApiResponse.error(res, 'Failed to check generation limits', 500);
    }
  }
);

module.exports = router;
