# Auth Service

Authentication microservice for Cognito Learning Hub. Handles user registration, login, Google OAuth, profile management, and password operations.

## 🚀 Features

- **User Registration & Login**: Email/password authentication
- **Google OAuth 2.0**: Sign in with Google
- **JWT Token Management**: Access and refresh tokens
- **Password Operations**: Change password, forgot/reset password
- **Email Verification**: Email confirmation flow
- **Profile Management**: Update user profile and settings
- **User Status**: Online/offline/away status tracking
- **Role-Based Access**: Student, Teacher, Moderator, Admin roles
- **Admin Operations**: User management, role assignment

## 📦 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5.1.0
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcryptjs, Google OAuth Library
- **Security**: Helmet, CORS, rate limiting
- **Email**: Nodemailer (for password reset)

## 🛠️ Installation

```bash
# Navigate to auth service
cd microservices/auth-service

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB, JWT, Google OAuth credentials

# Start in development mode
npm run dev

# Start in production mode
npm start
```

## 🔧 Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development
SERVICE_NAME=auth-service

# Database
MONGODB_URI=mongodb://localhost:27017/cognito_learning_hub

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Cognito Learning Hub <noreply@cognito.com>

# CORS
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login with email/password | Public |
| POST | `/google` | Login with Google OAuth | Public |
| POST | `/refresh` | Refresh access token | Public |
| POST | `/logout` | Logout user | Private |
| GET | `/me` | Get current user | Private |
| POST | `/verify-email/:token` | Verify email address | Public |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/:id` | Get user by ID | Private |
| GET | `/` | Get all users (paginated) | Moderator/Admin |
| PUT | `/profile` | Update profile | Private |
| PUT | `/password` | Change password | Private |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password/:token` | Reset password | Public |
| PUT | `/status` | Update online status | Private |
| PUT | `/:id/role` | Update user role | Admin |
| DELETE | `/:id` | Delete user | Admin |

## 🔐 Authentication Flow

### 1. Registration
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "role": "Student"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Login
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secure123"
}

Response: Same as registration
```

### 3. Google OAuth
```javascript
POST /api/auth/google
{
  "credential": "google-id-token"
}

Response: Same as registration
```

### 4. Token Refresh
```javascript
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new-access-token"
  }
}
```

### 5. Protected Requests
Include JWT in headers:
```
Authorization: Bearer eyJhbGc...
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Separate access and refresh tokens
- **Token Blacklisting**: Refresh token storage and invalidation
- **Rate Limiting**: Different limits for auth vs general endpoints
- **Input Validation**: express-validator with sanitization
- **NoSQL Injection Prevention**: Input sanitization
- **CORS Protection**: Configurable allowed origins
- **Helmet Security**: HTTP headers protection

## 📊 User Roles & Permissions

- **Student**: Default role, basic access
- **Teacher**: Can create quizzes and content
- **Moderator**: Can manage users and moderate content
- **Admin**: Full system access

## 🧪 Testing

```bash
# Run tests
npm test

# Health check
curl http://localhost:3001/health
```

## 🏗️ Architecture

```
auth-service/
├── index.js              # Main server file
├── package.json          # Dependencies
├── .env.example          # Environment template
├── models/
│   ├── User.js          # User model with auth fields
│   └── index.js         # Database initialization
└── routes/
    ├── auth.js          # Auth endpoints
    └── user.js          # User management endpoints
```

## 🔗 Integration with Other Services

### Service-to-Service Authentication
Other services can validate JWT tokens using the shared auth middleware:

```javascript
const { authenticateToken } = require('../shared/middleware/auth');

router.get('/protected', authenticateToken, (req, res) => {
  // req.user contains { userId, role }
  console.log(req.user.userId);
});
```

### User Information Forwarding
API Gateway forwards authenticated user info in headers:
```
x-user-id: user-id
x-user-role: Student
```

## 📈 Performance

- **MongoDB Indexes**: Optimized for email, googleId, role lookups
- **Token Caching**: Redis integration ready
- **Rate Limiting**: Prevents abuse and DDoS
- **Async Operations**: Non-blocking I/O

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/cognito_learning_hub
```

### Google OAuth Not Working
- Verify `GOOGLE_CLIENT_ID` matches your Google Console app
- Ensure redirect URIs are configured in Google Console
- Check credential format (should be Google ID token)

### JWT Token Errors
- Verify `JWT_SECRET` is set and matches across services
- Check token expiry settings
- Ensure Authorization header format: `Bearer <token>`

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure production MongoDB URI (Atlas recommended)
- [ ] Set up email service (SMTP or SendGrid)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure Redis for token blacklisting
- [ ] Set up monitoring and logging

### Docker Support
```bash
# Build image
docker build -t auth-service .

# Run container
docker run -p 3001:3001 --env-file .env auth-service
```

## 📝 Logging

Logs are stored in `logs/` directory:
- `auth-service.log`: All logs
- `auth-service-error.log`: Error logs only

## 🔄 Migration from Monolith

This service replaces the authentication logic from the monolithic backend:
- `/api/register` → `/api/auth/register`
- `/api/login` → `/api/auth/login`
- `/api/google-auth` → `/api/auth/google`
- All user profile endpoints remain the same

## 🤝 Contributing

When adding new auth features:
1. Add validation rules in shared middleware
2. Update User model if needed
3. Create new route handlers
4. Add tests
5. Update this README

## 📄 License

MIT License - See main project LICENSE file
