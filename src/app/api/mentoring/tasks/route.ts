import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";
import { ObjectId } from "mongodb";
import { resolveTrackLevel } from "@/lib/types/mentoring-tracks";
import type { TrackSession, TrackTask } from "@/lib/types/mentoring-tracks";

function toObjectId(id: string) {
  try { return new ObjectId(id); } catch { return id; }
}

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

    const tasks = await db.find("mentoring_tasks", { workspaceId });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[API/Mentoring/Tasks] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      workspaceId, title, description, status = "todo", dueDate, importance = 0,
      // Track-related optional fields
      trackId, trackSessionId, trackTaskId, trackTag, category, xpFixed, bonus,
    } = body;

    if (!workspaceId || !title) {
      return NextResponse.json({ error: "Workspace ID and title are required" }, { status: 400 });
    }

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only authorized members can create tasks
    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    const task: any = {
      workspaceId,
      title,
      description,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      importance: Number(importance),
      assigneeId: body.assigneeId || null,
      assigneeName: body.assigneeName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Attach track metadata if provided
    if (trackId !== undefined)        task.trackId = trackId;
    if (trackSessionId !== undefined) task.trackSessionId = trackSessionId;
    if (trackTaskId !== undefined)    task.trackTaskId = trackTaskId;
    if (trackTag !== undefined)       task.trackTag = trackTag;
    if (category !== undefined)       task.category = category;
    if (xpFixed !== undefined)        task.xpFixed = Number(xpFixed);
    if (bonus !== undefined)          task.bonus = Boolean(bonus);

    const taskId = await db.insertOne("mentoring_tasks", task);
    return NextResponse.json({ success: true, taskId });
  } catch (error) {
    console.error("[API/Mentoring/Tasks] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { taskId, status, title, description, dueDate, assigneeId, assigneeName } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    let queryId: any = taskId;
    try {
      queryId = new ObjectId(taskId);
    } catch (e) {
      // Fallback if not a valid 24-char hex string
    }

    // Find the task first to get the workspaceId and previous status
    const task = await db.findOne("mentoring_tasks", { _id: queryId });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check workspace access
    const auth = await authorizeWorkspaceAccess(task.workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    // Gamification XP logic
    // Track tasks use xpFixed; avulse tasks use importance × 10
    const nextStatus = status || task.status;
    const prevStatus = task.status;
    const finalImportance = body.importance !== undefined ? Number(body.importance) : (task.importance || 0);
    const finalAssigneeId = assigneeId !== undefined ? assigneeId : (task.assigneeId || userId);
    const xpAward =
      task.xpFixed !== undefined && task.xpFixed !== null
        ? Number(task.xpFixed)
        : finalImportance * 10;

    if (nextStatus === "done" && prevStatus !== "done") {
      if (xpAward > 0 && finalAssigneeId) {
        await db.updateOne("mentoring_profiles", { userId: finalAssigneeId }, { $inc: { xp: xpAward } });
      }
      // Track auto-unlock: check if this completes a session
      if (task.trackId && task.trackSessionId !== undefined) {
        await checkAndAutoUnlockSession(task, xpAward, finalAssigneeId);
      }
    } else if (nextStatus !== "done" && prevStatus === "done") {
      if (xpAward > 0 && finalAssigneeId) {
        await db.updateOne("mentoring_profiles", { userId: finalAssigneeId }, { $inc: { xp: -xpAward } });
      }
      // Reverse XP in enrollment too
      if (task.trackId) {
        await db.updateOne(
          "mentoring_track_enrollments",
          { trackId: task.trackId, menteeUserId: finalAssigneeId, status: "active" },
          { $inc: { earnedXP: -xpAward }, $set: { updatedAt: new Date() } }
        );
      }
    }

    const update: any = { updatedAt: new Date() };
    if (status) update.status = status;
    if (title) update.title = title;
    if (description) update.description = description;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (body.importance !== undefined) update.importance = Number(body.importance);
    if (assigneeId !== undefined) update.assigneeId = assigneeId;
    if (assigneeName !== undefined) update.assigneeName = assigneeName;

    // Allow updating track fields too
    if (body.category !== undefined)    update.category = body.category;
    if (body.trackTag !== undefined)    update.trackTag = body.trackTag;
    if (body.xpFixed !== undefined)     update.xpFixed = Number(body.xpFixed);
    if (body.bonus !== undefined)       update.bonus = Boolean(body.bonus);

    await db.updateOne("mentoring_tasks", { _id: queryId }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Mentoring/Tasks] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helper: Auto-unlock next track session when all mandatory tasks are done
// ---------------------------------------------------------------------------
async function checkAndAutoUnlockSession(
  task: any,
  xpAward: number,
  menteeUserId: string
) {
  try {
    // Find the active enrollment for this track + mentee
    const enrollment = await db.findOne("mentoring_track_enrollments", {
      trackId: task.trackId,
      menteeUserId,
      status: "active",
    });
    if (!enrollment) return;

    // Load track to check unlockMode
    const track = await db.findOne("mentoring_tracks", {
      _id: (() => { try { return new ObjectId(task.trackId); } catch { return task.trackId; } })() as any,
    });
    if (!track) return;

    // Increment earnedXP in enrollment
    await db.updateOne(
      "mentoring_track_enrollments",
      { _id: enrollment._id },
      { $inc: { earnedXP: xpAward }, $set: { updatedAt: new Date() } }
    );

    // Recalculate level
    const updatedEnrollment = await db.findOne("mentoring_track_enrollments", { _id: enrollment._id });
    const newLevel = resolveTrackLevel(updatedEnrollment?.earnedXP || 0, track.levels);
    if (newLevel.id !== enrollment.currentLevelId) {
      await db.updateOne(
        "mentoring_track_enrollments",
        { _id: enrollment._id },
        { $set: { currentLevelId: newLevel.id, updatedAt: new Date() } }
      );
    }

    // Only auto-unlock if mode is automatic
    if (track.unlockMode !== "automatic") return;

    const sessionProgress: any[] = enrollment.sessionProgress || [];
    const currentSP = sessionProgress.find((sp: any) => sp.sessionId === task.trackSessionId);
    if (!currentSP || currentSP.completedAt) return; // already completed

    // Fetch all non-bonus tasks for this session
    const sessionKanbanIds = (currentSP.kanbanTaskIds || []).map((id: string): any => {
      try { return new ObjectId(id); } catch { return id; }
    });

    if (!sessionKanbanIds.length) return;

    const sessionTasks = await db.find("mentoring_tasks", {
      _id: { $in: sessionKanbanIds } as any,
    });

    // All non-bonus tasks must be done
    const mandatoryTasks = sessionTasks.filter((t: any) => !t.bonus);
    const allDone = mandatoryTasks.length > 0 && mandatoryTasks.every((t: any) => t.status === "done");

    if (!allDone) return;

    // Find current session index
    const currentIdx = sessionProgress.findIndex((sp: any) => sp.sessionId === task.trackSessionId);
    const nextIdx = currentIdx + 1;

    const now = new Date();
    const updatedProgress = [...sessionProgress];
    updatedProgress[currentIdx] = { ...currentSP, completedAt: now };

    if (nextIdx < track.sessions.length) {
      const nextSession = track.sessions[nextIdx];

      // Create Kanban tasks for next session
      const nextKanbanIds: string[] = [];
      for (const trackTask of nextSession.tasks as TrackTask[]) {
        const kanbanTaskDoc = {
          workspaceId: enrollment.workspaceId,
          title: trackTask.title,
          description: `${nextSession.tag} · ${track.name}`,
          status: "todo",
          importance: 0,
          assigneeId: menteeUserId,
          assigneeName: null,
          trackId: task.trackId,
          trackSessionId: nextSession.id,
          trackTaskId: trackTask.id,
          trackTag: nextSession.tag,
          category: trackTask.category,
          xpFixed: trackTask.xp,
          bonus: trackTask.bonus,
          createdAt: now,
          updatedAt: now,
        };
        const id = await db.insertOne("mentoring_tasks", kanbanTaskDoc);
        nextKanbanIds.push(id.toString());
      }

      updatedProgress[nextIdx] = {
        ...updatedProgress[nextIdx],
        unlockedAt: now,
        kanbanTaskIds: nextKanbanIds,
      };
    }

    const allComplete = updatedProgress.every((sp: any) => sp.completedAt !== null);

    await db.updateOne(
      "mentoring_track_enrollments",
      { _id: enrollment._id },
      {
        $set: {
          sessionProgress: updatedProgress,
          status: allComplete ? "completed" : "active",
          updatedAt: now,
        },
      }
    );
  } catch (err) {
    // Non-blocking — log and continue
    console.error("[checkAndAutoUnlockSession] Error:", err);
  }
}
