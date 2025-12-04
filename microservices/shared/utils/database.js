/**
 * MongoDB Connection Utility
 * Shared database connection helper for all microservices
 */

const mongoose = require('mongoose');
const createLogger = require('./logger');

class DatabaseConnection {
  constructor(serviceName) {
    this.logger = createLogger(serviceName);
    this.isConnected = false;
  }

  async connect(mongoUri, options = {}) {
    if (this.isConnected) {
      this.logger.info('Already connected to MongoDB');
      return;
    }

    try {
      const defaultOptions = {
        autoIndex: process.env.NODE_ENV !== 'production',
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true,
      };

      await mongoose.connect(mongoUri, { ...defaultOptions, ...options });
      
      // Ping database to ensure connection is ready
      await mongoose.connection.db.admin().ping();
      
      // Wait a bit for mongoose to fully initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.isConnected = true;
      this.logger.info('✓ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        this.logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('error', (err) => {
        this.logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('reconnected', () => {
        this.isConnected = true;
        this.logger.info('MongoDB reconnected');
      });

    } catch (error) {
      this.logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      this.logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

module.exports = DatabaseConnection;
