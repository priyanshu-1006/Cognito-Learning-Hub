/**
 * Redis Cache Utility
 * Centralized caching for sessions, leaderboards, and temporary data
 */

const Redis = require("ioredis");
const createLogger = require("./logger");

class RedisClient {
  constructor(serviceName) {
    this.logger = createLogger(serviceName);
    this.client = null;
    this.isConnected = false;
  }

  connect(redisUrl = process.env.REDIS_URL || "redis://localhost:6379") {
    try {
      // Check if Upstash Redis is configured
      let redisConfig;

      if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
        this.logger.info("Connecting to Upstash Redis (cloud)...");

        const url = new URL(process.env.UPSTASH_REDIS_URL);

        redisConfig = {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: process.env.UPSTASH_REDIS_TOKEN,
          tls: {
            rejectUnauthorized: false,
          },
          maxRetriesPerRequest: null, // Required for Bull queue compatibility
          enableReadyCheck: false, // Required for Bull queue compatibility
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        };

        this.client = new Redis(redisConfig);
      } else {
        // Fallback to provided URL or localhost
        this.logger.info("Connecting to local Redis...");

        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: null, // Required for Bull queue compatibility
          enableReadyCheck: false, // Required for Bull queue compatibility
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      }

      this.client.on("connect", () => {
        this.isConnected = true;
        this.logger.info("Redis client connected");
      });

      this.client.on("ready", () => {
        this.isConnected = true;
        this.logger.info("Redis client ready");
      });

      this.client.on("error", (err) => {
        // Don't log ECONNRESET errors as they're normal with cloud Redis (Upstash)
        // These are automatically handled by the retry strategy
        if (err.code !== "ECONNRESET") {
          this.logger.error("Redis connection error:", err);
        }
        // Keep connected flag true as reconnection is automatic
      });

      this.client.on("close", () => {
        this.logger.info("Redis connection closed");
        this.isConnected = false;
      });

      this.client.on("reconnecting", (delay) => {
        this.logger.info(`Redis reconnecting in ${delay}ms...`);
      });

      return this.client;
    } catch (error) {
      this.logger.error("Failed to initialize Redis:", error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Redis DELETE error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key, amount = 1) {
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      this.logger.error(`Redis INCREMENT error for key ${key}:`, error);
      return null;
    }
  }

  async expire(key, seconds) {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  async flushPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      this.logger.error(`Redis FLUSH PATTERN error for ${pattern}:`, error);
      return 0;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.logger.info("Redis disconnected gracefully");
    }
  }

  isHealthy() {
    return this.isConnected && this.client.status === "ready";
  }
}

module.exports = RedisClient;
