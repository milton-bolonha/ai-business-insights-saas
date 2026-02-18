import { db } from "@/lib/db/mongodb";
import type { PlanDocument } from "@/lib/db/models/Plan";

type PlanId = "guest" | "member" | "business";

interface PlanRecord {
  planId: PlanId;
  limits: UsageLimits;
  updatedAt?: Date;
}

/**
 * Usage limits and tracking for SaaS features
 */

export type UsageType =
  | "companiesCount"
  | "contactsCount"
  | "notesCount"
  | "tilesCount"
  | "tokensUsed"
  | "tileChatsCount"
  | "contactChatsCount"
  | "regenerationsCount"
  | "assetsCount";

export interface UsageLimits {
  companiesCount: number; // Max workspaces per user
  contactsCount: number; // Max contacts per user
  notesCount: number; // Max notes per user
  tilesCount: number; // Max tiles per user
  tileChatsCount: number; // Max tile chats
  contactChatsCount: number; // Max contact chats
  regenerationsCount: number; // Max regenerations
  assetsCount: number; // Max assets/uploads
  tokensUsed: number; // Max tokens per month
}

/**
 * Plano cacheado em memória (process-local)
 */
const planCache: Map<PlanId, { limits: UsageLimits; loadedAt: number }> =
  new Map();
const PLAN_CACHE_TTL_MS = 60_000; // 1 minuto

export const FREE_LIMITS: UsageLimits = {
  companiesCount: 3,
  contactsCount: 5,
  notesCount: 20,
  tilesCount: 20, // Limit for Free Members
  tileChatsCount: 20,
  contactChatsCount: 20,
  regenerationsCount: 10,
  assetsCount: 0,
  tokensUsed: 3000,
};

export const SAFE_DEFAULT_MEMBER: UsageLimits = {
  companiesCount: 3,
  contactsCount: 5,
  notesCount: 20,
  tilesCount: 20,
  tileChatsCount: 50,
  contactChatsCount: 50,
  regenerationsCount: 20,
  assetsCount: 10,
  tokensUsed: 10_000,
};

export const SAFE_DEFAULT_GUEST: UsageLimits = {
  companiesCount: 0,
  contactsCount: 0,
  notesCount: 0,
  tilesCount: Number(process.env.GUEST_TILES_LIMIT) || 0,
  tileChatsCount: 0,
  contactChatsCount: 0,
  regenerationsCount: 0,
  assetsCount: 0,
  tokensUsed: 0,
};

function getCachedLimits(planId: PlanId): UsageLimits | null {
  const cached = planCache.get(planId);
  if (cached && Date.now() - cached.loadedAt < PLAN_CACHE_TTL_MS) {
    return cached.limits;
  }
  return null;
}

/**
 * Busca limites de plano no DB, com cache e fallback
 */
async function fetchPlanLimits(planId: PlanId): Promise<UsageLimits> {
  const cached = planCache.get(planId);
  if (cached && Date.now() - cached.loadedAt < PLAN_CACHE_TTL_MS) {
    return cached.limits;
  }

  try {
    const record = await db.findOne<PlanDocument>("plans", { planId });
    if (record?.limits) {
      planCache.set(planId, { limits: record.limits, loadedAt: Date.now() });
      return record.limits;
    }
  } catch (err) {
    console.warn("[usage-service] Failed to load plan from DB", {
      planId,
      err,
    });
  }

  throw new Error(`Plan ${planId} not found in DB and no fallback allowed`);
}

function resolvePlanId(userDocPlan?: string, userId?: string | null): PlanId {
  if (!userId) return "guest";
  if (userDocPlan === "business") return "business";
  return "member";
}

/**
 * Check if user has exceeded usage limits
 */
export async function checkLimit(
  userId: string,
  usageType: UsageType
): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
}> {
  try {
    let currentUsage = 0;
    let planId: PlanId = "member";

    if (userId) {
      const userDoc = await db.findOne("users", { userId });
      currentUsage = userDoc?.[usageType] || 0;
      planId = resolvePlanId((userDoc as any)?.plan, userId);
    } else {
      // Guest: client-side AuthStore controla; server não bloqueia por enquanto
      return { allowed: true };
    }

    const limits = await fetchPlanLimits(planId);
    const limit = limits[usageType];
    const allowed = currentUsage < limit;

    return {
      allowed,
      limit,
      used: currentUsage,
      reason: !allowed ? `Limit exceeded: ${currentUsage}/${limit}` : undefined,
    };
  } catch (error) {
    console.error("[UsageService] Error checking limit:", error);
    // Fail closed for security
    return { allowed: false, reason: "Limit check unavailable" };
  }
}

/**
 * Check if a specific feature is enabled for the user/app
 */
export async function checkFeature(
  userId: string,
  featureId: string,
  appTag?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) {
    return {
      allowed: false,
      reason: "You need to be logged in to use this feature."
    };
  }

  // Example: "Publish" is a premium feature for "Love Writers"
  if (featureId === "canPublish" && appTag === "love_writers") {
    const plan = await getPlanForUser(userId);

    // Logic: Only Members (Pro) can publish
    if (plan.plan === "member" || plan.plan === "business") {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Publishing is available only for Pro members."
    };
  }

  // Default: Allow if no specific rule blocks it
  return { allowed: true };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
  userId: string,
  usageType: UsageType,
  amount: number = 1
): Promise<void> {
  if (!userId) return; // Don't track guest usage in database

  try {
    await db.updateOne(
      "users",
      { userId },
      {
        $inc: { [usageType]: amount },
        $setOnInsert: { userId, createdAt: new Date() },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    console.log(
      `[UsageService] ✅ Incremented ${usageType} by ${amount} for user ${userId}`
    );
  } catch (error) {
    console.error("[UsageService] Error incrementing usage:", error);
    // Don't throw - usage tracking failure shouldn't break the app
  }
}

/**
 * Get current usage for a user
 */
export async function getUsage(
  userId: string
): Promise<Record<UsageType, number>> {
  if (!userId) {
    return {
      companiesCount: 0,
      contactsCount: 0,
      notesCount: 0,
      tilesCount: 0,
      tileChatsCount: 0,
      contactChatsCount: 0,
      regenerationsCount: 0,
      assetsCount: 0,
      tokensUsed: 0,
    };
  }

  try {
    const userDoc = await db.findOne("users", { userId });
    return {
      companiesCount: userDoc?.companiesCount || 0,
      contactsCount: userDoc?.contactsCount || 0,
      notesCount: userDoc?.notesCount || 0,
      tilesCount: userDoc?.tilesCount || 0,
      tileChatsCount: userDoc?.tileChatsCount || 0,
      contactChatsCount: userDoc?.contactChatsCount || 0,
      regenerationsCount: userDoc?.regenerationsCount || 0,
      assetsCount: userDoc?.assetsCount || 0,
      tokensUsed: userDoc?.tokensUsed || 0,
    };
  } catch (error) {
    console.error("[UsageService] Error getting usage:", error);
    return {
      companiesCount: 0,
      contactsCount: 0,
      notesCount: 0,
      tilesCount: 0,
      tileChatsCount: 0,
      contactChatsCount: 0,
      regenerationsCount: 0,
      assetsCount: 0,
      tokensUsed: 0,
    };
  }
}

/**
 * Retorna limites aplicáveis para o user (ou guest) e o nome do plano
 */
/**
 * Helper para limitar uploads de assets (usado por members)
 */
export async function enforceAssetLimit(
  userId: string,
  amount = 1
): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) {
    // guests não devem fazer upload de assets
    return { allowed: false, reason: "Guests cannot upload assets" };
  }
  const limit = await checkLimit(userId, "assetsCount");
  if (!limit.allowed) return limit;
  await incrementUsage(userId, "assetsCount", amount);
  return { allowed: true };
}

/**
 * Retorna plano + limites com leitura do DB e fallback seguro
 */
export async function getPlanForUser(
  userId?: string | null
): Promise<{ plan: PlanId; limits: UsageLimits }> {
  if (!userId) {
    try {
      return { plan: "guest", limits: await fetchPlanLimits("guest") };
    } catch (err) {
      console.warn(
        "[usage-service] guest plan unavailable, using safe fallback",
        err
      );
      return {
        plan: "guest",
        limits: getCachedLimits("guest") ?? FREE_LIMITS,
      };
    }
  }
  try {
    const userDoc = await db.findOne("users", { userId });
    const planId = resolvePlanId((userDoc as any)?.plan, userId);
    const limits = await fetchPlanLimits(planId);
    return { plan: planId, limits };
  } catch (err) {
    console.warn("[usage-service] getPlanForUser fallback", err);
    return {
      plan: "member",
      limits: getCachedLimits("member") ?? SAFE_DEFAULT_MEMBER,
    };
  }
}

/**
 * Reset usage counters (admin function)
 */
export async function resetUsage(userId: string): Promise<void> {
  if (!userId) return;

  try {
    await db.updateOne(
      "users",
      { userId },
      {
        $set: {
          companiesCount: 0,
          contactsCount: 0,
          notesCount: 0,
          tilesCount: 0,
          tokensUsed: 0,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[UsageService] ✅ Reset usage for user ${userId}`);
  } catch (error) {
    console.error("[UsageService] Error resetting usage:", error);
  }
}
