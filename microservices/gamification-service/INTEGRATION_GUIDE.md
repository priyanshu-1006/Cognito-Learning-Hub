# Gamification Service Integration Summary

## 🎯 Cross-Service Communication Map

This document outlines how the Gamification Service integrates with other microservices.

### **1. Quiz Service (Port 3002) → Gamification Service**

**Trigger:** Quiz completion  
**Integration Point:** `POST http://localhost:3007/api/events/quiz-completed`

**When to Call:**
- After saving quiz result to database
- After calculating final score and bonus points

**Example Integration Code (Quiz Service):**
```javascript
// In Quiz Service - After quiz completion
const axios = require('axios');

async function onQuizCompleted(userId, quizId, result) {
  try {
    // Save result first
    await saveResultToDatabase(result);
    
    // Notify gamification service (non-blocking)
    axios.post('http://localhost:3007/api/events/quiz-completed', {
      userId,
      quizId,
      resultData: {
        percentage: result.percentage,
        pointsEarned: result.pointsEarned,
        bonusPoints: result.bonusPoints,
        totalTimeTaken: result.totalTimeTaken,
        passed: result.passed,
        experienceGained: calculateExperience(result),
        category: result.category
      }
    }).catch(err => {
      console.error('Failed to notify gamification service:', err.message);
      // Don't throw - gamification failure shouldn't break quiz completion
    });
  } catch (error) {
    console.error('Error in quiz completion:', error);
    throw error;
  }
}
```

**What Gamification Service Does:**
1. Updates user stats (totalQuizzesTaken +1, totalPoints, etc.) in Redis
2. Updates average score
3. Records last activity timestamp for streak tracking
4. Queues achievement check job (async, non-blocking)
5. Returns success response immediately

---

### **2. Result Service (Port 3003) → Gamification Service**

**Trigger:** Result saved to database  
**Integration Point:** `POST http://localhost:3007/api/events/result-saved`

**When to Call:**
- After result document is created in MongoDB

**Example Integration Code (Result Service):**
```javascript
// In Result Service - After saving result
async function onResultSaved(userId, resultId, resultData) {
  try {
    // Notify gamification for leaderboard update
    await axios.post('http://localhost:3007/api/events/result-saved', {
      userId,
      resultId,
      resultData: {
        category: resultData.category,
        totalPoints: resultData.totalPoints
      }
    }).catch(err => {
      console.error('Failed to update leaderboards:', err.message);
    });
  } catch (error) {
    console.error('Error notifying gamification:', error);
  }
}
```

**What Gamification Service Does:**
1. Updates global leaderboard (Redis Sorted Set)
2. Updates category-specific leaderboard
3. Updates weekly/monthly leaderboards

---

### **3. Live Service (Port 3004) → Gamification Service**

**Trigger:** Live session ends  
**Integration Point:** `POST http://localhost:3007/api/events/live-session-ended`

**When to Call:**
- After live session timer expires
- After calculating final rankings

**Example Integration Code (Live Service):**
```javascript
// In Live Service - After session ends
async function onLiveSessionEnded(sessionId, participants) {
  try {
    // Calculate participant stats
    const participantData = participants.map(p => ({
      userId: p.userId,
      points: p.finalScore,
      bonusPoints: p.streakBonus + p.speedBonus,
      rank: p.rank,
      accuracy: p.correctAnswers / p.totalAnswers * 100,
      totalTime: p.totalTimeSpent,
      experience: calculateLiveExperience(p)
    }));

    // Notify gamification service
    await axios.post('http://localhost:3007/api/events/live-session-ended', {
      sessionId,
      participants: participantData
    }).catch(err => {
      console.error('Failed to update gamification:', err.message);
    });
  } catch (error) {
    console.error('Error notifying gamification:', error);
  }
}
```

**What Gamification Service Does:**
1. Updates stats for ALL participants
2. Queues achievement checks for each participant
3. Checks for live session-specific achievements (e.g., "Top 3 in live session")

---

### **4. Gamification Service → Social Service (Port 3006)**

**Trigger:** Achievement unlocked  
**Integration Point:** `POST http://localhost:3006/api/events/achievement-unlocked`

**When Called:**
- Automatically when achievement is unlocked (in achievement worker)

**Example Integration Code (Already implemented in achievementWorker.js):**
```javascript
// In Gamification Service - Achievement Worker
async function notifySocialService(userId, unlockedAchievements) {
  for (const { achievement } of unlockedAchievements) {
    await axios.post('http://localhost:3006/api/events/achievement-unlocked', {
      userId,
      achievement: {
        id: achievement._id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        points: achievement.points
      }
    }).catch(err => {
      console.error('Failed to notify social service:', err.message);
    });
  }
}
```

**What Social Service Should Do:**
1. Create a social post about the achievement
2. Send notifications to user's followers
3. Update user's activity feed

**Example Social Service Handler:**
```javascript
// In Social Service - Event handler
router.post('/api/events/achievement-unlocked', async (req, res) => {
  try {
    const { userId, achievement } = req.body;

    // Create social post
    const post = new Post({
      user: userId,
      type: 'achievement',
      content: {
        text: `Unlocked ${achievement.icon} ${achievement.name}!`,
        achievement: achievement
      },
      visibility: 'public'
    });
    await post.save();

    // Send notifications to followers
    await notifyFollowers(userId, {
      type: 'achievement_unlocked',
      achievement: achievement.name
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling achievement unlock:', error);
    res.status(500).json({ success: false });
  }
});
```

---

### **5. Other Services → Gamification Service (Queries)**

**Leaderboard Queries:**
```javascript
// Get global leaderboard for display
const leaderboard = await axios.get('http://localhost:3007/api/leaderboards/global?start=0&limit=10');

// Get user's rank
const rank = await axios.get(`http://localhost:3007/api/leaderboards/rank/${userId}`);

// Get surrounding users
const surrounding = await axios.get(`http://localhost:3007/api/leaderboards/surrounding/${userId}?range=5`);
```

**User Stats Queries:**
```javascript
// Get user stats for profile display
const stats = await axios.get(`http://localhost:3007/api/stats/${userId}`);

// Get user achievements
const achievements = await axios.get(`http://localhost:3007/api/achievements/${userId}?completedOnly=true`);
```

---

## 🔧 Required Changes to Existing Services

### **Quiz Service (3002) - Add Gamification Hook**

**File:** `microservices/quiz-service/src/routes/quizzes.js`

Add after quiz completion:
```javascript
const axios = require('axios');
const GAMIFICATION_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3007';

// After saving result
axios.post(`${GAMIFICATION_URL}/api/events/quiz-completed`, {
  userId: req.user.id,
  quizId: quiz._id,
  resultData: {
    percentage: result.percentage,
    pointsEarned: result.pointsEarned,
    bonusPoints: result.bonusPoints,
    totalTimeTaken: result.totalTimeTaken,
    passed: result.percentage >= quiz.passingScore,
    experienceGained: Math.round(result.pointsEarned / 10),
    category: quiz.category
  }
}).catch(err => {
  console.error('Gamification notification failed:', err.message);
});
```

---

### **Result Service (3003) - Add Leaderboard Update**

**File:** `microservices/result-service/src/routes/results.js`

Add after result creation:
```javascript
const axios = require('axios');
const GAMIFICATION_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3007';

// After saving result
axios.post(`${GAMIFICATION_URL}/api/events/result-saved`, {
  userId: result.user,
  resultId: result._id,
  resultData: {
    category: result.quizCategory,
    totalPoints: result.totalPoints
  }
}).catch(err => {
  console.error('Leaderboard update failed:', err.message);
});
```

---

### **Live Service (3004) - Add Session End Hook**

**File:** `microservices/live-service/src/services/sessionManager.js`

Add in `endSession()` method:
```javascript
const axios = require('axios');
const GAMIFICATION_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3007';

// After calculating final rankings
const participantData = participants.map(p => ({
  userId: p.userId,
  points: p.finalScore,
  bonusPoints: p.streakBonus + p.speedBonus,
  rank: p.rank,
  accuracy: p.correctAnswers / p.totalAnswers * 100,
  totalTime: p.totalTimeSpent,
  experience: Math.round(p.finalScore / 5)
}));

axios.post(`${GAMIFICATION_URL}/api/events/live-session-ended`, {
  sessionId: session.id,
  participants: participantData
}).catch(err => {
  console.error('Gamification notification failed:', err.message);
});
```

---

### **Social Service (3006) - Add Achievement Handler**

**File:** `microservices/social-service/src/routes/events.js`

Add new route:
```javascript
router.post('/achievement-unlocked', async (req, res) => {
  try {
    const { userId, achievement } = req.body;

    // Create social post
    const Post = require('../models/Post');
    const post = new Post({
      user: userId,
      type: 'achievement',
      content: {
        text: `Unlocked ${achievement.icon} ${achievement.name}!`,
        achievement: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity
        }
      },
      visibility: 'public'
    });
    await post.save();

    // Queue notification job
    const { getNotificationQueue } = require('../config/queue');
    const notificationQueue = getNotificationQueue();
    await notificationQueue.add('achievement-notification', {
      userId,
      achievementName: achievement.name,
      achievementIcon: achievement.icon
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling achievement unlock:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 🧪 Integration Testing

### **Test 1: Quiz Completion Flow**
```bash
# 1. Complete a quiz (Quiz Service)
curl -X POST http://localhost:3002/api/quizzes/quiz123/submit \
  -H "Authorization: Bearer TOKEN" \
  -d '{"answers": [...]}'

# 2. Check if stats updated (Gamification Service)
curl http://localhost:3007/api/stats/user123

# 3. Check if achievement unlocked
curl http://localhost:3007/api/achievements/user123?completedOnly=true

# 4. Check leaderboard
curl http://localhost:3007/api/leaderboards/global?limit=10
```

### **Test 2: Live Session Flow**
```bash
# 1. End live session (Live Service)
curl -X POST http://localhost:3004/api/sessions/session123/end \
  -H "Authorization: Bearer TOKEN"

# 2. Verify all participants' stats updated
curl http://localhost:3007/api/stats/user123
curl http://localhost:3007/api/stats/user456

# 3. Check leaderboard changes
curl http://localhost:3007/api/leaderboards/global?limit=10
```

### **Test 3: Achievement → Social Post**
```bash
# 1. Trigger achievement (simulate by completing quizzes)
# ... complete 10 quizzes ...

# 2. Check social service for achievement post
curl http://localhost:3006/api/posts?userId=user123&type=achievement

# 3. Verify notifications sent
curl http://localhost:3006/api/notifications/user123
```

---

## 📊 Monitoring Integration Health

### **Check All Services**
```bash
# Gamification Service
curl http://localhost:3007/health

# Check queue status
curl http://localhost:3007/api/events/health

# Check achievement processing
curl http://localhost:3007/api/achievements

# Check leaderboards
curl http://localhost:3007/api/leaderboards/global?limit=10
```

---

## ⚠️ Important Notes

1. **Non-Blocking**: All gamification event calls use `.catch()` to prevent service failures from breaking quiz/live sessions
2. **Async Processing**: Achievement checks don't block - they're queued with Bull
3. **Retry Logic**: Bull queue has 3 retries with exponential backoff
4. **Idempotency**: Achievement unlocks are idempotent (won't unlock same achievement twice)
5. **Race Conditions**: Redis atomic operations (HINCRBY) prevent race conditions in stats updates

---

## 🔄 Failure Handling

### **Gamification Service Down**
- Quiz/Live/Result services continue working normally
- Events are logged but not processed
- When service restarts, stats can be rebuilt from Result collection

### **Achievement Check Fails**
- Bull queue retries 3 times with exponential backoff
- Failed jobs logged in Bull dashboard
- Can be manually retried from admin panel

### **Social Service Down**
- Achievement unlocks still recorded
- Social posts can be created later from achievement history
- Notifications can be sent retroactively

---

## 🚀 Deployment Checklist

- [ ] Deploy Gamification Service (port 3007)
- [ ] Seed default achievements: `POST /api/achievements/seed`
- [ ] Add GAMIFICATION_SERVICE_URL to all service .env files
- [ ] Add gamification hooks to Quiz Service
- [ ] Add leaderboard update to Result Service
- [ ] Add session end hook to Live Service
- [ ] Add achievement handler to Social Service
- [ ] Test quiz completion → stats update flow
- [ ] Test achievement unlock → social post flow
- [ ] Test live session → leaderboard update flow
- [ ] Monitor Bull queue: `GET /api/events/health`
- [ ] Verify cron jobs running (streak checker, stats sync)

---

## 📈 Future Enhancements

1. **Event Bus**: Replace HTTP webhooks with RabbitMQ/Kafka for reliability
2. **GraphQL Federation**: Unified API for gamification queries
3. **Real-time Updates**: Socket.IO for live leaderboard updates
4. **Achievement Templates**: Dynamic achievement creation from admin panel
5. **Seasonal Events**: Time-limited achievements and leaderboards
6. **Clan/Team Stats**: Aggregate stats for groups
7. **Achievement Sharing**: Share achievements on external platforms
