// Simple in-memory cache with TTL support
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Set a value in the cache with optional TTL
 */
export function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Get a value from the cache
 * Returns null if expired or not found
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Check if a key exists in the cache and is not expired
 */
export function hasCache(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return false;
  }

  return true;
}

/**
 * Delete a key from the cache
 */
export function deleteCache(key: string): boolean {
  return cache.delete(key);
}

/**
 * Clear all entries from the cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Delete expired entries from the cache
 */
export function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

// Cleanup expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(cleanCache, 60 * 1000); // Cleanup every minute
}

/**
 * Create a cached async function
 * If cached value exists and is not expired, returns cached value
 * Otherwise calls the function and caches the result
 */
export async function cachedAsync<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fn();
  setCache(key, value, ttl);
  return value;
}

/**
 * Create a cached sync function
 */
export function cached<T>(key: string, fn: () => T, ttl = DEFAULT_TTL): T {
  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = fn();
  setCache(key, value, ttl);
  return value;
}
