import { json } from "@sveltejs/kit";
import "../../../../../../chunks/db.js";
import "../../../../../../chunks/users.js";
import "puppeteer";
import "../../../../../../chunks/service4.js";
import "../../../../../../chunks/evaluation_service.js";
import { M as MonitorService } from "../../../../../../chunks/monitor_service.js";
import { g as getRedisClient } from "../../../../../../chunks/redis.js";
import { A as AuthService } from "../../../../../../chunks/service2.js";
class RateLimiter {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Check if request is within rate limit
   */
  async checkLimit(userId, ip, endpoint) {
    const key = this.generateKey(userId, ip, endpoint);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    try {
      const redis = await getRedisClient();
      const pipe = redis.pipeline();
      pipe.zremrangebyscore(key, "-inf", windowStart);
      pipe.zcard(key);
      pipe.zadd(key, now, `${now}-${Math.random()}`);
      pipe.expire(key, Math.ceil(this.config.windowMs / 1e3));
      const results = await pipe.exec();
      if (!results) {
        throw new Error("Redis pipeline execution failed");
      }
      const currentRequests = results[1][1] || 0;
      const allowed = currentRequests < this.config.maxRequests;
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
        windowMs: this.config.windowMs
      };
    } catch (error) {
      console.error("Rate limiting error:", error);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(now + this.config.windowMs),
        totalRequests: 1,
        windowMs: this.config.windowMs
      };
    }
  }
  /**
   * Generate cache key for rate limiting
   */
  generateKey(userId, ip, endpoint) {
    if (this.config.keyGenerator) {
      return `rate_limit:${this.config.keyGenerator(userId, ip)}`;
    }
    const parts = ["rate_limit"];
    if (userId) {
      parts.push(`user:${userId}`);
    }
    if (ip) {
      parts.push(`ip:${ip}`);
    }
    if (endpoint) {
      parts.push(`endpoint:${endpoint}`);
    }
    return parts.join(":");
  }
  /**
   * Reset rate limit for a specific key
   */
  async resetLimit(userId, ip, endpoint) {
    const key = this.generateKey(userId, ip, endpoint);
    try {
      const redis = await getRedisClient();
      await redis.del(key);
    } catch (error) {
      console.error("Error resetting rate limit:", error);
    }
  }
  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(userId, ip, endpoint) {
    const key = this.generateKey(userId, ip, endpoint);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    try {
      const redis = await getRedisClient();
      await redis.zremrangebyscore(key, "-inf", windowStart);
      const currentRequests = await redis.zcard(key);
      const resetTime = new Date(now + this.config.windowMs);
      const remaining = Math.max(0, this.config.maxRequests - currentRequests);
      const allowed = currentRequests < this.config.maxRequests;
      return {
        allowed,
        remaining,
        resetTime,
        totalRequests: currentRequests,
        windowMs: this.config.windowMs
      };
    } catch (error) {
      console.error("Rate limiting status error:", error);
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
        totalRequests: 0,
        windowMs: this.config.windowMs
      };
    }
  }
}
const userDailyLimiter = new RateLimiter({
  windowMs: 24 * 60 * 60 * 1e3,
  // 24 hours
  maxRequests: 50,
  keyGenerator: (userId) => `daily:user:${userId}`
});
async function POST({ params, request, getClientAddress }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const user = await AuthService.getCurrentUser(token);
    if (!user) {
      return json({ error: "Invalid token" }, { status: 401 });
    }
    const monitorId = params.id;
    if (!monitorId) {
      return json({ error: "Monitor ID required" }, { status: 400 });
    }
    const ip = getClientAddress();
    const rateLimitResult = await userDailyLimiter.checkLimit(user.id, ip, "manual_refresh");
    if (!rateLimitResult.allowed) {
      return json(
        {
          error: "Daily manual refresh limit exceeded",
          message: "You have reached your daily limit of 50 manual refreshes. Automatic monitoring continues as scheduled.",
          limit: 50,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime.toISOString(),
          nextReset: rateLimitResult.resetTime
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "50",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": Math.ceil(rateLimitResult.resetTime.getTime() / 1e3).toString(),
            "Retry-After": Math.ceil(rateLimitResult.windowMs / 1e3).toString()
          }
        }
      );
    }
    const monitor = await MonitorService.getMonitor(monitorId, user.id);
    if (!monitor) {
      return json({ error: "Monitor not found" }, { status: 404 });
    }
    const { MonitorEvaluationService } = await import("../../../../../../chunks/index.js");
    const evaluationResult = await MonitorEvaluationService.evaluateMonitor(
      monitorId,
      `manual-${Date.now()}`
    );
    return json({
      success: true,
      message: "Monitor refreshed successfully",
      evaluation: {
        success: evaluationResult.success,
        triggered: evaluationResult.triggered,
        previousValue: evaluationResult.previousValue,
        currentValue: evaluationResult.currentValue,
        processingTime: evaluationResult.processingTime,
        evaluatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      rateLimit: {
        remaining: rateLimitResult.remaining - 1,
        // Account for this request
        limit: 50,
        resetTime: rateLimitResult.resetTime.toISOString(),
        window: "24 hours"
      },
      monitor: {
        id: monitor.id,
        name: monitor.name,
        lastEvaluated: (/* @__PURE__ */ new Date()).toISOString(),
        status: monitor.isActive ? "active" : "inactive"
      }
    });
  } catch (error) {
    console.error("Manual refresh error:", error);
    return json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export {
  POST
};
