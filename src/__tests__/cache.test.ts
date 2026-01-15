import { ResponseCache, cachedFetch } from '../../src/utils/cache';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache({
      ttl: 1000, // 1 second
      staleAfter: 500, // 500ms
    });
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const data = { name: 'test', value: 123 };
      cache.set('key1', data);

      const result = cache.get('key1');
      expect(result.data).toEqual(data);
      expect(result.isStale).toBe(false);
    });

    it('should return null for missing key', () => {
      const result = cache.get('nonexistent');
      expect(result.data).toBeNull();
      expect(result.isStale).toBe(false);
    });

    it('should support custom TTL', () => {
      const data = { test: 'data' };
      cache.set('key1', data, 5000); // 5 second TTL

      const result = cache.get('key1');
      expect(result.data).toEqual(data);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire data after TTL', (done) => {
      cache.set('key1', { data: 'test' }, 100); // 100ms TTL

      setTimeout(() => {
        const result = cache.get('key1');
        expect(result.data).toBeNull();
        done();
      }, 150);
    });

    it('should return stale flag when data becomes stale', (done) => {
      cache.set('key1', { data: 'test' }, 1000);

      setTimeout(() => {
        const result = cache.get('key1');
        expect(result.data).not.toBeNull();
        expect(result.isStale).toBe(true);
        done();
      }, 600);
    });
  });

  describe('Cache Operations', () => {
    it('should check if key exists', () => {
      cache.set('key1', { data: 'test' });
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should check if key is stale', (done) => {
      cache.set('key1', { data: 'test' }, 1000);

      // Fresh
      expect(cache.isStale('key1')).toBe(false);

      // Wait for stale threshold
      setTimeout(() => {
        expect(cache.isStale('key1')).toBe(true);
        done();
      }, 600);
    });

    it('should delete key', () => {
      cache.set('key1', { data: 'test' });
      expect(cache.has('key1')).toBe(true);

      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', { data: 'test1' });
      cache.set('key2', { data: 'test2' });

      cache.clear();
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should report cache size', () => {
      cache.set('key1', { data: 'test1' });
      cache.set('key2', { data: 'test2' });

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it('should list cache entries with age and status', () => {
      cache.set('key1', { data: 'test' }, 1000);

      const stats = cache.getStats();
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].key).toBe('key1');
      expect(stats.entries[0].ttl).toBe(1000);
      expect(stats.entries[0].age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Cleanup', () => {
    it('should remove expired entries', (done) => {
      cache.set('key1', { data: 'test' }, 100);
      cache.set('key2', { data: 'test' }, 10000);

      setTimeout(() => {
        const deleted = cache.cleanup();
        expect(deleted).toBe(1);
        expect(cache.has('key1')).toBe(false);
        expect(cache.has('key2')).toBe(true);
        done();
      }, 150);
    });

    it('should return count of deleted entries', (done) => {
      cache.set('key1', { data: 'test' }, 100);
      cache.set('key2', { data: 'test' }, 100);
      cache.set('key3', { data: 'test' }, 10000);

      setTimeout(() => {
        const deleted = cache.cleanup();
        expect(deleted).toBe(2);
        done();
      }, 150);
    });
  });

  describe('Multiple Data Types', () => {
    it('should handle strings', () => {
      cache.set('string', 'test string');
      expect(cache.get('string').data).toBe('test string');
    });

    it('should handle numbers', () => {
      cache.set('number', 42);
      expect(cache.get('number').data).toBe(42);
    });

    it('should handle objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      cache.set('object', obj);
      expect(cache.get('object').data).toEqual(obj);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, { a: 3 }];
      cache.set('array', arr);
      expect(cache.get('array').data).toEqual(arr);
    });

    it('should handle null values', () => {
      cache.set('null', null);
      // Note: This tests implementation detail - null is falsy but should be stored
      const result = cache.get('null');
      expect(result.data).toBeNull();
    });
  });
});

describe('cachedFetch', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache({ ttl: 1000, staleAfter: 500 });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return cached data on cache hit', async () => {
    const cachedData = { id: 1, name: 'test' };
    cache.set('/api/data', cachedData);

    // @ts-ignore
    const result = await cachedFetch('/api/data', cache);

    expect(result.data).toEqual(cachedData);
    expect(result.fromCache).toBe(true);
    expect(result.isStale).toBe(false);
  });

  it('should fetch fresh data on cache miss', async () => {
    const freshData = { id: 2, name: 'fresh' };
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => freshData,
    });

    // @ts-ignore
    const result = await cachedFetch('/api/data', cache);

    expect(result.data).toEqual(freshData);
    expect(result.fromCache).toBe(false);
    expect(result.isStale).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should cache fetched data', async () => {
    const freshData = { id: 3, name: 'fresh' };
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => freshData,
    });

    // @ts-ignore
    await cachedFetch('/api/data', cache);

    // Second call should use cache
    // @ts-ignore
    const result = await cachedFetch('/api/data', cache);
    expect(result.fromCache).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should fall back to stale data on fetch error', async () => {
    const staleData = { id: 4, name: 'stale' };
    cache.set('/api/data', staleData);

    // @ts-ignore
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    // @ts-ignore
    const result = await cachedFetch('/api/data', cache);

    expect(result.data).toEqual(staleData);
    expect(result.fromCache).toBe(true);
    expect(result.isStale).toBe(true);
  });

  it('should throw if no cache and fetch fails', async () => {
    // @ts-ignore
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    // @ts-ignore
    await expect(cachedFetch('/api/data', cache)).rejects.toThrow();
  });

  it('should handle fetch with custom cache key', async () => {
    const data = { id: 5, name: 'test' };
    cache.set('custom-key', data);

    // @ts-ignore
    const result = await cachedFetch('/api/data', cache, {
      cacheKey: 'custom-key',
    });

    expect(result.data).toEqual(data);
    expect(result.fromCache).toBe(true);
  });

  it('should handle fetch with custom TTL', async () => {
    const data = { id: 6, name: 'test' };
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => data,
    });

    // @ts-ignore
    await cachedFetch('/api/data', cache, { cacheTTL: 5000 });

    const stats = cache.getStats();
    expect(stats.entries[0].ttl).toBe(5000);
  });
});
