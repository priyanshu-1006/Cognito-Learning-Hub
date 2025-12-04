/**
 * Result Service - Main Server
 * Port: 3003
 * Features: Result processing, leaderboards, analytics with Redis caching
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const createLogger = require("../shared/utils/logger");
const ApiResponse = require("../shared/utils/response");
const { connectDB } = require("./models");
const cacheManager = require("./services/cacheManager");

const app = express();
const logger = createLogger("result-service");
const PORT = process.env.PORT || 3003;

// Trust proxy - Required for rate limiter to work correctly
// Allows express-rate-limit to correctly identify client IPs from X-Forwarded-For
app.set("trust proxy", 1); // Trust first proxy (required in all environments)

// Rate limiting - Only count failed requests (4xx, 5xx)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300, // Increased from 100
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests (4xx, 5xx)
  skip: (req) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Input Sanitization (XSS & Injection Protection)
const { sanitizeAll } = require("../shared/middleware/inputValidation");
app.use(sanitizeAll);

app.use("/api/", limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/results", require("./routes/submission"));
app.use("/api/leaderboards", require("./routes/leaderboards"));
app.use("/api/analytics", require("./routes/analytics"));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "result-service",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/health",
      results: "/api/results/*",
      leaderboards: "/api/leaderboards/*",
      analytics: "/api/analytics/*",
    },
  });
});

// Health check
app.get("/health", async (req, res) => {
  try {
    const mongoose = require("mongoose");

    const health = {
      status: "healthy",
      service: "result-service",
      timestamp: new Date().toISOString(),
      checks: {
        database:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        redis: cacheManager.isHealthy() ? "connected" : "disconnected",
      },
    };

    // Get cache stats
    const cacheStats = await cacheManager.getCacheStats();
    if (cacheStats) {
      health.cache = cacheStats;
    }

    res.json(health);
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Cache management endpoint (admin only)
app.post("/api/admin/cache/clear", async (req, res) => {
  try {
    // TODO: Add admin authentication
    await cacheManager.redis.flushdb();
    logger.info("Cache cleared by admin");
    return ApiResponse.success(
      res,
      { cleared: true },
      "Cache cleared successfully"
    );
  } catch (error) {
    logger.error("Clear cache error:", error);
    return ApiResponse.error(res, "Failed to clear cache", 500);
  }
});

// 404 Handler
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

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info("HTTP server closed");
    }

    const mongoose = require("mongoose");
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");

    await cacheManager.disconnect();
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
let server;
const startServer = async () => {
  try {
    await connectDB();
    await cacheManager.connect();

    server = app.listen(PORT, () => {
      const serviceUrl =
        process.env.NODE_ENV === "production"
          ? process.env.RESULT_SERVICE_URL ||
            `https://result-service.onrender.com`
          : `http://localhost:${PORT}`;

      logger.info(`Result Service running on port ${PORT}`);
      logger.info(`Health check: ${serviceUrl}/health`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
