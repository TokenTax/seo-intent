import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Cache, CacheEntry } from './types';

export class FileCache implements Cache {
  private cacheDir: string;

  constructor(baseDir: string = '.cache') {
    this.cacheDir = path.resolve(process.cwd(), baseDir);
  }

  /**
   * Initialize the cache directory if it doesn't exist
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Generate a safe filename from a cache key
   */
  private getFilePath(key: string): string {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(data);

      // Check if entry has expired
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      // File doesn't exist or is invalid
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in the cache with TTL in hours
   */
  async set<T>(key: string, value: T, ttlHours: number): Promise<void> {
    await this.ensureCacheDir();

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + (ttlHours * 60 * 60 * 1000),
    };

    const filePath = this.getFilePath(key);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
  }

  /**
   * Check if a key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist - ignore
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Cache delete error:', error);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Cache clear error:', error);
      }
    }
  }
}

// Don't export singleton here - use cache factory instead
// This allows for dynamic selection between file and Redis cache
