# Moderation Service - Complete Setup & Integration Guide

## 🎯 Service Overview

**Port:** 3008  
**Database:** MongoDB (cognito_moderation)  
**Role:** Content moderation, user reports, admin actions, appeals

## 📋 Features Implemented

### 1. Report System
- ✅ User-submitted reports for inappropriate content
- ✅ Auto-prioritization (high for hate speech/violence/harassment)
- ✅ Multiple content types (post, comment, user, quiz, message)
- ✅ Evidence attachment support
- ✅ Status workflow: pending → reviewing → resolved/dismissed
- ✅ Bulk operations for moderators
- ✅ Report statistics and analytics

### 2. Moderation Actions
- ✅ Multiple action types: warning, mute, suspend, ban, content_removal
- ✅ Duration-based actions (hours, days, weeks, months, permanent)
- ✅ Auto-expiration for temporary actions
- ✅ Severity levels (minor, moderate, severe, critical)
- ✅ Action revocation with audit trail
- ✅ Ban status checking
- ✅ Integration with User Service via webhooks

### 3. Appeal System
- ✅ Users can appeal moderation actions
- ✅ Moderator review workflow
- ✅ Status tracking (pending → under review → approved/rejected)
- ✅ Automatic action revocation on approval

### 4. Security & Access Control
- ✅ JWT-based authentication
- ✅ Role-based authorization (User, Moderator, Admin)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation with Joi
- ✅ Comprehensive logging with Winston

## 🚀 Setup Instructions

### Step 1: Environment Configuration

Create `.env` file in `microservices/moderation-service/`:

```env
PORT=3008
MONGODB_URI=mongodb://localhost:27017/cognito_moderation
NODE_ENV=development

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
SOCIAL_SERVICE_URL=http://localhost:3006

# JWT Secret (must match auth-service)
JWT_SECRET=your_jwt_secret_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 2: Install Dependencies

```bash
cd microservices/moderation-service
npm install
```

**Dependencies installed:**
- express (4.18.2) - Web framework
- mongoose (7.0.0) - MongoDB ODM
- jsonwebtoken (9.0.0) - JWT authentication
- joi (17.9.2) - Input validation
- winston (3.8.2) - Logging
- axios (1.6.0) - HTTP client
- express-rate-limit (6.7.0) - Rate limiting
- cors (2.8.5) - CORS middleware
- dotenv (16.0.3) - Environment variables

### Step 3: Start the Service

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Expected output:
```
🛡️  Moderation Service running on port 3008
MongoDB connected successfully
```

### Step 4: Verify Service Health

```bash
curl http://localhost:3008/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "moderation-service",
  "timestamp": "2025-11-28T...",
  "mongodb": "connected"
}
```

## 🔗 Integration Points

### 1. User Service Integration

**Moderation Service → User Service**

When moderation actions are applied, the service notifies User Service:

```javascript
// In routes/actions.js (line 68-76)
POST ${USER_SERVICE_URL}/api/internal/moderation-action
Body: {
  userId: targetUserId,
  actionType: "ban" | "suspend" | "warning",
  expiresAt: Date,
  moderationActionId: ObjectId
}
```

**User Service needs to implement:**
```javascript
// user-service/routes/internal.js
router.post('/internal/moderation-action', async (req, res) => {
  const { userId, actionType, expiresAt, moderationActionId } = req.body;
  
  // Update user's account restrictions
  await User.findByIdAndUpdate(userId, {
    'moderation.isRestricted': true,
    'moderation.restrictionType': actionType,
    'moderation.expiresAt': expiresAt,
    'moderation.actionId': moderationActionId
  });
  
  res.json({ success: true });
});
```

### 2. Social Service Integration

Reports can be created for social posts and comments:

```javascript
// When reporting a post
POST /api/reports
{
  "reportedContentId": "post_id_from_social_service",
  "contentType": "post",
  "reason": "harassment",
  "description": "..."
}
```

**Social Service should check moderation status:**
```javascript
// Before allowing post creation/comment
const banCheck = await axios.get(
  `http://localhost:3008/api/actions/check/banned/${userId}`
);

if (banCheck.data.isBanned) {
  return res.status(403).json({ 
    error: 'Your account is restricted',
    reason: banCheck.data.reason,
    expiresAt: banCheck.data.expiresAt
  });
}
```

### 3. Auth Service Integration

Moderation Service uses Auth Service JWT tokens for authentication:

```javascript
// All protected routes require JWT token
Authorization: Bearer <token_from_auth_service>

// JWT payload must include:
{
  userId: "user_id",
  role: "user" | "moderator" | "admin"
}
```

## 📚 API Usage Examples

### Example 1: User Reports Inappropriate Post

```bash
# User reports a post
curl -X POST http://localhost:3008/api/reports \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedContentId": "post_12345",
    "contentType": "post",
    "reason": "harassment",
    "description": "This post contains offensive language targeting other users",
    "evidence": [
      {
        "type": "screenshot",
        "data": "https://example.com/screenshot.png"
      }
    ]
  }'
```

Response:
```json
{
  "message": "Report submitted successfully",
  "reportId": "673f1234567890abcdef",
  "status": "pending"
}
```

### Example 2: Moderator Reviews Reports

```bash
# Get all pending reports
curl http://localhost:3008/api/reports?status=pending&priority=high \
  -H "Authorization: Bearer MODERATOR_JWT_TOKEN"
```

Response:
```json
{
  "reports": [
    {
      "_id": "673f1234567890abcdef",
      "reporterId": "user_123",
      "reportedContentId": "post_12345",
      "contentType": "post",
      "reason": "harassment",
      "description": "...",
      "status": "pending",
      "priority": "high",
      "createdAt": "2025-11-28T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

### Example 3: Moderator Takes Action

```bash
# Apply 7-day suspension
curl -X POST http://localhost:3008/api/actions \
  -H "Authorization: Bearer MODERATOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "user_456",
    "actionType": "suspend",
    "reason": "Repeated harassment violations",
    "duration": {
      "value": 7,
      "unit": "days"
    },
    "severity": "severe",
    "relatedReportId": "673f1234567890abcdef",
    "notes": "Third violation this month. Previous warnings issued on 11/10 and 11/20."
  }'
```

### Example 4: User Submits Appeal

```bash
curl -X POST http://localhost:3008/api/appeals \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "action_id_from_notification",
    "reason": "I believe this action was taken in error. The reported content was taken out of context and was meant as constructive criticism, not harassment."
  }'
```

### Example 5: Check Ban Status

```bash
# Check if user is banned
curl http://localhost:3008/api/actions/check/banned/user_456 \
  -H "Authorization: Bearer ANY_JWT_TOKEN"
```

Response:
```json
{
  "isBanned": true,
  "banType": "temporary",
  "reason": "Repeated harassment violations",
  "expiresAt": "2025-12-05T10:30:00Z",
  "appealStatus": "pending"
}
```

## 🔄 Automated Tasks

### Expire Temporary Actions (Cron Job)

Set up a cron job to automatically expire temporary bans/suspensions:

```bash
# Add to crontab (run every hour)
0 * * * * curl -X POST http://localhost:3008/api/actions/expire/check

# Or use node-cron in your service
const cron = require('node-cron');

cron.schedule('0 * * * *', async () => {
  await axios.post('http://localhost:3008/api/actions/expire/check');
});
```

## 📊 Monitoring & Analytics

### Get Report Statistics

```bash
curl http://localhost:3008/api/reports/stats \
  -H "Authorization: Bearer MODERATOR_JWT_TOKEN"
```

Response:
```json
{
  "byStatus": [
    { "_id": "pending", "count": 23 },
    { "_id": "resolved", "count": 156 },
    { "_id": "dismissed", "count": 12 }
  ],
  "byPriority": [
    { "_id": "high", "count": 8 },
    { "_id": "medium", "count": 12 },
    { "_id": "low", "count": 3 }
  ],
  "topReasons": [
    { "_id": "spam", "count": 45 },
    { "_id": "harassment", "count": 32 },
    { "_id": "inappropriate_content", "count": 28 }
  ]
}
```

## 🧪 Testing Scenarios

### Scenario 1: Complete Moderation Flow

1. **User A reports User B's post**
   ```bash
   POST /api/reports (as User A)
   ```

2. **Moderator reviews report**
   ```bash
   GET /api/reports?status=pending (as Moderator)
   GET /api/reports/:reportId (as Moderator)
   ```

3. **Moderator takes action**
   ```bash
   POST /api/actions (as Moderator)
   PATCH /api/reports/:reportId/status (mark as resolved)
   ```

4. **User B checks why they're suspended**
   ```bash
   GET /api/actions/check/banned/:userId (as User B)
   ```

5. **User B submits appeal**
   ```bash
   POST /api/appeals (as User B)
   ```

6. **Moderator reviews appeal**
   ```bash
   GET /api/appeals (as Moderator)
   PATCH /api/appeals/:appealId/review (approve/reject)
   ```

### Scenario 2: Bulk Report Handling

```bash
# Moderator dismisses multiple spam reports at once
curl -X PATCH http://localhost:3008/api/reports/bulk/update \
  -H "Authorization: Bearer MODERATOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportIds": ["id1", "id2", "id3"],
    "status": "dismissed",
    "action": "none"
  }'
```

## 🔐 Role-Based Access Control

| Endpoint | User | Moderator | Admin |
|----------|------|-----------|-------|
| POST /api/reports | ✅ | ✅ | ✅ |
| GET /api/reports | ❌ | ✅ | ✅ |
| PATCH /api/reports/:id/status | ❌ | ✅ | ✅ |
| POST /api/actions | ❌ | ✅ | ✅ |
| GET /api/actions | ❌ | ✅ | ✅ |
| PATCH /api/actions/:id/revoke | ❌ | ✅ | ✅ |
| GET /api/actions/banned/users | ❌ | ❌ | ✅ |
| POST /api/appeals | ✅ | ✅ | ✅ |
| GET /api/appeals | ❌ | ✅ | ✅ |
| PATCH /api/appeals/:id/review | ❌ | ✅ | ✅ |

## 🚨 Common Issues & Solutions

### Issue 1: JWT Token Invalid

**Error:** `Invalid authentication token`

**Solution:** Ensure JWT_SECRET matches auth-service and token is valid:
```bash
# Check token expiration
jwt decode <token>

# Verify JWT_SECRET in .env matches auth-service
```

### Issue 2: MongoDB Connection Failed

**Error:** `MongoDB connection error`

**Solution:**
```bash
# Ensure MongoDB is running
mongosh

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/cognito_moderation
```

### Issue 3: User Service Notification Fails

**Error:** `Failed to notify user service`

**Solution:** 
- Check USER_SERVICE_URL in .env
- Ensure User Service is running on port 3002
- Implement `/api/internal/moderation-action` endpoint in User Service

## 📈 Performance Considerations

1. **Indexing:** Reports and actions are indexed on frequently queried fields:
   - `reporterId`, `status`, `priority`, `createdAt`
   - `targetUserId`, `isActive`, `expiresAt`

2. **Rate Limiting:** 100 requests per 15 minutes per IP

3. **Pagination:** All list endpoints support pagination (default 20 items)

4. **Caching:** Consider adding Redis caching for:
   - Ban status checks (frequently accessed)
   - Report statistics

## 🔮 Next Steps

1. **Frontend Integration:**
   - Create report submission form in Social Service UI
   - Add moderator dashboard for report review
   - Build appeal submission interface

2. **Automated Moderation:**
   - Integrate AI content moderation (OpenAI Moderation API)
   - Auto-flag high-severity content
   - Pattern detection for repeat offenders

3. **Notifications:**
   - Email users when action is taken
   - Notify when appeals are reviewed
   - Alert moderators for high-priority reports

4. **Analytics Dashboard:**
   - Visualize report trends
   - Track moderator performance
   - Monitor resolution times

## ✅ Service Complete!

The Moderation Service is now fully functional and ready to integrate with your platform! All endpoints are tested and documented.

**Files Created:**
- ✅ index.js (main server)
- ✅ package.json (dependencies)
- ✅ .env.example (configuration template)
- ✅ models/ (Report, ModerationAction, BannedUser, Appeal)
- ✅ routes/ (reports, actions, appeals)
- ✅ middleware/ (auth, moderator, admin)
- ✅ utils/ (logger)
- ✅ README.md (documentation)

**Total Routes:** 20+ endpoints  
**Database Models:** 4 models  
**Middleware:** 3 role-based guards  
**Integration Points:** User Service, Social Service, Auth Service
