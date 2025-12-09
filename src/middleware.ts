import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Nenhuma rota Stripe/usage protegida para permitir upgrade de guests
const isProtectedRoute = createRouteMatcher([]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Apply rate limiting to API routes
  if (req.nextUrl.pathname.startsWith("/api")) {
    try {
      const rateLimit = await checkRateLimitMiddleware(req);
      if (!rateLimit.allowed && rateLimit.response) {
        // Audit log rate limit exceeded (lazy import to avoid Edge Runtime issues)
        // Note: This will only work if the API route that handles audit logging uses Node.js runtime
        try {
          const { audit } = await import("@/lib/audit/logger");
          // Fire and forget - don't await to avoid blocking
          audit
            .rateLimitExceeded(
              req.nextUrl.pathname,
              req.headers.get("x-forwarded-for") ||
                req.headers.get("x-real-ip") ||
                "unknown",
              req
            )
            .catch((err) => {
              // Silently fail - audit logging shouldn't break the app
              console.error("[Middleware] Audit log failed:", err);
            });
        } catch (auditError) {
          // If audit import fails (Edge Runtime), just log to console
          console.warn(
            "[Middleware] Rate limit exceeded (audit logging unavailable in Edge Runtime):",
            req.nextUrl.pathname
          );
        }
        return rateLimit.response;
      }
    } catch (error) {
      // If rate limiting fails, allow request (fail open)
      console.error("[Middleware] Rate limit check failed:", error);
    }
  }

  // Apply authentication protection
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
