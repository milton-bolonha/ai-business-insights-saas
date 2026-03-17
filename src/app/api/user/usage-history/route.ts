import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { userId: authUserId } = await getAuth();
        const body = await request.json().catch(() => ({}));
        const userId = body.userId || authUserId;

        console.log(`[usage-history] Request Auth: ${authUserId}, Body: ${body?.userId}, Final UserID: ${userId}`);

        if (!userId) {
            return NextResponse.json({
                history: [],
                creditsTotal: 0
            }, { status: 200 });
        }

        // If the user has a stripeCustomerId stored, we should query purchases by it too
        // Fallback or-condition incase userId is clerkId or vice-versa
        const userDoc = await db.findOne("users", {
            $or: [
                { userId },
                { clerkId: userId }
            ]
        }) as any;

        const stripeCustomerId = userDoc?.stripeCustomerId || "no_stripe_id";

        console.log(`[usage-history] UserDoc Found: ${!!userDoc}, CreditsTotal: ${userDoc?.creditsTotal}`);

        const expandedUserIds = [userId];
        if (userDoc?.userId) expandedUserIds.push(userDoc.userId);
        if (userDoc?.clerkId) expandedUserIds.push(userDoc.clerkId);

        console.log(`[usage-history] Searching purchases across IDs: ${expandedUserIds.join(', ')} and Stripe: ${stripeCustomerId}`);

        const usageLogs = await db.find("credit_transactions", {
            userId: { $in: expandedUserIds }
        }, { sort: { createdAt: -1 } }) as any[];

        const purchaseLogs = await db.find("purchases", {
            $or: [
                { userId: { $in: expandedUserIds } },
                { stripeCustomerId }
            ]
        }, { sort: { createdAt: -1 } }) as any[];

        // Normalize events for unified timeline presentation
        const timeline = [
            ...usageLogs.slice(0, 50).map((log: any) => ({
                id: log._id?.toString() || crypto.randomUUID(),
                type: "usage",
                action: log.usageType,
                credits: -(log.creditsCost || 0), // Negative means spent
                date: log.createdAt,
            })),
            ...purchaseLogs.slice(0, 50).map((log: any) => ({
                id: log._id?.toString() || crypto.randomUUID(),
                type: "purchase",
                action: "buy_credits",
                credits: log.acquiredCredits || 0, // Positive means acquired
                amount: log.amount,
                currency: log.currency,
                plan: log.plan,
                date: log.createdAt,
            }))
        ];

        // Sort by descending date
        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            history: timeline.slice(0, 100), // cap at 100 merged
            creditsTotal: userDoc?.creditsTotal || 0
        }, { status: 200 });

    } catch (error: any) {
        console.error("[API Usage History] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
