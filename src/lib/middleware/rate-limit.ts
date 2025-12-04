/**
 * Rate Limiting Middleware
 * 
 * Implements IP-based rate limiting using Redis for distributed tracking.
 * Prevents abuse and protects against brute force attacks.
 * 
 * Security: Zero Trust - every request is validated
 */

import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache/redis";
import { getAuth } from "@/lib/auth/get-auth";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

// Default rate limits
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  // Public endpoints (guests)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Too many requests. Please try again later.",
  },
  // Authenticated endpoints (members)
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: "Rate limit exceeded. Please slow down.",
  },
  // Critical endpoints (AI generation, payments)
  critical: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: "Rate limit exceeded for this operation. Please wait before trying again.",
  },
};

/**
 * Get client identifier for rate limiting
 * Uses IP address for guests, userId for members
 */
async function getClientId(request: NextRequest): Promise<string> {
  // Try to get authenticated user first
  try {
    const { userId } = await getAuth();
    if (userId) {
      return `user:${userId}`;
    }
  } catch (error) {
    // If auth fails, fall back to IP
  }

  // Fallback to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip") || 
             "unknown";

  return `ip:${ip}`;
}

/**
 * Get rate limit key for Redis
 */
function getRateLimitKey(clientId: string, endpoint: string, window: number): string {
  const windowId = Math.floor(Date.now() / window);
  return `rate_limit:${endpoint}:${clientId}:${windowId}`;
}

/**
 * Check if request exceeds rate limit
 */
async function checkRateLimit(
  clientId: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!cache.isAvailable()) {
    // If Redis is not available, allow request (fail open)
    console.warn("[RateLimit] Redis not available - allowing request");
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs };
  }

  const key = getRateLimitKey(clientId, endpoint, config.windowMs);
  
  try {
    // Get current count
    const current = await cache.get<number>(key) || 0;

    if (current >= config.maxRequests) {
      // Calculate reset time
      const windowId = Math.floor(Date.now() / config.windowMs);
      const resetAt = (windowId + 1) * config.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Increment counter
    const newCount = current + 1;
    await cache.set(key, newCount, Math.ceil(config.windowMs / 1000)); // TTL in seconds

    return {
      allowed: true,
      remaining: config.maxRequests - newCount,
      resetAt: Date.now() + config.windowMs,
    };
  } catch (error) {
    console.error("[RateLimit] Error checking rate limit:", error);
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: config.maxRequests, resetAt: Date.now() + config.windowMs };
  }
}

/**
 * Determine rate limit config based on endpoint
 */
function getRateLimitConfig(pathname: string, isAuthenticated: boolean): RateLimitConfig {
  // Critical endpoints (AI generation, payments)
  if (
    pathname.startsWith("/api/generate") ||
    pathname.startsWith("/api/stripe") ||
    pathname.startsWith("/api/webhooks/stripe")
  ) {
    return DEFAULT_LIMITS.critical;
  }

  // Authenticated endpoints
  if (isAuthenticated) {
    return DEFAULT_LIMITS.authenticated;
  }

  // Public endpoints (default)
  return DEFAULT_LIMITS.public;
}

/**
 * Rate limiting middleware
 * 
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimit = await checkRateLimitMiddleware(request, "/api/workspace");
 *   if (!rateLimit.allowed) {
 *     return rateLimit.response;
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export async function checkRateLimitMiddleware(
  request: NextRequest,
  endpoint: string = ""
): Promise<{ allowed: boolean; response?: NextResponse; remaining?: number; resetAt?: number }> {
  try {
    const clientId = await getClientId(request);
    const pathname = request.nextUrl.pathname;
    const finalEndpoint = endpoint || pathname;

    // Check if user is authenticated
    let isAuthenticated = false;
    try {
      const { userId } = await getAuth();
      isAuthenticated = !!userId;
    } catch {
      // Not authenticated
    }

    const config = getRateLimitConfig(finalEndpoint, isAuthenticated);
    const result = await checkRateLimit(clientId, finalEndpoint, config);

    if (!result.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: config.message || "Rate limit exceeded",
            retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": config.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": result.resetAt.toString(),
              "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
            },
          }
        ),
        remaining: 0,
        resetAt: result.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };
  } catch (error) {
    console.error("[RateLimit] Error in middleware:", error);
    // Fail open - allow request on error
    return { allowed: true };
  }
}

/**
 * Helper to get rate limit info without blocking
 */
export async function getRateLimitInfo(
  request: NextRequest,
  endpoint: string = ""
): Promise<{ remaining: number; resetAt: number; limit: number }> {
  const clientId = await getClientId(request);
  const pathname = request.nextUrl.pathname;
  const finalEndpoint = endpoint || pathname;

  let isAuthenticated = false;
  try {
    const { userId } = await getAuth();
    isAuthenticated = !!userId;
  } catch {
    // Not authenticated
  }

  const config = getRateLimitConfig(finalEndpoint, isAuthenticated);
  const key = getRateLimitKey(clientId, finalEndpoint, config.windowMs);
  
  try {
    const current = (await cache.get<number>(key)) || 0;
    const windowId = Math.floor(Date.now() / config.windowMs);
    const resetAt = (windowId + 1) * config.windowMs;

    return {
      remaining: Math.max(0, config.maxRequests - current),
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    return {
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
      limit: config.maxRequests,
    };
  }
}

