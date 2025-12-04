/**
 * Live Service - Main Server
 * Port: 3004
 * Features: Real-time multiplayer with Redis sessions, optimized leaderboards, Socket.IO
 */

require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const createLogger = require("../shared/utils/logger");
const ApiResponse = require("../shared/utils/response");
const { connectDB } = require("./models");
const sessionManager = require("./services/sessionManager");
const {
  initializeSocketHandlers,
  syncSessionToDatabase,
} = require("./socket/handlers");
const { initializeDuelHandlers } = require("./socket/duelHandlers");

const app = express();
const httpServer = createServer(app);
const logger = createLogger("live-service");
const PORT = process.env.PORT || 3004;

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Configure properly in production
    methods: ["GET", "POST"],
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 30000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
  maxHttpBufferSize:
    parseInt(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE) || 1000000,
  transports: ["websocket", "polling"],
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Input Sanitization (XSS & Injection Protection)
const { sanitizeAll } = require("../shared/middleware/inputValidation");
app.use(sanitizeAll);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/sessions", require("./routes/sessions"));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "live-service",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/health",
      sessions: "/api/sessions/*",
      socketStatus: "/api/socket/status",
    },
  });
});

// Health check
app.get("/health", async (req, res) => {
  try {
    const mongoose = require("mongoose");

    const health = {
      status: "healthy",
      service: "live-service",
      timestamp: new Date().toISOString(),
      checks: {
        database:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        redis: sessionManager.isHealthy() ? "connected" : "disconnected",
        socketio: io.engine.clientsCount,
      },
    };

    res.json(health);
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Socket.IO status endpoint
app.get("/api/socket/status", (req, res) => {
  res.json({
    connected: io.engine.clientsCount,
    rooms: io.sockets.adapter.rooms.size,
  });
});

// 404 handler
app.use((req, res) => {
  return ApiResponse.notFound(res, "Route not found");
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  return ApiResponse.error(
    res,
    err.message || "Internal server error",
    err.status || 500
  );
});

// Initialize Socket.IO handlers
initializeSocketHandlers(io);
initializeDuelHandlers(io);

// Periodic database sync (for active sessions)
const dbSyncInterval = parseInt(process.env.DB_SYNC_INTERVAL) || 30000;
setInterval(async () => {
  try {
    // Get all active sessions from Redis and sync to MongoDB
    const LiveSession = require("./models/LiveSession");
    const activeSessions = await LiveSession.find({
      status: { $in: ["waiting", "active"] },
    })
      .select("sessionCode")
      .lean();

    for (const session of activeSessions) {
      // Check if still in Redis
      const redisSession = await sessionManager.getSession(session.sessionCode);
      if (redisSession) {
        await syncSessionToDatabase(session.sessionCode);
      }
    }

    logger.debug(`Synced ${activeSessions.length} active sessions to database`);
  } catch (error) {
    logger.error("Error in periodic database sync:", error);
  }
}, dbSyncInterval);

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    // Close Socket.IO server
    io.close(() => {
      logger.info("Socket.IO server closed");
    });

    // Close HTTP server
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
      logger.info("HTTP server closed");
    }

    // Close database connection
    const mongoose = require("mongoose");
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");

    // Close Redis connection
    await sessionManager.disconnect();
    logger.info("Redis connection closed");

    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await sessionManager.connect();

    httpServer.listen(PORT, () => {
      const serviceUrl =
        process.env.NODE_ENV === "production"
          ? process.env.LIVE_SERVICE_URL || `https://live-service.onrender.com`
          : `http://localhost:${PORT}`;

      logger.info(`Live Service running on port ${PORT}`);
      logger.info(`Health check: ${serviceUrl}/health`);
      logger.info(`Socket.IO ready for connections`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io };
