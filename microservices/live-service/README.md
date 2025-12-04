# Live Service

Real-time multiplayer quiz service with Redis-backed sessions, optimized leaderboards, and efficient Socket.IO handling.

## 🎯 Key Features

- **Redis Session Storage**: No data loss on restart, horizontally scalable
- **Optimized Leaderboards**: Redis Sorted Sets for O(log N) updates
- **Batched Broadcasts**: Leaderboard updates every 2 seconds (configurable)
- **Atomic Operations**: ZINCRBY for race-condition-free scoring
- **Periodic DB Sync**: Redis → MongoDB sync every 30s or 10 answers
- **Socket.IO Optimization**: Connection pooling, compression, room-based broadcasts
- **Session Recovery**: Reconnect to active sessions after disconnect

## 🏗️ Architecture

```
live-service/
├── index.js                     # Main server with Socket.IO (port 3004)
├── models/
│   └── LiveSession.js           # MongoDB model (persistence only)
├── services/
│   └── sessionManager.js        # Redis operations (active sessions)
├── socket/
│   └── handlers.js              # Socket.IO event handlers
└── routes/
    └── sessions.js              # HTTP session management
```

## 🔄 Data Flow

### Old (Monolithic) - Memory Map
```
Answer → DB Query → Update → Re-populate → Sort → Broadcast
   ❌ 3 DB queries per answer
   ❌ O(N log N) sort every time
   ❌ Lost on restart
```

### New (Optimized) - Redis
```
Answer → ZINCRBY → Mark for batch update → (every 2s) → Broadcast
   ✅ 0 DB queries (Redis atomic)
   ✅ O(log N) sorted set update
   ✅ Persistent + recoverable
```

## 🚀 Quick Start

### Prerequisites
```bash
# Redis (required for sessions)
docker run -d -p 6379:6379 redis:alpine

# MongoDB (persistence layer)
```

### Installation
```bash
cd microservices/live-service
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
http://localhost:3004
```

---

## 🌐 HTTP Endpoints

### 1. Create Session
```http
POST /api/sessions/create
Authorization: Bearer <token>
```

**Body:**
```json
{
  "quizId": "64f8a9b2c3d4e5f6",
  "maxParticipants": 50,
  "settings": {
    "timePerQuestion": 30,
    "showLeaderboard": true,
    "allowLateJoin": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionCode": "A1B2C3",
      "status": "waiting",
      "joinUrl": "http://localhost:3004/join/A1B2C3",
      "quizMetadata": {
        "title": "Math Quiz",
        "totalQuestions": 10
      }
    }
  }
}
```

---

### 2. Get Session Details
```http
GET /api/sessions/:sessionCode
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionCode": "A1B2C3",
      "status": "active",
      "participantCount": 15,
      "currentQuestionIndex": 3,
      "quizMetadata": {...}
    }
  }
}
```

---

### 3. Get Leaderboard
```http
GET /api/sessions/:sessionCode/leaderboard?limit=50
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
        "score": 850,
        "correctAnswers": 8
      }
    ]
  }
}
```

---

### 4. Get Participants
```http
GET /api/sessions/:sessionCode/participants
```

---

### 5. Get Active Sessions
```http
GET /api/sessions
```

---

### 6. Delete Session (Host)
```http
DELETE /api/sessions/:sessionCode
Authorization: Bearer <token>
```

---

### 7. Get Session Stats
```http
GET /api/sessions/:sessionCode/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "sessionCode": "A1B2C3",
      "participantCount": 15,
      "answerCount": 120,
      "status": "active",
      "currentQuestion": 3
    }
  }
}
```

---

## 🔌 Socket.IO Events

### Client → Server

#### join-session
```javascript
socket.emit('join-session', {
  sessionCode: 'A1B2C3',
  userId: 'user123',
  userName: 'John Doe',
  userPicture: 'https://...'
});
```

**Response:**
```javascript
socket.on('session-joined', (data) => {
  // data.session, data.participant, data.participants, data.leaderboard
});
```

---

#### start-session (Host only)
```javascript
socket.emit('start-session', {
  sessionCode: 'A1B2C3',
  userId: 'host123'
});
```

**Broadcast:**
```javascript
socket.on('session-started', (data) => {
  // Session started, first question coming...
});
```

---

#### submit-answer
```javascript
socket.emit('submit-answer', {
  sessionCode: 'A1B2C3',
  userId: 'user123',
  questionId: 'q1',
  selectedAnswer: 2,
  timeSpent: 5000
});
```

**Response:**
```javascript
socket.on('answer-submitted', (data) => {
  // data.isCorrect, data.points, data.correctAnswer
});
```

---

#### next-question (Host only)
```javascript
socket.emit('next-question', {
  sessionCode: 'A1B2C3',
  userId: 'host123'
});
```

---

#### leave-session
```javascript
socket.emit('leave-session', {
  sessionCode: 'A1B2C3',
  userId: 'user123'
});
```

---

### Server → Client (Broadcasts)

#### question-started
```javascript
socket.on('question-started', (data) => {
  // data.questionIndex, data.question (no correct answer), data.timeLimit
});
```

---

#### question-ended
```javascript
socket.on('question-ended', (data) => {
  // data.questionIndex, data.correctAnswer
});
```

---

#### leaderboard-updated (Batched every 2s)
```javascript
socket.on('leaderboard-updated', (data) => {
  // data.leaderboard (top 50 by default)
});
```

---

#### participant-joined
```javascript
socket.on('participant-joined', (data) => {
  // data.participant, data.participantCount
});
```

---

#### participant-left
```javascript
socket.on('participant-left', (data) => {
  // data.userId, data.participantCount
});
```

---

#### session-ended
```javascript
socket.on('session-ended', (data) => {
  // data.message, data.leaderboard (final)
});
```

---

#### error
```javascript
socket.on('error', (data) => {
  // data.message
});
```

---

## 🔧 Optimization Features

### 1. Redis Session Storage
**vs In-Memory Map:**
- ✅ Survives server restart
- ✅ Horizontally scalable (shared state)
- ✅ TTL-based cleanup (no memory leaks)
- ✅ Pub/Sub for cross-server broadcasts

**Redis Keys:**
```
live:session:{code}          # Session metadata
live:participants:{code}     # Hash of participants
live:leaderboard:{code}      # Sorted Set (score-based)
live:answers:{code}          # List of answers
live:quiz:{code}             # Cached quiz data
```

---

### 2. Optimized Leaderboard (Sorted Sets)
**Old:** O(N log N) sort on every answer
**New:** O(log N) ZINCRBY update

```javascript
// Atomic score update
await redis.zincrby('live:leaderboard:A1B2C3', 10, 'user123');

// Get top 50: O(log N + 50)
await redis.zrevrange('live:leaderboard:A1B2C3', 0, 49, 'WITHSCORES');
```

---

### 3. Batched Broadcasts
**Problem:** 50 participants × 10 questions = 500 broadcasts
**Solution:** Queue updates, broadcast every 2 seconds

```javascript
// Mark for update (instant)
leaderboardUpdateQueue.set(sessionCode, true);

// Broadcast in batch (every 2s)
setInterval(() => {
  for (const [code, needsUpdate] of queue.entries()) {
    if (needsUpdate) broadcastLeaderboard(code);
  }
}, 2000);
```

---

### 4. Periodic Database Sync
**Strategy:** Redis (active) → MongoDB (persistence)

**Triggers:**
- Every 30 seconds (time-based)
- Every 10 answers (threshold-based)
- Session end (final sync)

**Benefits:**
- Fast Redis for real-time
- MongoDB for history/recovery
- No DB bottleneck during gameplay

---

### 5. Socket.IO Optimizations
```javascript
// Configuration
pingTimeout: 30000,        // Faster disconnect detection
pingInterval: 25000,       // Keep connections alive
compression: true,         // Reduce bandwidth
transports: ['websocket'], // Prefer WebSocket over polling
```

**Room-based broadcasts:**
```javascript
// Only to session participants (not all sockets)
io.to(sessionCode).emit('leaderboard-updated', data);
```

---

## 📊 Performance Metrics

**Expected Improvements vs Monolithic:**
- Answer processing: **10-15x faster** (Redis vs DB)
- Leaderboard updates: **O(log N) vs O(N log N)**
- Database load: **95% reduction** (periodic sync)
- Concurrent sessions: **10x more** (horizontal scaling)
- Session recovery: **100%** (Redis persistence)

**Scalability:**
- 50 participants/session (configurable)
- 100+ concurrent sessions per instance
- Horizontal scaling with Redis cluster

---

## 🧪 Testing

### Manual Testing
```bash
# Terminal 1: Start service
npm start

# Terminal 2: Connect with socket.io-client
node test-client.js
```

### Load Testing
```bash
# Simulate 50 participants
npm run load-test
```

---

## 🐛 Troubleshooting

### Session not found
```bash
# Check Redis keys
redis-cli
> KEYS live:session:*
> GET live:session:A1B2C3
```

### Leaderboard not updating
```bash
# Check sorted set
> ZRANGE live:leaderboard:A1B2C3 0 -1 WITHSCORES
```

### High memory usage
```bash
# Check Redis memory
redis-cli INFO memory

# Check for sessions without TTL
redis-cli
> TTL live:session:A1B2C3
```

### Socket disconnections
- Check `SOCKET_PING_TIMEOUT` (default: 30s)
- Verify WebSocket support (not blocked by proxy)
- Check client reconnection logic

---

## 🔗 Integration

**Client Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3004', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  socket.emit('join-session', {
    sessionCode: 'A1B2C3',
    userId: user.id,
    userName: user.name,
  });
});
```

**Quiz Service → Live Service:**
```javascript
// Create session for quiz
const response = await fetch('http://localhost:3004/api/sessions/create', {
  method: 'POST',
  body: JSON.stringify({ quizId }),
  headers: { Authorization: `Bearer ${token}` }
});
```

**Result Service Integration:**
At session end, submit batch results:
```javascript
const results = participants.map(p => ({
  userId: p.userId,
  quizId: session.quizId,
  sessionId: session._id,
  answers: p.answers,
  score: p.score
}));

await fetch('http://localhost:3003/api/results/batch-submit', {
  method: 'POST',
  body: JSON.stringify({ results })
});
```

---

## 📝 Environment Variables

See `.env.example` for all configuration options.

**Required:**
- `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_URL`

**Optional (with defaults):**
- `PORT=3004`
- `SESSION_TTL=7200` (2 hours)
- `LEADERBOARD_UPDATE_INTERVAL=2000` (2s)
- `DB_SYNC_INTERVAL=30000` (30s)
- `MAX_PARTICIPANTS=50`
- `SOCKET_PING_TIMEOUT=30000` (30s)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Port**: 3004  
**Dependencies**: Quiz Service (quiz data), Result Service (final results)
