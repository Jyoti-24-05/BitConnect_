// server/src/config/redis.js
import Redis from "ioredis";

let redisClient = null;

// ─── Connect ──────────────────────────────────────────────────────────────────
export const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.warn("⚠️  REDIS_URL not set — Redis disabled. Rate limiting uses memory store.");
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest:    3,
      enableReadyCheck:        true,
      reconnectOnError(err) {
        // Auto-reconnect on these specific errors
        const reconnectErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
        return reconnectErrors.some((e) => err.message.includes(e));
      },
      retryStrategy(times) {
        if (times > 5) {
          console.error("❌ Redis max retries reached — giving up");
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000); // exponential backoff, max 2s
      },
    });

    redisClient.on("connect",      () => console.log("✅ Redis connected"));
    redisClient.on("error",  (err) => console.error("❌ Redis error:", err.message));
    redisClient.on("reconnecting", () => console.warn("⚠️  Redis reconnecting..."));
    redisClient.on("close",        () => console.warn("⚠️  Redis connection closed"));

    // Test the connection
    await redisClient.ping();
    return redisClient;
  } catch (err) {
    console.error("❌ Redis connection failed:", err.message);
    redisClient = null;
    return null; // non-fatal — app continues without Redis
  }
};

// ─── Singleton getter ─────────────────────────────────────────────────────────
export const getRedis = () => redisClient;

// ─── Cache helpers ────────────────────────────────────────────────────────────

export const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`[Redis] cacheGet failed for "${key}":`, err.message);
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value)); // ioredis uses setex not setEx
  } catch (err) {
    console.error(`[Redis] cacheSet failed for "${key}":`, err.message);
  }
};

export const cacheDelete = async (keys) => {
  if (!redisClient) return;
  try {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length) await redisClient.del(...keyArray); // ioredis spreads args
  } catch (err) {
    console.error("[Redis] cacheDelete failed:", err.message);
  }
};

export const cacheDeletePattern = async (pattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) await redisClient.del(...keys);
  } catch (err) {
    console.error("[Redis] cacheDeletePattern failed:", err.message);
  }
};

export const withCache = async (key, fetchFn, ttlSeconds = 300) => {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;
  const fresh = await fetchFn();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
};

export default {
  connectRedis,
  getRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  withCache,
};