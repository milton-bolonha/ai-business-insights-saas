/**
 * Redis Cache Client
 * Supports both Vercel KV and Upstash Redis
 */

import { kv } from "@vercel/kv";
import { Redis } from "@upstash/redis";

type CacheImplementation = "vercel" | "upstash" | null;

let cacheImpl: CacheImplementation = null;
let vercelClient: typeof kv | null = null;
let upstashClient: Redis | null = null;

// Try to initialize Vercel KV first
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    vercelClient = kv;
    cacheImpl = "vercel";
    console.log("[Cache] ✅ Using Vercel KV");
  }
} catch (err) {
  console.warn("[Cache] Vercel KV not available, trying Upstash...", err);
}

// Fallback to Upstash if Vercel KV is not available
if (!vercelClient) {
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      upstashClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      cacheImpl = "upstash";
      console.log("[Cache] ✅ Using Upstash Redis");
    }
  } catch (err) {
    console.warn("[Cache] Upstash Redis not available", err);
  }
}

function getClient() {
  if (cacheImpl === "vercel") {
    return vercelClient;
  }
  if (cacheImpl === "upstash") {
    return upstashClient;
  }
  console.warn("[Cache] ⚠️ No Redis client available - caching will be disabled");
  return null;
}

/**
 * Cache helper functions
 * Gracefully handles missing Redis client
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getClient();
    if (!client) {
      return null;
    }

    try {
      if (cacheImpl === "vercel") {
        const data = (await client.get(key)) as T | null;
        return data;
      } else if (cacheImpl === "upstash") {
        const data = await client.get(key);
        if (data) {
          // Upstash returns JSON strings, parse if needed
          return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
        }
        return null;
      }
      return null;
    } catch (error) {
      console.warn(`[Cache] Get failed for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    const client = getClient();
    if (!client) {
      return;
    }

    try {
      if (cacheImpl === "vercel") {
        if (ttlSeconds) {
          await client.setex(key, ttlSeconds, data);
        } else {
          await client.set(key, data);
        }
      } else if (cacheImpl === "upstash") {
        const serialized = JSON.stringify(data);
        if (ttlSeconds) {
          await client.setex(key, ttlSeconds, serialized);
        } else {
          await client.set(key, serialized);
        }
      }
    } catch (error) {
      console.warn(`[Cache] Set failed for key "${key}":`, error);
    }
  },

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    const client = getClient();
    if (!client) {
      return;
    }

    try {
      await client.del(key);
    } catch (error) {
      console.warn(`[Cache] Delete failed for key "${key}":`, error);
    }
  },

  /**
   * Delete multiple keys
   */
  async delMultiple(keys: string[]): Promise<void> {
    const client = getClient();
    if (!client || keys.length === 0) {
      return;
    }

    try {
      if (cacheImpl === "vercel") {
        // Vercel KV doesn't support batch delete, delete one by one
        await Promise.all(keys.map((key) => client.del(key)));
      } else if (cacheImpl === "upstash") {
        await client.del(...keys);
      }
    } catch (error) {
      console.warn(`[Cache] Delete multiple failed:`, error);
    }
  },

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return getClient() !== null;
  },

  /**
   * Get cache implementation type
   */
  getImplementation(): "vercel" | "upstash" | null {
    return cacheImpl;
  },

  /**
   * Find keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const client = getClient();
    if (!client) {
      return [];
    }

    try {
      if (cacheImpl === "vercel") {
        return await client.keys(pattern);
      } else if (cacheImpl === "upstash") {
        return await client.keys(pattern);
      }
      return [];
    } catch (error) {
      console.warn(`[Cache] Keys failed for pattern "${pattern}":`, error);
      return [];
    }
  },
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  contacts: {
    dashboard: (dashboardId: string) => `contacts:dashboard:${dashboardId}`,
    workspace: (workspaceId: string) => `contacts:workspace:${workspaceId}`,
  },
  notes: {
    dashboard: (dashboardId: string) => `notes:dashboard:${dashboardId}`,
    workspace: (workspaceId: string) => `notes:workspace:${workspaceId}`,
  },
  tiles: {
    dashboard: (dashboardId: string) => `tiles:dashboard:${dashboardId}`,
    workspace: (workspaceId: string) => `tiles:workspace:${workspaceId}`,
  },
};

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  contacts: 300, // 5 minutos
  notes: 300, // 5 minutos
  tiles: 600, // 10 minutos (mudam menos)
  workspaces: 1800, // 30 minutos
};

