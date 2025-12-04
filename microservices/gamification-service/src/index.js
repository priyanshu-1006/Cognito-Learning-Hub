const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const cron = require("node-cron");
require("dotenv").config();

const { initializeRedis, getRedisClient } = require("./config/redis");
const { initializeQueues } = require("./config/queue");
const achievementRoutes = require("./routes/achievements");
const leaderboardRoutes = require("./routes/leaderboards");
const statsRoutes = require("./routes/stats");
const eventRoutes = require("./routes/events");
const { startStreakCronJob } = require("./jobs/streakChecker");
const { startStatsSyncJob } = require("./jobs/statsSync");

const app = express();
const PORT = process.env.PORT || 3007;

// Input validation and sanitization
const { sanitizeAll } = require("../../shared/middleware/inputValidation");

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(sanitizeAll);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "gamification-service",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/health",
      achievements: "/api/achievements",
      leaderboards: "/api/leaderboards",
      stats: "/api/stats",
      events: "/api/events",
    },
  });
});

// Health check
app.get("/health", async (req, res) => {
  const redis = getRedisClient();
  const redisStatus = redis ? "connected" : "disconnected";
  const mongoStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "ok",
    service: "gamification-service",
    port: PORT,
    timestamp: new Date().toISOString(),
    connections: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

// Routes
app.use("/api/achievements", achievementRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/events", eventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    service: "gamification-service",
  });
});

// Initialize services
async function initialize() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Initialize Redis
    await initializeRedis();
    console.log("✅ Redis connected");

    // Initialize Bull queues
    await initializeQueues();
    console.log("✅ Bull queues initialized");

    // Start cron jobs
    startStreakCronJob();
    console.log("✅ Streak checker cron job started");

    startStatsSyncJob();
    console.log("✅ Stats sync job started");

    // Start server
    app.listen(PORT, () => {
      console.log(`🎮 Gamification Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize service:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  const redis = getRedisClient();
  if (redis) await redis.quit();
  await mongoose.connection.close();
  process.exit(0);
});

initialize();

module.exports = app;
