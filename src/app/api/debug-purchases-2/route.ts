import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
    try {
        const purchases = await db.find("purchases", {}) as any[];

        const counts: Record<string, number> = {};
        purchases.forEach(p => {
            const id = p.userId || "null";
            counts[id] = (counts[id] || 0) + 1;
        });

        // Find exactly which UUIDs only have 1 purchase
        const onePurchaseIds = Object.keys(counts).filter(id => counts[id] === 1);

        const orphanedPurchases = purchases.filter(p => onePurchaseIds.includes(p.userId || "null")).map(p => ({
            _id: p._id,
            userId: p.userId,
            amount: p.amount,
            createdAt: p.createdAt
        }));

        const sampleOrphan = await db.findOne("users", { userId: "user_30lCRGxlNoUi6cc1l9m30u71zNt" });
        const sampleClerk = await db.findOne("users", { clerkId: "user_30lCRGxlNoUi6cc1l9m30u71zNt" });
        const allUser30Purchases = purchases.filter(p => p.userId === "user_30lCRGxlNoUi6cc1l9m30u71zNt" || p.clerkId === "user_30lCRGxlNoUi6cc1l9m30u71zNt");

        return NextResponse.json({
            sampleOrphan,
            sampleClerk,
            allUser30Purchases,
            orphanedPurchases,
            counts,
            totalPurchases: purchases.length
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
