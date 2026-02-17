import Redis from 'ioredis';
import { Cache, CacheEntry } from './types';

/**
 * Redis-based cache implementation for production use
 * Compatible with Redis, Upstash, Vercel KV, and other Redis providers
 */
export class RedisCache implements Cache {
  private client: Redis;
  private connected: boolean = false;

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL;

    if (!url) {
      throw new Error('Redis URL not provided. Set REDIS_URL environment variable.');
    }

    console.log('[RedisCache] Connecting to Redis...');
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.connected = true;
      console.log('[RedisCache] Connected to Redis');
    });

    this.client.on('error', (err) => {
      console.error('[RedisCache] Redis error:', err);
      this.connected = false;
    });

    // Connect immediately
    this.client.connect().catch((err) => {
      console.error('[RedisCache] Failed to connect to Redis:', err);
    });
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(data);

      // Check if entry has expired
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('[RedisCache] Get error:', error);
      return null;
    }
  }

  /**
   * Set a value in the cache with TTL in hours
   */
  async set<T>(key: string, value: T, ttlHours: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + (ttlHours * 60 * 60 * 1000),
      };

      const ttlSeconds = Math.floor(ttlHours * 60 * 60);
      await this.client.setex(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      console.error('[RedisCache] Set error:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      console.error('[RedisCache] Has error:', error);
      return false;
    }
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('[RedisCache] Delete error:', error);
    }
  }

  /**
   * Clear all cache entries (use with caution!)
   */
  async clear(): Promise<void> {
    try {
      await this.client.flushdb();
      console.log('[RedisCache] Cache cleared');
    } catch (error) {
      console.error('[RedisCache] Clear error:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      console.log('[RedisCache] Disconnected from Redis');
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
