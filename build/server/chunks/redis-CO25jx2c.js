import Redis from 'ioredis';
import { config } from 'dotenv';

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
      keys.forEach((key, index) => {
        const value = values[index];
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

export { RedisCache as R, getRedisClient as g, testRedisConnection as t };
//# sourceMappingURL=redis-CO25jx2c.js.map
