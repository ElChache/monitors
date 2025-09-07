import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { CacheService } from '$lib/server/cache/service';
import { testRedisConnection } from '$lib/server/cache/redis';

// GET /api/cache/test - Test cache functionality
export const GET: RequestHandler = async () => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      throw error(403, 'Cache testing is not available in production');
    }

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      throw error(503, 'Redis connection failed');
    }

    // Run comprehensive cache health check
    const healthCheck = await CacheService.healthCheck();
    
    // Test basic cache operations
    const testKey = `test_${Date.now()}`;
    const testData = {
      message: 'Cache test data',
      timestamp: new Date().toISOString(),
      number: Math.random()
    };

    // Test session cache
    const sessionSet = await CacheService.setSession(testKey, testData);
    const sessionGet = await CacheService.getSession(testKey);
    const sessionDel = await CacheService.deleteSession(testKey);

    // Test monitor cache
    const monitorSet = await CacheService.setMonitor(testKey, testData);
    const monitorGet = await CacheService.getMonitor(testKey);
    const monitorDel = await CacheService.deleteMonitor(testKey);

    // Test AI response cache
    const aiSet = await CacheService.setAIResponse(`test prompt ${testKey}`, testData);
    const aiGet = await CacheService.getAIResponse(`test prompt ${testKey}`);

    // Test rate limiting
    const rateLimit1 = await CacheService.incrementRateLimit('test_user', 'api_calls', 60);
    const rateLimit2 = await CacheService.incrementRateLimit('test_user', 'api_calls', 60);
    const rateLimitStatus = await CacheService.getRateLimit('test_user', 'api_calls');

    return json({
      success: true,
      redis: {
        connected: redisConnected,
        healthCheck
      },
      cacheTests: {
        session: {
          set: sessionSet,
          get: sessionGet !== null && sessionGet.message === testData.message,
          delete: sessionDel
        },
        monitor: {
          set: monitorSet,
          get: monitorGet !== null && monitorGet.message === testData.message,
          delete: monitorDel
        },
        aiResponse: {
          set: aiSet,
          get: aiGet !== null && aiGet.message === testData.message
        },
        rateLimit: {
          increment1: rateLimit1 === 1,
          increment2: rateLimit2 === 2,
          status: rateLimitStatus.current === 2
        }
      },
      testData
    });

  } catch (err) {
    console.error('Cache test error:', err);

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Cache test failed');
  }
};

// POST /api/cache/test - Advanced cache testing
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      throw error(403, 'Cache testing is not available in development mode only');
    }

    const body = await request.json();
    const { operation, cacheType, key, value, ttl } = body;

    let result: any = {
      operation,
      cacheType,
      key,
      success: false
    };

    switch (operation) {
      case 'set':
        if (cacheType === 'session') {
          result.success = await CacheService.setSession(key, value);
        } else if (cacheType === 'monitor') {
          result.success = await CacheService.setMonitor(key, value);
        } else if (cacheType === 'user') {
          result.success = await CacheService.setUser(key, value);
        }
        break;

      case 'get':
        if (cacheType === 'session') {
          result.data = await CacheService.getSession(key);
          result.success = result.data !== null;
        } else if (cacheType === 'monitor') {
          result.data = await CacheService.getMonitor(key);
          result.success = result.data !== null;
        } else if (cacheType === 'user') {
          result.data = await CacheService.getUser(key);
          result.success = result.data !== null;
        }
        break;

      case 'delete':
        if (cacheType === 'session') {
          result.success = await CacheService.deleteSession(key);
        } else if (cacheType === 'monitor') {
          result.success = await CacheService.deleteMonitor(key);
        } else if (cacheType === 'user') {
          result.success = await CacheService.deleteUser(key);
        }
        break;

      case 'rate_limit':
        const count = await CacheService.incrementRateLimit(key, value || 'test', ttl || 3600);
        const status = await CacheService.getRateLimit(key, value || 'test');
        result.success = true;
        result.count = count;
        result.status = status;
        break;

      case 'bulk_invalidate':
        if (key) {
          await CacheService.invalidateUserCache(key);
          result.success = true;
        }
        break;

      default:
        throw error(400, `Unknown operation: ${operation}`);
    }

    return json(result);

  } catch (err) {
    console.error('Cache test POST error:', err);

    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    throw error(500, 'Cache test operation failed');
  }
};