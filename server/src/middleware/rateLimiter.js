// server/src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

// Strict limiter for auth routes — prevents brute force
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,              // 10 attempts per window
  message:          { success: false, message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders:  true,
  legacyHeaders:    false,
});

// General API limiter for all other routes
export const apiLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              100,
  message:          { success: false, message: "Too many requests. Slow down." },
  standardHeaders:  true,
  legacyHeaders:    false,
});