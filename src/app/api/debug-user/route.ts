import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const email = "miltonsiedler@gmail.com";
        const user = await db.findOne("users", { email }) as any;

        if (!user) {
            return NextResponse.json({ error: "User not found" });
        }

        const purchases = await db.find("purchases", {
            $or: [
                { userId: user.userId },
                { userId: user.clerkId },
                { stripeCustomerId: user.stripeCustomerId || "invalid_id" }
            ]
        });

        return NextResponse.json({
            user: {
                _id: user._id,
                userId: user.userId,
                clerkId: user.clerkId,
                email: user.email,
                creditsTotal: user.creditsTotal,
                stripeCustomerId: user.stripeCustomerId
            },
            purchasesCount: purchases.length,
            purchases: purchases
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
