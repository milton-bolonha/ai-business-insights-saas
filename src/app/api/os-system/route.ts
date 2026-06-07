import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    const orders = await db.find("os_orders", { workspaceId }, { sort: { createdAt: -1 } });
    
    // Transform _id to string for frontend compatibility if needed
    const serializedOrders = orders.map((o: any) => ({
      ...o,
      _id: o._id.toString(),
      // ensure we use the explicit string id generated or the stringified ObjectId
      id: o.id || o._id.toString() 
    }));

    return NextResponse.json({ orders: serializedOrders });
  } catch (err: any) {
    console.error("[GET /api/os-system]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const newOrder = {
      ...body,
      workspaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const _id = await db.insertOne("os_orders", newOrder);

    return NextResponse.json({ 
      success: true, 
      order: { ...newOrder, _id: _id.toString(), id: newOrder.id || _id.toString() } 
    });
  } catch (err: any) {
    console.error("[POST /api/os-system]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
