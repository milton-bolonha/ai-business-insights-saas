import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";
import { ObjectId } from "mongodb";
import { resolveTrackLevel } from "@/lib/types/mentoring-tracks";
import type { TrackSession, TrackTask } from "@/lib/types/mentoring-tracks";

function toObjectId(id: string): any {
  try { return new ObjectId(id); } catch { return id; }
}

/**
 * Create Kanban tasks for a given track session
 */
async function createSessionKanbanTasks(
  session: TrackSession,
  workspaceId: string,
  menteeUserId: string,
  menteeUserName: string | null,
  trackId: string,
  trackName: string
): Promise<string[]> {
  const kanbanTaskIds: string[] = [];
  for (const trackTask of session.tasks as TrackTask[]) {
    const kanbanTask = {
      workspaceId,
      title: trackTask.title,
      description: `${session.tag} · ${trackName}`,
      status: "todo",
      importance: 0,
      assigneeId: menteeUserId,
      assigneeName: menteeUserName || null,
      trackId,
      trackSessionId: session.id,
      trackTaskId: trackTask.id,
      trackTag: session.tag,
      category: trackTask.category,
      xpFixed: trackTask.xp,
      bonus: trackTask.bonus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await db.insertOne("mentoring_tasks", kanbanTask);
    kanbanTaskIds.push(id.toString());
  }
  return kanbanTaskIds;
}

/**
 * PATCH /api/mentoring/enrollments/[enrollmentId]/session
 * Body: { sessionId: number, action: "complete_and_unlock_next" | "complete" }
 *
 * "complete_and_unlock_next" (mentor or auto-trigger):
 *   1. Mark current session completedAt
 *   2. Create Kanban tasks for next session
 *   3. Mark next session unlockedAt
 *   4. Recalculate level
 *
 * "complete" (last session):
 *   1. Mark current session completedAt
 *   2. Mark enrollment as completed
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId } = await params;
    const body = await req.json();
    const { sessionId, action, menteeUserName } = body;

    if (!sessionId || !action) {
      return NextResponse.json({ error: "sessionId and action are required" }, { status: 400 });
    }

    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollment = await db.findOne("mentoring_track_enrollments", {
      _id: toObjectId(enrollmentId),
    });
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    const auth = await authorizeWorkspaceAccess(enrollment.workspaceId, userId);
    if (!auth.authorized) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Load track
    const track = await db.findOne("mentoring_tracks", {
      _id: toObjectId(enrollment.trackId),
    });
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    const sessionProgress: any[] = enrollment.sessionProgress || [];
    const currentIdx = sessionProgress.findIndex((sp: any) => sp.sessionId === sessionId);

    if (currentIdx === -1) {
      return NextResponse.json({ error: "Session not found in enrollment" }, { status: 404 });
    }

    const currentSP = sessionProgress[currentIdx];
    if (!currentSP.unlockedAt) {
      return NextResponse.json({ error: "Session is still locked" }, { status: 400 });
    }

    const now = new Date();

    if (action === "complete_and_unlock_next") {
      // Mark current session complete
      sessionProgress[currentIdx] = { ...currentSP, completedAt: now };

      const nextIdx = currentIdx + 1;
      if (nextIdx < track.sessions.length) {
        const nextSession: TrackSession = track.sessions[nextIdx];

        // Create Kanban tasks for next session
        const nextKanbanIds = await createSessionKanbanTasks(
          nextSession,
          enrollment.workspaceId,
          enrollment.menteeUserId,
          menteeUserName || null,
          enrollment.trackId,
          track.name
        );

        // Unlock next session
        sessionProgress[nextIdx] = {
          ...sessionProgress[nextIdx],
          unlockedAt: now,
          kanbanTaskIds: nextKanbanIds,
        };
      }
    } else if (action === "complete") {
      sessionProgress[currentIdx] = { ...currentSP, completedAt: now };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Recalculate level from earnedXP
    const currentLevel = resolveTrackLevel(enrollment.earnedXP || 0, track.levels);

    // Check if all sessions complete → enrollment done
    const allComplete = sessionProgress.every((sp: any) => sp.completedAt !== null);

    await db.updateOne(
      "mentoring_track_enrollments",
      { _id: toObjectId(enrollmentId) },
      {
        $set: {
          sessionProgress,
          currentLevelId: currentLevel.id,
          status: allComplete ? "completed" : "active",
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      currentLevelId: currentLevel.id,
      status: allComplete ? "completed" : "active",
    });
  } catch (error) {
    console.error("[API/Mentoring/Enrollments/[id]/session] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
