import { NextRequest, NextResponse } from "next/server";
import { fetchMLMarketData } from "@/lib/services/market-data-service";
import { getAuth } from "@/lib/auth/get-auth";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    // Enforcement: Check limit
    if (userId) {
      const limit = await checkLimit(userId, "marketEnrichmentCount");
      if (!limit.allowed) {
        return NextResponse.json({ error: limit.reason }, { status: 402 });
      }
    }

    console.log(`[API/Market] Fetching ML data for: ${q}`);
    const stats = await fetchMLMarketData(q);

    // Increment usage
    if (userId && stats) {
      await incrementUsage(userId, "marketEnrichmentCount", 1);
    }

    return NextResponse.json(stats, {
        headers: {
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        }
    });
  } catch (error) {
    console.error(`[API/Market] Upstream ML Error:`, error);
    return NextResponse.json({
        error: "Mercado Livre API Unavailable",
        message: error instanceof Error ? error.message : "Possible authentication or rate limit issue",
        help: "Check ML_CLIENT_ID/SECRET and app permissions in ML dashboard."
    }, { status: 502 });
  }
}
