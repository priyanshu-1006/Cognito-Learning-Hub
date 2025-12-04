# Moderation Service

Port: **3008**

## Overview
The Moderation Service handles content moderation, user reports, moderation actions (warnings, suspensions, bans), and appeal management for the Cognito Learning Hub platform.

## Features

### 📋 Report Management
- User-submitted reports for inappropriate content
- Auto-prioritization based on violation type
- Filtering and pagination
- Report statistics and analytics
- Bulk operations

### ⚖️ Moderation Actions
- Warning system
- Temporary/permanent bans
- Content removal tracking
- User suspension
- Action history and audit trail
- Automatic expiration of temporary actions

### 🎯 Appeal System
- Users can appeal moderation actions
- Moderator review workflow
- Appeal status tracking
- Automatic action revocation on approval

### 🔐 Role-Based Access
- **Users**: Submit reports, view own reports, submit appeals
- **Moderators**: Review reports, take moderation actions, review appeals
- **Admins**: Full access including banned user management

## Database Models

### Report
- Reporter and reported user/content tracking
- Violation categories (spam, harassment, hate speech, etc.)
- Priority levels (low, medium, high, critical)
- Status workflow (pending → reviewing → resolved/dismissed)
- Evidence attachment support

### ModerationAction
- Action types (warning, mute, suspend, ban, etc.)
- Duration-based actions with auto-expiration
- Severity levels
- Related report linking
- Revocation tracking

### BannedUser
- Permanent and temporary bans
- Violation history
- Appeal status tracking
- Ban expiration management

### Appeal
- User appeal submissions
- Moderator review workflow
- Status tracking (pending, under review, approved, rejected)

## API Endpoints

### Reports
```
POST   /api/reports                    - Create report (authenticated)
GET    /api/reports                    - Get all reports (moderators)
GET    /api/reports/stats              - Get report statistics (moderators)
GET    /api/reports/:reportId          - Get report details (moderators)
PATCH  /api/reports/:reportId/status   - Update report status (moderators)
PATCH  /api/reports/bulk/update        - Bulk update reports (moderators)
GET    /api/reports/user/my-reports    - Get user's own reports
```

### Moderation Actions
```
POST   /api/actions                    - Create moderation action (moderators)
GET    /api/actions                    - Get all actions (moderators)
GET    /api/actions/user/:userId       - Get user's moderation history (moderators)
PATCH  /api/actions/:actionId/revoke   - Revoke action (moderators)
GET    /api/actions/check/banned/:userId - Check if user is banned
GET    /api/actions/banned/users       - Get all banned users (admins)
POST   /api/actions/expire/check       - Expire old actions (cron job)
```

### Appeals
```
POST   /api/appeals                    - Submit appeal (authenticated)
GET    /api/appeals                    - Get all appeals (moderators)
GET    /api/appeals/my-appeals         - Get user's own appeals
PATCH  /api/appeals/:appealId/review   - Review appeal (moderators)
```

### System
```
GET    /health                         - Health check
GET    /info                           - Service information
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd microservices/moderation-service
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:
```env
PORT=3008
MONGODB_URI=mongodb://localhost:27017/cognito_moderation
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
SOCIAL_SERVICE_URL=http://localhost:3006
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Start Service
```bash
# Development
npm run dev

# Production
npm start
```

## Integration with Other Services

### User Service
- Notifies User Service when moderation actions are applied
- Checks user ban status before allowing actions
- Syncs account restrictions

### Social Service
- Reports on posts and comments
- Content removal enforcement
- User interaction restrictions

### Auth Service
- JWT token validation
- Role-based access control

## Usage Examples

### Submit a Report
```javascript
POST /api/reports
Authorization: Bearer <token>
{
  "reportedUserId": "user123",
  "reportedContentId": "post456",
  "contentType": "post",
  "reason": "harassment",
  "description": "User is posting offensive content",
  "evidence": [
    {
      "type": "screenshot",
      "data": "screenshot_url"
    }
  ]
}
```

### Apply Moderation Action
```javascript
POST /api/actions
Authorization: Bearer <moderator_token>
{
  "targetUserId": "user123",
  "actionType": "suspend",
  "reason": "Repeated harassment violations",
  "duration": {
    "value": 7,
    "unit": "days"
  },
  "severity": "severe",
  "relatedReportId": "report_id"
}
```

### Submit an Appeal
```javascript
POST /api/appeals
Authorization: Bearer <token>
{
  "actionId": "action_id",
  "reason": "I believe this action was taken in error because..."
}
```

## Monitoring & Maintenance

### Report Statistics
Monitor report trends to identify platform issues:
```bash
GET /api/reports/stats
```

### Expired Action Cleanup
Set up a cron job to automatically expire temporary actions:
```bash
# Run every hour
0 * * * * curl -X POST http://localhost:3008/api/actions/expire/check
```

### Health Check
```bash
curl http://localhost:3008/health
```

## Security Features

- Rate limiting on all API endpoints
- JWT-based authentication
- Role-based authorization
- Input validation with Joi
- Audit logging for all moderation actions
- Evidence attachment for reports

## Best Practices

1. **Report Handling**: Review high-priority reports first
2. **Action Documentation**: Always include detailed notes for moderation actions
3. **Appeal Review**: Review appeals within 48 hours
4. **Ban Management**: Use temporary bans before permanent bans
5. **Evidence**: Encourage users to provide evidence with reports

## Future Enhancements

- [ ] Automated content moderation with AI
- [ ] User reputation system
- [ ] Warning point system
- [ ] Email notifications for moderation actions
- [ ] Dashboard for moderation metrics
- [ ] Appeal deadline tracking
- [ ] Community moderation (voting system)

## Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT authentication (via middleware)
- joi: Input validation
- winston: Logging
- axios: HTTP client
- express-rate-limit: Rate limiting
- cors: CORS middleware

## License
Part of Cognito Learning Hub Platform
