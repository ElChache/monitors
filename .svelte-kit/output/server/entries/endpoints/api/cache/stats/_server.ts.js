import { error, json } from "@sveltejs/kit";
import { C as CacheService, a as CacheTrackingService } from "../../../../../chunks/service2.js";
const GET = async ({ url }) => {
  try {
    if (process.env.NODE_ENV === "production" && process.env.CACHE_STATS_ENABLED !== "true") {
      throw error(403, "Cache statistics are not available in production");
    }
    const type = url.searchParams.get("type");
    const detailed = url.searchParams.get("detailed") === "true";
    const cacheStats = await CacheService.getCacheStats();
    const healthCheck = await CacheService.healthCheck();
    let result = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      redis: healthCheck.redis,
      caches: healthCheck.caches,
      stats: cacheStats
    };
    if (detailed) {
      const analytics = await CacheTrackingService.getCacheAnalytics();
      result.analytics = analytics;
      if (type) {
        const topKeys = await CacheTrackingService.getTopCacheKeys(
          type,
          10
        );
        result.topKeys = topKeys;
      }
    }
    return json(result);
  } catch (err) {
    console.error("Cache stats error:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to retrieve cache statistics");
  }
};
const POST = async ({ request }) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      throw error(403, "Cache statistics clearing is only available in development");
    }
    const body = await request.json();
    const { action } = body;
    if (action === "cleanup") {
      const days = body.days || 7;
      const cleaned = await CacheTrackingService.cleanupOldEvents(days);
      return json({
        success: true,
        message: `Cleaned up cache events older than ${days} days`,
        eventsRemoved: cleaned
      });
    }
    throw error(400, "Unknown action");
  } catch (err) {
    console.error("Cache stats POST error:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to process cache statistics request");
  }
};
export {
  GET,
  POST
};
