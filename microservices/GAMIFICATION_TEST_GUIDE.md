# 🎮 Gamification Integration - Quick Test Guide

## 🚀 Quick Start

### 1. Start All Services (5 terminals)

```bash
# Terminal 1: Gamification Service (Port 3007)
cd microservices/gamification-service
npm start

# Terminal 2: Result Service (Port 3003)
cd microservices/result-service
npm start

# Terminal 3: Live Service (Port 3004)
cd microservices/live-service
npm start

# Terminal 4: Social Service (Port 3006)
cd microservices/social-service
npm start

# Terminal 5: Auth Service (Port 3001) - for JWT tokens
cd microservices/auth-service
npm start
```

### 2. Seed Default Achievements

```bash
curl -X POST http://localhost:3007/api/achievements/seed
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Default achievements seeded"
}
```

---

## ✅ Test Scenarios

### Test 1: Quiz Completion → Stats Update → Achievement Unlock

#### Step 1: Submit a Quiz Result
```bash
curl -X POST http://localhost:3003/api/results/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "quizId": "673b123456789abc12345678",
    "answers": [
      {
        "questionId": "q1",
        "selectedAnswer": "A",
        "isCorrect": true,
        "points": 10
      },
      {
        "questionId": "q2",
        "selectedAnswer": "B",
        "isCorrect": true,
        "points": 10
      }
    ],
    "startedAt": "2025-11-28T10:00:00Z",
    "completedAt": "2025-11-28T10:05:00Z",
    "quizMetadata": {
      "category": "Math",
      "difficulty": "Medium"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "_id": "result123",
      "score": 20,
      "correctAnswers": 2,
      "totalQuestions": 2
    }
  }
}
```

#### Step 2: Check Gamification Service Logs
Look for:
```
Processing achievement check for user 673b...
✅ Achievement job xxx completed
```

#### Step 3: Verify Stats Updated
```bash
curl http://localhost:3007/api/stats/YOUR_USER_ID
```

**Expected Response:**
```json
{
  "success": true,
  "userId": "673b...",
  "stats": {
    "totalQuizzesTaken": 1,
    "totalPoints": 20,
    "currentStreak": 1,
    "level": 1,
    "experience": 2
  }
}
```

#### Step 4: Check for Unlocked Achievement
```bash
curl http://localhost:3007/api/achievements/YOUR_USER_ID?completedOnly=true
```

**Expected Response (after 1st quiz):**
```json
{
  "success": true,
  "achievements": [
    {
      "achievement": {
        "name": "First Steps",
        "description": "Complete your first quiz",
        "icon": "🎯",
        "points": 10
      },
      "unlockedAt": "2025-11-28T10:05:30Z"
    }
  ]
}
```

#### Step 5: Check Social Post Created
```bash
curl http://localhost:3006/api/posts?userId=YOUR_USER_ID&type=achievement
```

**Expected Response:**
```json
{
  "success": true,
  "posts": [
    {
      "type": "achievement",
      "content": {
        "text": "Unlocked 🎯 First Steps! 🎉",
        "achievement": {
          "name": "First Steps",
          "icon": "🎯",
          "rarity": "common"
        }
      }
    }
  ]
}
```

---

### Test 2: Multiple Quizzes → Level Up

#### Complete 10 Quizzes
```bash
# Submit 10 quiz results (use loop or repeat)
for i in {1..10}; do
  curl -X POST http://localhost:3003/api/results/submit \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d "{...}" 
done
```

#### Check Stats After 10 Quizzes
```bash
curl http://localhost:3007/api/stats/YOUR_USER_ID
```

**Expected:**
- `totalQuizzesTaken`: 10
- `level`: 2 or 3 (depending on score)
- `experience`: 100-200

#### Check Achievements
```bash
curl http://localhost:3007/api/achievements/YOUR_USER_ID?completedOnly=true
```

**Should have unlocked:**
- ✅ First Steps (1 quiz)
- ✅ Quiz Enthusiast (10 quizzes)

---

### Test 3: Perfect Score → Epic Achievement

#### Submit Quiz with 100% Score
```bash
curl -X POST http://localhost:3003/api/results/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "quizId": "673b123456789abc12345678",
    "answers": [
      {"isCorrect": true, "points": 10},
      {"isCorrect": true, "points": 10},
      {"isCorrect": true, "points": 10},
      {"isCorrect": true, "points": 10},
      {"isCorrect": true, "points": 10}
    ],
    "startedAt": "2025-11-28T10:00:00Z",
    "completedAt": "2025-11-28T10:02:00Z"
  }'
```

#### Verify Perfect Score Achievement
```bash
curl http://localhost:3007/api/achievements/YOUR_USER_ID?completedOnly=true | grep "Perfect Score"
```

**Expected:**
```json
{
  "achievement": {
    "name": "Perfect Score",
    "icon": "💯",
    "rarity": "epic",
    "points": 100
  }
}
```

---

### Test 4: Live Session → Batch Stats Update

This test requires Socket.IO client. Simplified version:

#### Check Gamification Service Logs
When a live session ends, look for:
```
Processing achievement check for user user1
Processing achievement check for user user2
Processing achievement check for user user3
```

#### Verify All Participants' Stats Updated
```bash
curl http://localhost:3007/api/stats/PARTICIPANT_1_ID
curl http://localhost:3007/api/stats/PARTICIPANT_2_ID
curl http://localhost:3007/api/stats/PARTICIPANT_3_ID
```

---

### Test 5: Leaderboard Updates

#### Check Global Leaderboard
```bash
curl http://localhost:3007/api/leaderboards/global?limit=10
```

**Expected Response:**
```json
{
  "success": true,
  "type": "global",
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user1",
      "score": 500,
      "user": {
        "name": "Top Player"
      }
    },
    {
      "rank": 2,
      "userId": "user2",
      "score": 450,
      "user": {
        "name": "Second Place"
      }
    }
  ]
}
```

#### Check User's Rank
```bash
curl http://localhost:3007/api/leaderboards/rank/YOUR_USER_ID
```

**Expected:**
```json
{
  "success": true,
  "userId": "your-id",
  "rank": 5,
  "score": 320
}
```

---

## 🔍 Debugging Commands

### Check Service Health
```bash
# Gamification Service
curl http://localhost:3007/health

# Result Service
curl http://localhost:3003/health

# Live Service
curl http://localhost:3004/health

# Social Service
curl http://localhost:3006/health
```

### Check Queue Status
```bash
curl http://localhost:3007/api/events/health
```

**Expected:**
```json
{
  "success": true,
  "queues": {
    "achievement": {
      "waiting": 0,
      "active": 0,
      "completed": 25,
      "failed": 0
    },
    "stats": {
      "waiting": 0,
      "active": 0,
      "completed": 50,
      "failed": 0
    }
  }
}
```

### Check Redis Cache
```bash
# Stats cache
redis-cli GET userstats:YOUR_USER_ID

# Leaderboard
redis-cli ZREVRANGE leaderboard:global 0 9 WITHSCORES

# User achievements
redis-cli SMEMBERS achievements:YOUR_USER_ID
```

### Force Stats Sync to DB
```bash
curl -X POST http://localhost:3007/api/stats/YOUR_USER_ID/sync
```

---

## 🐛 Common Issues

### Issue 1: No Achievement Unlocked

**Symptoms:** Quiz completed but no achievement

**Check:**
```bash
# Check if event received
curl http://localhost:3007/api/events/health

# Check queue
redis-cli LLEN bull:achievement-processing:wait
```

**Solution:**
- Verify Bull queue is running
- Check Gamification Service logs for errors
- Manually trigger achievement check:
```bash
curl -X POST http://localhost:3007/api/events/quiz-completed \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "quizId": "quiz123",
    "resultData": {
      "percentage": 90,
      "pointsEarned": 100,
      "passed": true
    }
  }'
```

### Issue 2: Stats Not Updating

**Symptoms:** Quiz submitted but stats unchanged

**Check:**
```bash
# Check Redis
redis-cli HGETALL userstats:YOUR_USER_ID

# Check MongoDB
mongo cognito_gamification
db.userstats.findOne({user: ObjectId("YOUR_USER_ID")})
```

**Solution:**
- Restart Gamification Service
- Clear Redis cache:
```bash
redis-cli DEL userstats:YOUR_USER_ID
```

### Issue 3: Social Post Not Created

**Symptoms:** Achievement unlocked but no post

**Check Social Service logs:**
```bash
cd microservices/social-service
npm start
# Look for "Created achievement post for user X"
```

**Manually test:**
```bash
curl -X POST http://localhost:3006/api/events/achievement-unlocked \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "achievement": {
      "name": "Test Achievement",
      "icon": "🎯",
      "rarity": "common"
    }
  }'
```

---

## 📊 Performance Monitoring

### Check Response Times
```bash
# Result submission should be <100ms
time curl -X POST http://localhost:3003/api/results/submit \
  -H "Authorization: Bearer TOKEN" \
  -d '{...}'

# Leaderboard should be <50ms (cached)
time curl http://localhost:3007/api/leaderboards/global
```

### Monitor Queue Processing
```bash
# Watch queue in real-time
watch -n 1 'curl -s http://localhost:3007/api/events/health | jq .queues'
```

### Check Redis Memory
```bash
redis-cli INFO memory
redis-cli DBSIZE
```

---

## 🎯 Success Criteria

After testing, you should see:

✅ **Stats Updated:** `totalQuizzesTaken`, `totalPoints`, `experience`, `level`  
✅ **Achievements Unlocked:** At least "First Steps" after 1 quiz  
✅ **Social Posts Created:** Achievement posts visible  
✅ **Leaderboard Updated:** User appears in global leaderboard  
✅ **Queue Processing:** No failed jobs in Bull queue  
✅ **Redis Caching:** Stats cached with 1-hour TTL  
✅ **Non-Blocking:** Result submission still fast (<100ms)

---

## 🚀 Next Steps

1. **Add More Users:** Test with multiple users to populate leaderboards
2. **Test Streaks:** Complete quizzes daily to trigger streak achievements
3. **Test Live Sessions:** Run multiplayer sessions to test batch updates
4. **Monitor Performance:** Use Redis monitoring and Bull dashboard
5. **Scale Testing:** Load test with 100+ concurrent quiz submissions

---

## 📞 Support

If issues persist:
1. Check all services are running: `curl http://localhost:PORT/health`
2. Review logs for each service
3. Verify Redis is running: `redis-cli PING`
4. Check MongoDB connections
5. Verify JWT tokens are valid

For detailed integration flow, see: `GAMIFICATION_INTEGRATION_COMPLETE.md`
