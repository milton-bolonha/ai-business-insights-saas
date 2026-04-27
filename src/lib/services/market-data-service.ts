/**
 * Market Data Service
 * 
 * Fetches and processes real-time market data from Mercado Livre (ML) API.
 * Uses a Master Token stored in MongoDB (OAuth 2.0 Authorization Code Flow).
 */
import { db } from "@/lib/db/mongodb";

export interface MarketStats {
  used: {
    median: number;
    p10: number;
    p90: number;
    count: number;
  };
  new: {
    median: number;
    p10: number;
    p90: number;
    count: number;
  };
  confidence: number;
}

const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";
const ML_SEARCH_URL = "https://api.mercadolibre.com/sites/MLB/search";

/**
 * Gets the Master Token from MongoDB and handles auto-refresh if expired.
 */
async function getMasterAccessToken() {
  const adminIntegration = await db.findOne<any>("integrations", { provider: "mercadolivre" });

  if (!adminIntegration) {
    console.warn("[MarketDataService] ⚠️ No Master ML Connection found. Please visit /api/auth/ml/login");
    return null;
  }

  const { accessToken, refreshToken, expiresAt } = adminIntegration;

  // Check if token is expired (with 30s buffer)
  if (Date.now() > (expiresAt - 30000)) {
    console.log("[MarketDataService] 🔄 Master Token expired. Refreshing...");
    
    try {
      const resp = await fetch(ML_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.ML_CLIENT_ID || "",
          client_secret: process.env.ML_CLIENT_SECRET || "",
          refresh_token: refreshToken,
        }).toString(),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error("[MarketDataService] ❌ Token Refresh FAILED:", data);
        return null;
      }

      // Update MongoDB with new tokens
      const newExpiry = Date.now() + (data.expires_in * 1000);
      await db.updateOne(
        "integrations",
        { provider: "mercadolivre" },
        { 
          $set: { 
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: newExpiry,
            updatedAt: new Date()
          } 
        }
      );

      console.log("[MarketDataService] ✅ Master Token refreshed successfully");
      return data.access_token;
    } catch (err) {
      console.error("[MarketDataService] ❌ Unexpected refresh error:", err);
      return null;
    }
  }

  return accessToken;
}

export async function fetchMLMarketData(query: string): Promise<MarketStats | null> {
  try {
    const token = await getMasterAccessToken();
    
    // If we have no token, we can't perform an authorized search.
    // Based on recent ML changes, unauthorized requests to /search return 403.
    if (!token) {
      console.error("[MarketDataService] ❌ Unauthorized: Cannot fetch market data without active ML connection.");
      return null;
    }

    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(" ").slice(0, 4).join(" ");
    
    // Fetch 50 items to have a good sample
    const url = `${ML_SEARCH_URL}?q=${encodeURIComponent(normalizedQuery)}&limit=50`;
    
    const resp = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    const data = await resp.json();

    if (!resp.ok) {
        console.error(`[MarketDataService] ML Search FAILED. Status: ${resp.status}, Error:`, data);
        return null; // Return null instead of throwing to allow generation fallback
    }

    const results = data.results || [];
    
    // 1. Cleaning and Filtering (Market Intelligence Layer)
    const cleanResults = results.filter((item: any) => {
      const title = item.title.toLowerCase();
      const price = item.price;

      // 🛑 JUNK FILTER: Expand exclusion for Brazilian market noise
      const junkRegex = /peças|defeito|não funciona|quebrado|sucata|lixo|para retirar|queimado|conserto|avariad[oa]/;
      if (junkRegex.test(title)) return false;

      // 🛑 PRICE FLOOR: Ignore items below 150 BRL (likely accessories or scam)
      if (price < 150) return false; 
      
      return true;
    });

    const usedItems = cleanResults.filter((i: any) => i.condition === "used");
    const newItems = cleanResults.filter((i: any) => i.condition === "new");

    const usedStats = computeStats(usedItems);
    const newStats = computeStats(newItems);

    // 2. Confidence Scoring
    const confidence = calculateConfidence(usedStats.count, usedStats.p10, usedStats.p90, usedStats.median);

    return {
      used: usedStats,
      new: newStats,
      confidence,
    };
  } catch (error) {
    console.error("[MarketDataService] Unexpected error during fetch:", error);
    return null;
  }
}

function computeStats(items: any[]) {
  if (items.length === 0) {
    return { median: 0, p10: 0, p90: 0, count: 0 };
  }

  // Sort prices ascending
  const prices = items.map((i) => i.price).sort((a, b) => a - b);
  
  // 📈 PERCENTILE CLEANING: Focus on the "Real Market Heart" (P10 to P90)
  const p10Idx = Math.floor(prices.length * 0.1);
  const p90Idx = Math.floor(prices.length * 0.9);
  
  const coreMarketPrices = prices.slice(p10Idx, p90Idx + 1);

  if (coreMarketPrices.length === 0) return { median: 0, p10: 0, p90: 0, count: 0 };

  // Calculate stats based on the cleaned core
  const p10 = coreMarketPrices[0];
  const p90 = coreMarketPrices[coreMarketPrices.length - 1];
  const median = coreMarketPrices[Math.floor(coreMarketPrices.length * 0.5)];

  return { median, p10, p90, count: items.length };
}

function calculateConfidence(count: number, p10: number, p90: number, median: number) {
  if (count === 0) return 0;
  
  let score = 1.0;

  // Sample size penalty
  if (count < 5) score *= 0.4;
  else if (count < 15) score *= 0.7;
  else if (count < 30) score *= 0.9;

  // Dispersion penalty
  if (median > 0) {
    const range = (p90 - p10) / median;
    if (range > 1.5) score *= 0.5; // High variance
    else if (range > 0.8) score *= 0.8;
  }

  return Math.max(0.1, Math.min(1.0, score));
}
