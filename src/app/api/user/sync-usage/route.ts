import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { getUsage, getPlanForUser } from "@/lib/saas/usage-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getAuth();
        const body = await req.json().catch(() => ({}));
        const targetUserId = body.userId || userId;
        const email = body.email;

        const planInfo = await getPlanForUser(targetUserId);
        const usage = await getUsage(targetUserId ?? "", email);
        
        // Fetch the user's global role from MongoDB
        const { db } = await import("@/lib/db/mongodb");
        const userDoc = targetUserId ? await db.findOne("users", { userId: targetUserId }) as any : null;
        let globalRole = userDoc?.role || (targetUserId ? "user" : "guest");

        // Sync admin role dynamically if email matches SUPER_ADMIN_EMAIL
        if (email && process.env.SUPER_ADMIN_EMAIL && email === process.env.SUPER_ADMIN_EMAIL) {
            if (userDoc && userDoc.role !== "admin") {
                console.log(`[UsageSync] 👑 Self-healing: Upgrading super admin ${email} to admin role in MongoDB`);
                await db.updateOne("users", { userId: targetUserId }, { $set: { role: "admin" } });
                globalRole = "admin";
            }
        }

        return new NextResponse(
            JSON.stringify({
                usage,
                limits: planInfo.limits,
                plan: planInfo.plan,
                isMember: !!targetUserId,
                globalRole,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    // Dados user-specific (guest/member): não usar CDN/browse cache
                    "Cache-Control": "private, no-store",
                },
            }
        );
    } catch (error) {
        console.error("[API Usage] Error:", error);
        // Do not crash the app for guests on plan errors, gracefully return local limits
        return NextResponse.json({
            usage: null,
            limits: null,
            plan: "guest",
            isMember: false,
            globalRole: "guest",
        }, { status: 200 });
    }
}
