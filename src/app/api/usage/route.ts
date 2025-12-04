import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { getUsage } from "@/lib/saas/usage-service";

export async function GET() {
  try {
    const { userId } = await getAuth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const usage = await getUsage(userId);

    return NextResponse.json({
      usage,
      isMember: true, // If they have a userId, they're authenticated
    });
  } catch (error) {
    console.error("[API Usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to get usage" },
      { status: 500 }
    );
  }
}
