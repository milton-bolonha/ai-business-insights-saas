import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { auditLog } from "@/lib/audit/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await getAuth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { workspaceId, dashboard } = body;

        if (!workspaceId || !dashboard || !dashboard.id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Insert into MongoDB
        await db.insertOne("dashboards", {
            ...dashboard, // Spread all dashboard properties
            _id: dashboard.id, // Use the client-side ID as _id
            workspaceId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log(`[api/dashboard/create] Dashboard created: ${dashboard.id} in workspace ${workspaceId}`);

        return NextResponse.json({ success: true, dashboardId: dashboard.id });

    } catch (error) {
        console.error("[api/dashboard/create] Error creating dashboard:", error);
        return NextResponse.json(
            { error: "Failed to create dashboard" },
            { status: 500 }
        );
    }
}
