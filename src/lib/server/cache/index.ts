// Main cache service exports
export { CacheService } from './service';
export { 
  RedisCache, 
  getRedisClient, 
  getRedisSubscriber, 
  getRedisPublisher,
  closeRedisConnections,
  testRedisConnection 
} from './redis';
export { CacheTrackingService } from './tracking';

export type { CacheEvent } from './tracking';

// Cache configuration exports
export { CACHE_PREFIXES, CACHE_TTL } from './service';