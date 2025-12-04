/**
 * Shared Constants
 * Common constants used across all microservices
 */

module.exports = {
  // User roles
  ROLES: {
    STUDENT: "Student",
    TEACHER: "Teacher",
    MODERATOR: "Moderator",
    ADMIN: "Admin",
  },

  // Quiz difficulties
  DIFFICULTIES: {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
    EXPERT: "Expert",
  },

  // Question types
  QUESTION_TYPES: {
    MULTIPLE_CHOICE: "multiple-choice",
    TRUE_FALSE: "true-false",
    DESCRIPTIVE: "descriptive",
    FILL_BLANK: "fill-in-blank",
  },

  // Session statuses
  SESSION_STATUS: {
    WAITING: "waiting",
    ACTIVE: "active",
    PAUSED: "paused",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  },

  // Achievement types
  ACHIEVEMENT_TYPES: {
    QUIZ_COMPLETION: "quiz_completion",
    SCORE_ACHIEVEMENT: "score_achievement",
    STREAK: "streak",
    SPEED: "speed",
    CATEGORY_MASTER: "category_master",
    SPECIAL: "special",
  },

  // Notification types
  NOTIFICATION_TYPES: {
    FRIEND_REQUEST: "friend-request",
    FRIEND_ACCEPTED: "friend-accepted",
    QUIZ_CHALLENGE: "quiz-challenge",
    CHALLENGE_COMPLETED: "challenge-completed",
    CHALLENGE_WON: "challenge-won",
    CHALLENGE_LOST: "challenge-lost",
    NEW_MESSAGE: "new-message",
    BROADCAST: "broadcast",
    COMMUNITY_INVITE: "community-invite",
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    LEADERBOARD: 300, // 5 minutes
    USER_SESSION: 3600, // 1 hour
    QUIZ_METADATA: 1800, // 30 minutes
    USER_STATS: 600, // 10 minutes
  },

  // Rate limiting
  RATE_LIMITS: {
    GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
    HEAVY: { windowMs: 15 * 60 * 1000, max: 20 },
  },

  // Service ports
  PORTS: {
    API_GATEWAY: 3000,
    AUTH_SERVICE: 3001,
    QUIZ_SERVICE: 3002,
    RESULT_SERVICE: 3003,
    LIVE_SERVICE: 3004,
    MEETING_SERVICE: 3009,
    SOCIAL_SERVICE: 3006,
    GAMIFICATION_SERVICE: 3007,
    MODERATION_SERVICE: 3008,
  },

  // Events (for event bus)
  EVENTS: {
    USER_REGISTERED: "user.registered",
    USER_UPDATED: "user.updated",
    QUIZ_CREATED: "quiz.created",
    QUIZ_COMPLETED: "quiz.completed",
    SESSION_STARTED: "session.started",
    SESSION_ENDED: "session.ended",
    FRIEND_REQUEST_SENT: "friend.request.sent",
    ACHIEVEMENT_UNLOCKED: "achievement.unlocked",
  },
};
