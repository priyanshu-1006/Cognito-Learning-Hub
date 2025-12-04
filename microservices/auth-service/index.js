/**
 * Authentication Service - Main Entry Point
 * Handles user authentication, registration, and profile management
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Shared utilities
const createLogger = require("../shared/utils/logger");
const ApiResponse = require("../shared/utils/response");
const { errorHandler } = require("../shared/middleware/errorHandler");
const { generalLimiter } = require("../shared/middleware/rateLimiter");

// Service-specific imports
const database = require("./models");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

// Initialize
const app = express();
const logger = createLogger("auth-service");
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for rate limiter to work correctly
// Allows express-rate-limit to correctly identify client IPs from X-Forwarded-For
app.set("trust proxy", 1); // Trust first proxy (required in all environments)

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In production, allow API Gateway and other microservices
      if (process.env.NODE_ENV === "production") {
        const isAllowedMicroservice =
          origin.includes(".onrender.com") ||
          origin.includes(".vercel.app") ||
          allowedOrigins.includes(origin);

        if (isAllowedMicroservice) {
          return callback(null, true);
        }
      }

      // Development mode - check allowed origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Security & Middleware
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

// Input Sanitization (XSS & Injection Protection)
const { sanitizeAll } = require("../shared/middleware/inputValidation");
app.use(sanitizeAll);

app.use(generalLimiter);

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();

    return ApiResponse.success(
      res,
      {
        service: "auth-service",
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealth ? "connected" : "disconnected",
        memory: process.memoryUsage(),
      },
      "Auth service is healthy"
    );
  } catch (error) {
    logger.error("Health check failed:", error);
    return ApiResponse.error(res, "Service unhealthy", 503, {
      database: "disconnected",
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  return ApiResponse.success(
    res,
    {
      service: "auth-service",
      version: "1.0.0",
      status: "online",
      endpoints: {
        health: "/health",
        auth: "/api/auth/*",
        users: "/api/users/*",
      },
    },
    "Auth Service API"
  );
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 404 Handler - catch all unmatched routes
app.use((req, res, next) => {
  return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
});

// Error Handler
app.use((err, req, res, next) => {
  // Check if response already sent or connection closed
  if (res.headersSent || !res.writable) {
    logger.warn("Response already sent or connection closed");
    return next(err);
  }

  logger.error("Unhandled error:", err);

  const statusCode = err.statusCode || 500;
  const errors =
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null;

  return ApiResponse.error(
    res,
    err.message || "Internal server error",
    statusCode,
    errors
  );
});

// Graceful Shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing server gracefully");
  await database.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, closing server gracefully");
  await database.disconnect();
  process.exit(0);
});

// Start Server
async function startServer() {
  try {
    // Validate critical environment variables
    const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      logger.error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
      logger.error("Service will start but authentication will not work!");
    }

    // Initialize database with retry logic
    let dbConnected = false;
    let retries = 3;

    while (retries > 0 && !dbConnected) {
      try {
        await database.initialize();
        logger.info("Database connected successfully");
        dbConnected = true;
      } catch (dbError) {
        retries--;
        logger.error(
          `Database connection failed. Retries left: ${retries}`,
          dbError.message
        );
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
        }
      }
    }

    if (!dbConnected) {
      logger.error("Failed to connect to database after all retries");
      logger.warn(
        "Starting service anyway - health checks will show database as disconnected"
      );
    }

    // Start listening regardless of database connection
    app.listen(PORT, "0.0.0.0", () => {
      const serviceUrl =
        process.env.NODE_ENV === "production"
          ? process.env.AUTH_SERVICE_URL || `https://auth-service.onrender.com`
          : `http://localhost:${PORT}`;

      logger.info(`🚀 Auth Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`Health check: ${serviceUrl}/health`);
      logger.info(
        `Database: ${dbConnected ? "✅ Connected" : "❌ Disconnected"}`
      );
    });
  } catch (error) {
    logger.error("Critical error starting auth service:", error);
    // Don't exit - try to keep service running for health checks
    app.listen(PORT, "0.0.0.0", () => {
      logger.warn(`⚠️ Auth Service started with errors on port ${PORT}`);
    });
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();

module.exports = app;
