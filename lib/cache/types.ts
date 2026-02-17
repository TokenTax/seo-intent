export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlHours: number): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  delete(key: string): Promise<void>;
}
