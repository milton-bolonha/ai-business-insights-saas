import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";
import { ObjectId } from "mongodb";
import { resolveTrackLevel } from "@/lib/types/mentoring-tracks";
import type { MentoringTrackEnrollment, SessionProgress, TrackSession, TrackTask } from "@/lib/types/mentoring-tracks";

/**
 * GET /api/mentoring/enrollments?workspaceId=xxx&menteeUserId=yyy[&status=active]
 * List enrollments for a mentee (optionally filtered by workspace).
 * When only menteeUserId is provided (no workspaceId), returns public track level info only.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const menteeUserId = searchParams.get("menteeUserId");
    const statusFilter = searchParams.get("status"); // optional: "active" | "completed" | "paused"

    const query: any = {};
    if (workspaceId) query.workspaceId = workspaceId;
    if (menteeUserId) query.menteeUserId = menteeUserId;
    if (statusFilter) query.status = statusFilter;

    // If workspaceId is given, authorize access
    if (workspaceId) {
      const { userId } = await getAuth().catch(() => ({ userId: null }));
      if (userId) {
        const auth = await authorizeWorkspaceAccess(workspaceId, userId).catch(() => ({ authorized: false }));
        if (!auth.authorized) {
          return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
        }
      }
    } else if (!menteeUserId) {
      return NextResponse.json({ error: "workspaceId or menteeUserId is required" }, { status: 400 });
    }

    const enrollments = await db.find("mentoring_track_enrollments", query);

    // Enrich with track name/levels for display
    const enriched = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const track = await db.findOne("mentoring_tracks", {
          _id: (() => { try { return new ObjectId(enrollment.trackId); } catch { return enrollment.trackId; } })(),
        });
        const enriched: any = {
          ...enrollment,
          trackName: track?.name || "",
          trackProgram: track?.program || "",
          trackLevels: track?.levels || [],
          trackTotalSessions: track?.totalSessions || 0,
          unlockMode: track?.unlockMode || "automatic",
        };
        // For public access (no workspaceId), strip sessionProgress from response
        if (!workspaceId) {
          delete enriched.sessionProgress;
        }
        return enriched;
      })
    );

    return NextResponse.json({ enrollments: enriched });
  } catch (error) {
    console.error("[API/Mentoring/Enrollments] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/mentoring/enrollments
 * Enroll a mentee in a track.
 * Creates Kanban tasks for session 1 automatically.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackId, workspaceId, menteeUserId, menteeUserName } = body;

    if (!trackId || !workspaceId || !menteeUserId) {
      return NextResponse.json(
        { error: "trackId, workspaceId, menteeUserId are required" },
        { status: 400 }
      );
    }

    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Access denied" }, { status: 403 });
    }

    // Only workspace owner (mentor) can enroll
    const isOwner = auth.workspace?.userId === userId;
    if (!isOwner) {
      return NextResponse.json({ error: "Only workspace owners can enroll mentees" }, { status: 403 });
    }

    // Load track
    const track = await db.findOne("mentoring_tracks", {
      _id: (() => { try { return new ObjectId(trackId); } catch { return trackId; } })(),
    });
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    // Prevent duplicate active enrollment in same track
    const existing = await db.findOne("mentoring_track_enrollments", {
      trackId,
      workspaceId,
      menteeUserId,
      status: "active",
    });
    if (existing) {
      return NextResponse.json(
        { error: "Mentee already has an active enrollment in this track" },
        { status: 409 }
      );
    }

    // Create Kanban tasks for session 1
    const session1: TrackSession = track.sessions[0];
    const kanbanTaskIds: string[] = [];

    for (const trackTask of session1.tasks as TrackTask[]) {
      const kanbanTask = {
        workspaceId,
        title: trackTask.title,
        description: `${session1.tag} · ${track.name}`,
        status: "todo",
        importance: 0,              // visual only; XP comes from xpFixed
        assigneeId: menteeUserId,
        assigneeName: menteeUserName || null,
        // Track-specific fields
        trackId,
        trackSessionId: session1.id,
        trackTaskId: trackTask.id,
        trackTag: session1.tag,
        category: trackTask.category,
        xpFixed: trackTask.xp,
        bonus: trackTask.bonus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const kanbanTaskId = await db.insertOne("mentoring_tasks", kanbanTask);
      kanbanTaskIds.push(kanbanTaskId.toString());
    }

    // Build session progress array — session 1 unlocked, rest locked
    const sessionProgress: SessionProgress[] = track.sessions.map((s: TrackSession, idx: number) => ({
      sessionId: s.id,
      unlockedAt: idx === 0 ? new Date() : null,
      completedAt: null,
      kanbanTaskIds: idx === 0 ? kanbanTaskIds : [],
    }));

    const enrollment: Omit<MentoringTrackEnrollment, "_id"> = {
      trackId,
      workspaceId,
      menteeUserId,
      mentorUserId: userId,
      enrolledAt: new Date(),
      status: "active",
      currentLevelId: track.levels[0]?.id || "reserva",
      earnedXP: 0,
      sessionProgress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const enrollmentId = await db.insertOne("mentoring_track_enrollments", enrollment);
    return NextResponse.json({ success: true, enrollmentId });
  } catch (error) {
    console.error("[API/Mentoring/Enrollments] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
