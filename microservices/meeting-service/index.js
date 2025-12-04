/**
 * Meeting Service - Main Server
 * Handles WebRTC signaling for peer-to-peer video meetings
 * NOTE: Media streams go directly between peers (not through backend)
 */

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const meetingManager = require("./services/meetingManager");
const signalingHandlers = require("./socket/signalingHandlers");
const meetingRoutes = require("./routes/meetings");
const connectDB = require("./models");
const createLogger = require("../shared/utils/logger");

const logger = createLogger("meeting-service");

const app = express();
const server = http.createServer(app);

// Trust proxy (required for rate limiting behind any proxy/load balancer)
// Enable for both development and production since API gateway forwards requests
app.set("trust proxy", 1);

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
  pingInterval: 10000,
  transports: ["websocket", "polling"],
  allowEIO3: true,
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});

app.use("/api/meetings", limiter);

// ============================================
// ROUTES
// ============================================

app.use("/api/meetings", meetingRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "meeting-service",
    status: "healthy",
    redis: meetingManager.isHealthy() ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Root
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Meeting Service",
    version: "1.0.0",
    description: "WebRTC signaling server for peer-to-peer video meetings",
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

signalingHandlers(io);

// Socket.IO connection logging
io.on("connection", (socket) => {
  logger.debug(`Socket.IO connection established: ${socket.id}`);
});

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

      // Disconnect Redis
      await meetingManager.disconnect();
      logger.info("Redis disconnected");

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

const PORT = process.env.PORT || 3005;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info("MongoDB connected");

    // Connect to Redis
    await meetingManager.connect();
    logger.info("Redis connected");

    // Start server
    server.listen(PORT, () => {
      logger.info(`Meeting Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(
        `CORS Origins: ${process.env.CORS_ORIGINS || "http://localhost:5173"}`
      );
      logger.info(`WebRTC Signaling: Active`);
      logger.info(
        `STUN Servers: ${process.env.STUN_SERVERS || "Not configured"}`
      );

      if (process.env.TURN_SERVER) {
        logger.info(`TURN Server: Configured`);
      } else {
        logger.warn(
          `TURN Server: Not configured (may cause connectivity issues behind strict NATs)`
        );
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
