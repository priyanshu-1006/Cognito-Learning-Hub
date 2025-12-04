/**
 * Legacy Routes - Backward compatibility with monolith
 * Contains all legacy endpoints that frontend still uses
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mongoose = require('mongoose');
const { authenticateToken } = require('../../shared/middleware/auth');
const { heavyLimiter } = require('../../shared/middleware/rateLimiter');
const aiService = require('../services/aiService');
const createLogger = require('../../shared/utils/logger');

const router = express.Router();
const logger = createLogger('legacy-routes');

/**
 * GET /api/adaptive-difficulty
 * Get adaptive difficulty recommendation based on recent performance
 */
router.get('/adaptive-difficulty', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = mongoose.connection.db;

    // Get last 10 results
    const results = await db.collection('results')
      .find({ user: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    if (results.length === 0) {
      return res.json({
        recommendedDifficulty: 'Medium',
        message: 'No previous results. Starting with Medium difficulty.',
        averageScore: null,
        totalQuizzes: 0
      });
    }

    const avgScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
    let recommendedDifficulty = 'Medium';

    if (avgScore >= 85) {
      recommendedDifficulty = 'Hard';
    } else if (avgScore >= 70) {
      recommendedDifficulty = 'Medium';
    } else {
      recommendedDifficulty = 'Easy';
    }

    res.json({
      recommendedDifficulty,
      averageScore: Math.round(avgScore),
      totalQuizzes: results.length,
      message: `Based on your recent performance (${Math.round(avgScore)}% average), we recommend ${recommendedDifficulty} difficulty.`
    });
  } catch (error) {
    logger.error('Error fetching adaptive difficulty:', error);
    res.status(500).json({ error: 'Failed to calculate adaptive difficulty' });
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10485760 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.txt') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

/**
 * POST /api/generate-quiz-topic
 * Generate quiz from topic (synchronous - matches monolith)
 */
router.post('/generate-quiz-topic', authenticateToken, heavyLimiter, async (req, res) => {
  try {
    const { topic, numQuestions, difficulty, useAdaptive } = req.body;
    const userId = req.user.userId;
    const db = mongoose.connection.db;

    // Determine actual difficulty
    let actualDifficulty = difficulty || 'Medium';
    let adaptiveInfo = null;

    if (useAdaptive) {
      // Get user's adaptive data from results
      const results = await db.collection('results')
        .find({ user: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      if (results.length > 0) {
        const avgScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
        
        // Adjust difficulty based on performance
        if (avgScore >= 85) actualDifficulty = 'Hard';
        else if (avgScore >= 70) actualDifficulty = 'Medium';
        else actualDifficulty = 'Easy';

        adaptiveInfo = {
          originalDifficulty: difficulty,
          adaptedDifficulty: actualDifficulty,
          avgScore,
          reason: `Adjusted based on recent performance (${avgScore.toFixed(1)}%)`
        };
      }
    }

    // Generate quiz using AI
    const prompt = `
You are an expert quiz maker.
Create a quiz based on the following topic: "${topic}".
The quiz should have ${numQuestions || 5} questions.
The difficulty level should be ${actualDifficulty}.

IMPORTANT: Your response MUST be a valid JSON object. Do not include any text, explanation, or markdown formatting before or after the JSON object.
The JSON object should be an array of question objects, where each object has the following structure:
{
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "The correct option text"
}
    `;

    const questions = await aiService.generateQuestions(prompt);

    // Save quiz to database
    const newQuiz = {
      title: `AI Quiz: ${topic}${useAdaptive ? ' (Adaptive)' : ''}`,
      questions,
      difficulty: actualDifficulty,
      createdBy: new mongoose.Types.ObjectId(userId),
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('quizzes').insertOne(newQuiz);
    const savedQuiz = { _id: result.insertedId, ...newQuiz };

    logger.info(`AI-Topic quiz "${savedQuiz.title}" saved for user ${userId}`);

    res.status(201).json({
      quiz: savedQuiz,
      adaptiveInfo: useAdaptive ? adaptiveInfo : null
    });
  } catch (error) {
    logger.error('Error in generate-quiz-topic:', error);
    res.status(500).json({ message: 'Failed to generate quiz from topic.' });
  }
});

/**
 * POST /api/generate-quiz-file
 * Generate quiz from uploaded file (synchronous - matches monolith)
 */
router.post('/generate-quiz-file', authenticateToken, heavyLimiter, upload.single('quizFile'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    filePath = req.file.path;
    const { numQuestions, useAdaptive, difficulty } = req.body;
    const userId = req.user.userId;
    const db = mongoose.connection.db;

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
      throw new Error('Could not extract text from the file.');
    }

    logger.info(`Extracted ${extractedText.length} characters from ${req.file.originalname}`);

    // Determine difficulty
    let actualDifficulty = difficulty || 'Medium';
    let adaptiveInfo = null;

    if (useAdaptive === 'true' || useAdaptive === true) {
      const results = await db.collection('results')
        .find({ user: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      if (results.length > 0) {
        const avgScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
        
        if (avgScore >= 85) actualDifficulty = 'Hard';
        else if (avgScore >= 70) actualDifficulty = 'Medium';
        else actualDifficulty = 'Easy';

        adaptiveInfo = {
          originalDifficulty: difficulty || 'Medium',
          adaptedDifficulty: actualDifficulty,
          avgScore,
          reason: `Adjusted based on recent performance`
        };
      }
    }

    // Generate quiz using AI
    const prompt = `
You are an expert quiz maker.
Create a quiz with ${numQuestions || 5} questions at ${actualDifficulty} difficulty level based on the following text content:
---
${extractedText.substring(0, 8000)}
---

IMPORTANT: Your response MUST be a valid JSON object. Do not include any text, explanation, or markdown formatting before or after the JSON object.
The JSON object should be an array of question objects, each with "question", "options", and "correct_answer" keys.
    `;

    const questions = await aiService.generateQuestions(prompt);

    // Save quiz to database
    const quizTitle = `AI Quiz: ${req.file.originalname}${adaptiveInfo ? ' (Adaptive)' : ''}`;
    const newQuiz = {
      title: quizTitle,
      questions,
      difficulty: actualDifficulty,
      createdBy: new mongoose.Types.ObjectId(userId),
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('quizzes').insertOne(newQuiz);
    const savedQuiz = { _id: result.insertedId, ...newQuiz };

    logger.info(`AI-File quiz "${savedQuiz.title}" saved for user ${userId}`);

    res.status(201).json({
      quiz: savedQuiz,
      adaptiveInfo: adaptiveInfo
    });
  } catch (error) {
    logger.error('Error processing file:', error);
    res.status(500).json({ message: 'An error occurred while processing the file.' });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted temporary file: ${filePath}`);
    }
  }
});

/**
 * POST /api/save-manual-quiz
 * Save manually created quiz (synchronous - matches monolith)
 */
router.post('/save-manual-quiz', authenticateToken, async (req, res) => {
  try {
    const { title, questions } = req.body;
    const userId = req.user.userId;
    const db = mongoose.connection.db;

    const newQuiz = {
      title,
      questions,
      createdBy: new mongoose.Types.ObjectId(userId),
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('quizzes').insertOne(newQuiz);
    const savedQuiz = { _id: result.insertedId, ...newQuiz };

    logger.info(`Manual quiz "${savedQuiz.title}" saved by user ${userId}`);
    res.status(201).json(savedQuiz);
  } catch (error) {
    logger.error('Error saving manual quiz:', error);
    res.status(500).json({ message: 'An error occurred on the server.' });
  }
});

/**
 * POST /api/generate-pdf-questions
 * Generate questions for PDF export (synchronous - matches monolith)
 */
router.post('/generate-pdf-questions', authenticateToken, async (req, res) => {
  try {
    const { topic, numQuestions, difficulty, questionTypes } = req.body;

    // Build prompt based on question types
    const typeMapping = {
      mcq: 'Multiple Choice Questions with 4 options',
      truefalse: 'True/False Questions',
      descriptive: 'Descriptive/Essay Questions'
    };

    const requestedTypes = (questionTypes || ['mcq'])
      .map(type => typeMapping[type] || type)
      .join(', ');

    const prompt = `
You are an expert quiz maker and educator.
Create ${numQuestions || 5} quiz questions about "${topic}".
Difficulty level: ${difficulty || 'Medium'}
Question types to include: ${requestedTypes}

For each question, provide:
1. Question text that is clear and educational
2. Question type (mcq, truefalse, or descriptive)
3. For MCQ: exactly 4 options with one correct answer
4. For True/False: the correct answer (True or False)
5. For Descriptive: key points for the answer
6. A brief explanation or reasoning
7. Appropriate marks (1-3 for MCQ/True-False, 3-10 for descriptive)

IMPORTANT: Your response MUST be a valid JSON array. Do not include any text before or after the JSON.

Example format:
[
  {
    "type": "mcq",
    "question": "What is photosynthesis?",
    "options": ["Process of respiration", "Process of making food using sunlight", "Process of digestion", "Process of excretion"],
    "correctAnswer": "Process of making food using sunlight",
    "explanation": "Photosynthesis is the process by which plants make their own food using sunlight, water, and carbon dioxide.",
    "marks": 2
  }
]
    `;

    const questions = await aiService.generateQuestions(prompt);

    // Format questions for PDF
    const formattedQuestions = questions.map((q, index) => ({
      type: q.type || 'mcq',
      question: q.question || `Generated question ${index + 1}`,
      options: q.options || [],
      correctAnswer: q.correctAnswer || q.correct_answer || '',
      explanation: q.explanation || '',
      marks: q.marks || (q.type === 'descriptive' ? 5 : 2)
    }));

    logger.info(`Generated ${formattedQuestions.length} PDF questions for topic: ${topic}`);
    res.json({ questions: formattedQuestions });
  } catch (error) {
    logger.error('Error generating PDF questions:', error);
    res.status(500).json({
      message: 'Failed to generate questions for PDF',
      error: error.message
    });
  }
});

module.exports = router;
