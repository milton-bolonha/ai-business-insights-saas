import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    const { userId } = await getAuth();
    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    const sessions = await db.find("mentoring_sessions", { 
      workspaceId,
      status: { $ne: "cancelled" } 
    });
    
    // Sort by date safely
    sessions.sort((a, b) => {
      const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
      const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
      return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[API/Mentoring/Sessions] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, title, description, startAt, endAt, meetingUrl } = body;

    if (!workspaceId || !title || !startAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Mentors (Managers/Owners) can schedule sessions
    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    const session = {
      workspaceId,
      title,
      description,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : new Date(new Date(startAt).getTime() + 60 * 60 * 1000), // Default 1h
      meetingUrl,
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessionId = await db.insertOne("mentoring_sessions", session);
    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("[API/Mentoring/Sessions] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
