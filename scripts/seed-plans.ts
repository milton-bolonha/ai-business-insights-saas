import { db } from "@/lib/db/mongodb";
import type { UsageLimits } from "@/lib/saas/usage-service";
import type { PlanDocument } from "@/lib/db/models/Plan";

const PLANS: Array<Pick<PlanDocument, "planId" | "limits">> = [
  {
    planId: "guest",
    limits: {
      companiesCount: 3,
      contactsCount: 5,
      notesCount: 20,
      tilesCount: 30,
      tileChatsCount: 20,
      contactChatsCount: 20,
      regenerationsCount: 10,
      assetsCount: 0,
      tokensUsed: 3000,
    } satisfies UsageLimits,
  },
  {
    planId: "member",
    limits: {
      companiesCount: 100,
      contactsCount: 1000,
      notesCount: 2000,
      tilesCount: 2000,
      tileChatsCount: 5000,
      contactChatsCount: 5000,
      regenerationsCount: 2000,
      assetsCount: 10000,
      tokensUsed: 1_000_000,
    } satisfies UsageLimits,
  },
  {
    planId: "business",
    limits: {
      companiesCount: 10000,
      contactsCount: 100000,
      notesCount: 100000,
      tilesCount: 100000,
      tileChatsCount: 100000,
      contactChatsCount: 100000,
      regenerationsCount: 100000,
      assetsCount: 100000,
      tokensUsed: 100_000_000,
    } satisfies UsageLimits,
  },
];

async function main() {
  console.log("[seed-plans] Seeding plans...");
  for (const plan of PLANS) {
    await db.updateOne(
      "plans",
      { planId: plan.planId },
      {
        $set: {
          ...plan,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`[seed-plans] upserted plan ${plan.planId}`);
  }
  console.log("[seed-plans] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-plans] Error:", err);
  process.exit(1);
});

