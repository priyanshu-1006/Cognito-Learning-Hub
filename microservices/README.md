# Cognito Learning Hub - Microservices Architecture

> 🏆 **Built for HackSprint Hackathon at Axis College by Team OPTIMISTIC MUTANT CODERS**

This directory contains the microservices implementation of Cognito Learning Hub - an AI-powered educational quiz platform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Port 3000)                  │
│          Central routing, auth, rate limiting, CORS          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌──────▼──────┐
│  Auth Service │    │  Quiz Service    │   │Result Service│
│   Port 3001   │    │   Port 3002      │   │  Port 3003   │
└───────────────┘    └──────────────────┘   └──────────────┘
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌──────▼──────┐
│ Live Service  │    │Meeting Service   │   │Social Service│
│   Port 3004   │    │   Port 3005      │   │  Port 3006   │
└───────────────┘    └──────────────────┘   └──────────────┘
        │                     │
┌───────▼───────┐    ┌────────▼────────┐
│Gamification   │    │  Moderation      │
│   Port 3007   │    │   Port 3008      │
└───────────────┘    └──────────────────┘
```

## Services

### 1. **API Gateway** (Port 3000)
- Entry point for all client requests
- Routes to appropriate microservices
- Handles authentication, rate limiting, CORS
- WebSocket proxy for real-time features

### 2. **Auth Service** (Port 3001)
- User registration and login
- JWT token generation and validation
- Google OAuth integration
- Role management

### 3. **Quiz Service** (Port 3002)
- Quiz CRUD operations
- AI quiz generation (Gemini)
- File upload and parsing
- Adaptive difficulty calculation

### 4. **Result Service** (Port 3003)
- Store quiz results and scores
- Generate leaderboards
- Analytics and statistics
- Performance tracking

### 5. **Live Service** (Port 3004)
- Real-time multiplayer quizzes (Socket.IO)
- 1v1 duel matchmaking
- Live scoring and leaderboards
- Session management

### 6. **Meeting Service** (Port 3005)
- WebRTC signaling server
- Video call management
- Screen sharing coordination
- Host controls

### 7. **Social Service** (Port 3006)
- Friend system
- Quiz challenges
- Direct messaging
- Notifications
- User status tracking

### 8. **Gamification Service** (Port 3007)
- Achievements and badges
- XP and leveling system
- Streaks and rewards
- User statistics

### 9. **Moderation Service** (Port 3008)
- Content reporting
- Admin dashboard
- Moderator tools
- Audit logs

## Shared Libraries

Located in `/shared/`:

### Utilities (`/shared/utils/`)
- `logger.js` - Winston logging
- `database.js` - MongoDB connection
- `redis.js` - Redis caching
- `response.js` - Standardized API responses
- `eventBus.js` - Event-driven communication

### Middleware (`/shared/middleware/`)
- `auth.js` - JWT authentication
- `roles.js` - Role-based access control
- `errorHandler.js` - Centralized error handling
- `rateLimiter.js` - Rate limiting configs
- `validation.js` - Input validation

### Configuration (`/shared/config/`)
- `constants.js` - Shared constants
- `services.js` - Service discovery

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB
- Redis (optional for caching)

### Installation

1. **Install API Gateway dependencies:**
```bash
cd api-gateway
npm install
```

2. **Install Shared libraries dependencies:**
```bash
cd ../shared
npm install
```

3. **Configure environment variables:**
```bash
# Copy example env files
cp api-gateway/.env.example api-gateway/.env

# Edit .env files with your configuration
```

### Running Locally

**Option 1: Run API Gateway only (services coming next)**
```bash
cd api-gateway
npm run dev
```

**Option 2: Using Docker Compose (after all services are built)**
```bash
docker-compose up
```

## Environment Variables

Each service requires these common variables:

```env
NODE_ENV=development
JWT_SECRET=your-secret-key
MONGO_URI=mongodb://localhost:27017/cognito_servicename
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

API Gateway specific:
```env
GATEWAY_PORT=3000
FRONTEND_URLS=http://localhost:5173,http://localhost:3000
```

## Communication Patterns

### Synchronous (HTTP/REST)
- Client → API Gateway → Service
- Service → Service (for immediate responses)

### Asynchronous (Events)
- Event Bus for decoupled operations
- Future: RabbitMQ/Kafka integration

### Real-Time (WebSocket)
- Socket.IO for live features
- Proxied through API Gateway

## Development Workflow

1. **Start with API Gateway**: Already created ✅
2. **Build Auth Service**: Next step
3. **Build other services**: Incrementally
4. **Test inter-service communication**
5. **Deploy to production**

## Next Steps

- [ ] Build Auth Service (Port 3001)
- [ ] Build Quiz Service (Port 3002)
- [ ] Build Result Service (Port 3003)
- [ ] Build Live Service (Port 3004)
- [ ] Build Meeting Service (Port 3005)
- [ ] Build Social Service (Port 3006)
- [ ] Build Gamification Service (Port 3007)
- [ ] Build Moderation Service (Port 3008)
- [ ] Set up Docker Compose
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Add distributed tracing (Jaeger)

## Migration from Monolith

The original monolithic backend is preserved in `/backend/` for reference. Services are being extracted incrementally with full feature parity.

## Documentation

- API Documentation: See each service's README
- Architecture Decisions: `/docs/architecture.md` (coming soon)
- Deployment Guide: `/docs/deployment.md` (coming soon)

## Support

For questions or issues, contact Team OPTIMISTIC MUTANT CODERS.

---

**Made with ❤️ for HackSprint at Axis College**
