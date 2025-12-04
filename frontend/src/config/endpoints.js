/**
 * API Endpoints Configuration
 * All endpoints go through API Gateway (localhost:3000)
 * 
 * ⚠️ IMPORTANT: Never call microservices directly from frontend!
 * Always use API Gateway routes defined here.
 */

export const ENDPOINTS = {
  // ========================================
  // AUTH SERVICE - User Authentication
  // ========================================
  auth: {
    // POST: Register new user
    register: '/api/auth/register',
    
    // POST: Login user
    login: '/api/auth/login',
    
    // POST: Logout user
    logout: '/api/auth/logout',
    
    // POST: Refresh JWT token
    refresh: '/api/auth/refresh',
    
    // GET: Get current user profile
    profile: '/api/auth/profile',
    
    // PUT: Update user profile
    updateProfile: '/api/auth/profile',
    
    // POST: Change password
    changePassword: '/api/auth/change-password',
    
    // POST: Request password reset
    forgotPassword: '/api/auth/forgot-password',
    
    // POST: Reset password with token
    resetPassword: '/api/auth/reset-password',
  },

  // ========================================
  // QUIZ SERVICE - Quiz Generation & Management
  // ========================================
  quiz: {
    // POST: Generate quiz from topic (AI-powered)
    generateFromTopic: '/api/generate-quiz-topic',
    
    // POST: Generate quiz from uploaded file
    generateFromFile: '/api/generate-quiz-file',
    
    // POST: Generate questions from PDF
    generateFromPDF: '/api/generate-pdf-questions',
    
    // POST: Save manually created quiz
    saveManualQuiz: '/api/save-manual-quiz',
    
    // GET: Get all quizzes
    list: '/api/quizzes',
    
    // GET: Get quiz by ID
    getById: (id) => `/api/quizzes/${id}`,
    
    // PUT: Update quiz
    update: (id) => `/api/quizzes/${id}`,
    
    // DELETE: Delete quiz
    delete: (id) => `/api/quizzes/${id}`,
    
    // POST: Get adaptive difficulty question
    adaptiveDifficulty: '/api/adaptive-difficulty',
    
    // POST: AI Doubt Solver
    doubtSolver: '/api/doubt-solver/ask',
  },

  // ========================================
  // RESULT SERVICE - Quiz Results & Analytics
  // ========================================
  results: {
    // POST: Submit quiz results
    submit: '/api/results/submit',
    
    // GET: Get user's all results
    getUserResults: (userId) => `/api/results/user/${userId}`,
    
    // GET: Get results for specific quiz
    getQuizResults: (quizId) => `/api/results/quiz/${quizId}`,
    
    // GET: Get leaderboard
    leaderboard: '/api/results/leaderboard',
    
    // GET: Get user stats
    userStats: (userId) => `/api/results/user/${userId}/stats`,
    
    // GET: Get quiz analytics
    quizAnalytics: (quizId) => `/api/results/quiz/${quizId}/analytics`,
  },

  // ========================================
  // LIVE SERVICE - Real-time Quiz Sessions
  // ========================================
  live: {
    // POST: Create new live session
    createSession: '/api/live-sessions/create',
    
    // POST: Join live session with code
    joinSession: '/api/live-sessions/join',
    
    // GET: Get session details by code
    getSession: (code) => `/api/live-sessions/${code}`,
    
    // POST: Start session (host only)
    startSession: (code) => `/api/live-sessions/${code}/start`,
    
    // POST: End session (host only)
    endSession: (code) => `/api/live-sessions/${code}/end`,
    
    // POST: Submit answer in live session
    submitAnswer: (code) => `/api/live-sessions/${code}/answer`,
    
    // GET: Get session leaderboard
    leaderboard: (code) => `/api/live-sessions/${code}/leaderboard`,
    
    // GET: Get session history
    history: '/api/live-sessions/history',
    
    // GET: Get session analytics
    analytics: (code) => `/api/live-sessions/${code}/analytics`,
  },

  // ========================================
  // MEETING SERVICE - Video Meetings (WebRTC)
  // ========================================
  meeting: {
    // POST: Create new meeting room
    create: '/api/meetings/create',
    
    // POST: Join meeting with code
    join: '/api/meetings/join',
    
    // GET: Get meeting details
    get: (meetingId) => `/api/meetings/${meetingId}`,
    
    // POST: End meeting (host only)
    end: (meetingId) => `/api/meetings/${meetingId}/end`,
    
    // GET: Get meeting history
    history: '/api/meetings/history',
    
    // POST: Toggle audio/video
    toggleMedia: (meetingId) => `/api/meetings/${meetingId}/media`,
  },

  // ========================================
  // SOCIAL SERVICE - Social Features
  // ========================================
  social: {
    // Friends
    friends: {
      // GET: Get friend list
      list: '/api/friends',
      
      // POST: Send friend request
      sendRequest: '/api/friends/request',
      
      // POST: Accept friend request
      accept: (requestId) => `/api/friends/accept/${requestId}`,
      
      // DELETE: Remove friend
      remove: (friendId) => `/api/friends/${friendId}`,
      
      // GET: Get pending requests
      pending: '/api/friends/pending',
    },
    
    // Challenges (Duel Mode)
    challenges: {
      // GET: Get all challenges
      list: '/api/challenges',
      
      // POST: Create challenge
      create: '/api/challenges/create',
      
      // POST: Accept challenge
      accept: (challengeId) => `/api/challenges/${challengeId}/accept`,
      
      // POST: Decline challenge
      decline: (challengeId) => `/api/challenges/${challengeId}/decline`,
      
      // POST: Submit challenge answer
      submit: (challengeId) => `/api/challenges/${challengeId}/submit`,
      
      // GET: Get challenge results
      results: (challengeId) => `/api/challenges/${challengeId}/results`,
    },
    
    // Notifications
    notifications: {
      // GET: Get all notifications
      list: '/api/notifications',
      
      // PUT: Mark as read
      markRead: (notificationId) => `/api/notifications/${notificationId}/read`,
      
      // PUT: Mark all as read
      markAllRead: '/api/notifications/read-all',
      
      // DELETE: Delete notification
      delete: (notificationId) => `/api/notifications/${notificationId}`,
    },
    
    // Chat
    chat: {
      // GET: Get conversations
      list: '/api/chat/conversations',
      
      // GET: Get messages for conversation
      messages: (conversationId) => `/api/chat/${conversationId}/messages`,
      
      // POST: Send message
      send: '/api/chat/send',
      
      // PUT: Mark as read
      markRead: (conversationId) => `/api/chat/${conversationId}/read`,
    },
    
    // Admin Broadcasts
    broadcasts: {
      // POST: Send broadcast (admin only)
      send: '/api/broadcasts/send',
      
      // GET: Get broadcast history
      history: '/api/broadcasts/history',
    },
    
    // User profiles
    users: {
      // GET: Search users
      search: '/api/users/search',
      
      // GET: Get user profile
      profile: (userId) => `/api/users/${userId}`,
      
      // PUT: Update profile
      update: '/api/user/profile',
    },
  },

  // ========================================
  // GAMIFICATION SERVICE - Achievements & Rewards
  // ========================================
  gamification: {
    // Achievements
    achievements: {
      // GET: Get all available achievements
      list: '/api/achievements',
      
      // GET: Get user's achievements
      user: (userId) => `/api/achievements/user/${userId}`,
      
      // GET: Get achievement details
      get: (achievementId) => `/api/achievements/${achievementId}`,
    },
    
    // Stats & Leaderboard
    stats: {
      // GET: Get global leaderboard
      leaderboard: '/api/stats/leaderboard',
      
      // GET: Get user stats
      user: (userId) => `/api/stats/user/${userId}`,
      
      // GET: Get streak info
      streak: (userId) => `/api/stats/user/${userId}/streak`,
    },
  },

  // ========================================
  // MODERATION SERVICE - Reports & Admin
  // ========================================
  moderation: {
    // Reports
    reports: {
      // POST: Create report
      create: '/api/reports/create',
      
      // GET: Get all reports (moderator/admin)
      list: '/api/reports',
      
      // GET: Get report details
      get: (reportId) => `/api/reports/${reportId}`,
      
      // PUT: Update report status
      update: (reportId) => `/api/reports/${reportId}`,
    },
    
    // Admin actions
    admin: {
      // POST: Ban user
      banUser: '/api/admin/ban',
      
      // POST: Unban user
      unbanUser: '/api/admin/unban',
      
      // GET: Get banned users
      bannedUsers: '/api/admin/banned-users',
      
      // DELETE: Delete content
      deleteContent: '/api/admin/delete-content',
      
      // GET: Get moderation logs
      logs: '/api/admin/logs',
    },
    
    // Moderator actions
    moderator: {
      // POST: Take action on report
      action: '/api/moderator/action',
      
      // GET: Get pending reports
      pending: '/api/moderator/pending',
      
      // GET: Get moderation stats
      stats: '/api/moderator/stats',
    },
  },
};

/**
 * WebSocket Event Names
 * For real-time communication via Socket.IO
 */
export const WS_EVENTS = {
  // Live Quiz Events
  live: {
    JOIN_SESSION: 'join-session',
    LEAVE_SESSION: 'leave-session',
    START_SESSION: 'start-session',
    NEXT_QUESTION: 'next-question',
    SUBMIT_ANSWER: 'submit-answer',
    SESSION_ENDED: 'session-ended',
    PARTICIPANT_JOINED: 'participant-joined',
    PARTICIPANT_LEFT: 'participant-left',
    QUESTION_STARTED: 'question-started',
    LEADERBOARD_UPDATED: 'leaderboard-updated',
    TIMER_UPDATE: 'timer-update',
  },
  
  // Meeting Events (WebRTC)
  meeting: {
    JOIN_MEETING: 'join-meeting',
    LEAVE_MEETING: 'leave-meeting',
    USER_JOINED: 'user-joined',
    USER_LEFT: 'user-left',
    OFFER: 'offer',
    ANSWER: 'answer',
    ICE_CANDIDATE: 'ice-candidate',
    TOGGLE_AUDIO: 'toggle-audio',
    TOGGLE_VIDEO: 'toggle-video',
    SCREEN_SHARE: 'screen-share',
    CHAT_MESSAGE: 'chat-message',
  },
  
  // Chat Events
  chat: {
    NEW_MESSAGE: 'new-message',
    MESSAGE_READ: 'message-read',
    TYPING: 'typing',
    STOP_TYPING: 'stop-typing',
  },
  
  // Notification Events
  notifications: {
    NEW_NOTIFICATION: 'new-notification',
    NOTIFICATION_READ: 'notification-read',
  },
};

export default ENDPOINTS;
