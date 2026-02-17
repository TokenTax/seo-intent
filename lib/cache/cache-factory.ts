import { Cache } from './types';
import { FileCache } from './file-cache';
import { RedisCache } from './redis-cache';

let cacheInstance: Cache | null = null;

/**
 * Create and return a cache instance based on configuration
 * - Uses Redis if REDIS_URL is set (production)
 * - Falls back to file cache for local development
 */
export function getCache(): Cache {
  if (cacheInstance) {
    return cacheInstance;
  }

  const redisUrl = process.env.REDIS_URL;
  const useRedis = process.env.USE_REDIS_CACHE === 'true' || !!redisUrl;

  if (useRedis && redisUrl) {
    console.log('[CacheFactory] Using Redis cache for production');
    cacheInstance = new RedisCache(redisUrl);
  } else {
    console.log('[CacheFactory] Using file-based cache for development');
    const cacheDir = process.env.CACHE_DIR || '.cache';
    cacheInstance = new FileCache(cacheDir);
  }

  return cacheInstance;
}

// Export singleton instance
export const cache = getCache();
