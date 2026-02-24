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

        const planInfo = await getPlanForUser(targetUserId);
        const usage = await getUsage(targetUserId ?? "");

        return new NextResponse(
            JSON.stringify({
                usage,
                limits: planInfo.limits,
                plan: planInfo.plan,
                isMember: !!targetUserId,
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
        return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
    }
}
