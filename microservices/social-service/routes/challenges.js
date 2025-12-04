/**
 * Challenges Routes (Quiz Challenges/Duels)
 */

const express = require('express');
const router = express.Router();
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');
const axios = require('axios');

const logger = createLogger('challenges-routes');

const GAMIFICATION_SERVICE = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3007';

/**
 * Get user's challenges
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch duels/challenges from gamification service
    const response = await axios.get(`${GAMIFICATION_SERVICE}/api/duels/user/${userId}`, {
      headers: {
        'x-auth-token': req.headers['x-auth-token'],
      },
    });

    res.json({
      success: true,
      data: response.data.data || response.data || [],
    });
  } catch (error) {
    logger.error('Error fetching challenges:', error.message || 'Unknown error');
    
    // Return empty array instead of error for better UX
    res.json({
      success: true,
      data: [],
    });
  }
});

/**
 * Create a new challenge
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Forward to gamification service
    const response = await axios.post(
      `${GAMIFICATION_SERVICE}/api/duels`,
      { ...req.body, challengerId: userId },
      {
        headers: {
          'x-auth-token': req.headers['x-auth-token'],
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    logger.error('Error creating challenge:', error.message || 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'Failed to create challenge',
    });
  }
});

/**
 * Accept a challenge
 */
router.post('/:challengeId/accept', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params;

    // Forward to gamification service
    const response = await axios.post(
      `${GAMIFICATION_SERVICE}/api/duels/${challengeId}/accept`,
      req.body,
      {
        headers: {
          'x-auth-token': req.headers['x-auth-token'],
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    logger.error('Error accepting challenge:', error.message || 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'Failed to accept challenge',
    });
  }
});

/**
 * Decline a challenge
 */
router.post('/:challengeId/decline', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params;

    // Forward to gamification service
    const response = await axios.post(
      `${GAMIFICATION_SERVICE}/api/duels/${challengeId}/decline`,
      req.body,
      {
        headers: {
          'x-auth-token': req.headers['x-auth-token'],
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    logger.error('Error declining challenge:', error.message || 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'Failed to decline challenge',
    });
  }
});

module.exports = router;
