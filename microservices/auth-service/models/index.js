/**
 * Database Configuration for Auth Service
 * Using direct mongoose connection like the monolith backend
 */

const mongoose = require("mongoose");

// Get shared logger
const createLogger = require("../../shared/utils/logger");
const logger = createLogger("auth-service");

class AuthDatabase {
  /**
   * Initialize database and load models
   */
  async initialize() {
    try {
      // Use MONGO_URI from .env file
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error("MONGO_URI environment variable is not defined");
      }

      logger.info("Connecting to MongoDB...");
      logger.info("MONGO_URI:", mongoUri.replace(/:[^:@]+@/, ":****@")); // Hide password

      // Use the EXACT same connection as monolith backend
      await mongoose.connect(mongoUri, {
        autoIndex: true, // Build indexes
      });

      logger.info("✓ MongoDB connected successfully");
      logger.info(
        `Connection state: ${mongoose.connection.readyState} (1 = connected)`
      );

      // Load User model AFTER connection
      require("./User");

      // CRITICAL: Test the connection with an actual query
      logger.info("Testing connection with a sample query...");
      const testResult = await mongoose.connection.db.admin().ping();
      logger.info("✓ Ping test successful:", testResult);

      logger.info("Auth service models loaded successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize auth database:", error);
      throw error;
    }
  }

  /**
   * Get User model
   */
  getUserModel() {
    return mongoose.model("User");
  }

  /**
   * Health check - verify database connection
   */
  async healthCheck() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return false;
      }
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info("Database disconnected");
    } catch (error) {
      logger.error("Error disconnecting from database:", error);
      throw error;
    }
  }
}

module.exports = new AuthDatabase();
