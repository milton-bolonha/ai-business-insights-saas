import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });

    const pipelines = await db.find("blog_pipelines", { workspaceId }, { sort: { createdAt: -1 } });
    return NextResponse.json({ pipelines });
  } catch (error: any) {
    console.error("[GET_PIPELINES]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });

    const body = await req.json();
    const { name, target, sourceType, sourceValue, frequency, scheduledDays, scheduledTime } = body;

    if (!name || !target || !sourceType) {
      return NextResponse.json({ error: "Missing required pipeline fields" }, { status: 400 });
    }

    const newPipeline = {
      workspaceId,
      name,
      target, // "post" | "page"
      sourceType, // "prompt" | "url" | "file"
      sourceValue, // the text prompt or url
      frequency, // "once" | "daily" | "weekly"
      scheduledDays: scheduledDays || [], // [3] for Wednesday
      scheduledTime: scheduledTime || "09:00",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const id = await db.insertOne("blog_pipelines", newPipeline);
    return NextResponse.json({ pipeline: { ...newPipeline, _id: id } }, { status: 201 });
  } catch (error: any) {
    console.error("[POST_PIPELINE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Pipeline ID is required" }, { status: 400 });

    await db.deleteOne("blog_pipelines", { _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE_PIPELINE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
