import { db } from "@/lib/db/mongodb";
import { cache } from "@/lib/cache/redis";
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
  | "assetsCount"
  | "bookGenerationsCount"
  | "marketEnrichmentCount"
  | "imageGenerationsCount"
  | "wmsInventoryCount"
  | "wmsAiAssistant"
  | "ordersCount"
  | "staffCount";

export interface UsageLimits {
  companiesCount: number; // Max workspaces per user
  contactsCount: number; // Max contacts per user
  notesCount: number; // Max notes per user
  tilesCount: number; // Max tiles per user
  tileChatsCount: number; // Max tile chats
  contactChatsCount: number; // Max contact chats
  regenerationsCount: number; // Max regenerations
  assetsCount: number; // Max assets/uploads
  bookGenerationsCount?: number; // Max book generations
  marketEnrichmentCount?: number; // Max market data enrichments
  imageGenerationsCount?: number; // Max image generations
  wmsInventoryCount?: number;
  wmsAiAssistant?: number;
  ordersCount?: number;
  staffCount?: number;
  tokensUsed: number; // Max tokens per month
  creditsTotal: number; // Max available credits
}

export const CREDIT_COSTS: Record<UsageType, number> = {
  companiesCount: 10,
  contactsCount: 1,
  notesCount: 1,
  tilesCount: 5,
  tileChatsCount: 2,
  contactChatsCount: 2,
  regenerationsCount: 5,
  assetsCount: 1,
  bookGenerationsCount: 20, // generating a portion of a book costs 20 credits
  marketEnrichmentCount: 5, // enrichment costs 5 credits
  imageGenerationsCount: 100,
  wmsInventoryCount: 1,
  wmsAiAssistant: 5,
  ordersCount: 2,
  staffCount: 1,
  tokensUsed: 0,
};

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
  bookGenerationsCount: 5,
  marketEnrichmentCount: 5,
  imageGenerationsCount: 0,
  wmsInventoryCount: 50,
  wmsAiAssistant: 10,
  ordersCount: 20,
  staffCount: 10,
  tokensUsed: 3000,
  creditsTotal: 200, // Included initial credits
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
  bookGenerationsCount: 50,
  marketEnrichmentCount: 100,
  imageGenerationsCount: 10,
  tokensUsed: 10_000,
  creditsTotal: 10000, // Default Pro credits
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
    console.warn("[usage-service] Failed to load plan from DB, using fallback", {
      planId,
      err,
    });
  }

  // Fallback if DB fetch failed or record is missing
  if (planId === "business") return SAFE_DEFAULT_MEMBER;
  return SAFE_DEFAULT_MEMBER;
}

function resolvePlanId(userDocPlan?: string, userId?: string | null): PlanId {
  if (!userId) return "member"; // Default to member for safety if userId is missing but we're in member zone
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
    let creditsUsed = 0;
    let creditsTotalConfig = 0;
    let planId: PlanId = "member";

    const limits = await getPlanForUser(userId);
    creditsTotalConfig = limits.limits.creditsTotal;
    const actionCost = CREDIT_COSTS[usageType] || 0;

    if (userId) {
      const userDoc = await db.findOne("users", { userId }) as any;
      // Fetch dynamic total credits balance or plan mapped config
      creditsTotalConfig = userDoc?.creditsTotal || creditsTotalConfig;
      creditsUsed = userDoc?.creditsUsed || 0;
      planId = resolvePlanId(userDoc?.plan, userId);
    } else {
      // Guest: client-side AuthStore controls, skipping strict block unless implemented.
      // But now we can apply shadow limits later. For now, pass Guest.
      return { allowed: true };
    }

    const limit = creditsTotalConfig;
    const used = creditsUsed;
    const allowed = (used + actionCost) <= limit;

    return {
      allowed,
      limit,
      used,
      reason: !allowed ? `Not enough credits: Action costs ${actionCost}, balance ${(limit - used)}` : undefined,
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
  if (!userId || userId === "guest_temp" || userId.startsWith("guest_")) return; // Don't track guest usage in database

  try {
    const actionCost = (CREDIT_COSTS[usageType] || 0) * amount;

    await db.updateOne(
      "users",
      { userId },
      {
        $inc: {
          [usageType]: amount,
          creditsUsed: actionCost
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: false }
    );

    // [New feature] Log the transaction ledger in the DB
    await db.insertOne("credit_transactions", {
      userId,
      usageType,
      amount,
      creditsCost: actionCost,
      createdAt: new Date(),
    });

    console.log(
      `[UsageService] ✅ Incremented ${usageType} by ${amount} for user ${userId}. Cost: ${actionCost} credits`
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
  userId: string,
  email?: string
): Promise<Record<string, number>> {
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
      creditsUsed: 0,
      creditsTotal: 0,
    };
  }

  try {
    let userDoc = await db.findOne("users", {
      $or: [{ userId }, { clerkId: userId }]
    }) as any;

    if (!userDoc) {
      // 1. If we have an email, check if a user record already exists for it (Account Linking)
      if (email) {
        userDoc = await db.findOne("users", { email });
        if (userDoc) {
          console.log(`[UsageService] 🔗 Linking existing email profile ${email} to userId ${userId}`);
          await db.updateOne("users", { _id: userDoc._id }, {
            $set: { userId, clerkId: userId, updatedAt: new Date() }
          });
          // Refetch with new ID
          userDoc = await db.findOne("users", { userId });
        }
      }

      // 2. If still no userDoc, auto-provision
      if (!userDoc && userId.startsWith("user_")) {
        console.log(`[UsageService] 👤 Auto-provisioning new member profile for ${userId}`);
        const isSuperAdmin = email && process.env.SUPER_ADMIN_EMAIL && email === process.env.SUPER_ADMIN_EMAIL;

        const newUser: any = {
          userId,
          clerkId: userId,
          isMember: true,
          plan: "member",
          role: isSuperAdmin ? "admin" : "user",
          creditsTotal: 0,
          creditsUsed: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        if (email) newUser.email = email;

        try {
          await db.updateOne("users", { userId }, { $set: newUser }, { upsert: true });
          userDoc = await db.findOne("users", { userId });

          // NEW: Link any pending invitations
          if (email) {
            console.log(`[UsageService] 🔗 Linking pending invitations for ${email}`);
            await db.updateMany("workspacememberships", 
              { email: email, userId: null as any }, 
              { $set: { userId: userId, status: 'active', updatedAt: new Date() } }
            );
          }
        } catch (provisionErr: any) {
          // Final fallback for race conditions or duplicate email during upsert
          if (provisionErr.code === 11000) {
            userDoc = await db.findOne("users", { email });
            if (userDoc) {
              await db.updateOne("users", { _id: userDoc._id }, { $set: { userId, clerkId: userId } });
            
              // NEW: Link any pending invitations
              if (email) {
                console.log(`[UsageService] 🔗 Linking pending invitations for ${email}`);
                await db.updateMany("workspacememberships", 
                  { email: email, userId: null as any }, 
                  { $set: { userId: userId, status: 'active', updatedAt: new Date() } }
                );
              }
            }
          }
        }
      } else if (!userDoc) {
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
          creditsUsed: 0,
          creditsTotal: 0,
        };
      }
    }

    // Auto-reconciliation logic:
    // If user has purchases that aren't reflected in creditsTotal, update it.
    let creditsTotal = userDoc?.creditsTotal || 0;

    try {
      const stripeCustomerId = userDoc?.stripeCustomerId;
      const userEmail = userDoc?.email || email;

      console.log(`[UsageService] 🔄 Reconciling credits for ${userId} (Email: ${userEmail}, StripeID: ${stripeCustomerId})`);

      const purchases = await db.find("purchases", {
        $or: [
          { userId },
          { clerkId: userId },
          ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []) // Try by email if it was stored
        ]
      }) as any[];

      const totalFromPurchases = purchases.reduce((sum, p) => sum + (p.acquiredCredits || 0), 0);

      let totalFromLedger = 0;
      if (userEmail) {
        const ledgerPurchases = await db.find("credit_transactions", {
          email: userEmail,
          usageType: "purchase_credits"
        }) as any[];

        if (ledgerPurchases.length > 0) {
          totalFromLedger = ledgerPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
          console.log(`[UsageService] 🔍 Found ${totalFromLedger} credits in ledger for ${userEmail}`);
        }
      }

      const verifiedTotal = Math.max(totalFromPurchases, totalFromLedger);

      // If the verified truth is higher than current total, heal the profile
      if (verifiedTotal > creditsTotal) {
        console.log(`[UsageService] 🟢 Auto-healing credits for ${userId}: ${creditsTotal} -> ${verifiedTotal}`);
        await db.updateOne("users", { _id: userDoc._id }, {
          $set: {
            creditsTotal: verifiedTotal,
            // Ensure email is saved in userDoc if it was missing
            ...((!userDoc.email && userEmail) ? { email: userEmail } : {}),
            // Also sync stripeCustomerId if we found one in purchases but not in userDoc
            ...((!stripeCustomerId && purchases.find(p => p.stripeCustomerId)) ? { stripeCustomerId: purchases.find(p => p.stripeCustomerId).stripeCustomerId } : {})
          }
        });
        creditsTotal = verifiedTotal;

        // Invalidate cache so the next call sees the healed value
        await cache.del(`usage:${userId}`);
      }
    } catch (reconcileErr) {
      console.warn("[UsageService] Failed to reconcile credits", reconcileErr);
    }

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
      creditsUsed: userDoc?.creditsUsed || 0,
      creditsTotal: creditsTotal,
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
      creditsUsed: 0,
      creditsTotal: 0,
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
  const isGuest = !userId || userId === "guest_temp" || userId.startsWith("guest_");

  if (isGuest) {
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
