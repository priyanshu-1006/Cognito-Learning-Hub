/**
 * Social Service - Main Server
 * Optimized with Redis pub/sub, Bull queues, and async processing
 */

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const feedManager = require("./services/feedManager");
const notificationManager = require("./services/notificationManager");
const queueManager = require("./workers/queueManager");
const socketHandlers = require("./socket/handlers");
const connectDB = require("./models");
const createLogger = require("../shared/utils/logger");

// Routes
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const followRoutes = require("./routes/follows");
const notificationRoutes = require("./routes/notifications");
const eventRoutes = require("./routes/events");
const friendRoutes = require("./routes/friends");
const challengeRoutes = require("./routes/challenges");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chat");

const logger = createLogger("social-service");

const app = express();
const server = http.createServer(app);

// Trust proxy - Required for rate limiter to work correctly
// Allows express-rate-limit to correctly identify client IPs from X-Forwarded-For
app.set("trust proxy", 1); // Trust first proxy (required in all environments)

// ============================================
// SOCKET.IO SETUP
// ============================================

const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 30000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 10000,
  transports: ["websocket", "polling"],
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input Sanitization (XSS & Injection Protection)
const { sanitizeAll } = require("../shared/middleware/inputValidation");
app.use(sanitizeAll);

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// ============================================
// ROUTES
// ============================================

app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes); // For /api/user/status and /api/user/friends-status
app.use("/api/chat", chatRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    let queueStats = { status: "not initialized" };

    // Safely get queue stats if queues are initialized
    if (queueManager.feedQueue && queueManager.notificationQueue) {
      try {
        queueStats = await queueManager.getStats();
      } catch (queueError) {
        logger.warn("Queue stats error:", queueError.message);
        queueStats = { status: "error", message: queueError.message };
      }
    }

    res.json({
      success: true,
      service: "social-service",
      status: "healthy",
      redis: feedManager.isHealthy() ? "connected" : "disconnected",
      queues: queueStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Root
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Social Service",
    version: "1.0.0",
    description: "Social features with Redis pub/sub and async processing",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ============================================
// SOCKET.IO HANDLERS
// ============================================

socketHandlers(io);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Close Socket.IO
      io.close(() => {
        logger.info("Socket.IO server closed");
      });

      // Close Redis
      await feedManager.disconnect();
      await notificationManager.disconnect();
      logger.info("Redis disconnected");

      // Close Bull queues
      await queueManager.close();
      logger.info("Bull queues closed");

      // Close MongoDB
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      logger.info("MongoDB disconnected");

      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3006;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info("MongoDB connected");

    // Try to connect to Redis (optional)
    try {
      await feedManager.connect();
      await notificationManager.connect();
      logger.info("Redis connected");
    } catch (redisError) {
      logger.warn(
        "Redis connection failed - running without cache:",
        redisError.message
      );
    }

    // Initialize Bull queues (requires Redis)
    try {
      queueManager.init();
      logger.info("Bull queues initialized");
    } catch (queueError) {
      logger.warn(
        "Queue initialization failed - async processing disabled:",
        queueError.message
      );
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`Social Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(
        `CORS Origins: ${process.env.CORS_ORIGINS || "http://localhost:5173"}`
      );
      logger.info(`Socket.IO: Active`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
