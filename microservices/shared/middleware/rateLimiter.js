/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

const rateLimit = require("express-rate-limit");
const ApiResponse = require("../utils/response");

// General API rate limiter - Only count failed requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Increased from 100 to 300 requests per window
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
  handler: (req, res) => {
    ApiResponse.tooManyRequests(
      res,
      "Too many requests from this IP, please try again later."
    );
  },
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  message:
    "Too many authentication attempts, please try again after 15 minutes.",
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    ApiResponse.tooManyRequests(
      res,
      "Too many authentication attempts, please try again after 15 minutes."
    );
  },
});

// Moderate rate limiter for resource-intensive operations
const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Rate limit reached for this operation.",
  handler: (req, res) => {
    ApiResponse.tooManyRequests(
      res,
      "Rate limit reached. Please try again later."
    );
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  heavyLimiter,
};
