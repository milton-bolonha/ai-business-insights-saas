import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { getUsage, getPlanForUser } from "@/lib/saas/usage-service";

export async function GET() {
  try {
    const { userId } = await getAuth();

    const planInfo = await getPlanForUser(userId);
    const usage = await getUsage(userId ?? "");

    return NextResponse.json({
      usage,
      limits: planInfo.limits,
      plan: planInfo.plan,
      isMember: !!userId,
    });
  } catch (error) {
    console.error("[API Usage] Error:", error);
    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
  }
}
