# Gamification Service

**Port:** 3007  
**Purpose:** Achievement, leaderboard, and user stats management with Redis caching

## 🎮 Service Overview

The Gamification Service manages:
- **Achievements**: 12 default achievements across 6 types (quiz_completion, score_achievement, streak, speed, category_master, special)
- **Leaderboards**: Global, category-specific, weekly, and monthly rankings
- **User Stats**: Comprehensive tracking (quizzes taken, points, streaks, level, experience)
- **Event-Driven Integration**: Subscribes to events from Quiz, Result, Live, and Social services

---

## 🏗️ Architecture

### **Core Components**

1. **Achievement Processor** (`src/services/achievementProcessor.js`)
   - Evaluates achievement criteria
   - Unlocks achievements based on user activity
   - 12 default achievements with 4 rarity levels

2. **Stats Manager** (`src/services/statsManager.js`)
   - Redis-cached user stats with atomic increments
   - Real-time stats updates (HINCRBY, HINCRBYFLOAT)
   - Periodic MongoDB sync (every 5 minutes)

3. **Leaderboard Manager** (`src/services/leaderboardManager.js`)
   - Redis Sorted Sets for O(log N) updates
   - Global, category, weekly, monthly leaderboards
   - User rank queries with surrounding users

4. **Bull Queue Workers**
   - **Achievement Worker**: Async achievement checks (doesn't block quiz completion)
   - **Stats Worker**: Syncs Redis stats to MongoDB

5. **Cron Jobs**
   - **Streak Checker**: Runs daily at midnight, resets inactive streaks
   - **Stats Sync**: Runs every 5 minutes, syncs cached stats to DB

---

## 📊 Redis Data Structures

### **1. User Stats (Hash)**
```
Key: userstats:{userId}
Fields: totalQuizzesTaken, totalPoints, totalTimeSpent, currentStreak, 
        longestStreak, experience, level, averageScore
TTL: 1 hour (synced to DB before expiry)
```

### **2. Leaderboards (Sorted Sets)**
```
leaderboard:global          - Global rankings by totalPoints
leaderboard:category:{cat}  - Category-specific rankings
leaderboard:weekly          - Weekly rankings (reset Monday)
leaderboard:monthly         - Monthly rankings (reset 1st)
```

### **3. Achievement Tracking (Sets)**
```
achievements:{userId}        - Set of unlocked achievement IDs
progress:{userId}:{achId}    - Achievement progress (0-100)
```

### **4. Streak Tracking (String)**
```
lastactivity:{userId}        - Timestamp of last quiz activity
TTL: 7 days
```

---

## 🔌 API Endpoints

### **Achievements**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/achievements` | Get all achievements (filter by type/rarity) |
| GET | `/api/achievements/:userId` | Get user's achievements |
| GET | `/api/achievements/:userId/:achievementId/progress` | Get achievement progress |
| POST | `/api/achievements` | Create achievement (admin) |
| POST | `/api/achievements/seed` | Seed default achievements |
| PUT | `/api/achievements/:achievementId` | Update achievement |
| DELETE | `/api/achievements/:achievementId` | Delete achievement |

### **Leaderboards**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboards/global?start=0&limit=100` | Global leaderboard |
| GET | `/api/leaderboards/category/:category` | Category leaderboard |
| GET | `/api/leaderboards/weekly` | Weekly leaderboard |
| GET | `/api/leaderboards/monthly` | Monthly leaderboard |
| GET | `/api/leaderboards/rank/:userId` | User's global rank |
| GET | `/api/leaderboards/rank/:userId/category/:category` | User's category rank |
| GET | `/api/leaderboards/surrounding/:userId?range=5` | Users near user's rank |
| POST | `/api/leaderboards/rebuild` | Rebuild leaderboards (admin) |

### **Stats**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/:userId` | Get user stats |
| GET | `/api/stats/top/:statField?limit=10` | Top users by stat (totalPoints, level, etc.) |
| POST | `/api/stats/:userId/sync` | Force sync stats to DB (admin) |
| PUT | `/api/stats/:userId` | Update stats manually (admin) |
| POST | `/api/stats/bulk-update` | Bulk update stats (admin) |

### **Events (Integration with other services)**

| Method | Endpoint | Description | Triggered By |
|--------|----------|-------------|--------------|
| POST | `/api/events/quiz-completed` | Quiz completion event | Quiz Service |
| POST | `/api/events/result-saved` | Result saved event | Result Service |
| POST | `/api/events/live-session-ended` | Live session ended | Live Service |
| POST | `/api/events/quiz-created` | Quiz created event | Quiz Service |
| POST | `/api/events/social-interaction` | Social interaction event | Social Service |
| GET | `/api/events/health` | Check event handler health | Monitoring |

---

## 🔗 Cross-Service Integration

### **1. Quiz Service → Gamification**
**Event:** `POST /api/events/quiz-completed`
```json
{
  "userId": "user123",
  "quizId": "quiz456",
  "resultData": {
    "percentage": 90,
    "pointsEarned": 100,
    "bonusPoints": 20,
    "totalTimeTaken": 180,
    "passed": true,
    "experienceGained": 50,
    "category": "Math"
  }
}
```
**Actions:**
- Updates user stats (atomic Redis increments)
- Updates average score
- Records activity for streak tracking
- Queues achievement check (non-blocking)

### **2. Result Service → Gamification**
**Event:** `POST /api/events/result-saved`
```json
{
  "userId": "user123",
  "resultId": "result789",
  "resultData": {
    "category": "Science",
    "totalPoints": 150
  }
}
```
**Actions:**
- Updates leaderboards (global + category)

### **3. Live Service → Gamification**
**Event:** `POST /api/events/live-session-ended`
```json
{
  "sessionId": "session123",
  "participants": [
    {
      "userId": "user123",
      "points": 200,
      "bonusPoints": 50,
      "rank": 1,
      "accuracy": 95,
      "totalTime": 300,
      "experience": 100
    }
  ]
}
```
**Actions:**
- Updates stats for all participants
- Queues achievement checks for live session performance

### **4. Gamification → Social Service**
**Event:** Achievement unlocked notification
**Endpoint:** `POST http://localhost:3006/api/events/achievement-unlocked`
```json
{
  "userId": "user123",
  "achievement": {
    "id": "ach123",
    "name": "Quiz Master",
    "description": "Complete 50 quizzes",
    "icon": "🎓",
    "rarity": "rare",
    "points": 200
  }
}
```
**Actions:**
- Social Service creates a post about the achievement
- Sends notifications to user's followers

---

## 🏆 Default Achievements

| Name | Type | Criteria | Rarity | Points |
|------|------|----------|--------|--------|
| First Steps | quiz_completion | 1 quiz | Common | 10 |
| Quiz Enthusiast | quiz_completion | 10 quizzes | Common | 50 |
| Quiz Master | quiz_completion | 50 quizzes | Rare | 200 |
| Perfect Score | score_achievement | 100% score | Epic | 100 |
| Excellence | score_achievement | 90%+ score | Rare | 50 |
| On Fire | streak | 5-day streak | Rare | 75 |
| Unstoppable | streak | 10-day streak | Epic | 150 |
| Speed Demon | speed | Complete quiz <2 min | Rare | 60 |
| Point Collector | special | 1000 total points | Rare | 100 |
| Rising Star | special | Level 5 | Rare | 80 |
| Champion | special | Level 10 | Epic | 200 |
| Legend | special | Level 20 | Legendary | 500 |

---

## 🚀 Setup & Deployment

### **1. Install Dependencies**
```bash
cd microservices/gamification-service
npm install
```

### **2. Configure Environment**
Copy `.env.example` to `.env` and update:
```env
PORT=3007
MONGODB_URI=mongodb://localhost:27017/cognito_gamification
REDIS_HOST=localhost
REDIS_PORT=6379

QUIZ_SERVICE_URL=http://localhost:3002
RESULT_SERVICE_URL=http://localhost:3003
LIVE_SERVICE_URL=http://localhost:3004
SOCIAL_SERVICE_URL=http://localhost:3006

JWT_SECRET=your_jwt_secret_here
```

### **3. Seed Default Achievements**
```bash
curl -X POST http://localhost:3007/api/achievements/seed
```

### **4. Start Service**
```bash
npm start
```

### **5. Verify Health**
```bash
curl http://localhost:3007/health
```

---

## ⚡ Performance Optimizations

### **1. Redis Caching**
- **User Stats**: Cached in Redis with 1-hour TTL
- **Leaderboards**: Redis Sorted Sets for O(log N) updates vs O(N log N) database sorts
- **Achievement Tracking**: Sets for fast membership checks

### **2. Async Processing**
- **Achievement Checks**: Bull queue with 3 retries, doesn't block quiz completion
- **Stats Sync**: Queued operation, Redis→MongoDB sync every 5 minutes

### **3. Database Indexes**
```javascript
// Achievement indexes
{ type: 1, isActive: 1 }
{ rarity: 1 }
{ name: 1 }

// UserAchievement indexes
{ user: 1, achievement: 1 } (unique)
{ user: 1, isCompleted: 1 }
{ user: 1, unlockedAt: -1 }

// UserStats indexes
{ user: 1 } (unique)
{ totalPoints: -1 }
{ level: -1 }
{ currentStreak: -1 }
{ longestStreak: -1 }
{ averageScore: -1 }
{ lastQuizDate: -1 }
```

### **4. Batch Operations**
- **User Details**: Fetched in batch for leaderboard population
- **Bulk Stats Update**: Single `bulkWrite()` for migrations

### **5. Cron Job Optimization**
- **Streak Checker**: Only processes users with currentStreak > 0
- **Stats Sync**: Only syncs users with cached stats

---

## 📈 Monitoring

### **Queue Status**
```bash
curl http://localhost:3007/api/events/health
```
Returns:
```json
{
  "success": true,
  "service": "event-handlers",
  "queues": {
    "achievement": {
      "waiting": 0,
      "active": 0,
      "completed": 1523,
      "failed": 2
    },
    "stats": {
      "waiting": 0,
      "active": 0,
      "completed": 8901,
      "failed": 0
    }
  }
}
```

### **Health Check**
```bash
curl http://localhost:3007/health
```

---

## 🔄 Streak Logic

1. **Quiz Completion**: Records `lastactivity:{userId}` timestamp in Redis (7-day TTL)
2. **Daily Cron (Midnight)**: Checks all users with `currentStreak > 0`
3. **Inactive Check**: If `lastactivity` > 24 hours ago → reset streak to 0
4. **Streak Bonus**: 
   - 2 streak = 10% bonus
   - 3 streak = 15% bonus
   - 4 streak = 20% bonus
   - 5+ streak = 25% bonus

---

## 🧪 Testing Integration

### **Test Quiz Completion**
```bash
curl -X POST http://localhost:3007/api/events/quiz-completed \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "quizId": "quiz456",
    "resultData": {
      "percentage": 95,
      "pointsEarned": 150,
      "bonusPoints": 30,
      "totalTimeTaken": 120,
      "passed": true,
      "experienceGained": 75,
      "category": "Math"
    }
  }'
```

### **Check User Stats**
```bash
curl http://localhost:3007/api/stats/user123
```

### **Check Global Leaderboard**
```bash
curl http://localhost:3007/api/leaderboards/global?start=0&limit=10
```

### **Check User Achievements**
```bash
curl http://localhost:3007/api/achievements/user123
```

---

## 🛠️ Admin Operations

### **Rebuild Leaderboards**
```bash
curl -X POST http://localhost:3007/api/leaderboards/rebuild
```

### **Force Stats Sync**
```bash
curl -X POST http://localhost:3007/api/stats/user123/sync
```

### **Create Custom Achievement**
```bash
curl -X POST http://localhost:3007/api/achievements \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Night Owl",
    "description": "Complete 10 quizzes after midnight",
    "icon": "🦉",
    "type": "special",
    "criteria": { "target": 10, "type": "night_quiz" },
    "rarity": "rare",
    "points": 80
  }'
```

---

## 📝 Notes

- **Non-Blocking**: Achievement checks use Bull queue (3 retries with exponential backoff)
- **Atomic Updates**: Redis HINCRBY/HINCRBYFLOAT for race condition safety
- **Periodic Sync**: Stats synced to MongoDB every 5 minutes
- **Leaderboard Reset**: Weekly/monthly leaderboards reset via cron (can be scheduled)
- **Cross-Service Events**: Uses HTTP webhooks (consider RabbitMQ/Kafka for production)

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 3007 |
| MONGODB_URI | MongoDB connection string | - |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| QUIZ_SERVICE_URL | Quiz service URL | http://localhost:3002 |
| SOCIAL_SERVICE_URL | Social service URL | http://localhost:3006 |
| ACHIEVEMENT_QUEUE_CONCURRENCY | Achievement worker concurrency | 5 |
| STATS_SYNC_INTERVAL_MS | Stats sync interval | 60000 (1 min) |
| LEADERBOARD_TTL_SECONDS | Leaderboard cache TTL | 300 (5 min) |
