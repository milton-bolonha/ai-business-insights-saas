import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await getAuth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dashboardId = searchParams.get("dashboardId");
        const workspaceId = searchParams.get("workspaceId");

        if (!dashboardId || !workspaceId) {
            return NextResponse.json(
                { error: "Missing required params (dashboardId, workspaceId)" },
                { status: 400 }
            );
        }

        // Delete from MongoDB
        const { ObjectId } = await import("mongodb");
        const result = await db.deleteOne(
            "dashboards",
            { _id: new ObjectId(dashboardId), workspaceId, userId }
        );

        if (result) {
            console.log(`[api/dashboard/delete] Dashboard deleted: ${dashboardId}`);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Dashboard not found or unauthorized" }, { status: 404 });
        }

    } catch (error) {
        console.error("[api/dashboard/delete] Error deleting dashboard:", error);
        return NextResponse.json(
            { error: "Failed to delete dashboard" },
            { status: 500 }
        );
    }
}
