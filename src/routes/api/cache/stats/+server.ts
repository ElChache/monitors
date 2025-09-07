import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { CacheService } from '$lib/server/cache/service';
import { CacheTrackingService } from '$lib/server/cache/tracking';

// GET /api/cache/stats - Get cache statistics and performance data
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Only allow in development/staging environment for security
    if (process.env.NODE_ENV === 'production' && process.env.CACHE_STATS_ENABLED !== 'true') {
      throw error(403, 'Cache statistics are not available in production');
    }

    const type = url.searchParams.get('type'); // Optional: specific cache type
    const detailed = url.searchParams.get('detailed') === 'true';

    // Get basic cache statistics
    const cacheStats = await CacheService.getCacheStats();
    
    // Get health check
    const healthCheck = await CacheService.healthCheck();

    let result: any = {
      timestamp: new Date().toISOString(),
      redis: healthCheck.redis,
      caches: healthCheck.caches,
      stats: cacheStats
    };

    // Add detailed analytics if requested
    if (detailed) {
      const analytics = await CacheTrackingService.getCacheAnalytics();
      result.analytics = analytics;

      // Add top keys for specific cache type if requested
      if (type) {
        const topKeys = await CacheTrackingService.getTopCacheKeys(
          type as any, 
          10
        );
        result.topKeys = topKeys;
      }
    }

    return json(result);

  } catch (err) {
    console.error('Cache stats error:', err);

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to retrieve cache statistics');
  }
};

// POST /api/cache/stats - Clear cache statistics (development only)
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      throw error(403, 'Cache statistics clearing is only available in development');
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'cleanup') {
      const days = body.days || 7;
      const cleaned = await CacheTrackingService.cleanupOldEvents(days);
      
      return json({
        success: true,
        message: `Cleaned up cache events older than ${days} days`,
        eventsRemoved: cleaned
      });
    }

    throw error(400, 'Unknown action');

  } catch (err) {
    console.error('Cache stats POST error:', err);

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to process cache statistics request');
  }
};