/**
 * Redis Session Manager
 * Handles all Redis operations for live sessions
 * Replaces in-memory Map with Redis for horizontal scaling
 */

const Redis = require("ioredis");
const createLogger = require("../../shared/utils/logger");

const logger = createLogger("session-manager");

class SessionManager {
  constructor() {
    this.redis = null;
    this.subscriber = null;
    this.connected = false;

    this.keyPrefix = process.env.REDIS_KEY_PREFIX || "live:";
    this.sessionTTL = parseInt(process.env.SESSION_TTL) || 7200; // 2 hours
  }

  /**
   * Connect to Redis (with pub/sub)
   */
  async connect() {
    try {
      let redisConfig;

      // Check if Upstash Redis is configured
      if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
        logger.info("Connecting to Upstash Redis (cloud)...");

        const url = new URL(process.env.UPSTASH_REDIS_URL);

        redisConfig = {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: process.env.UPSTASH_REDIS_TOKEN,
          tls: {
            rejectUnauthorized: false,
          },
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        };

        // Main Redis client
        this.redis = new Redis(redisConfig);

        // Subscriber client (for pub/sub) - clone config
        this.subscriber = new Redis(redisConfig);
      } else {
        // Fallback to local Redis
        logger.info("Connecting to local Redis...");

        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        // Main Redis client
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        // Subscriber client (for pub/sub)
        this.subscriber = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      }

      this.redis.on("connect", () => {
        this.connected = true;
        logger.info("Redis connected");
      });

      this.redis.on("error", (err) => {
        logger.error("Redis error:", err);
        this.connected = false;
      });

      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    this.connected = false;
    logger.info("Redis disconnected");
  }

  isConnected() {
    return this.connected;
  }

  /**
   * Check if Redis is healthy (connected and ready)
   */
  isHealthy() {
    return this.connected && this.redis && this.redis.status === "ready";
  }

  // ============================================
  // KEY GENERATORS
  // ============================================

  getSessionKey(sessionCode) {
    return `${this.keyPrefix}session:${sessionCode}`;
  }

  getLeaderboardKey(sessionCode) {
    return `${this.keyPrefix}leaderboard:${sessionCode}`;
  }

  getParticipantsKey(sessionCode) {
    return `${this.keyPrefix}participants:${sessionCode}`;
  }

  getAnswersKey(sessionCode) {
    return `${this.keyPrefix}answers:${sessionCode}`;
  }

  getQuizCacheKey(sessionCode) {
    return `${this.keyPrefix}quiz:${sessionCode}`;
  }

  getCurrentQuestionKey(sessionCode) {
    return `${this.keyPrefix}current-question:${sessionCode}`;
  }

  // ============================================
  // SESSION CRUD OPERATIONS
  // ============================================

  /**
   * Create new session in Redis
   */
  async createSession(sessionData) {
    try {
      const key = this.getSessionKey(sessionData.sessionCode);

      const session = {
        sessionCode: sessionData.sessionCode,
        quizId: sessionData.quizId,
        hostId: sessionData.hostId,
        status: "waiting",
        currentQuestionIndex: -1,
        maxParticipants: sessionData.maxParticipants || 50,
        settings: sessionData.settings || {},
        quizMetadata: sessionData.quizMetadata || {},
        createdAt: new Date().toISOString(),
        startedAt: null,
        endedAt: null,
      };

      await this.redis.setex(key, this.sessionTTL, JSON.stringify(session));
      logger.info(`Created session: ${sessionData.sessionCode}`);

      return session;
    } catch (error) {
      logger.error("Error creating session:", error);
      throw error;
    }
  }

  /**
   * Get session from Redis
   */
  async getSession(sessionCode) {
    try {
      const key = this.getSessionKey(sessionCode);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error("Error getting session:", error);
      return null;
    }
  }

  /**
   * Update session in Redis
   */
  async updateSession(sessionCode, updates) {
    try {
      const session = await this.getSession(sessionCode);

      if (!session) {
        throw new Error("Session not found");
      }

      const updatedSession = {
        ...session,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const key = this.getSessionKey(sessionCode);
      await this.redis.setex(
        key,
        this.sessionTTL,
        JSON.stringify(updatedSession)
      );

      return updatedSession;
    } catch (error) {
      logger.error("Error updating session:", error);
      throw error;
    }
  }

  /**
   * Delete session from Redis
   */
  async deleteSession(sessionCode) {
    try {
      const pipeline = this.redis.pipeline();

      pipeline.del(this.getSessionKey(sessionCode));
      pipeline.del(this.getLeaderboardKey(sessionCode));
      pipeline.del(this.getParticipantsKey(sessionCode));
      pipeline.del(this.getAnswersKey(sessionCode));
      pipeline.del(this.getQuizCacheKey(sessionCode));
      pipeline.del(this.getCurrentQuestionKey(sessionCode));

      await pipeline.exec();
      logger.info(`Deleted session: ${sessionCode}`);

      return true;
    } catch (error) {
      logger.error("Error deleting session:", error);
      return false;
    }
  }

  /**
   * Extend session TTL (on activity)
   */
  async extendSessionTTL(sessionCode) {
    try {
      const key = this.getSessionKey(sessionCode);
      await this.redis.expire(key, this.sessionTTL);
      return true;
    } catch (error) {
      logger.error("Error extending session TTL:", error);
      return false;
    }
  }

  // ============================================
  // PARTICIPANT MANAGEMENT
  // ============================================

  /**
   * Add participant to session
   * Uses Redis Hash for fast lookups
   */
  async addParticipant(sessionCode, participant) {
    try {
      const key = this.getParticipantsKey(sessionCode);

      const participantData = {
        userId: participant.userId,
        userName: participant.userName,
        userPicture: participant.userPicture || "",
        score: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        joinedAt: new Date().toISOString(),
        isActive: true,
        socketId: participant.socketId || "",
      };

      await this.redis.hset(
        key,
        participant.userId,
        JSON.stringify(participantData)
      );
      await this.redis.expire(key, this.sessionTTL);

      // Initialize in leaderboard (sorted set)
      await this.updateLeaderboard(sessionCode, participant.userId, 0);

      logger.debug(
        `Added participant ${participant.userId} to session ${sessionCode}`
      );
      return participantData;
    } catch (error) {
      logger.error("Error adding participant:", error);
      throw error;
    }
  }

  /**
   * Get participant from session
   */
  async getParticipant(sessionCode, userId) {
    try {
      const key = this.getParticipantsKey(sessionCode);
      const data = await this.redis.hget(key, userId);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error("Error getting participant:", error);
      return null;
    }
  }

  /**
   * Get all participants
   */
  async getAllParticipants(sessionCode) {
    try {
      const key = this.getParticipantsKey(sessionCode);
      const data = await this.redis.hgetall(key);

      const participants = [];
      for (const [userId, participantJson] of Object.entries(data)) {
        participants.push(JSON.parse(participantJson));
      }

      return participants;
    } catch (error) {
      logger.error("Error getting all participants:", error);
      return [];
    }
  }

  /**
   * Update participant data
   */
  async updateParticipant(sessionCode, userId, updates) {
    try {
      const participant = await this.getParticipant(sessionCode, userId);

      if (!participant) {
        throw new Error("Participant not found");
      }

      const updatedParticipant = {
        ...participant,
        ...updates,
      };

      const key = this.getParticipantsKey(sessionCode);
      await this.redis.hset(key, userId, JSON.stringify(updatedParticipant));

      return updatedParticipant;
    } catch (error) {
      logger.error("Error updating participant:", error);
      throw error;
    }
  }

  /**
   * Remove participant from session
   */
  async removeParticipant(sessionCode, userId) {
    try {
      const key = this.getParticipantsKey(sessionCode);
      await this.redis.hdel(key, userId);

      // Remove from leaderboard
      const leaderboardKey = this.getLeaderboardKey(sessionCode);
      await this.redis.zrem(leaderboardKey, userId);

      logger.debug(`Removed participant ${userId} from session ${sessionCode}`);
      return true;
    } catch (error) {
      logger.error("Error removing participant:", error);
      return false;
    }
  }

  /**
   * Get participant count
   */
  async getParticipantCount(sessionCode) {
    try {
      const key = this.getParticipantsKey(sessionCode);
      return await this.redis.hlen(key);
    } catch (error) {
      logger.error("Error getting participant count:", error);
      return 0;
    }
  }

  // ============================================
  // LEADERBOARD OPERATIONS (Redis Sorted Set)
  // ============================================

  /**
   * Update participant score in leaderboard
   * Uses ZINCRBY for atomic operations - O(log N)
   */
  async updateLeaderboard(sessionCode, userId, scoreIncrement) {
    try {
      const key = this.getLeaderboardKey(sessionCode);

      // ZINCRBY is atomic - no race conditions
      const newScore = await this.redis.zincrby(key, scoreIncrement, userId);
      await this.redis.expire(key, this.sessionTTL);

      return parseFloat(newScore);
    } catch (error) {
      logger.error("Error updating leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get leaderboard (sorted by score, descending)
   * Redis Sorted Set: O(log N + M) where M = limit
   */
  async getLeaderboard(sessionCode, limit = 50) {
    try {
      const key = this.getLeaderboardKey(sessionCode);

      // ZREVRANGE with WITHSCORES - returns top N users
      const results = await this.redis.zrevrange(
        key,
        0,
        limit - 1,
        "WITHSCORES"
      );

      // Get participant details
      const leaderboard = [];
      for (let i = 0; i < results.length; i += 2) {
        const userId = results[i];
        const score = parseFloat(results[i + 1]);

        const participant = await this.getParticipant(sessionCode, userId);

        if (participant) {
          leaderboard.push({
            rank: Math.floor(i / 2) + 1,
            userId,
            userName: participant.userName,
            username: participant.userName, // Alias for frontend compatibility
            userPicture: participant.userPicture,
            avatar: participant.userPicture, // Alias for frontend compatibility
            score,
            correctAnswers: participant.correctAnswers,
            incorrectAnswers: participant.incorrectAnswers,
            accuracy:
              participant.correctAnswers + participant.incorrectAnswers > 0
                ? (participant.correctAnswers /
                    (participant.correctAnswers +
                      participant.incorrectAnswers)) *
                  100
                : 0,
          });
        }
      }

      return leaderboard;
    } catch (error) {
      logger.error("Error getting leaderboard:", error);
      return [];
    }
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(sessionCode, userId) {
    try {
      const key = this.getLeaderboardKey(sessionCode);
      const rank = await this.redis.zrevrank(key, userId);

      if (rank === null) {
        return null;
      }

      return rank + 1; // Redis rank is 0-indexed
    } catch (error) {
      logger.error("Error getting user rank:", error);
      return null;
    }
  }

  // ============================================
  // ANSWER TRACKING
  // ============================================

  /**
   * Record answer in Redis
   * Uses List for ordered storage
   */
  async recordAnswer(sessionCode, answerData) {
    try {
      const key = this.getAnswersKey(sessionCode);

      const answer = {
        userId: answerData.userId,
        questionId: answerData.questionId,
        selectedAnswer: answerData.selectedAnswer,
        isCorrect: answerData.isCorrect,
        points: answerData.points || 0,
        answeredAt: new Date().toISOString(),
        timeSpent: answerData.timeSpent || 0,
      };

      await this.redis.rpush(key, JSON.stringify(answer));
      await this.redis.expire(key, this.sessionTTL);

      return answer;
    } catch (error) {
      logger.error("Error recording answer:", error);
      throw error;
    }
  }

  /**
   * Get all answers for a session
   */
  async getAllAnswers(sessionCode) {
    try {
      const key = this.getAnswersKey(sessionCode);
      const answers = await this.redis.lrange(key, 0, -1);

      return answers.map((ans) => JSON.parse(ans));
    } catch (error) {
      logger.error("Error getting all answers:", error);
      return [];
    }
  }

  /**
   * Get answer count (for sync threshold)
   */
  async getAnswerCount(sessionCode) {
    try {
      const key = this.getAnswersKey(sessionCode);
      return await this.redis.llen(key);
    } catch (error) {
      logger.error("Error getting answer count:", error);
      return 0;
    }
  }

  // ============================================
  // QUIZ CACHING
  // ============================================

  /**
   * Cache quiz data in Redis (for fast access)
   */
  async cacheQuiz(sessionCode, quizData) {
    try {
      const key = this.getQuizCacheKey(sessionCode);
      await this.redis.setex(key, this.sessionTTL, JSON.stringify(quizData));
      logger.debug(`Cached quiz for session ${sessionCode}`);
      return true;
    } catch (error) {
      logger.error("Error caching quiz:", error);
      return false;
    }
  }

  /**
   * Get cached quiz
   */
  async getCachedQuiz(sessionCode) {
    try {
      const key = this.getQuizCacheKey(sessionCode);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error("Error getting cached quiz:", error);
      return null;
    }
  }

  // ============================================
  // PUB/SUB FOR BROADCASTS
  // ============================================

  /**
   * Publish message to session channel
   */
  async publishToSession(sessionCode, event, data) {
    try {
      const channel = `${this.keyPrefix}channel:${sessionCode}`;
      const message = JSON.stringify({ event, data, timestamp: Date.now() });

      await this.redis.publish(channel, message);
      return true;
    } catch (error) {
      logger.error("Error publishing to session:", error);
      return false;
    }
  }

  /**
   * Subscribe to session channel
   */
  subscribeToSession(sessionCode, callback) {
    try {
      const channel = `${this.keyPrefix}channel:${sessionCode}`;

      this.subscriber.subscribe(channel, (err) => {
        if (err) {
          logger.error("Error subscribing to session:", err);
        } else {
          logger.debug(`Subscribed to session ${sessionCode}`);
        }
      });

      this.subscriber.on("message", (ch, message) => {
        if (ch === channel) {
          const data = JSON.parse(message);
          callback(data);
        }
      });

      return true;
    } catch (error) {
      logger.error("Error subscribing to session:", error);
      return false;
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get session statistics
   */
  async getSessionStats(sessionCode) {
    try {
      const participantCount = await this.getParticipantCount(sessionCode);
      const answerCount = await this.getAnswerCount(sessionCode);
      const session = await this.getSession(sessionCode);

      return {
        sessionCode,
        participantCount,
        answerCount,
        status: session?.status,
        currentQuestion: session?.currentQuestionIndex,
      };
    } catch (error) {
      logger.error("Error getting session stats:", error);
      return null;
    }
  }

  /**
   * Get Redis statistics
   */
  async getRedisStats() {
    try {
      const info = await this.redis.info("stats");
      const keyspace = await this.redis.info("keyspace");

      return {
        connected: this.connected,
        info,
        keyspace,
      };
    } catch (error) {
      logger.error("Error getting Redis stats:", error);
      return null;
    }
  }
}

module.exports = new SessionManager();
