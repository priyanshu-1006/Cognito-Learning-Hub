/**
 * AI Generation Service with Circuit Breaker and Caching
 * Addresses: AI timeout, circuit breaker, and caching optimizations
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const CircuitBreaker = require('opossum');
const crypto = require('crypto');
const createLogger = require('../../shared/utils/logger');
const cacheManager = require('./cacheManager');

const logger = createLogger('ai-service');

// Validate API key on startup
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  logger.error('GOOGLE_API_KEY environment variable is not set!');
  throw new Error('GOOGLE_API_KEY is required for quiz generation');
}

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' 
});

/**
 * Core AI generation function (to be wrapped in circuit breaker)
 */
async function generateQuizWithAI(prompt) {
  try {
    const startTime = Date.now();
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const duration = Date.now() - startTime;
    logger.info(`AI generation completed in ${duration}ms`);
    
    return { text, duration };
  } catch (error) {
    logger.error('AI generation failed:', error);
    throw error;
  }
}

/**
 * Circuit Breaker Configuration
 */
const circuitBreakerOptions = {
  timeout: parseInt(process.env.AI_TIMEOUT) || 15000, // 15 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: parseInt(process.env.AI_CIRCUIT_BREAKER_TIMEOUT) || 60000, // 60 seconds
  rollingCountTimeout: 10000, // 10 second rolling window
  rollingCountBuckets: 10,
  name: 'AI Generation Circuit Breaker',
};

// Wrap AI generation in circuit breaker
const protectedAIGeneration = new CircuitBreaker(generateQuizWithAI, circuitBreakerOptions);

// Circuit breaker event listeners
protectedAIGeneration.on('open', () => {
  logger.error('Circuit breaker OPENED - AI service unavailable');
});

protectedAIGeneration.on('halfOpen', () => {
  logger.warn('Circuit breaker HALF-OPEN - Testing AI service');
});

protectedAIGeneration.on('close', () => {
  logger.info('Circuit breaker CLOSED - AI service restored');
});

protectedAIGeneration.on('timeout', () => {
  logger.warn('AI generation TIMEOUT');
});

protectedAIGeneration.on('failure', (error) => {
  logger.error('AI generation FAILURE:', error.message);
});

protectedAIGeneration.fallback((prompt) => {
  logger.error('Circuit breaker FALLBACK triggered');
  throw new Error('AI service is currently unavailable. Please try again later.');
});

/**
 * Extract JSON from AI response (handles markdown formatting)
 */
function extractJson(text) {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try to find array in text
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    
    throw new Error('Could not extract valid JSON from AI response');
  }
}

/**
 * Generate file hash for cache key
 */
function generateFileHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Build AI prompt for topic-based quiz
 */
function buildTopicPrompt(topic, numQuestions, difficulty, adaptiveContext = null) {
  let prompt = `You are an expert quiz maker.
Create a quiz based on the following topic: "${topic}".
The quiz should have ${numQuestions} questions.
The difficulty level should be ${difficulty}.`;

  // Add adaptive context if available
  if (adaptiveContext) {
    prompt += `\n\nADAPTIVE MODE CONTEXT:
- User's average score: ${adaptiveContext.avgScore?.toFixed(1)}%
- Performance trend: ${adaptiveContext.trend}`;
    
    if (adaptiveContext.weakAreas && adaptiveContext.weakAreas.length > 0) {
      prompt += `\n- Weak areas to focus on: ${adaptiveContext.weakAreas.join(', ')}`;
    }
    
    prompt += `\n\nPlease tailor the questions to help this user improve, maintaining ${difficulty} difficulty.`;
  }

  prompt += `\n\nIMPORTANT: Your response MUST be a valid JSON array. Do not include any text, explanation, or markdown formatting.
The JSON should be an array of question objects with this exact structure:
[
  {
    "question": "Your question here",
    "type": "multiple-choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "The correct option text",
    "explanation": "Brief explanation of the answer",
    "points": 1,
    "timeLimit": 30,
    "difficulty": "${difficulty}"
  }
]`;

  return prompt;
}

/**
 * Build AI prompt for file-based quiz
 */
function buildFilePrompt(extractedText, numQuestions, difficulty, adaptiveContext = null) {
  let prompt = `You are an expert quiz maker.
Create ${numQuestions} questions at ${difficulty} difficulty level based on the following content:

---
${extractedText.substring(0, 8000)}
---`;

  // Add adaptive context if available
  if (adaptiveContext) {
    prompt += `\n\nIMPORTANT CONTEXT: This quiz is for a user with:
- Average performance: ${adaptiveContext.avgScore?.toFixed(1)}%
- Performance trend: ${adaptiveContext.trend}`;
    
    if (adaptiveContext.weakAreas && adaptiveContext.weakAreas.length > 0) {
      prompt += `\n- Weak areas: ${adaptiveContext.weakAreas.join(', ')}`;
    }
    
    prompt += `\n\nAdjust the difficulty and focus accordingly.`;
  }

  prompt += `\n\nIMPORTANT: Your response MUST be a valid JSON array with the following structure:
[
  {
    "question": "Question text",
    "type": "multiple-choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Correct option",
    "explanation": "Brief explanation",
    "points": 1,
    "timeLimit": 30,
    "difficulty": "${difficulty}"
  }
]`;

  return prompt;
}

/**
 * Generate quiz from topic (with caching)
 */
async function generateQuizFromTopic({
  topic,
  numQuestions = 5,
  difficulty = 'Medium',
  useAdaptive = false,
  userId = null,
  adaptiveContext = null,
}) {
  try {
    // Check cache first
    const cacheKey = cacheManager.getTopicQuizKey(topic, numQuestions, difficulty, useAdaptive);
    const cached = await cacheManager.getCachedQuiz(cacheKey);
    
    if (cached) {
      logger.info(`Returning cached quiz for topic: ${topic}`);
      return {
        questions: cached.questions,
        fromCache: true,
        cacheKey,
        adaptiveInfo: cached.adaptiveInfo,
      };
    }
    
    // Build prompt
    const prompt = buildTopicPrompt(topic, numQuestions, difficulty, adaptiveContext);
    
    // Generate with circuit breaker protection
    const { text, duration } = await protectedAIGeneration.fire(prompt);
    
    // Extract and parse questions
    const questions = extractJson(text);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('AI did not return valid questions array');
    }
    
    // Prepare result
    const result = {
      questions,
      fromCache: false,
      generationTime: duration,
      adaptiveInfo: useAdaptive && adaptiveContext ? {
        originalDifficulty: difficulty,
        adaptedDifficulty: adaptiveContext.suggestedDifficulty || difficulty,
        reason: adaptiveContext.reason,
        avgScore: adaptiveContext.avgScore,
        trend: adaptiveContext.trend,
      } : null,
    };
    
    // Cache for future use
    await cacheManager.cacheQuiz(cacheKey, result, cacheManager.QUIZ_CACHE_TTL);
    
    logger.info(`Generated and cached quiz for topic: ${topic}`);
    return result;
  } catch (error) {
    logger.error(`Failed to generate quiz from topic: ${topic}`, error);
    throw error;
  }
}

/**
 * Generate quiz from file content (with caching)
 */
async function generateQuizFromFile({
  extractedText,
  numQuestions = 5,
  difficulty = 'Medium',
  useAdaptive = false,
  userId = null,
  adaptiveContext = null,
  fileName = 'unknown',
}) {
  try {
    // Generate file hash for cache key
    const fileHash = generateFileHash(extractedText);
    const cacheKey = cacheManager.getFileQuizKey(fileHash, numQuestions, difficulty);
    
    // Check cache first
    const cached = await cacheManager.getCachedQuiz(cacheKey);
    
    if (cached) {
      logger.info(`Returning cached quiz for file: ${fileName}`);
      return {
        questions: cached.questions,
        fromCache: true,
        cacheKey,
        adaptiveInfo: cached.adaptiveInfo,
      };
    }
    
    // Build prompt
    const prompt = buildFilePrompt(extractedText, numQuestions, difficulty, adaptiveContext);
    
    // Generate with circuit breaker protection
    const { text, duration } = await protectedAIGeneration.fire(prompt);
    
    // Extract and parse questions
    const questions = extractJson(text);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('AI did not return valid questions array');
    }
    
    // Prepare result
    const result = {
      questions,
      fromCache: false,
      generationTime: duration,
      adaptiveInfo: useAdaptive && adaptiveContext ? {
        originalDifficulty: difficulty,
        adaptedDifficulty: adaptiveContext.suggestedDifficulty || difficulty,
        reason: adaptiveContext.reason,
        avgScore: adaptiveContext.avgScore,
      } : null,
    };
    
    // Cache for longer (files are more stable content)
    await cacheManager.cacheQuiz(cacheKey, result, cacheManager.FILE_QUIZ_CACHE_TTL);
    
    logger.info(`Generated and cached quiz for file: ${fileName}`);
    return result;
  } catch (error) {
    logger.error(`Failed to generate quiz from file: ${fileName}`, error);
    throw error;
  }
}

/**
 * Get circuit breaker stats
 */
function getCircuitBreakerStats() {
  return {
    state: protectedAIGeneration.opened ? 'OPEN' : protectedAIGeneration.halfOpen ? 'HALF-OPEN' : 'CLOSED',
    stats: protectedAIGeneration.stats,
    options: {
      timeout: circuitBreakerOptions.timeout,
      errorThreshold: circuitBreakerOptions.errorThresholdPercentage,
      resetTimeout: circuitBreakerOptions.resetTimeout,
    },
  };
}

/**
 * Generate content from prompt (for doubt solver)
 */
async function generateContent(prompt) {
  try {
    const result = await protectedAIGeneration.fire(prompt);
    return result;
  } catch (error) {
    logger.error('Content generation error:', error);
    throw error;
  }
}

/**
 * Generate questions from prompt (for legacy routes)
 * Returns parsed questions array
 */
async function generateQuestions(prompt) {
  try {
    const result = await protectedAIGeneration.fire(prompt);
    const questions = extractJson(result.text);
    return questions;
  } catch (error) {
    logger.error('Question generation error:', error);
    throw error;
  }
}

module.exports = {
  generateQuizFromTopic,
  generateQuizFromFile,
  generateContent,
  generateQuestions,
  extractJson,
  generateFileHash,
  getCircuitBreakerStats,
  protectedAIGeneration,
};
