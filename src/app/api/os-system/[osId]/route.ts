import { NextRequest, NextResponse } from "next/server";
import { getAuthWorkspace } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ osId: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    const { osId } = await params;
    const updates = await req.json().catch(() => null);

    if (!updates) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updatedOrder = await db.updateOne(
      "os_orders",
      { id: osId, workspaceId },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Not found or no changes made" }, { status: 404 });
    }

    // return the modified order if possible, or just a success flag
    return NextResponse.json({ success: true, message: "Order updated successfully" });
  } catch (err: any) {
    const { osId } = await params;
    console.error(`[PUT /api/os-system/${osId}]`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ osId: string }> }) {
  try {
    const { workspaceId, error, status } = await getAuthWorkspace(req);
    if (error || !workspaceId) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    const { osId } = await params;

    const result = await db.deleteOne("os_orders", { id: osId, workspaceId });
    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (err: any) {
    const { osId } = await params;
    console.error(`[DELETE /api/os-system/${osId}]`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
