/**
 * Redis Meeting Manager
 * Handles active meeting state, participant tracking, and signaling coordination
 */

const Redis = require("ioredis");
const createLogger = require("../../shared/utils/logger");

const logger = createLogger("meeting-manager");

class MeetingManager {
  constructor() {
    this.redis = null;
    this.subscriber = null;
    this.connected = false;

    this.keyPrefix = process.env.REDIS_KEY_PREFIX || "meeting:";
    this.meetingTTL = parseInt(process.env.MEETING_TTL) || 14400; // 4 hours
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

        this.redis = new Redis(redisConfig);
        this.subscriber = new Redis(redisConfig);
      } else {
        // Fallback to local Redis
        logger.info("Connecting to local Redis...");

        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.subscriber = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      }

      this.redis.on("connect", () => {
        this.connected = true;
        logger.info("Redis client connected");
      });

      this.redis.on("ready", () => {
        this.connected = true;
        logger.info("Redis client ready");
      });

      this.redis.on("error", (err) => {
        // Don't log ECONNRESET errors as they're normal with cloud Redis
        if (err.code !== "ECONNRESET") {
          logger.error("Redis error:", err);
        }
        // Keep connected flag true as reconnection is automatic
      });

      this.redis.on("close", () => {
        logger.info("Redis connection closed");
        this.connected = false;
      });

      this.redis.on("reconnecting", () => {
        logger.info("Redis reconnecting...");
      });

      // Subscriber events
      this.subscriber.on("error", (err) => {
        if (err.code !== "ECONNRESET") {
          logger.error("Redis subscriber error:", err);
        }
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
    if (this.redis) await this.redis.quit();
    if (this.subscriber) await this.subscriber.quit();
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

  getMeetingKey(roomId) {
    return `${this.keyPrefix}room:${roomId}`;
  }

  getParticipantsKey(roomId) {
    return `${this.keyPrefix}participants:${roomId}`;
  }

  getSocketMappingKey(socketId) {
    return `${this.keyPrefix}socket:${socketId}`;
  }

  getPeerConnectionsKey(roomId) {
    return `${this.keyPrefix}peers:${roomId}`;
  }

  getSignalingChannelKey(roomId) {
    return `${this.keyPrefix}signaling:${roomId}`;
  }

  // ============================================
  // MEETING OPERATIONS
  // ============================================

  /**
   * Create new meeting in Redis
   */
  async createMeeting(meetingData) {
    try {
      const key = this.getMeetingKey(meetingData.roomId);

      const meeting = {
        roomId: meetingData.roomId,
        title: meetingData.title,
        hostId: meetingData.hostId,
        status: "waiting",
        maxParticipants: meetingData.maxParticipants || 50,
        settings: meetingData.settings || {},
        createdAt: new Date().toISOString(),
        startedAt: null,
        endedAt: null,
      };

      await this.redis.setex(key, this.meetingTTL, JSON.stringify(meeting));
      logger.info(`Created meeting: ${meetingData.roomId}`);

      return meeting;
    } catch (error) {
      logger.error("Error creating meeting:", error);
      throw error;
    }
  }

  /**
   * Get meeting from Redis
   */
  async getMeeting(roomId) {
    try {
      const key = this.getMeetingKey(roomId);
      const data = await this.redis.get(key);

      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error("Error getting meeting:", error);
      return null;
    }
  }

  /**
   * Update meeting in Redis
   */
  async updateMeeting(roomId, updates) {
    try {
      const meeting = await this.getMeeting(roomId);

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      const updatedMeeting = {
        ...meeting,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const key = this.getMeetingKey(roomId);
      await this.redis.setex(
        key,
        this.meetingTTL,
        JSON.stringify(updatedMeeting)
      );

      return updatedMeeting;
    } catch (error) {
      logger.error("Error updating meeting:", error);
      throw error;
    }
  }

  /**
   * Delete meeting from Redis
   */
  async deleteMeeting(roomId) {
    try {
      const pipeline = this.redis.pipeline();

      pipeline.del(this.getMeetingKey(roomId));
      pipeline.del(this.getParticipantsKey(roomId));
      pipeline.del(this.getPeerConnectionsKey(roomId));

      await pipeline.exec();
      logger.info(`Deleted meeting: ${roomId}`);

      return true;
    } catch (error) {
      logger.error("Error deleting meeting:", error);
      return false;
    }
  }

  /**
   * Extend meeting TTL (on activity)
   */
  async extendMeetingTTL(roomId) {
    try {
      const key = this.getMeetingKey(roomId);
      await this.redis.expire(key, this.meetingTTL);
      return true;
    } catch (error) {
      logger.error("Error extending meeting TTL:", error);
      return false;
    }
  }

  // ============================================
  // PARTICIPANT MANAGEMENT (Redis Set + Hash)
  // ============================================

  /**
   * Add participant to meeting
   * Uses Redis Set for fast membership checks
   * Uses Redis Hash for participant details
   */
  async addParticipant(roomId, participant) {
    try {
      const key = this.getParticipantsKey(roomId);

      const participantData = {
        userId: participant.userId,
        userName: participant.userName,
        userPicture: participant.userPicture || "",
        peerId: participant.peerId || "",
        socketId: participant.socketId || "",
        isConnected: true,
        isAudioEnabled: participant.isAudioEnabled !== false,
        isVideoEnabled: participant.isVideoEnabled !== false,
        isScreenSharing: false,
        joinedAt: new Date().toISOString(),
        videoQuality: participant.videoQuality || "720p",
      };

      // Store in hash
      await this.redis.hset(
        key,
        participant.userId,
        JSON.stringify(participantData)
      );
      await this.redis.expire(key, this.meetingTTL);

      // Map socket to room (for disconnect cleanup)
      if (participant.socketId) {
        await this.redis.setex(
          this.getSocketMappingKey(participant.socketId),
          this.meetingTTL,
          JSON.stringify({ roomId, userId: participant.userId })
        );
      }

      logger.debug(
        `Added participant ${participant.userId} to meeting ${roomId}`
      );
      return participantData;
    } catch (error) {
      logger.error("Error adding participant:", error);
      throw error;
    }
  }

  /**
   * Get participant from meeting
   */
  async getParticipant(roomId, userId) {
    try {
      const key = this.getParticipantsKey(roomId);
      const data = await this.redis.hget(key, userId);

      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error("Error getting participant:", error);
      return null;
    }
  }

  /**
   * Get all participants
   */
  async getAllParticipants(roomId) {
    try {
      const key = this.getParticipantsKey(roomId);
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
  async updateParticipant(roomId, userId, updates) {
    try {
      const participant = await this.getParticipant(roomId, userId);

      if (!participant) {
        throw new Error("Participant not found");
      }

      const updatedParticipant = {
        ...participant,
        ...updates,
      };

      const key = this.getParticipantsKey(roomId);
      await this.redis.hset(key, userId, JSON.stringify(updatedParticipant));

      return updatedParticipant;
    } catch (error) {
      logger.error("Error updating participant:", error);
      throw error;
    }
  }

  /**
   * Remove participant from meeting
   */
  async removeParticipant(roomId, userId) {
    try {
      const key = this.getParticipantsKey(roomId);
      await this.redis.hdel(key, userId);

      logger.debug(`Removed participant ${userId} from meeting ${roomId}`);
      return true;
    } catch (error) {
      logger.error("Error removing participant:", error);
      return false;
    }
  }

  /**
   * Get participant count
   */
  async getParticipantCount(roomId) {
    try {
      const key = this.getParticipantsKey(roomId);
      return await this.redis.hlen(key);
    } catch (error) {
      logger.error("Error getting participant count:", error);
      return 0;
    }
  }

  /**
   * Get room ID from socket ID (for disconnect cleanup)
   */
  async getRoomFromSocket(socketId) {
    try {
      const key = this.getSocketMappingKey(socketId);
      const data = await this.redis.get(key);

      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error("Error getting room from socket:", error);
      return null;
    }
  }

  // ============================================
  // PEER CONNECTION TRACKING
  // ============================================

  /**
   * Track peer connection (for mesh topology)
   * Stores who is connected to whom
   */
  async addPeerConnection(roomId, fromUserId, toUserId) {
    try {
      const key = this.getPeerConnectionsKey(roomId);
      const connectionKey = `${fromUserId}:${toUserId}`;

      await this.redis.hset(key, connectionKey, new Date().toISOString());
      await this.redis.expire(key, this.meetingTTL);

      return true;
    } catch (error) {
      logger.error("Error tracking peer connection:", error);
      return false;
    }
  }

  /**
   * Remove peer connection
   */
  async removePeerConnection(roomId, fromUserId, toUserId) {
    try {
      const key = this.getPeerConnectionsKey(roomId);
      const connectionKey = `${fromUserId}:${toUserId}`;

      await this.redis.hdel(key, connectionKey);
      return true;
    } catch (error) {
      logger.error("Error removing peer connection:", error);
      return false;
    }
  }

  /**
   * Get all peer connections for a user
   */
  async getUserPeerConnections(roomId, userId) {
    try {
      const key = this.getPeerConnectionsKey(roomId);
      const allConnections = await this.redis.hgetall(key);

      const userConnections = [];
      for (const [connectionKey] of Object.entries(allConnections)) {
        const [from, to] = connectionKey.split(":");
        if (from === userId || to === userId) {
          userConnections.push({ from, to });
        }
      }

      return userConnections;
    } catch (error) {
      logger.error("Error getting user peer connections:", error);
      return [];
    }
  }

  // ============================================
  // PUB/SUB FOR SIGNALING
  // ============================================

  /**
   * Publish signaling message to meeting channel
   * Used for WebRTC signaling coordination
   */
  async publishSignaling(roomId, event, data) {
    try {
      const channel = this.getSignalingChannelKey(roomId);
      const message = JSON.stringify({ event, data, timestamp: Date.now() });

      await this.redis.publish(channel, message);
      return true;
    } catch (error) {
      logger.error("Error publishing signaling message:", error);
      return false;
    }
  }

  /**
   * Subscribe to signaling channel
   */
  subscribeToSignaling(roomId, callback) {
    try {
      const channel = this.getSignalingChannelKey(roomId);

      this.subscriber.subscribe(channel, (err) => {
        if (err) {
          logger.error("Error subscribing to signaling:", err);
        } else {
          logger.debug(`Subscribed to signaling for meeting ${roomId}`);
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
      logger.error("Error subscribing to signaling:", error);
      return false;
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get meeting statistics
   */
  async getMeetingStats(roomId) {
    try {
      const participantCount = await this.getParticipantCount(roomId);
      const meeting = await this.getMeeting(roomId);
      const participants = await this.getAllParticipants(roomId);

      const activeParticipants = participants.filter(
        (p) => p.isConnected
      ).length;
      const audioEnabled = participants.filter((p) => p.isAudioEnabled).length;
      const videoEnabled = participants.filter((p) => p.isVideoEnabled).length;
      const screenSharing = participants.filter(
        (p) => p.isScreenSharing
      ).length;

      return {
        roomId,
        participantCount,
        activeParticipants,
        audioEnabled,
        videoEnabled,
        screenSharing,
        status: meeting?.status,
      };
    } catch (error) {
      logger.error("Error getting meeting stats:", error);
      return null;
    }
  }
}

module.exports = new MeetingManager();
