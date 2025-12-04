/**
 * Centralized Logging Utility
 * Uses Winston for structured logging across all microservices
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] [${service || 'SYSTEM'}] ${level}: ${message} ${metaStr}`;
  })
);

// Create logger instance
const createLogger = (serviceName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    defaultMeta: { service: serviceName },
    transports: [
      // Console transport
      new winston.transports.Console(),
      
      // File transports for errors
      new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      
      // File transport for all logs
      new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
};

// Export logger factory
module.exports = createLogger;
