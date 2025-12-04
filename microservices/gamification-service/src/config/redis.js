const Redis = require('ioredis');

let redisClient = null;

/**
 * Initialize Redis connection with retry logic
 * Supports both Upstash Redis (cloud) and local Redis
 */
function initializeRedis() {
  return new Promise((resolve, reject) => {
    // Check if Upstash Redis is configured (recommended for production)
    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
      console.log('🔄 Connecting to Upstash Redis (cloud)...');
      
      // Parse Upstash URL
      const url = new URL(process.env.UPSTASH_REDIS_URL);
      
      redisClient = new Redis({
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: process.env.UPSTASH_REDIS_TOKEN,
        tls: {
          rejectUnauthorized: false
        },
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: null,  // Required for Bull queue compatibility
        enableReadyCheck: false,      // Required for Bull queue compatibility
        lazyConnect: false,
      });
    } else {
      // Fallback to local Redis
      console.log('🔄 Connecting to local Redis...');
      
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: null,  // Required for Bull queue compatibility
        enableReadyCheck: false,      // Required for Bull queue compatibility
        lazyConnect: false,
      });
    }

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
      resolve();
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      if (!redisClient.status || redisClient.status === 'end') {
        reject(err);
      }
    });

    redisClient.on('close', () => {
      console.log('Redis connection closed');
    });
  });
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Redis key patterns for gamification
 */
const REDIS_KEYS = {
  // User stats cache: userstats:{userId}
  USER_STATS: (userId) => `userstats:${userId}`,
  
  // Leaderboards (Sorted Sets)
  LEADERBOARD_GLOBAL: 'leaderboard:global',
  LEADERBOARD_CATEGORY: (category) => `leaderboard:category:${category}`,
  LEADERBOARD_WEEKLY: 'leaderboard:weekly',
  LEADERBOARD_MONTHLY: 'leaderboard:monthly',
  
  // Achievement tracking
  USER_ACHIEVEMENTS: (userId) => `achievements:${userId}`,
  ACHIEVEMENT_PROGRESS: (userId, achievementId) => `progress:${userId}:${achievementId}`,
  
  // Streak tracking
  USER_STREAK: (userId) => `streak:${userId}`,
  LAST_ACTIVITY: (userId) => `lastactivity:${userId}`,
  
  // Stats aggregation locks
  STATS_LOCK: (userId) => `lock:stats:${userId}`,
};

/**
 * Atomic increment operations for user stats
 */
async function incrementUserStats(userId, updates) {
  const key = REDIS_KEYS.USER_STATS(userId);
  const pipeline = redisClient.pipeline();

  if (updates.totalQuizzesTaken) {
    pipeline.hincrby(key, 'totalQuizzesTaken', updates.totalQuizzesTaken);
  }
  if (updates.totalPoints) {
    pipeline.hincrbyfloat(key, 'totalPoints', updates.totalPoints);
  }
  if (updates.totalTimeSpent) {
    pipeline.hincrby(key, 'totalTimeSpent', updates.totalTimeSpent);
  }
  if (updates.currentStreak !== undefined) {
    pipeline.hset(key, 'currentStreak', updates.currentStreak);
  }
  if (updates.longestStreak !== undefined) {
    pipeline.hset(key, 'longestStreak', updates.longestStreak);
  }
  if (updates.experience) {
    pipeline.hincrbyfloat(key, 'experience', updates.experience);
  }

  // Set expiry to 1 hour (will be synced to DB before expiry)
  pipeline.expire(key, 3600);

  await pipeline.exec();
}

/**
 * Get user stats from Redis cache
 */
async function getUserStatsFromCache(userId) {
  const key = REDIS_KEYS.USER_STATS(userId);
  const stats = await redisClient.hgetall(key);
  
  if (!stats || Object.keys(stats).length === 0) {
    return null;
  }

  // Convert string values to numbers
  return {
    totalQuizzesTaken: parseInt(stats.totalQuizzesTaken) || 0,
    totalPoints: parseFloat(stats.totalPoints) || 0,
    totalTimeSpent: parseInt(stats.totalTimeSpent) || 0,
    currentStreak: parseInt(stats.currentStreak) || 0,
    longestStreak: parseInt(stats.longestStreak) || 0,
    experience: parseFloat(stats.experience) || 0,
    level: parseInt(stats.level) || 1,
    averageScore: parseFloat(stats.averageScore) || 0,
  };
}

/**
 * Cache user stats to Redis
 */
async function cacheUserStats(userId, stats) {
  const key = REDIS_KEYS.USER_STATS(userId);
  const pipeline = redisClient.pipeline();

  pipeline.hmset(key, {
    totalQuizzesTaken: stats.totalQuizzesTaken || 0,
    totalPoints: stats.totalPoints || 0,
    totalTimeSpent: stats.totalTimeSpent || 0,
    currentStreak: stats.currentStreak || 0,
    longestStreak: stats.longestStreak || 0,
    experience: stats.experience || 0,
    level: stats.level || 1,
    averageScore: stats.averageScore || 0,
  });

  pipeline.expire(key, 3600);
  await pipeline.exec();
}

/**
 * Update leaderboard score (Sorted Set)
 */
async function updateLeaderboard(leaderboardKey, userId, score) {
  await redisClient.zadd(leaderboardKey, score, userId);
}

/**
 * Get leaderboard rankings
 */
async function getLeaderboard(leaderboardKey, start = 0, end = 99) {
  const results = await redisClient.zrevrange(leaderboardKey, start, end, 'WITHSCORES');
  
  const leaderboard = [];
  for (let i = 0; i < results.length; i += 2) {
    leaderboard.push({
      userId: results[i],
      score: parseFloat(results[i + 1]),
      rank: start + (i / 2) + 1,
    });
  }
  
  return leaderboard;
}

/**
 * Get user rank in leaderboard
 */
async function getUserRank(leaderboardKey, userId) {
  const rank = await redisClient.zrevrank(leaderboardKey, userId);
  const score = await redisClient.zscore(leaderboardKey, userId);
  
  return {
    rank: rank !== null ? rank + 1 : null,
    score: score !== null ? parseFloat(score) : null,
  };
}

module.exports = {
  initializeRedis,
  getRedisClient,
  REDIS_KEYS,
  incrementUserStats,
  getUserStatsFromCache,
  cacheUserStats,
  updateLeaderboard,
  getLeaderboard,
  getUserRank,
};
