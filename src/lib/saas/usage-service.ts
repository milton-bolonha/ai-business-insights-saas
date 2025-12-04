import { db } from "@/lib/db/mongodb";

/**
 * Usage limits and tracking for SaaS features
 */

export type UsageType =
  | "companiesCount"
  | "contactsCount"
  | "notesCount"
  | "tilesCount"
  | "tokensUsed";

interface UsageLimits {
  companiesCount: number; // Max workspaces per user
  contactsCount: number; // Max contacts per user
  notesCount: number; // Max notes per user
  tilesCount: number; // Max tiles per user
  tokensUsed: number; // Max tokens per month
}

const MEMBER_LIMITS: UsageLimits = {
  companiesCount: 100, // Unlimited workspaces for members
  contactsCount: 1000, // High limit for contacts
  notesCount: 2000,
  tilesCount: 2000,
  tokensUsed: 1000000, // High token limit (1M tokens/month)
};

const GUEST_LIMITS: UsageLimits = {
  companiesCount: 3, // Max 3 workspaces for guests
  contactsCount: 5, // Max 5 contacts for guests
  notesCount: 20,
  tilesCount: 30,
  tokensUsed: 3000, // 3000 tokens for guests
};

/**
 * Check if user has exceeded usage limits
 */
export async function checkLimit(
  userId: string,
  usageType: UsageType
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // For members, check against member limits
    // For guests, check against guest limits
    const limits = userId ? MEMBER_LIMITS : GUEST_LIMITS;

    // Get current usage from MongoDB (for members) or localStorage (for guests)
    let currentUsage = 0;

    if (userId) {
      // Member: Check MongoDB
      const userDoc = await db.findOne("users", { userId });
      currentUsage = userDoc?.[usageType] || 0;
    } else {
      // Guest: Check localStorage (handled by AuthContext)
      // For now, return allowed (limits are checked in AuthContext)
      return { allowed: true };
    }

    const limit = limits[usageType];
    const allowed = currentUsage < limit;

    return {
      allowed,
      reason: !allowed ? `Limit exceeded: ${currentUsage}/${limit}` : undefined,
    };
  } catch (error) {
    console.error("[UsageService] Error checking limit:", error);
    // On error, allow usage to prevent blocking users
    return { allowed: true };
  }
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
    // Update or insert user usage document
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

    console.log(`[UsageService] ✅ Incremented ${usageType} by ${amount} for user ${userId}`);
  } catch (error) {
    console.error("[UsageService] Error incrementing usage:", error);
    // Don't throw - usage tracking failure shouldn't break the app
  }
}

/**
 * Get current usage for a user
 */
export async function getUsage(userId: string): Promise<Record<UsageType, number>> {
  if (!userId) {
    return {
      companiesCount: 0,
      contactsCount: 0,
      notesCount: 0,
      tilesCount: 0,
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
      tokensUsed: userDoc?.tokensUsed || 0,
    };
  } catch (error) {
    console.error("[UsageService] Error getting usage:", error);
    return {
      companiesCount: 0,
      contactsCount: 0,
      notesCount: 0,
      tilesCount: 0,
      tokensUsed: 0,
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
