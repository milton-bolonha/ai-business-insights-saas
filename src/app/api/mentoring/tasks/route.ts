import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";
import { ObjectId } from "mongodb";

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
    const { workspaceId, title, description, status = "todo", dueDate, importance = 0 } = body;

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

    const task = {
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

    // Gamification dynamic XP logic
    const nextStatus = status || task.status;
    const prevStatus = task.status;
    const finalImportance = body.importance !== undefined ? Number(body.importance) : (task.importance || 0);
    const finalAssigneeId = assigneeId !== undefined ? assigneeId : (task.assigneeId || userId);

    if (nextStatus === "done" && prevStatus !== "done") {
      const xpAward = finalImportance * 10;
      if (xpAward > 0 && finalAssigneeId) {
        await db.updateOne("mentoring_profiles", { userId: finalAssigneeId }, { $inc: { xp: xpAward } });
      }
    } else if (nextStatus !== "done" && prevStatus === "done") {
      const xpAward = finalImportance * 10;
      if (xpAward > 0 && finalAssigneeId) {
        await db.updateOne("mentoring_profiles", { userId: finalAssigneeId }, { $inc: { xp: -xpAward } });
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

    await db.updateOne("mentoring_tasks", { _id: queryId }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Mentoring/Tasks] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
