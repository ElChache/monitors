import { Redis } from 'ioredis';
import { config } from 'dotenv';

config();

// Redis client for rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('Redis rate limiting error:', err);
});

export interface RateLimitOptions {
  identifier: string; // Unique identifier (IP, user ID, etc.)
  limit: number; // Number of requests allowed
  window: number; // Time window in seconds
  type: string; // Type of rate limit (for logging)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { identifier, limit, window, type } = options;
  const key = `ratelimit:${type}:${identifier}`;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    const now = Date.now();
    const windowStart = now - (window * 1000);

    // Remove old entries and count current requests
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, window);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Pipeline execution failed');
    }

    // Get current count after cleanup
    const currentCount = results[1][1] as number;
    const resetTime = now + (window * 1000);

    if (currentCount >= limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(window)
      };
    }

    // Request allowed
    return {
      allowed: true,
      remaining: Math.max(0, limit - currentCount - 1),
      resetTime
    };

  } catch (error) {
    console.error(`Rate limiting error for ${type}:`, error);
    
    // On Redis failure, allow the request but log the error
    // This prevents Redis outages from breaking the application
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: Date.now() + (window * 1000)
    };
  }
}

export async function isRateLimited(options: RateLimitOptions): Promise<boolean> {
  const result = await rateLimit(options);
  return !result.allowed;
}

export async function getRemainingRequests(options: RateLimitOptions): Promise<number> {
  const { identifier, limit, window, type } = options;
  const key = `ratelimit:${type}:${identifier}`;

  try {
    const now = Date.now();
    const windowStart = now - (window * 1000);

    // Clean up old entries and count current
    await redis.zremrangebyscore(key, 0, windowStart);
    const currentCount = await redis.zcard(key);

    return Math.max(0, limit - currentCount);
  } catch (error) {
    console.error('Error getting remaining requests:', error);
    return limit;
  }
}

// Daily rate limit for manual monitor refreshes (50 per day per user)
export async function checkDailyLimit(userId: string, limit: number = 50): Promise<RateLimitResult> {
  return rateLimit({
    identifier: userId,
    limit,
    window: 24 * 60 * 60, // 24 hours
    type: 'daily_refresh'
  });
}

// Authentication rate limiting (prevent brute force)
export async function checkAuthLimit(identifier: string): Promise<RateLimitResult> {
  return rateLimit({
    identifier,
    limit: 5, // 5 attempts
    window: 15 * 60, // 15 minutes
    type: 'auth_attempt'
  });
}

// API rate limiting (general API usage)
export async function checkAPILimit(identifier: string): Promise<RateLimitResult> {
  return rateLimit({
    identifier,
    limit: 100, // 100 requests
    window: 60, // 1 minute
    type: 'api_request'
  });
}

export { redis as rateLimitRedis };