
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import type { Note } from "@/lib/types";
import { getAuth } from "@/lib/auth/get-auth";
import { addNoteToDashboard, loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";
import { audit } from "@/lib/audit/logger";
import { checkRateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Runtime: Node.js (required for MongoDB)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    console.log("[API] HIT: /api/test-note POST");

    // const rate = await checkRateLimitMiddleware(request, "/api/test-note");
    // if (!rate.allowed && rate.response) return rate.response;

    const body = await request.json().catch(() => null);
    const { userId } = await getAuth();
    let usageService: typeof import("@/lib/saas/usage-service") | null = null;

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const dashboardId = typeof body?.dashboardId === "string" ? body.dashboardId.trim() : "";
    const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";

    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!content) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (!dashboardId) {
        return NextResponse.json({ error: "dashboardId is required" }, { status: 400 });
    }

    try {
        const now = new Date().toISOString();
        const noteId = `note_${randomUUID()}`;

        const noteData: Note = {
            id: noteId,
            title,
            content,
            createdAt: now,
            updatedAt: now,
        };

        // 🟡 GUEST: Salvar no localStorage (Simplified for test)
        if (!userId) {
            const workspaces = loadWorkspacesWithDashboards();
            const workspace = workspaces.find((w) => w.id === workspaceId);

            if (workspace) {
                addNoteToDashboard(workspace.id, dashboardId, noteData);

                console.log("[API] /api/test-note - Note saved to localStorage", {
                    noteId,
                    workspaceId: workspace.id,
                    dashboardId,
                });

                return NextResponse.json({
                    success: true,
                    note: noteData,
                });
            } else {
                return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
            }
        }

        return NextResponse.json({ error: "Auth not implemented in test" }, { status: 501 });

    } catch (error) {
        console.error("[API] /api/test-note - Error:", error);
        return NextResponse.json(
            {
                error: "Failed to create note",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
