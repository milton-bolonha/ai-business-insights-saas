import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { Tile } from "@/lib/types";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: workspaceId } = await params;
        const { db } = await connectToDatabase();
        const { product } = await request.json();

        // 1. Find the orders/leads tile in this workspace
        const workspace = await db.collection("workspaces").findOne({
            sessionId: workspaceId
        });

        if (!workspace) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const tiles = (workspace.tiles || []) as Tile[];
        const ordersTile = tiles.find((t: Tile) => t.category === "orders");

        if (!ordersTile) {
            return NextResponse.json({ error: "Order panel not configured in this store." }, { status: 400 });
        }

        // 2. Create the order object
        const newOrder = {
            id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            clientName: "External Interest (Store)",
            product: product.name,
            value: product.price,
            status: "To Assemble",
            priority: "Medium",
            paymentMethod: "To Define",
            createdAt: new Date().toISOString()
        };

        // 3. Update the tile in the DB
        const currentMetadata = ordersTile.metadata || {};
        const ordersList = currentMetadata.orders || (Array.isArray(currentMetadata) ? currentMetadata : []);
        
        const updatedMetadata = {
            ...currentMetadata,
            orders: [...ordersList, newOrder]
        };

        await db.collection("workspaces").updateOne(
            { sessionId: workspaceId, "tiles.id": ordersTile.id },
            { $set: { "tiles.$.metadata": updatedMetadata } }
        );

        return NextResponse.json({ success: true, orderId: newOrder.id });
    } catch (error) {
        console.error("[PublicAPI] POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
