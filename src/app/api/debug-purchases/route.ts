import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST() {
    try {
        const purchases = await db.find("purchases", {}) as any[];

        const counts: Record<string, number> = {};
        purchases.forEach(p => {
            const id = p.userId || "null";
            counts[id] = (counts[id] || 0) + 1;
        });

        return NextResponse.json({
            counts,
            totalPurchases: purchases.length
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
