import Redis from "ioredis";
import { config } from "dotenv";
import { d as db } from "./db.js";
import { pgTable, timestamp, text, boolean, varchar, uuid, index } from "drizzle-orm/pg-core";
config();
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || void 0,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 3e4,
  family: 4,
  // IPv4
  connectTimeout: 1e4,
  commandTimeout: 5e3
};
let redisClient = null;
async function initializeRedis() {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);
    new Redis(redisConfig);
    new Redis(redisConfig);
    redisClient.on("connect", () => {
      console.log("Redis client connected");
    });
    redisClient.on("error", (error) => {
      console.error("Redis client error:", error);
    });
    redisClient.on("close", () => {
      console.log("Redis client connection closed");
    });
    await redisClient.connect();
  }
}
async function getRedisClient() {
  if (!redisClient) {
    await initializeRedis();
  }
  return redisClient;
}
class RedisCache {
  client;
  prefix;
  constructor(client, prefix = "monitors:") {
    this.client = client;
    this.prefix = prefix;
  }
  /**
   * Generate cache key with prefix
   */
  key(key) {
    return `${this.prefix}${key}`;
  }
  /**
   * Set value with optional TTL
   */
  async set(key, value, ttlSeconds) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(this.key(key), ttlSeconds, serialized);
      } else {
        await this.client.set(this.key(key), serialized);
      }
      return true;
    } catch (error) {
      console.error("Redis set error:", error);
      return false;
    }
  }
  /**
   * Get value and deserialize
   */
  async get(key) {
    try {
      const value = await this.client.get(this.key(key));
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }
  /**
   * Delete key
   */
  async del(key) {
    try {
      const result = await this.client.del(this.key(key));
      return result > 0;
    } catch (error) {
      console.error("Redis del error:", error);
      return false;
    }
  }
  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const result = await this.client.exists(this.key(key));
      return result === 1;
    } catch (error) {
      console.error("Redis exists error:", error);
      return false;
    }
  }
  /**
   * Set TTL for existing key
   */
  async expire(key, ttlSeconds) {
    try {
      const result = await this.client.expire(this.key(key), ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error("Redis expire error:", error);
      return false;
    }
  }
  /**
   * Get TTL for key
   */
  async ttl(key) {
    try {
      return await this.client.ttl(this.key(key));
    } catch (error) {
      console.error("Redis ttl error:", error);
      return -1;
    }
  }
  /**
   * Increment numeric value
   */
  async incr(key) {
    try {
      return await this.client.incr(this.key(key));
    } catch (error) {
      console.error("Redis incr error:", error);
      return 0;
    }
  }
  /**
   * Decrement numeric value
   */
  async decr(key) {
    try {
      return await this.client.decr(this.key(key));
    } catch (error) {
      console.error("Redis decr error:", error);
      return 0;
    }
  }
  /**
   * Set multiple key-value pairs
   */
  async mset(pairs, ttlSeconds) {
    try {
      const pipeline = this.client.pipeline();
      for (const [key, value] of Object.entries(pairs)) {
        const serialized = JSON.stringify(value);
        const cacheKey = this.key(key);
        if (ttlSeconds) {
          pipeline.setex(cacheKey, ttlSeconds, serialized);
        } else {
          pipeline.set(cacheKey, serialized);
        }
      }
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error("Redis mset error:", error);
      return false;
    }
  }
  /**
   * Get multiple values
   */
  async mget(keys) {
    try {
      const cacheKeys = keys.map((key) => this.key(key));
      const values = await this.client.mget(...cacheKeys);
      const result = {};
      keys.forEach((key, index2) => {
        const value = values[index2];
        result[key] = value ? JSON.parse(value) : null;
      });
      return result;
    } catch (error) {
      console.error("Redis mget error:", error);
      return {};
    }
  }
  /**
   * Delete multiple keys
   */
  async mdel(keys) {
    try {
      const cacheKeys = keys.map((key) => this.key(key));
      return await this.client.del(...cacheKeys);
    } catch (error) {
      console.error("Redis mdel error:", error);
      return 0;
    }
  }
  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(this.key(pattern));
      if (keys.length === 0) {
        return 0;
      }
      return await this.client.del(...keys);
    } catch (error) {
      console.error("Redis delPattern error:", error);
      return 0;
    }
  }
  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const keyCount = await this.client.dbsize();
      const info = await this.client.memory("usage");
      return {
        keyCount,
        memoryUsage: `${Math.round(info / 1024 / 1024 * 100) / 100} MB`
      };
    } catch (error) {
      console.error("Redis getStats error:", error);
      return {
        keyCount: 0,
        memoryUsage: "0 MB"
      };
    }
  }
}
async function testRedisConnection() {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error("Redis connection test failed:", error);
    return false;
  }
}
const cacheEvents = pgTable(
  "cache_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operation: varchar("operation", { length: 20 }).notNull().$type(),
    cacheType: varchar("cache_type", { length: 20 }).notNull().$type(),
    key: varchar("key", { length: 255 }).notNull(),
    // Cache key (without prefix)
    hit: boolean("hit").notNull().default(false),
    // Whether operation was successful/hit
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    // Optional metadata for debugging
    metadata: text("metadata"),
    // JSON string for additional context
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    operationIdx: index("cache_events_operation_idx").on(table.operation),
    cacheTypeIdx: index("cache_events_cache_type_idx").on(table.cacheType),
    hitIdx: index("cache_events_hit_idx").on(table.hit),
    timestampIdx: index("cache_events_timestamp_idx").on(table.timestamp),
    typeTimestampIdx: index("cache_events_type_timestamp_idx").on(table.cacheType, table.timestamp),
    keyIdx: index("cache_events_key_idx").on(table.key)
  })
);
class CacheTrackingService {
  /**
   * Log cache operation event
   */
  static async logCacheEvent(operation, cacheType, key, hit) {
    try {
      if (process.env.NODE_ENV === "development" || process.env.CACHE_DETAILED_LOGGING === "true") {
        await db.insert(cacheEvents).values({
          operation,
          cacheType,
          key,
          hit,
          timestamp: /* @__PURE__ */ new Date()
        });
      }
    } catch (error) {
      console.error("Failed to log cache event:", error);
    }
  }
  /**
   * Get cache hit rate statistics
   */
  static async getCacheHitRate(cacheType, timeRange) {
    try {
      let query = db.select().from(cacheEvents);
      const conditions = [];
      if (cacheType) {
        conditions.push(`cache_type = '${cacheType}'`);
      }
      if (timeRange) {
        conditions.push(`timestamp >= '${timeRange.start.toISOString()}'`);
        conditions.push(`timestamp <= '${timeRange.end.toISOString()}'`);
      }
      const events = await query.execute();
      const totalEvents = events.length;
      const hits = events.filter((event) => event.hit).length;
      const misses = totalEvents - hits;
      const hitRate = totalEvents > 0 ? hits / totalEvents * 100 : 0;
      return {
        totalEvents,
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100
      };
    } catch (error) {
      console.error("Failed to get cache hit rate:", error);
      return {
        totalEvents: 0,
        hits: 0,
        misses: 0,
        hitRate: 0
      };
    }
  }
  /**
   * Get cache performance statistics by type
   */
  static async getCacheStatsByType() {
    try {
      const cacheTypes = [
        "session",
        "monitor",
        "ai_response",
        "user",
        "email",
        "rate_limit"
      ];
      const stats = {};
      for (const type of cacheTypes) {
        stats[type] = await this.getCacheHitRate(type);
      }
      return stats;
    } catch (error) {
      console.error("Failed to get cache stats by type:", error);
      return {};
    }
  }
  /**
   * Get most frequently accessed cache keys
   */
  static async getTopCacheKeys(cacheType, limit = 10) {
    try {
      const events = await db.select().from(cacheEvents).execute();
      const keyStats = {};
      events.forEach((event) => {
        if (cacheType && event.cacheType !== cacheType) {
          return;
        }
        if (!keyStats[event.key]) {
          keyStats[event.key] = { total: 0, hits: 0 };
        }
        keyStats[event.key].total++;
        if (event.hit) {
          keyStats[event.key].hits++;
        }
      });
      return Object.entries(keyStats).map(([key, stats]) => ({
        key,
        accessCount: stats.total,
        hitRate: Math.round(stats.hits / stats.total * 1e4) / 100
      })).sort((a, b) => b.accessCount - a.accessCount).slice(0, limit);
    } catch (error) {
      console.error("Failed to get top cache keys:", error);
      return [];
    }
  }
  /**
   * Get cache performance over time
   */
  static async getCachePerformanceOverTime(cacheType, timeRange = {
    start: new Date(Date.now() - 24 * 60 * 60 * 1e3),
    // 24 hours ago
    end: /* @__PURE__ */ new Date()
  }) {
    try {
      const events = await db.select().from(cacheEvents).execute();
      const hourlyStats = {};
      events.forEach((event) => {
        if (event.timestamp < timeRange.start || event.timestamp > timeRange.end) {
          return;
        }
        if (cacheType && event.cacheType !== cacheType) {
          return;
        }
        const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ":00:00";
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { total: 0, hits: 0 };
        }
        hourlyStats[hour].total++;
        if (event.hit) {
          hourlyStats[hour].hits++;
        }
      });
      return Object.entries(hourlyStats).map(([hour, stats]) => ({
        hour,
        events: stats.total,
        hits: stats.hits,
        hitRate: Math.round(stats.hits / stats.total * 1e4) / 100
      })).sort((a, b) => a.hour.localeCompare(b.hour));
    } catch (error) {
      console.error("Failed to get cache performance over time:", error);
      return [];
    }
  }
  /**
   * Clean up old cache events (for maintenance)
   */
  static async cleanupOldEvents(olderThanDays = 7) {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1e3);
      const result = await db.delete(cacheEvents).where(`timestamp < '${cutoffDate.toISOString()}'`).execute();
      console.log(`Cleaned up cache events older than ${cutoffDate.toISOString()}`);
      return 0;
    } catch (error) {
      console.error("Failed to cleanup old cache events:", error);
      return 0;
    }
  }
  /**
   * Get comprehensive cache analytics dashboard data
   */
  static async getCacheAnalytics() {
    try {
      const [overall, byType, topKeys, performance24h] = await Promise.all([
        this.getCacheHitRate(),
        this.getCacheStatsByType(),
        this.getTopCacheKeys(void 0, 5),
        this.getCachePerformanceOverTime()
      ]);
      return {
        overall,
        byType,
        topKeys,
        performance24h
      };
    } catch (error) {
      console.error("Failed to get cache analytics:", error);
      return {
        overall: { totalEvents: 0, hits: 0, misses: 0, hitRate: 0 },
        byType: {},
        topKeys: [],
        performance24h: []
      };
    }
  }
}
const CACHE_PREFIXES = {
  SESSION: "session:",
  MONITOR: "monitor:",
  AI_RESPONSE: "ai:",
  USER: "user:",
  EMAIL: "email:",
  RATE_LIMIT: "rate_limit:"
};
const CACHE_TTL = {
  SESSION: 24 * 60 * 60,
  // 24 hours
  MONITOR: 60 * 60,
  // 1 hour
  AI_RESPONSE: 24 * 60 * 60,
  // 24 hours
  USER: 30 * 60,
  // 30 minutes
  EMAIL: 10 * 60,
  // 10 minutes
  RATE_LIMIT: 24 * 60 * 60
  // 24 hours
};
class CacheService {
  static sessionCache = null;
  static monitorCache = null;
  static aiResponseCache = null;
  static userCache = null;
  static emailCache = null;
  static rateLimitCache = null;
  /**
   * Initialize all cache instances
   */
  static async initializeCaches() {
    const client = await getRedisClient();
    if (!this.sessionCache) {
      this.sessionCache = new RedisCache(client, CACHE_PREFIXES.SESSION);
    }
    if (!this.monitorCache) {
      this.monitorCache = new RedisCache(client, CACHE_PREFIXES.MONITOR);
    }
    if (!this.aiResponseCache) {
      this.aiResponseCache = new RedisCache(client, CACHE_PREFIXES.AI_RESPONSE);
    }
    if (!this.userCache) {
      this.userCache = new RedisCache(client, CACHE_PREFIXES.USER);
    }
    if (!this.emailCache) {
      this.emailCache = new RedisCache(client, CACHE_PREFIXES.EMAIL);
    }
    if (!this.rateLimitCache) {
      this.rateLimitCache = new RedisCache(client, CACHE_PREFIXES.RATE_LIMIT);
    }
  }
  /**
   * Session caching methods
   */
  static async setSession(sessionId, sessionData) {
    await this.initializeCaches();
    const success = await this.sessionCache.set(sessionId, sessionData, CACHE_TTL.SESSION);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "set",
        "session",
        sessionId,
        true
      );
    }
    return success;
  }
  static async getSession(sessionId) {
    await this.initializeCaches();
    const data = await this.sessionCache.get(sessionId);
    await CacheTrackingService.logCacheEvent(
      "get",
      "session",
      sessionId,
      data !== null
    );
    return data;
  }
  static async deleteSession(sessionId) {
    await this.initializeCaches();
    const success = await this.sessionCache.del(sessionId);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "delete",
        "session",
        sessionId,
        true
      );
    }
    return success;
  }
  /**
   * Monitor caching methods
   */
  static async setMonitor(monitorId, monitorData) {
    await this.initializeCaches();
    const success = await this.monitorCache.set(monitorId, monitorData, CACHE_TTL.MONITOR);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "set",
        "monitor",
        monitorId,
        true
      );
    }
    return success;
  }
  static async getMonitor(monitorId) {
    await this.initializeCaches();
    const data = await this.monitorCache.get(monitorId);
    await CacheTrackingService.logCacheEvent(
      "get",
      "monitor",
      monitorId,
      data !== null
    );
    return data;
  }
  static async deleteMonitor(monitorId) {
    await this.initializeCaches();
    const success = await this.monitorCache.del(monitorId);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "delete",
        "monitor",
        monitorId,
        true
      );
    }
    return success;
  }
  /**
   * User monitor list caching
   */
  static async setUserMonitors(userId, monitors) {
    await this.initializeCaches();
    const key = `user_monitors:${userId}`;
    const success = await this.monitorCache.set(key, monitors, CACHE_TTL.MONITOR);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "set",
        "monitor",
        key,
        true
      );
    }
    return success;
  }
  static async getUserMonitors(userId) {
    await this.initializeCaches();
    const key = `user_monitors:${userId}`;
    const data = await this.monitorCache.get(key);
    await CacheTrackingService.logCacheEvent(
      "get",
      "monitor",
      key,
      data !== null
    );
    return data;
  }
  static async invalidateUserMonitors(userId) {
    await this.initializeCaches();
    const key = `user_monitors:${userId}`;
    const success = await this.monitorCache.del(key);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "delete",
        "monitor",
        key,
        true
      );
    }
    return success;
  }
  /**
   * AI response caching methods
   */
  static async setAIResponse(prompt, response) {
    await this.initializeCaches();
    const key = this.generateAIPromptHash(prompt);
    const success = await this.aiResponseCache.set(key, response, CACHE_TTL.AI_RESPONSE);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "set",
        "ai_response",
        key,
        true
      );
    }
    return success;
  }
  static async getAIResponse(prompt) {
    await this.initializeCaches();
    const key = this.generateAIPromptHash(prompt);
    const data = await this.aiResponseCache.get(key);
    await CacheTrackingService.logCacheEvent(
      "get",
      "ai_response",
      key,
      data !== null
    );
    return data;
  }
  /**
   * Generate consistent hash for AI prompts
   */
  static generateAIPromptHash(prompt) {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  /**
   * User data caching methods
   */
  static async setUser(userId, userData) {
    await this.initializeCaches();
    const success = await this.userCache.set(userId, userData, CACHE_TTL.USER);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "set",
        "user",
        userId,
        true
      );
    }
    return success;
  }
  static async getUser(userId) {
    await this.initializeCaches();
    const data = await this.userCache.get(userId);
    await CacheTrackingService.logCacheEvent(
      "get",
      "user",
      userId,
      data !== null
    );
    return data;
  }
  static async deleteUser(userId) {
    await this.initializeCaches();
    const success = await this.userCache.del(userId);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "delete",
        "user",
        userId,
        true
      );
    }
    return success;
  }
  /**
   * Rate limiting methods
   */
  static async incrementRateLimit(identifier, limitType, ttl = CACHE_TTL.RATE_LIMIT) {
    await this.initializeCaches();
    const key = `${limitType}:${identifier}`;
    const current = await this.rateLimitCache.incr(key);
    if (current === 1) {
      await this.rateLimitCache.expire(key, ttl);
    }
    await CacheTrackingService.logCacheEvent(
      "incr",
      "rate_limit",
      key,
      true
    );
    return current;
  }
  static async getRateLimit(identifier, limitType) {
    await this.initializeCaches();
    const key = `${limitType}:${identifier}`;
    const [current, ttl] = await Promise.all([
      this.rateLimitCache.get(key),
      this.rateLimitCache.ttl(key)
    ]);
    await CacheTrackingService.logCacheEvent(
      "get",
      "rate_limit",
      key,
      current !== null
    );
    return {
      current: current || 0,
      ttl
    };
  }
  /**
   * Email template caching methods
   */
  static async setEmailTemplate(templateName, templateData) {
    await this.initializeCaches();
    const success = await this.emailCache.set(templateName, templateData, CACHE_TTL.EMAIL);
    if (success) {
      await CacheTrackingService.logCacheEvent(
        "set",
        "email",
        templateName,
        true
      );
    }
    return success;
  }
  static async getEmailTemplate(templateName) {
    await this.initializeCaches();
    const data = await this.emailCache.get(templateName);
    await CacheTrackingService.logCacheEvent(
      "get",
      "email",
      templateName,
      data !== null
    );
    return data;
  }
  /**
   * Bulk cache operations
   */
  static async invalidateUserCache(userId) {
    await this.initializeCaches();
    await this.deleteUser(userId);
    await this.invalidateUserMonitors(userId);
    await this.sessionCache.delPattern(`*${userId}*`);
    await CacheTrackingService.logCacheEvent(
      "invalidate",
      "user_bulk",
      userId,
      true
    );
  }
  /**
   * Cache statistics and monitoring
   */
  static async getCacheStats() {
    await this.initializeCaches();
    return {
      session: await this.sessionCache.getStats(),
      monitor: await this.monitorCache.getStats(),
      aiResponse: await this.aiResponseCache.getStats(),
      user: await this.userCache.getStats(),
      email: await this.emailCache.getStats(),
      rateLimit: await this.rateLimitCache.getStats()
    };
  }
  /**
   * Health check
   */
  static async healthCheck() {
    try {
      await this.initializeCaches();
      const testKey = "health_check_test";
      const testValue = { timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      const cacheTests = {
        session: await this.sessionCache.set(testKey, testValue, 10) && await this.sessionCache.get(testKey) !== null && await this.sessionCache.del(testKey),
        monitor: await this.monitorCache.set(testKey, testValue, 10) && await this.monitorCache.get(testKey) !== null && await this.monitorCache.del(testKey),
        aiResponse: await this.aiResponseCache.set(testKey, testValue, 10) && await this.aiResponseCache.get(testKey) !== null && await this.aiResponseCache.del(testKey),
        user: await this.userCache.set(testKey, testValue, 10) && await this.userCache.get(testKey) !== null && await this.userCache.del(testKey),
        email: await this.emailCache.set(testKey, testValue, 10) && await this.emailCache.get(testKey) !== null && await this.emailCache.del(testKey),
        rateLimit: await this.rateLimitCache.set(testKey, testValue, 10) && await this.rateLimitCache.get(testKey) !== null && await this.rateLimitCache.del(testKey)
      };
      const allCachesHealthy = Object.values(cacheTests).every((test) => test === true);
      return {
        redis: allCachesHealthy,
        caches: cacheTests
      };
    } catch (error) {
      console.error("Cache health check failed:", error);
      return {
        redis: false,
        caches: {
          session: false,
          monitor: false,
          aiResponse: false,
          user: false,
          email: false,
          rateLimit: false
        }
      };
    }
  }
}
export {
  CacheService as C,
  CacheTrackingService as a,
  testRedisConnection as t
};
