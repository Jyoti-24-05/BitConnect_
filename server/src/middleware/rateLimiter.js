// server/src/middleware/rateLimiter.js — replace entirely
import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV === "development";

// In development — effectively disabled (10000 requests)
// In production — strict limits
export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             isDev ? 10000 : 10,
  skip:            () => isDev, // completely skip in dev
  message:         { success: false, message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders:   false,
});

export const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             isDev ? 10000 : 100,
  skip:            () => isDev, // completely skip in dev
  message:         { success: false, message: "Too many requests. Slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
});