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
        const { id, name, website, salesRepCompany, salesRepWebsite, templateId, promptSettings, tiles } = body;

        if (!id || !name) {
            return NextResponse.json(
                { error: "Missing required fields (id, name)" },
                { status: 400 }
            );
        }

        const wsPromptSettings = promptSettings ?? (templateId ? { templateId } : undefined);

        // If tiles are provided, use the migration helper which is more robust
        // and handles workspaces, dashboards, AND tiles in one go.
        if (tiles && Array.isArray(tiles) && tiles.length > 0) {
            const { migrateWorkspaceToMongo } = await import("@/lib/db/migration-helpers");
            const workspaceSnapshot = {
                sessionId: id,
                name,
                website: website || "",
                salesRepCompany: salesRepCompany || "",
                salesRepWebsite: salesRepWebsite || "",
                promptSettings: wsPromptSettings,
                tiles,
                generatedAt: new Date().toISOString()
            };
            
            console.log(`[api/workspace/create] Using migration helper for workspace ${id} with ${tiles.length} tiles`);
            await migrateWorkspaceToMongo(workspaceSnapshot as any, userId);
        } else {
            // Fallback for metadata-only creation
            // Upsert workspace - safe to call multiple times
            const workspaceExists = await db.findOne("workspaces", { sessionId: id, userId });

            if (!workspaceExists) {
                await db.insertOne("workspaces", {
                    sessionId: id,
                    userId,
                    name,
                    website: website || "",
                    salesRepCompany: salesRepCompany || "",
                    salesRepWebsite: salesRepWebsite || "",
                    promptSettings: wsPromptSettings ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                console.log(`[api/workspace/create] Workspace created: ${id} for user ${userId}`);

                // Always create a default dashboard so the admin can load correctly
                const defaultDashboardId = `dashboard_${id}_default`;
                const dashboardExists = await db.findOne("dashboards", { id: defaultDashboardId, userId });
                if (!dashboardExists) {
                    await db.insertOne("dashboards", {
                        id: defaultDashboardId,
                        workspaceId: id,
                        userId,
                        name: "Default Dashboard",
                        templateId: templateId || null,
                        bgColor: "#f7f7f7",
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    console.log(`[api/workspace/create] Default dashboard created: ${defaultDashboardId}`);
                }
            } else {
                // Update timestamp and promptSettings if provided
                const updateFields: Record<string, unknown> = { updatedAt: new Date() };
                if (wsPromptSettings) updateFields.promptSettings = wsPromptSettings;
                await db.updateOne(
                    "workspaces",
                    { sessionId: id, userId },
                    { $set: updateFields }
                );
                console.log(`[api/workspace/create] Workspace already exists, updated: ${id}`);
            }
        }

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
