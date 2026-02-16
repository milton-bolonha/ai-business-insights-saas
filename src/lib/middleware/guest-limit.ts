import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache/redis";
import { randomUUID, createHmac } from "crypto";

const COOKIE_NAME = "guest_token";
const SECRET = process.env.GUEST_TOKEN_SECRET || "default-guest-secret-change-me";
const GUEST_LIMIT_WINDOW = 60 * 60 * 24 * 30; // 30 days persistence for limits

/**
 * Sign a value with HMAC
 */
function sign(value: string): string {
    const signature = createHmac("sha256", SECRET).update(value).digest("hex");
    return `${value}.${signature}`;
}

/**
 * Verify and extract value from signed string
 */
function unsign(signedValue: string): string | null {
    const [value, signature] = signedValue.split(".");
    if (!value || !signature) return null;

    const expectedSignature = createHmac("sha256", SECRET).update(value).digest("hex");
    if (signature !== expectedSignature) return null;

    return value;
}

export interface GuestLimitResult {
    allowed: boolean;
    guestId: string;
    response?: NextResponse; // If provided, return this immediately (contains Set-Cookie)
    reason?: string;
    remaining?: number;
}

/**
 * Middleware to enforce Guest Limits (Server-Side)
 * 
 * 1. Identifies Guest via Signed Cookie (creates if missing)
 * 2. Checks Redis for usage counts
 * 3. Returns allow/block decision
 */
export async function checkGuestLimit(
    req: NextRequest,
    limitType: "generation" | "tiles" = "generation",
    maxLimit: number = 3,
    requestedAmount: number = 1
): Promise<GuestLimitResult> {
    const cookie = req.cookies.get(COOKIE_NAME);
    let guestId = cookie?.value ? unsign(cookie.value) : null;
    let newCookieNeeded = false;

    if (!guestId) {
        guestId = randomUUID();
        newCookieNeeded = true;
    }

    // Redis Key: guest:{guestId}:usage:{limitType}
    // We also track by IP to prevent cookie clearing abuse
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const guestKey = `guest:${guestId}:usage:${limitType}`;
    const ipKey = `guest_ip:${ip}:usage:${limitType}`;

    try {
        // Check both Cookie-based and IP-based counts
        const [guestUsage, ipUsage] = await Promise.all([
            cache.get<number>(guestKey),
            cache.get<number>(ipKey)
        ]);

        const currentUsage = Math.max(guestUsage || 0, ipUsage || 0);

        // Check if adding the requested amount would exceed limit
        if (currentUsage + requestedAmount > maxLimit) {
            return {
                allowed: false,
                guestId,
                reason: `Visitante atingiu o limite. (Usado: ${currentUsage}, Solicitado: ${requestedAmount}, Máximo: ${maxLimit})`,
                remaining: 0
            };
        }

        // Logic to set the cookie in the response is tricky in Middleware called from Route Handler
        // We return a "response" object if a cookie needs to be set, 
        // but the Route Handler must merge this with its own response.

        // If we need to set a cookie, we construct a dummy response to hold the cookie
        let response: NextResponse | undefined;
        if (newCookieNeeded) {
            response = NextResponse.next();
            response.cookies.set(COOKIE_NAME, sign(guestId), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: GUEST_LIMIT_WINDOW
            });
        }

        return {
            allowed: true,
            guestId,
            response,
            remaining: maxLimit - currentUsage
        };

    } catch (error) {
        console.error("[GuestLimit] Redis error:", error);
        // Fail open if Redis allows, but log it.
        return { allowed: true, guestId, remaining: 1 };
    }
}

/**
 * Increment Guest Usage
 */
export async function incrementGuestUsage(
    guestId: string,
    ip: string,
    limitType: "generation" | "tiles" = "generation",
    amount: number = 1
): Promise<void> {
    const guestKey = `guest:${guestId}:usage:${limitType}`;
    const ipKey = `guest_ip:${ip}:usage:${limitType}`;

    // Increment and set TTL if new
    const ttl = GUEST_LIMIT_WINDOW;

    await Promise.all([
        cache.incr(guestKey, amount),
        cache.incr(ipKey, amount)
    ]);

    // Ensure TTL is set (fire and forget)
    cache.expire(guestKey, ttl);
    cache.expire(ipKey, ttl);
}
