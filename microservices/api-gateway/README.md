# API Gateway

> Part of **Cognito Learning Hub** - Built for HackSprint at Axis College

Central entry point for Cognito Learning Hub microservices architecture.

## Overview

The API Gateway acts as a reverse proxy that routes client requests to appropriate microservices, handling cross-cutting concerns like:

- **Authentication & Authorization**: JWT token validation
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **CORS**: Cross-origin resource sharing
- **Request Logging**: Centralized request tracking
- **Load Balancing**: Distribute requests across service instances
- **Service Discovery**: Dynamic service routing

## Features

✅ **HTTP/REST Routing**: Routes API requests to backend services
✅ **WebSocket Proxy**: Proxies Socket.IO connections for real-time features
✅ **Security**: Helmet, CORS, rate limiting, input sanitization
✅ **Health Checks**: Monitor service availability
✅ **Centralized Logging**: Winston-based structured logging
✅ **Error Handling**: Consistent error responses across all services

## Installation

```bash
cd api-gateway
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
GATEWAY_PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
FRONTEND_URLS=http://localhost:5173
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

## Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Routing Table

| Route | Target Service | Description |
|-------|---------------|-------------|
| `/api/auth/*` | Auth Service (3001) | Authentication & user management |
| `/api/quizzes/*` | Quiz Service (3002) | Quiz CRUD & AI generation |
| `/api/results/*` | Result Service (3003) | Quiz results & leaderboards |
| `/api/live-sessions/*` | Live Service (3004) | Real-time quiz sessions |
| `/api/meetings/*` | Meeting Service (3005) | Video calls & meetings |
| `/api/friends/*` | Social Service (3006) | Friend system |
| `/api/challenges/*` | Social Service (3006) | Quiz challenges |
| `/api/notifications/*` | Social Service (3006) | Notifications |
| `/api/chat/*` | Social Service (3006) | Messaging |
| `/api/achievements/*` | Gamification (3007) | Achievements & badges |
| `/api/stats/*` | Gamification (3007) | User statistics |
| `/api/reports/*` | Moderation (3008) | Content reports |
| `/api/admin/*` | Moderation (3008) | Admin dashboard |
| `/socket.io/*` | Live Service (3004) | WebSocket connections |

## Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "API Gateway",
  "timestamp": "2025-11-28T10:00:00.000Z",
  "uptime": 123.456
}
```

## Architecture

```
┌─────────────┐
│   Clients   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────────────────────────┐
│       API Gateway (3000)         │
│  ┌─────────────────────────┐   │
│  │   CORS, Rate Limiting    │   │
│  │   JWT Validation         │   │
│  │   Request Logging        │   │
│  └─────────────────────────┘   │
└───────┬─────────────────────────┘
        │
        ├─────► Auth Service (3001)
        ├─────► Quiz Service (3002)
        ├─────► Result Service (3003)
        ├─────► Live Service (3004)
        ├─────► Meeting Service (3005)
        ├─────► Social Service (3006)
        ├─────► Gamification (3007)
        └─────► Moderation (3008)
```

## Middleware Pipeline

1. **CORS**: Allow frontend origins
2. **Helmet**: Set security headers
3. **Rate Limiting**: Prevent abuse
4. **JSON Parsing**: Parse request body
5. **Auth (optional)**: Extract JWT user info
6. **Proxy**: Forward to service
7. **Error Handler**: Catch and format errors

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detail 1", "Detail 2"],
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

## Rate Limits

- **General API**: 100 requests / 15 minutes
- **Auth endpoints**: 5 requests / 15 minutes
- **Heavy operations**: 20 requests / 15 minutes

## Monitoring

Logs are stored in `/logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

## Production Deployment

### Docker
```bash
docker build -t cognito-api-gateway .
docker run -p 3000:3000 --env-file .env cognito-api-gateway
```

### Kubernetes
```bash
kubectl apply -f k8s/api-gateway.yaml
```

## Troubleshooting

**Service unavailable (503)**
- Check if target service is running
- Verify service URLs in `.env`
- Check network connectivity

**CORS errors**
- Add frontend URL to `FRONTEND_URLS` in `.env`
- Ensure credentials are enabled on client

**Rate limit errors (429)**
- Reduce request frequency
- Contact admin to adjust limits

## Development

**Adding a new route:**

```javascript
app.use(
  '/api/new-feature',
  createProxyMiddleware({
    target: SERVICES.NEW_SERVICE,
    pathRewrite: { '^/api/new-feature': '/api/new-feature' },
  })
);
```

**Testing:**

```bash
# Health check
curl http://localhost:3000/health

# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Next Steps

- [ ] Set up API Gateway ✅
- [ ] Build Auth Service (next)
- [ ] Build Quiz Service
- [ ] Add monitoring (Prometheus)
- [ ] Add distributed tracing (Jaeger)
- [ ] Set up load balancing
