import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";
import { ObjectId } from "mongodb";
import { resolveTrackLevel } from "@/lib/types/mentoring-tracks";

function toObjectId(id: string): any {
  try { return new ObjectId(id); } catch { return id; }
}

/**
 * GET /api/mentoring/enrollments/[enrollmentId]
 * Full enrollment progress enriched with Kanban task statuses per session.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId } = await params;
    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollment = await db.findOne("mentoring_track_enrollments", {
      _id: toObjectId(enrollmentId),
    });
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    const auth = await authorizeWorkspaceAccess(enrollment.workspaceId, userId);
    if (!auth.authorized) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Load track
    const track = await db.findOne("mentoring_tracks", { _id: toObjectId(enrollment.trackId) });

    // Enrich each session with live task data from Kanban
    const enrichedSessions = await Promise.all(
      enrollment.sessionProgress.map(async (sp: any) => {
        const tasks =
          sp.kanbanTaskIds?.length > 0
            ? await db.find("mentoring_tasks", {
                _id: { $in: sp.kanbanTaskIds.map(toObjectId) },
              })
            : [];

        return {
          ...sp,
          tasks: tasks.map((t: any) => ({
            _id: t._id?.toString(),
            title: t.title,
            status: t.status,
            trackTaskId: t.trackTaskId,
            category: t.category,
            xpFixed: t.xpFixed,
            bonus: t.bonus,
            trackTag: t.trackTag,
          })),
        };
      })
    );

    return NextResponse.json({
      enrollment: {
        ...enrollment,
        sessionProgress: enrichedSessions,
      },
      track,
    });
  } catch (error) {
    console.error("[API/Mentoring/Enrollments/[id]] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/mentoring/enrollments/[enrollmentId]
 * Change enrollment status: "pause" | "resume" | "complete"
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId } = await params;
    const body = await req.json();
    const { action } = body;

    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollment = await db.findOne("mentoring_track_enrollments", {
      _id: toObjectId(enrollmentId),
    });
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    const auth = await authorizeWorkspaceAccess(enrollment.workspaceId, userId);
    if (!auth.authorized) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const statusMap: Record<string, string> = {
      pause: "paused",
      resume: "active",
      complete: "completed",
    };

    if (!statusMap[action]) {
      return NextResponse.json({ error: "Invalid action. Use: pause | resume | complete" }, { status: 400 });
    }

    await db.updateOne(
      "mentoring_track_enrollments",
      { _id: toObjectId(enrollmentId) },
      { $set: { status: statusMap[action], updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, status: statusMap[action] });
  } catch (error) {
    console.error("[API/Mentoring/Enrollments/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
