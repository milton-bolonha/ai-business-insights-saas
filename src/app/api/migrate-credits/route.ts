import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const users = await db.find("users", {}) as any[];
        let logs: string[] = [];

        for (const u of users) {
            if (!u.userId) {
                logs.push(`Skipping legacy user _id ${u._id} because it lacks userId`);
                continue;
            }

            // 1. Get all purchases for this user
            const purchases = await db.find("purchases", {
                $or: [
                    { userId: u.userId },
                    { stripeCustomerId: u.stripeCustomerId || "invalid_id" }
                ]
            }) as any[];

            if (purchases.length === 0) {
                continue;
            }

            let totalAcquired = 0;
            for (const p of purchases) {
                // Member purchase typically grants 10000 credits. 
                // Business grants 50000 but let's assume 10k baseline if acquiredCredits is undefined
                const credits = p.acquiredCredits || (p.plan === 'business' ? 50000 : 10000);
                totalAcquired += credits;
            }

            // 2. We only overwrite if the new totalAcquired is higher than what they currently have,
            // since they might have spent some credits or we just never granted them.
            const currentTotal = u.creditsTotal || 0;
            if (totalAcquired > currentTotal) {
                logs.push(`User ${u.email || u.userId} has ${currentTotal} credits but should have AT LEAST ${totalAcquired} from ${purchases.length} purchases. Upgrading via Backfill.`);
                await db.updateOne("users", { _id: u._id }, {
                    $set: { creditsTotal: totalAcquired }
                });
            } else {
                logs.push(`User ${u.email || u.userId} credits are fine (${currentTotal} credits >= ${totalAcquired} acquired from ${purchases.length} purchases).`);
            }
        }

        return NextResponse.json({ success: true, logs }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
