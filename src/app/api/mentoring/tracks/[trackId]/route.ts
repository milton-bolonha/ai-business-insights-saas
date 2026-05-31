import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";
import { ObjectId } from "mongodb";

function toObjectId(id: string): any {
  try { return new ObjectId(id); } catch { return id; }
}

/**
 * GET /api/mentoring/tracks/[trackId]
 * Full track detail with sessions and tasks
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const track = await db.findOne("mentoring_tracks", { _id: toObjectId(trackId) });
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    // Global templates are public; workspace tracks require access
    if (!track.isGlobalTemplate && track.workspaceId) {
      const auth = await authorizeWorkspaceAccess(track.workspaceId, userId);
      if (!auth.authorized) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error("[API/Mentoring/Tracks/[trackId]] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/mentoring/tracks/[trackId]
 * Update track fields (owner only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const body = await req.json();
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const track = await db.findOne("mentoring_tracks", { _id: toObjectId(trackId) });
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    if (track.workspaceId) {
      const auth = await authorizeWorkspaceAccess(track.workspaceId, userId);
      if (!auth.authorized) return NextResponse.json({ error: "Access denied" }, { status: 403 });
      if (auth.workspace?.userId !== userId) {
        return NextResponse.json({ error: "Only workspace owners can edit tracks" }, { status: 403 });
      }
    }

    const allowed = ["name", "program", "description", "unlockMode", "levels", "sessions"];
    const update: any = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.sessions) update.totalSessions = body.sessions.length;

    await db.updateOne("mentoring_tracks", { _id: toObjectId(trackId) }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Mentoring/Tracks/[trackId]] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/mentoring/tracks/[trackId]
 * Delete track if no active enrollments (owner only)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const track = await db.findOne("mentoring_tracks", { _id: toObjectId(trackId) });
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    if (track.workspaceId) {
      const auth = await authorizeWorkspaceAccess(track.workspaceId, userId);
      if (!auth.authorized) return NextResponse.json({ error: "Access denied" }, { status: 403 });
      if (auth.workspace?.userId !== userId) {
        return NextResponse.json({ error: "Only workspace owners can delete tracks" }, { status: 403 });
      }
    }

    // Block delete if active enrollments exist
    const activeEnrollments = await db.find("mentoring_track_enrollments", {
      trackId,
      status: "active",
    });
    if (activeEnrollments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete track with active enrollments" },
        { status: 409 }
      );
    }

    await db.deleteOne("mentoring_tracks", { _id: toObjectId(trackId) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Mentoring/Tracks/[trackId]] DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
