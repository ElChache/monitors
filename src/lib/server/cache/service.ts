import { RedisCache, getRedisClient } from './redis';
import { CacheTrackingService } from './tracking';

/**
 * Cache configuration constants
 */
export const CACHE_PREFIXES = {
  SESSION: 'session:',
  MONITOR: 'monitor:',
  AI_RESPONSE: 'ai:',
  USER: 'user:',
  EMAIL: 'email:',
  RATE_LIMIT: 'rate_limit:'
} as const;

export const CACHE_TTL = {
  SESSION: 24 * 60 * 60, // 24 hours
  MONITOR: 60 * 60, // 1 hour
  AI_RESPONSE: 24 * 60 * 60, // 24 hours
  USER: 30 * 60, // 30 minutes
  EMAIL: 10 * 60, // 10 minutes
  RATE_LIMIT: 24 * 60 * 60 // 24 hours
} as const;

/**
 * Cache service for different data types
 */
export class CacheService {
  private static sessionCache: RedisCache | null = null;
  private static monitorCache: RedisCache | null = null;
  private static aiResponseCache: RedisCache | null = null;
  private static userCache: RedisCache | null = null;
  private static emailCache: RedisCache | null = null;
  private static rateLimitCache: RedisCache | null = null;

  /**
   * Initialize all cache instances
   */
  private static async initializeCaches(): Promise<void> {
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
  static async setSession(sessionId: string, sessionData: any): Promise<boolean> {
    await this.initializeCaches();
    const success = await this.sessionCache!.set(sessionId, sessionData, CACHE_TTL.SESSION);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'set',
        'session',
        sessionId,
        true
      );
    }
    
    return success;
  }

  static async getSession<T = any>(sessionId: string): Promise<T | null> {
    await this.initializeCaches();
    const data = await this.sessionCache!.get<T>(sessionId);
    
    await CacheTrackingService.logCacheEvent(
      'get',
      'session',
      sessionId,
      data !== null
    );
    
    return data;
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    await this.initializeCaches();
    const success = await this.sessionCache!.del(sessionId);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'delete',
        'session',
        sessionId,
        true
      );
    }
    
    return success;
  }

  /**
   * Monitor caching methods
   */
  static async setMonitor(monitorId: string, monitorData: any): Promise<boolean> {
    await this.initializeCaches();
    const success = await this.monitorCache!.set(monitorId, monitorData, CACHE_TTL.MONITOR);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'set',
        'monitor',
        monitorId,
        true
      );
    }
    
    return success;
  }

  static async getMonitor<T = any>(monitorId: string): Promise<T | null> {
    await this.initializeCaches();
    const data = await this.monitorCache!.get<T>(monitorId);
    
    await CacheTrackingService.logCacheEvent(
      'get',
      'monitor',
      monitorId,
      data !== null
    );
    
    return data;
  }

  static async deleteMonitor(monitorId: string): Promise<boolean> {
    await this.initializeCaches();
    const success = await this.monitorCache!.del(monitorId);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'delete',
        'monitor',
        monitorId,
        true
      );
    }
    
    return success;
  }

  /**
   * User monitor list caching
   */
  static async setUserMonitors(userId: string, monitors: any[]): Promise<boolean> {
    await this.initializeCaches();
    const key = `user_monitors:${userId}`;
    const success = await this.monitorCache!.set(key, monitors, CACHE_TTL.MONITOR);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'set',
        'monitor',
        key,
        true
      );
    }
    
    return success;
  }

  static async getUserMonitors(userId: string): Promise<any[] | null> {
    await this.initializeCaches();
    const key = `user_monitors:${userId}`;
    const data = await this.monitorCache!.get<any[]>(key);
    
    await CacheTrackingService.logCacheEvent(
      'get',
      'monitor',
      key,
      data !== null
    );
    
    return data;
  }

  static async invalidateUserMonitors(userId: string): Promise<boolean> {
    await this.initializeCaches();
    const key = `user_monitors:${userId}`;
    const success = await this.monitorCache!.del(key);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'delete',
        'monitor',
        key,
        true
      );
    }
    
    return success;
  }

  /**
   * AI response caching methods
   */
  static async setAIResponse(prompt: string, response: any): Promise<boolean> {
    await this.initializeCaches();
    
    // Generate consistent hash for the prompt
    const key = this.generateAIPromptHash(prompt);
    const success = await this.aiResponseCache!.set(key, response, CACHE_TTL.AI_RESPONSE);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'set',
        'ai_response',
        key,
        true
      );
    }
    
    return success;
  }

  static async getAIResponse<T = any>(prompt: string): Promise<T | null> {
    await this.initializeCaches();
    
    const key = this.generateAIPromptHash(prompt);
    const data = await this.aiResponseCache!.get<T>(key);
    
    await CacheTrackingService.logCacheEvent(
      'get',
      'ai_response',
      key,
      data !== null
    );
    
    return data;
  }

  /**
   * Generate consistent hash for AI prompts
   */
  private static generateAIPromptHash(prompt: string): string {
    // Simple hash function for consistent cache keys
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * User data caching methods
   */
  static async setUser(userId: string, userData: any): Promise<boolean> {
    await this.initializeCaches();
    const success = await this.userCache!.set(userId, userData, CACHE_TTL.USER);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'set',
        'user',
        userId,
        true
      );
    }
    
    return success;
  }

  static async getUser<T = any>(userId: string): Promise<T | null> {
    await this.initializeCaches();
    const data = await this.userCache!.get<T>(userId);
    
    await CacheTrackingService.logCacheEvent(
      'get',
      'user',
      userId,
      data !== null
    );
    
    return data;
  }

  static async deleteUser(userId: string): Promise<boolean> {
    await this.initializeCaches();
    const success = await this.userCache!.del(userId);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'delete',
        'user',
        userId,
        true
      );
    }
    
    return success;
  }

  /**
   * Rate limiting methods
   */
  static async incrementRateLimit(
    identifier: string,
    limitType: string,
    ttl: number = CACHE_TTL.RATE_LIMIT
  ): Promise<number> {
    await this.initializeCaches();
    const key = `${limitType}:${identifier}`;
    
    const current = await this.rateLimitCache!.incr(key);
    
    // Set TTL only on first increment
    if (current === 1) {
      await this.rateLimitCache!.expire(key, ttl);
    }
    
    await CacheTrackingService.logCacheEvent(
      'incr',
      'rate_limit',
      key,
      true
    );
    
    return current;
  }

  static async getRateLimit(identifier: string, limitType: string): Promise<{
    current: number;
    ttl: number;
  }> {
    await this.initializeCaches();
    const key = `${limitType}:${identifier}`;
    
    const [current, ttl] = await Promise.all([
      this.rateLimitCache!.get<number>(key),
      this.rateLimitCache!.ttl(key)
    ]);
    
    await CacheTrackingService.logCacheEvent(
      'get',
      'rate_limit',
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
  static async setEmailTemplate(templateName: string, templateData: any): Promise<boolean> {
    await this.initializeCaches();
    const success = await this.emailCache!.set(templateName, templateData, CACHE_TTL.EMAIL);
    
    if (success) {
      await CacheTrackingService.logCacheEvent(
        'set',
        'email',
        templateName,
        true
      );
    }
    
    return success;
  }

  static async getEmailTemplate<T = any>(templateName: string): Promise<T | null> {
    await this.initializeCaches();
    const data = await this.emailCache!.get<T>(templateName);
    
    await CacheTrackingService.logCacheEvent(
      'get',
      'email',
      templateName,
      data !== null
    );
    
    return data;
  }

  /**
   * Bulk cache operations
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await this.initializeCaches();
    
    // Clear user data
    await this.deleteUser(userId);
    
    // Clear user's monitors
    await this.invalidateUserMonitors(userId);
    
    // Clear user's sessions (pattern-based deletion)
    await this.sessionCache!.delPattern(`*${userId}*`);
    
    await CacheTrackingService.logCacheEvent(
      'invalidate',
      'user_bulk',
      userId,
      true
    );
  }

  /**
   * Cache statistics and monitoring
   */
  static async getCacheStats(): Promise<{
    session: any;
    monitor: any;
    aiResponse: any;
    user: any;
    email: any;
    rateLimit: any;
  }> {
    await this.initializeCaches();
    
    return {
      session: await this.sessionCache!.getStats(),
      monitor: await this.monitorCache!.getStats(),
      aiResponse: await this.aiResponseCache!.getStats(),
      user: await this.userCache!.getStats(),
      email: await this.emailCache!.getStats(),
      rateLimit: await this.rateLimitCache!.getStats()
    };
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{
    redis: boolean;
    caches: Record<string, boolean>;
  }> {
    try {
      await this.initializeCaches();
      
      const testKey = 'health_check_test';
      const testValue = { timestamp: new Date().toISOString() };
      
      const cacheTests = {
        session: await this.sessionCache!.set(testKey, testValue, 10) && 
                 await this.sessionCache!.get(testKey) !== null &&
                 await this.sessionCache!.del(testKey),
        monitor: await this.monitorCache!.set(testKey, testValue, 10) &&
                 await this.monitorCache!.get(testKey) !== null &&
                 await this.monitorCache!.del(testKey),
        aiResponse: await this.aiResponseCache!.set(testKey, testValue, 10) &&
                    await this.aiResponseCache!.get(testKey) !== null &&
                    await this.aiResponseCache!.del(testKey),
        user: await this.userCache!.set(testKey, testValue, 10) &&
              await this.userCache!.get(testKey) !== null &&
              await this.userCache!.del(testKey),
        email: await this.emailCache!.set(testKey, testValue, 10) &&
               await this.emailCache!.get(testKey) !== null &&
               await this.emailCache!.del(testKey),
        rateLimit: await this.rateLimitCache!.set(testKey, testValue, 10) &&
                   await this.rateLimitCache!.get(testKey) !== null &&
                   await this.rateLimitCache!.del(testKey)
      };
      
      const allCachesHealthy = Object.values(cacheTests).every(test => test === true);
      
      return {
        redis: allCachesHealthy,
        caches: cacheTests
      };
      
    } catch (error) {
      console.error('Cache health check failed:', error);
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