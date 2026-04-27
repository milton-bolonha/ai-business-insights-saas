import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: workspaceId } = await params;
        const { db } = await connectToDatabase();

        // 1. Fetch Workspace
        const workspace = await db.collection("workspaces").findOne({
            $or: [
                { id: workspaceId },
                { sessionId: workspaceId }
            ]
        });

        if (!workspace) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // 2. Fetch Active Dashboard (or first one)
        const dashboard = await db.collection("dashboards").findOne({
            $or: [
                { workspaceId: workspace.sessionId },
                { workspaceId: workspace._id?.toString() },
                { workspaceId: workspace.id }
            ],
            isActive: true
        }) || await db.collection("dashboards").findOne({
            $or: [
                { workspaceId: workspace.sessionId },
                { workspaceId: workspace._id?.toString() },
                { workspaceId: workspace.id }
            ]
        });

        let tiles = workspace.tiles || [];

        // 3. Fetch Tiles from dedicated collection if dashboard exists
        if (dashboard) {
            console.log(`[PublicAPI] Fetching tiles for dashboard ${dashboard.id}`);
            const dashboardTiles = await db.collection("tiles").find({
                $or: [
                    { dashboardId: dashboard.id },
                    { workspaceId: workspace.sessionId },
                    { workspaceId: workspace._id?.toString() },
                    { workspaceId: workspace.id }
                ]
            }).toArray();
            
            if (dashboardTiles.length > 0) {
                tiles = dashboardTiles.map(t => ({
                    ...t,
                    id: t.id || t._id.toString()
                }));
            }
        }

        console.log(`[PublicAPI] Store found: ${workspace.name}, Tiles: ${tiles.length}. Categories: ${tiles.map((t: any) => t.category).join(', ')}`);

        // Return only necessary data for public view (security)
        return NextResponse.json({
            name: workspace.name,
            tiles: tiles,
            promptSettings: workspace.promptSettings
        });
    } catch (error) {
        console.error("[PublicAPI] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
