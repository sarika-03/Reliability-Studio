/**
 * Response Caching System
 * Provides graceful degradation with stale-while-revalidate pattern
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  staleAfter?: number; // Time after which data becomes stale (milliseconds)
}

export interface CacheOptions {
  ttl?: number; // Default: 5 minutes
  staleWhileRevalidate?: boolean; // Default: true
  staleAfter?: number; // Default: 3 minutes (ttl - 2 minutes)
}

/**
 * In-memory response cache with TTL and stale-while-revalidate support
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL: number;
  private readonly staleWhileRevalidate: boolean;
  private readonly defaultStaleAfter: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes
    this.staleWhileRevalidate = options.staleWhileRevalidate !== false;
    this.defaultStaleAfter = options.staleAfter || Math.max(0, this.defaultTTL - 2 * 60 * 1000);
  }

  /**
   * Generate cache key from URL and optional parameters
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }
    const paramStr = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join('&');
    return `${url}?${paramStr}`;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const finalTTL = ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalTTL,
      staleAfter: this.defaultStaleAfter,
    };
    this.cache.set(key, entry);
    console.debug(`[Cache] Stored key: ${key} (TTL: ${finalTTL}ms)`);
  }

  /**
   * Get data from cache
   * Returns { data, isStale } to support stale-while-revalidate
   */
  get<T>(key: string): { data: T | null; isStale: boolean } {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return { data: null, isStale: false };
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      console.debug(`[Cache] Expired key: ${key} (age: ${age}ms, TTL: ${entry.ttl}ms)`);
      return { data: null, isStale: false };
    }

    // Check if entry is stale (but still usable)
    const isStale = entry.staleAfter !== undefined && age > entry.staleAfter;
    if (isStale && this.staleWhileRevalidate) {
      console.debug(`[Cache] Returning stale data for key: ${key} (age: ${age}ms)`);
    } else if (!isStale) {
      console.debug(`[Cache] Cache hit for key: ${key} (age: ${age}ms)`);
    }

    return { data: entry.data as T, isStale };
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const { data } = this.get(key);
    return data !== null;
  }

  /**
   * Check if key exists and is stale
   */
  isStale(key: string): boolean {
    const { isStale } = this.get(key);
    return isStale;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.debug(`[Cache] Deleted key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.debug(`[Cache] Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number; isStale: boolean }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const age = now - entry.timestamp;
      const isStale = entry.staleAfter !== undefined && age > entry.staleAfter;
      return { key, age, ttl: entry.ttl, isStale };
    });

    return { size: this.cache.size, entries };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const before = this.cache.size;
    const now = Date.now();

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });

    const deleted = before - this.cache.size;
    if (deleted > 0) {
      console.debug(`[Cache] Cleanup removed ${deleted} expired entries`);
    }
    return deleted;
  }
}

/**
 * Cached fetch with automatic retry and fallback to stale data
 */
export async function cachedFetch<T>(
  url: string,
  cache: ResponseCache,
  fetchOptions?: RequestInit & { cacheKey?: string; cacheTTL?: number }
): Promise<{ data: T | null; fromCache: boolean; isStale: boolean }> {
  const cacheKey = fetchOptions?.cacheKey || url;

  // Check cache first
  const { data: cachedData, isStale } = cache.get<T>(cacheKey);
  if (cachedData !== null) {
    return { data: cachedData, fromCache: true, isStale };
  }

  // Cache miss, perform fetch
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json() as T;
    cache.set(cacheKey, data, fetchOptions?.cacheTTL);
    return { data, fromCache: false, isStale: false };
  } catch (error) {
    // If fetch fails, check for stale data
    const { data: staleData } = cache.get<T>(cacheKey);
    if (staleData !== null) {
      console.warn(
        `[CachedFetch] Fetch failed, falling back to stale data for ${url}:`,
        error instanceof Error ? error.message : String(error)
      );
      return { data: staleData, fromCache: true, isStale: true };
    }

    throw error;
  }
}

/**
 * Global response cache instance
 */
export const responseCache = new ResponseCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
  staleAfter: 3 * 60 * 1000, // 3 minutes (becomes stale after 2 minutes)
});

/**
 * Decorator for caching fetch results
 * Usage: @cacheFetch({ ttl: 300000 })
 *        async getIncidents() { ... }
 */
export function cacheFetch(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodCache = new ResponseCache(options);
    const cacheKey = `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const { data, isStale } = methodCache.get(cacheKey);
      if (data !== null) {
        if (isStale) {
          console.debug(`[CacheDecorator] Using stale cache for ${cacheKey}`);
        } else {
          console.debug(`[CacheDecorator] Cache hit for ${cacheKey}`);
        }
        return data;
      }

      const result = await originalMethod.apply(this, args);
      methodCache.set(cacheKey, result);
      return result;
    };

    return descriptor;
  };
}
