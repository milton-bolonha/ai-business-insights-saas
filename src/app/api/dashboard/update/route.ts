import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await getAuth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { workspaceId, dashboardId, updates } = body;

        if (!workspaceId || !dashboardId || !updates) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Update in MongoDB
        const result = await db.updateOne(
            "dashboards",
            { _id: dashboardId, workspaceId, userId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );

        if (result) {
            console.log(`[api/dashboard/update] Dashboard updated: ${dashboardId}`);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Dashboard not found or unauthorized" }, { status: 404 });
        }

    } catch (error) {
        console.error("[api/dashboard/update] Error updating dashboard:", error);
        return NextResponse.json(
            { error: "Failed to update dashboard" },
            { status: 500 }
        );
    }
}
