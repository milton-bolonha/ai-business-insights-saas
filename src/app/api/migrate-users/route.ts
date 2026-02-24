import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const users = await db.find("users", {});
        let usersUpdated = 0;
        let purchasesUpdated = 0;
        let logs: string[] = [];

        for (const u of users as any[]) {
            if (!u.userId) {
                const newUserId = u.clerkId || u.clerkUserId || `guest_recovered_${u._id.toString()}`;
                logs.push(`Updating user ${u._id} with new userId: ${newUserId}`);
                await db.updateOne("users", { _id: u._id }, { $set: { userId: newUserId } });
                usersUpdated++;
            }
        }

        const purchases = await db.find("purchases", {});
        for (const p of purchases as any[]) {
            if (!p.userId && p.stripeCustomerId) {
                const mappedUser = await db.findOne("users", { stripeCustomerId: p.stripeCustomerId }) as any;
                if (mappedUser && mappedUser.userId) {
                    logs.push(`Updating purchase ${p._id} with userId: ${mappedUser.userId}`);
                    await db.updateOne("purchases", { _id: p._id }, { $set: { userId: mappedUser.userId } });
                    purchasesUpdated++;
                } else {
                    logs.push(`Purchase ${p._id} has no mapped user for stripeCustomerId: ${p.stripeCustomerId}`);
                }
            }
        }

        return NextResponse.json({ success: true, usersUpdated, purchasesUpdated, logs }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
