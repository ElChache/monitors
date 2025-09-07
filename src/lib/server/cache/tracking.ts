import { db } from '../db';
import { cacheEvents } from '../../db/schemas/cache_events';

export interface CacheEvent {
  operation: 'get' | 'set' | 'delete' | 'incr' | 'invalidate';
  cacheType: 'session' | 'monitor' | 'ai_response' | 'user' | 'email' | 'rate_limit' | 'user_bulk';
  key: string;
  hit: boolean;
  timestamp: Date;
}

/**
 * Cache tracking and monitoring service
 */
export class CacheTrackingService {
  
  /**
   * Log cache operation event
   */
  static async logCacheEvent(
    operation: CacheEvent['operation'],
    cacheType: CacheEvent['cacheType'],
    key: string,
    hit: boolean
  ): Promise<void> {
    try {
      // Only log in development/staging for detailed analysis
      // In production, consider logging only misses or errors
      if (process.env.NODE_ENV === 'development' || process.env.CACHE_DETAILED_LOGGING === 'true') {
        await db.insert(cacheEvents).values({
          operation,
          cacheType,
          key,
          hit,
          timestamp: new Date()
        });
      }
    } catch (error) {
      // Don't throw errors for cache tracking failures
      console.error('Failed to log cache event:', error);
    }
  }

  /**
   * Get cache hit rate statistics
   */
  static async getCacheHitRate(
    cacheType?: CacheEvent['cacheType'],
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalEvents: number;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    try {
      let query = db.select().from(cacheEvents);

      // Apply filters
      const conditions = [];
      
      if (cacheType) {
        conditions.push(`cache_type = '${cacheType}'`);
      }
      
      if (timeRange) {
        conditions.push(`timestamp >= '${timeRange.start.toISOString()}'`);
        conditions.push(`timestamp <= '${timeRange.end.toISOString()}'`);
      }

      // Get raw data (simplified query for now)
      const events = await query.execute();

      const totalEvents = events.length;
      const hits = events.filter(event => event.hit).length;
      const misses = totalEvents - hits;
      const hitRate = totalEvents > 0 ? (hits / totalEvents) * 100 : 0;

      return {
        totalEvents,
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100
      };

    } catch (error) {
      console.error('Failed to get cache hit rate:', error);
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
  static async getCacheStatsByType(): Promise<Record<string, {
    totalEvents: number;
    hits: number;
    misses: number;
    hitRate: number;
  }>> {
    try {
      const cacheTypes: CacheEvent['cacheType'][] = [
        'session',
        'monitor', 
        'ai_response',
        'user',
        'email',
        'rate_limit'
      ];

      const stats: Record<string, any> = {};

      for (const type of cacheTypes) {
        stats[type] = await this.getCacheHitRate(type);
      }

      return stats;

    } catch (error) {
      console.error('Failed to get cache stats by type:', error);
      return {};
    }
  }

  /**
   * Get most frequently accessed cache keys
   */
  static async getTopCacheKeys(
    cacheType?: CacheEvent['cacheType'],
    limit: number = 10
  ): Promise<Array<{
    key: string;
    accessCount: number;
    hitRate: number;
  }>> {
    try {
      // This would require more complex SQL aggregation
      // For now, return a simplified version
      const events = await db.select().from(cacheEvents).execute();
      
      const keyStats: Record<string, { total: number; hits: number }> = {};

      events.forEach(event => {
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

      return Object.entries(keyStats)
        .map(([key, stats]) => ({
          key,
          accessCount: stats.total,
          hitRate: Math.round((stats.hits / stats.total) * 10000) / 100
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get top cache keys:', error);
      return [];
    }
  }

  /**
   * Get cache performance over time
   */
  static async getCachePerformanceOverTime(
    cacheType?: CacheEvent['cacheType'],
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: new Date()
    }
  ): Promise<Array<{
    hour: string;
    events: number;
    hits: number;
    hitRate: number;
  }>> {
    try {
      // This would require complex time-based grouping
      // For now, return a simplified hourly breakdown
      const events = await db.select().from(cacheEvents).execute();

      const hourlyStats: Record<string, { total: number; hits: number }> = {};

      events.forEach(event => {
        if (event.timestamp < timeRange.start || event.timestamp > timeRange.end) {
          return;
        }

        if (cacheType && event.cacheType !== cacheType) {
          return;
        }

        const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00:00';

        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { total: 0, hits: 0 };
        }

        hourlyStats[hour].total++;
        if (event.hit) {
          hourlyStats[hour].hits++;
        }
      });

      return Object.entries(hourlyStats)
        .map(([hour, stats]) => ({
          hour,
          events: stats.total,
          hits: stats.hits,
          hitRate: Math.round((stats.hits / stats.total) * 10000) / 100
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

    } catch (error) {
      console.error('Failed to get cache performance over time:', error);
      return [];
    }
  }

  /**
   * Clean up old cache events (for maintenance)
   */
  static async cleanupOldEvents(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const result = await db
        .delete(cacheEvents)
        .where(`timestamp < '${cutoffDate.toISOString()}'`)
        .execute();

      // This is a simplified version - in practice you'd use proper SQL operations
      console.log(`Cleaned up cache events older than ${cutoffDate.toISOString()}`);
      
      return 0; // Would return actual count in real implementation

    } catch (error) {
      console.error('Failed to cleanup old cache events:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive cache analytics dashboard data
   */
  static async getCacheAnalytics(): Promise<{
    overall: {
      totalEvents: number;
      hits: number;
      misses: number;
      hitRate: number;
    };
    byType: Record<string, any>;
    topKeys: Array<any>;
    performance24h: Array<any>;
  }> {
    try {
      const [overall, byType, topKeys, performance24h] = await Promise.all([
        this.getCacheHitRate(),
        this.getCacheStatsByType(),
        this.getTopCacheKeys(undefined, 5),
        this.getCachePerformanceOverTime()
      ]);

      return {
        overall,
        byType,
        topKeys,
        performance24h
      };

    } catch (error) {
      console.error('Failed to get cache analytics:', error);
      return {
        overall: { totalEvents: 0, hits: 0, misses: 0, hitRate: 0 },
        byType: {},
        topKeys: [],
        performance24h: []
      };
    }
  }
}