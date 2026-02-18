import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { auditLog } from "@/lib/audit/logger";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await getAuth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, updates } = body;

        if (!id || !updates) {
            return NextResponse.json(
                { error: "Missing required fields (id, updates)" },
                { status: 400 }
            );
        }

        // Update in MongoDB
        // Ensure we only update the user's own workspace
        const result = await db.updateOne(
            "workspaces",
            { sessionId: id, userId }, // Filter by both ID and Owner
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );

        if (result) { // updateOne returns boolean true if modified/matched
            console.log(`[api/workspace/update] Workspace updated: ${id} for user ${userId}`);

            // Audit log (optional for frequent updates, but good for tracking)
            // await auditLog("update_workspace", "User updated workspace", { userId, details: { workspaceId: id, updates } });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Workspace not found or unauthorized" }, { status: 404 });
        }

    } catch (error) {
        console.error("[api/workspace/update] Error updating workspace:", error);
        return NextResponse.json(
            { error: "Failed to update workspace" },
            { status: 500 }
        );
    }
}
