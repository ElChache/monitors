import { getRedisClient } from '../cache/redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (userId?: string, ip?: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  totalRequests: number;
  windowMs: number;
}

/**
 * Redis-based rate limiting service
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(
    userId?: string, 
    ip?: string, 
    endpoint?: string
  ): Promise<RateLimitResult> {
    const key = this.generateKey(userId, ip, endpoint);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      const redis = await getRedisClient();
      // Use Redis sorted set to track requests within time window
      const pipe = redis.pipeline();
      
      // Remove old entries outside the current window
      pipe.zremrangebyscore(key, '-inf', windowStart);
      
      // Count current requests in window
      pipe.zcard(key);
      
      // Add current request
      pipe.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration on the key
      pipe.expire(key, Math.ceil(this.config.windowMs / 1000));
      
      const results = await pipe.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const currentRequests = (results[1][1] as number) || 0;
      const allowed = currentRequests < this.config.maxRequests;
      
      // If not allowed, remove the request we just added
      if (!allowed) {
        await redis.zpopmax(key);
      }

      const resetTime = new Date(now + this.config.windowMs);
      const remaining = Math.max(0, this.config.maxRequests - currentRequests - (allowed ? 1 : 0));

      return {
        allowed,
        remaining,
        resetTime,
        totalRequests: currentRequests + (allowed ? 1 : 0),
        windowMs: this.config.windowMs,
      };

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(now + this.config.windowMs),
        totalRequests: 1,
        windowMs: this.config.windowMs,
      };
    }
  }

  /**
   * Generate cache key for rate limiting
   */
  private generateKey(userId?: string, ip?: string, endpoint?: string): string {
    if (this.config.keyGenerator) {
      return `rate_limit:${this.config.keyGenerator(userId, ip)}`;
    }

    const parts = ['rate_limit'];
    
    if (userId) {
      parts.push(`user:${userId}`);
    }
    
    if (ip) {
      parts.push(`ip:${ip}`);
    }
    
    if (endpoint) {
      parts.push(`endpoint:${endpoint}`);
    }

    return parts.join(':');
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetLimit(userId?: string, ip?: string, endpoint?: string): Promise<void> {
    const key = this.generateKey(userId, ip, endpoint);
    try {
      const redis = await getRedisClient();
      await redis.del(key);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(userId?: string, ip?: string, endpoint?: string): Promise<RateLimitResult> {
    const key = this.generateKey(userId, ip, endpoint);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      const redis = await getRedisClient();
      // Clean up old entries and count current ones
      await redis.zremrangebyscore(key, '-inf', windowStart);
      const currentRequests = await redis.zcard(key);

      const resetTime = new Date(now + this.config.windowMs);
      const remaining = Math.max(0, this.config.maxRequests - currentRequests);
      const allowed = currentRequests < this.config.maxRequests;

      return {
        allowed,
        remaining,
        resetTime,
        totalRequests: currentRequests,
        windowMs: this.config.windowMs,
      };

    } catch (error) {
      console.error('Rate limiting status error:', error);
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
        totalRequests: 0,
        windowMs: this.config.windowMs,
      };
    }
  }
}

// Predefined rate limiters for different use cases

/**
 * User-based daily rate limiter (50 requests per day)
 */
export const userDailyLimiter = new RateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 50,
  keyGenerator: (userId) => `daily:user:${userId}`,
});

/**
 * IP-based hourly rate limiter for abuse prevention
 */
export const ipHourlyLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  keyGenerator: (userId, ip) => `hourly:ip:${ip}`,
});

/**
 * General API rate limiter per user per hour
 */
export const apiHourlyLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
  keyGenerator: (userId, ip) => userId ? `api:user:${userId}` : `api:ip:${ip}`,
});

/**
 * Authentication rate limiter (per IP)
 */
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (userId, ip) => `auth:ip:${ip}`,
});