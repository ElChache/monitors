import { Redis } from 'ioredis';
import { config } from 'dotenv';

config();
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3
});
redis.on("error", (err) => {
  console.error("Redis rate limiting error:", err);
});
async function rateLimit(options) {
  const { identifier, limit, window, type } = options;
  const key = `ratelimit:${type}:${identifier}`;
  try {
    const pipeline = redis.pipeline();
    const now = Date.now();
    const windowStart = now - window * 1e3;
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, window);
    const results = await pipeline.exec();
    if (!results) {
      throw new Error("Pipeline execution failed");
    }
    const currentCount = results[1][1];
    const resetTime = now + window * 1e3;
    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(window)
      };
    }
    return {
      allowed: true,
      remaining: Math.max(0, limit - currentCount - 1),
      resetTime
    };
  } catch (error) {
    console.error(`Rate limiting error for ${type}:`, error);
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: Date.now() + window * 1e3
    };
  }
}
async function checkAuthLimit(identifier) {
  return rateLimit({
    identifier,
    limit: 5,
    // 5 attempts
    window: 15 * 60,
    // 15 minutes
    type: "auth_attempt"
  });
}

export { checkAuthLimit as c, rateLimit as r };
//# sourceMappingURL=rateLimit-RwK8U2L8.js.map
