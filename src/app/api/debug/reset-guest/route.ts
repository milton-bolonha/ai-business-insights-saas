import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache/redis";
import { getClientId } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.DEV_MODE !== "true") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const clientId = await getClientId(request);
    
    // Find all rate limit keys for this client (ip or user)
    // Pattern: rate_limit:*:${clientId}:*
    const pattern = `rate_limit:*:${clientId}:*`;
    const keys = await cache.keys(pattern);

    if (keys.length > 0) {
      await cache.delMultiple(keys);
      console.log(`[Debug] Reset ${keys.length} rate limit keys for ${clientId}`);
    }

    return NextResponse.json({ 
      success: true, 
      keysDeleted: keys.length,
      clientId 
    });
  } catch (error) {
    console.error("[Debug] Reset failed:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
