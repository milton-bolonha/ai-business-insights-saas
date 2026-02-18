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
        const { id, name, website } = body;

        if (!id || !name) {
            return NextResponse.json(
                { error: "Missing required fields (id, name)" },
                { status: 400 }
            );
        }

        // Insert into MongoDB
        await db.insertOne("workspaces", {
            sessionId: id, // Mapping store ID to sessionId
            userId,
            name,
            website: website || "",
            createdAt: new Date(),
            updatedAt: new Date(),
            // Add other default fields if necessary (salesRepCompany, etc)
        });

        console.log(`[api/workspace/create] Workspace created: ${id} for user ${userId}`);

        // Audit log
        await auditLog("create_workspace", "User created a new workspace", {
            userId,
            details: { workspaceId: id, name }
        });

        return NextResponse.json({ success: true, workspaceId: id });

    } catch (error) {
        console.error("[api/workspace/create] Error creating workspace:", error);
        return NextResponse.json(
            { error: "Failed to create workspace" },
            { status: 500 }
        );
    }
}
