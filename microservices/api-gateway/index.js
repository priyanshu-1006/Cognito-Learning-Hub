/**
 * API Gateway
 * Central entry point for all client requests
 * Routes to appropriate microservices
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createProxyMiddleware } = require("http-proxy-middleware");
const createLogger = require("../shared/utils/logger");
const { SERVICES } = require("../shared/config/services");
const { generalLimiter } = require("../shared/middleware/rateLimiter");
const errorHandler = require("../shared/middleware/errorHandler");

const app = express();
const logger = createLogger("API-GATEWAY");
const PORT = process.env.GATEWAY_PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((url) => url.trim())
  : process.env.NODE_ENV === "production"
  ? [
      "https://www.quizwise-ai.live",
      "https://quizwise-ai.live",
      "https://cognito-learning-hub-frontend.vercel.app",
    ]
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
    ];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".onrender.com") ||
      origin.includes("localhost");

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours - cache preflight requests
};

// Middleware - CORS must be first
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all /api routes
app.options(/^\/api\/.*/, cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply general rate limiting (skip status endpoints for polling)
app.use("/api/", (req, res, next) => {
  // Skip rate limiting for job status polling endpoints
  if (req.path.includes("/status/") || req.path.endsWith("/status")) {
    return next();
  }
  return generalLimiter(req, res, next);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "API Gateway",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Cognito Learning Hub API Gateway",
    version: "1.0.0",
    status: "online",
    services: {
      auth: SERVICES.AUTH,
      quiz: SERVICES.QUIZ,
      result: SERVICES.RESULT,
      live: SERVICES.LIVE,
      meeting: SERVICES.MEETING,
      social: SERVICES.SOCIAL,
      gamification: SERVICES.GAMIFICATION,
      moderation: SERVICES.MODERATION,
    },
  });
});

// Proxy configuration options
const proxyOptions = {
  changeOrigin: true,
  logLevel: "warn",
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000,
  // Don't forward host header to avoid CORS issues
  xfwd: true,
  onProxyReq: (proxyReq, req, res) => {
    // Forward auth headers explicitly
    if (req.headers["x-auth-token"]) {
      proxyReq.setHeader("x-auth-token", req.headers["x-auth-token"]);
    }
    if (req.headers["authorization"]) {
      proxyReq.setHeader("Authorization", req.headers["authorization"]);
    }

    // Fix content-length for body-parser
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }

    // Forward user info from JWT if available
    if (req.user) {
      proxyReq.setHeader("X-User-Id", req.user.id);
      proxyReq.setHeader("X-User-Role", req.user.role);
    }
    logger.info(`→ Proxying ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to proxied responses
    const origin = req.headers.origin;
    if (origin) {
      proxyRes.headers["access-control-allow-origin"] = origin;
      proxyRes.headers["access-control-allow-credentials"] = "true";
    }
    logger.info(`← Response ${proxyRes.statusCode} from ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error("Proxy error:", err);
    if (!res.headersSent) {
      // Add CORS headers even on error
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable",
        error: err.message,
      });
    }
  },
};

// Route to Auth Service
app.use(
  "/api/auth",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.AUTH,
    pathRewrite: { "^/api/auth": "/api/auth" },
  })
);

// Route to Quiz Service
app.use(
  "/api/quizzes",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
    pathRewrite: { "^/api/quizzes": "/api/quizzes" },
  })
);

// Route to Quiz Generation endpoints (new microservice routes)
app.use(
  "/api/generate",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
    pathRewrite: { "^/api/generate": "/api/generate" },
  })
);

// Legacy routes (for backward compatibility)
app.use(
  "/api/generate-quiz-topic",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
  })
);

app.use(
  "/api/generate-quiz-file",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
  })
);

app.use(
  "/api/generate-pdf-questions",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
  })
);

app.use(
  "/api/save-manual-quiz",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
  })
);

app.use(
  "/api/adaptive-difficulty",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
  })
);

// Route to Result Service
app.use(
  "/api/results",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.RESULT,
    pathRewrite: { "^/api/results": "/api/results" },
  })
);

// Route to Analytics (Result Service)
app.use(
  "/api/analytics",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.RESULT,
    pathRewrite: { "^/api/analytics": "/api/analytics" },
  })
);

// Route to Leaderboards (Result Service)
app.use(
  "/api/leaderboards",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.RESULT,
    pathRewrite: { "^/api/leaderboards": "/api/leaderboards" },
  })
);

// Route to Live Service (REST endpoints)
app.use(
  "/api/live-sessions",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.LIVE,
    pathRewrite: { "^/api/live-sessions": "/api/sessions" },
  })
);

// Route to Meeting Service (REST endpoints)
app.use(
  "/api/meetings",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.MEETING,
    pathRewrite: { "^/api/meetings": "/api/meetings" },
  })
);

// Route to Social Service
app.use(
  "/api/friends",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.SOCIAL,
    pathRewrite: { "^/api/friends": "/api/friends" },
  })
);

app.use(
  "/api/challenges",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.SOCIAL,
    pathRewrite: { "^/api/challenges": "/api/challenges" },
  })
);

app.use(
  "/api/notifications",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.SOCIAL,
    pathRewrite: { "^/api/notifications": "/api/notifications" },
  })
);

app.use(
  "/api/chat",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.SOCIAL,
    pathRewrite: { "^/api/chat": "/api/chat" },
  })
);

app.use(
  "/api/broadcasts",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.SOCIAL,
    pathRewrite: { "^/api/broadcasts": "/api/broadcasts" },
  })
);

app.use(
  "/api/user",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.SOCIAL,
    pathRewrite: { "^/api/user": "/api/user" },
  })
);

app.use(
  "/api/users",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.SOCIAL,
    pathRewrite: { "^/api/users": "/api/users" },
  })
);

// Route to Gamification Service
app.use(
  "/api/achievements",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.GAMIFICATION,
    pathRewrite: { "^/api/achievements": "/api/achievements" },
  })
);

app.use(
  "/api/stats",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.GAMIFICATION,
    pathRewrite: { "^/api/stats": "/api/stats" },
  })
);

// Route to Moderation Service
app.use(
  "/api/reports",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.MODERATION,
    pathRewrite: { "^/api/reports": "/api/reports" },
  })
);

app.use(
  "/api/admin",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.MODERATION,
    pathRewrite: { "^/api/admin": "/api/admin" },
  })
);

app.use(
  "/api/moderator",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.MODERATION,
    pathRewrite: { "^/api/moderator": "/api/moderator" },
  })
);

// Route to AI Doubt Solver (Quiz Service)
app.use(
  "/api/doubt-solver",
  createProxyMiddleware({
    ...proxyOptions,
    target: SERVICES.QUIZ,
  })
);

// WebSocket proxy for Live Service
app.use(
  "/socket.io",
  createProxyMiddleware({
    target: SERVICES.LIVE,
    ws: true,
    changeOrigin: true,
    logLevel: "warn",
    timeout: 60000,
    proxyTimeout: 60000,
    onError: (err, req, res) => {
      logger.error("WebSocket proxy error:", err.message);
      // For WebSocket upgrades, res might be a socket, not an HTTP response
      if (res && typeof res.status === "function" && !res.headersSent) {
        res.status(503).json({
          success: false,
          message: "Live service unavailable",
          error: err.message,
        });
      } else if (res && typeof res.writeHead === "function") {
        // WebSocket handshake - send proper HTTP error
        try {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              message: "Live service unavailable",
              error: err.message,
            })
          );
        } catch (e) {
          logger.error("Failed to send WebSocket error response:", e.message);
        }
      }
    },
    onProxyReqWs: (proxyReq, req, socket) => {
      logger.info("WebSocket upgrade request to Live Service");
      socket.on("error", (err) => {
        logger.error("WebSocket socket error:", err.message);
      });
    },
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use(errorHandler("API-GATEWAY"));

// Start server
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 API Gateway running on http://0.0.0.0:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info("Service mappings:");
  Object.entries(SERVICES).forEach(([name, url]) => {
    logger.info(`  ${name}: ${url}`);
  });
});

module.exports = app;
