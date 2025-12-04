# Result Service

Quiz result processing and analytics microservice with optimized aggregation queries and Redis-cached leaderboards.

## 🎯 Key Features

- **Result Submission**: Individual and batch result processing
- **Cached Leaderboards**: Redis-backed quiz and global leaderboards (5min TTL)
- **User Analytics**: Performance statistics and attempt history
- **Quiz Analytics**: Aggregated metrics for quiz creators
- **Optimized Queries**: 10 MongoDB indexes for fast aggregations
- **Smart Caching**: Cache invalidation on new submissions

## 🏗️ Architecture

```
result-service/
├── index.js                  # Main server (port 3003)
├── models/
│   └── Result.js             # Result schema with 10 indexes
├── services/
│   └── cacheManager.js       # Redis cache for leaderboards/stats
└── routes/
    ├── submission.js         # Result submission endpoints
    ├── leaderboards.js       # Leaderboard queries (cached)
    └── analytics.js          # User/quiz analytics
```

## 🚀 Quick Start

### Prerequisites
```bash
# Redis (required for caching)
docker run -d -p 6379:6379 redis:alpine

# MongoDB (running at MONGODB_URI)
```

### Installation
```bash
cd microservices/result-service
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the Service
```bash
npm start
# or for development:
npm run dev
```

## 📚 API Documentation

### Base URL
```
http://localhost:3003
```

---

## 📊 Result Submission

### 1. Submit Quiz Result
```http
POST /api/results/submit
Authorization: Bearer <token>
```

**Body:**
```json
{
  "quizId": "64f8a9b2c3d4e5f6",
  "sessionId": "64f8a9b2c3d4e5f7",
  "answers": [
    {
      "questionId": "q1",
      "selectedAnswer": 2,
      "isCorrect": true,
      "points": 10,
      "timeSpent": 5000
    }
  ],
  "startedAt": "2024-01-01T10:00:00Z",
  "completedAt": "2024-01-01T10:05:00Z",
  "quizMetadata": {
    "title": "Math Quiz",
    "difficulty": "Medium",
    "category": "Mathematics"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "id": "64f8a9b2c3d4e5f8",
      "score": 80,
      "maxScore": 100,
      "percentage": 80,
      "correctAnswers": 8,
      "totalQuestions": 10,
      "performanceLevel": "Good",
      "isPassed": true
    },
    "analysis": {
      "timing": {
        "fastest": 3000,
        "slowest": 8000,
        "average": 5000
      },
      "speedScore": 16.0
    }
  }
}
```

---

### 2. Batch Submit (Multiplayer)
```http
POST /api/results/batch-submit
Authorization: Bearer <token>
```

**Body:**
```json
{
  "results": [
    {
      "userId": "user1",
      "quizId": "quiz1",
      "sessionId": "session1",
      "answers": [...],
      "startedAt": "...",
      "completedAt": "..."
    }
  ]
}
```

---

## 🏆 Leaderboards (Cached)

### 3. Quiz Leaderboard
```http
GET /api/leaderboards/quiz/:quizId?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user1",
        "userName": "John Doe",
        "userPicture": "...",
        "score": 95,
        "percentage": 95,
        "totalTimeSpent": 300000
      }
    ],
    "cached": true,
    "limit": 10
  }
}
```

**Cache**: 5 minutes TTL, invalidated on new submissions

---

### 4. Global Leaderboard
```http
GET /api/leaderboards/global?limit=100
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user1",
        "userName": "Jane Smith",
        "totalScore": 5280,
        "averagePercentage": 88.5,
        "quizzesTaken": 60,
        "accuracy": 87.2
      }
    ],
    "cached": true
  }
}
```

**Cache**: 10 minutes TTL

---

### 5. User Rank in Quiz
```http
GET /api/leaderboards/user/:userId/rank?quizId=64f8a9b2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 15,
    "score": 75,
    "percentage": 75,
    "totalAttempts": 150
  }
}
```

---

## 📈 Analytics

### 6. User Statistics (Cached)
```http
GET /api/analytics/user/:userId/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "overall": {
        "totalQuizzes": 45,
        "averageScore": 82.5,
        "bestScore": 98,
        "totalCorrect": 385,
        "totalQuestions": 450
      },
      "byCategory": [
        {
          "_id": "Math",
          "count": 20,
          "avgScore": 85.3
        }
      ],
      "recentTrend": [...]
    },
    "cached": true
  }
}
```

**Cache**: 1 hour TTL

---

### 7. User History
```http
GET /api/analytics/user/:userId/history?page=1&limit=20
Authorization: Bearer <token>
```

---

### 8. Quiz Analytics
```http
GET /api/analytics/quiz/:quizId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalAttempts": 125,
      "averageScore": 78.5,
      "highestScore": 100,
      "lowestScore": 45,
      "averageTime": 285000,
      "passRate": 82.4
    },
    "cached": true
  }
}
```

**Cache**: 30 minutes TTL

---

### 9. Detailed Result Analysis
```http
GET /api/analytics/result/:resultId
Authorization: Bearer <token>
```

---

### 10. Performance Comparison
```http
GET /api/analytics/comparison?userId=user1&quizIds=quiz1,quiz2,quiz3
Authorization: Bearer <token>
```

---

## 🔧 Optimization Features

### 1. Database Indexes (10 Total)
```javascript
// Result Model Indexes
1. { userId: 1 }                           // User lookup
2. { quizId: 1 }                          // Quiz lookup
3. { sessionId: 1 }                       // Session lookup
4. { userId: 1, createdAt: -1 }           // User history
5. { quizId: 1, score: -1, totalTimeSpent: 1 } // Quiz leaderboard
6. { sessionId: 1, score: -1, totalTimeSpent: 1 } // Session leaderboard
7. { score: -1, createdAt: -1 }           // Global leaderboard
8. { userId: 1, completedAt: -1 }         // Performance over time
9. { 'quizMetadata.category': 1, percentage: -1 } // Category analytics
10. { createdAt: -1 }                     // Recent results
```

### 2. Cache Strategy
```javascript
// TTL Settings
Leaderboards:    5 minutes  (high traffic, fast invalidation)
User Stats:      1 hour     (stable data)
Quiz Analytics:  30 minutes (moderate updates)
Global Stats:    10 minutes (balance between freshness/performance)
```

### 3. Aggregation Pipeline Optimization
- **allowDiskUse(true)** for large aggregations
- **$facet** for parallel aggregations
- **Lean queries** when virtuals not needed
- **Projection** to reduce data transfer

### 4. Cache Invalidation Strategy
```javascript
// On result submission:
1. Invalidate quiz leaderboard (all limits)
2. Invalidate global leaderboard
3. Invalidate user stats
4. Invalidate quiz analytics

// Async invalidation (non-blocking)
```

## 📊 Performance Metrics

**Expected Improvements vs Monolithic:**
- Leaderboard queries: **10-20x faster** (Redis cache)
- User stats: **5-8x faster** (indexed aggregations)
- Quiz analytics: **4-6x faster** (cached + indexes)
- Concurrent requests: **10x more** (optimized queries)

**Cache Hit Rate Target**: 70-80%

## 🧪 Testing

```bash
npm test
```

## 🐛 Troubleshooting

### High cache miss rate
```bash
# Check Redis keys
redis-cli
> KEYS leaderboard:*
> TTL leaderboard:quiz:64f8a9b2:top10
```

### Slow aggregations
```bash
# Check index usage
db.results.explain().aggregate([...])

# Verify indexes
db.results.getIndexes()
```

### Memory issues
```bash
# Monitor Redis memory
redis-cli INFO memory

# Check MongoDB connections
db.serverStatus().connections
```

## 🔗 Integration

**Quiz Service → Result Service**
```javascript
// After quiz completion
await fetch('http://localhost:3003/api/results/submit', {
  method: 'POST',
  body: JSON.stringify(resultData),
  headers: { Authorization: `Bearer ${token}` }
});
```

**Live Service → Result Service (Multiplayer)**
```javascript
// Batch submit at session end
await fetch('http://localhost:3003/api/results/batch-submit', {
  method: 'POST',
  body: JSON.stringify({ results: allResults })
});
```

## 📝 Environment Variables

See `.env.example` for all configuration options.

**Required:**
- `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_URL`

**Optional (with defaults):**
- `PORT=3003`
- `CACHE_TTL_LEADERBOARD=300` (5 min)
- `CACHE_TTL_USER_STATS=3600` (1 hour)
- `RATE_LIMIT_MAX_REQUESTS=100`

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Port**: 3003  
**Dependencies**: Quiz Service (quizId references)
