interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class SimpleCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTtlMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupThresholdMs: number;

  constructor(defaultTtlMs: number = 60000, cleanupIntervalMs: number = 300000) {
    this.defaultTtlMs = defaultTtlMs;
    this.cleanupThresholdMs = cleanupIntervalMs;
    this.startCleanup();
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  keys(): string[] {
    this.cleanupExpired();
    return Array.from(this.cache.keys());
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, this.cleanupThresholdMs);
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  getStats(): {
    size: number;
    hits: number;
    misses: number;
  } {
    this.cleanupExpired();
    return {
      size: this.cache.size,
      hits: 0,
      misses: 0
    };
  }
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTtlMs: number;

  constructor(maxSize: number = 1000, defaultTtlMs: number = 60000) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
  } {
    this.cleanupExpired();
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const tenantCache = new SimpleCache(300000);

export const permissionCache = new SimpleCache(300000);

export const featureFlagCache = new LRUCache(500, 60000);

export function cacheTenant(tenantId: string, tenant: unknown): void {
  tenantCache.set(`tenant:${tenantId}`, tenant);
}

export function getCachedTenant(tenantId: string): unknown | undefined {
  return tenantCache.get(`tenant:${tenantId}`);
}

export function invalidateTenantCache(tenantId: string): void {
  tenantCache.delete(`tenant:${tenantId}`);
}

export function cachePermissions(userId: string, permissions: string[]): void {
  permissionCache.set(`permissions:${userId}`, permissions);
}

export function getCachedPermissions(userId: string): string[] | undefined {
  return permissionCache.get(`permissions:${userId}`) as string[] | undefined;
}

export function invalidatePermissionCache(userId: string): void {
  permissionCache.delete(`permissions:${userId}`);
}

export function cacheFeatureFlag(key: string, flag: unknown): void {
  featureFlagCache.set(`feature:${key}`, flag);
}

export function getCachedFeatureFlag(key: string): unknown | undefined {
  return featureFlagCache.get(`feature:${key}`);
}

export function invalidateFeatureFlagCache(key: string): void {
  featureFlagCache.delete(`feature:${key}`);
}

export function invalidateAllCaches(): void {
  tenantCache.clear();
  permissionCache.clear();
  featureFlagCache.clear();
}
