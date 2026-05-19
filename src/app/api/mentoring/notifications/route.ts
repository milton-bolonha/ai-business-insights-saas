import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { getAuth } from "@/lib/auth/get-auth";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Build notification query
    // We fetch global broadcasts ("global") and workspace-specific notifications
    const query: any = {
      $or: [
        { workspaceId: "global" },
        ...(workspaceId ? [{ workspaceId }] : [])
      ]
    };

    const notifications = await db.find("mentoring_notifications", query);

    // 2. Filter notifications meant for the user or sent by the user
    // A user sees:
    // - Global broadcasts (recipientId: "all")
    // - Direct notifications targeted to their userId
    // - Notifications they sent (senderId: userId)
    const filteredNotifications = notifications.filter((notif: any) => {
      return (
        notif.recipientId === "all" ||
        notif.recipientId === userId ||
        notif.senderId === userId
      );
    });

    // Sort by newest first
    filteredNotifications.sort((a: any, b: any) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // 3. Compute unread count (where readBy array does not contain current userId)
    const unreadCount = filteredNotifications.filter((notif: any) => {
      const readBy = notif.readBy || [];
      return !readBy.includes(userId) && notif.senderId !== userId;
    }).length;

    return NextResponse.json({ notifications: filteredNotifications, unreadCount });
  } catch (error) {
    console.error("[API/Mentoring/Notifications] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, recipientId, title, message, icon } = body;

    if (!workspaceId || !recipientId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization checks
    if (workspaceId === "global") {
      // Must be a global super admin
      const currentUser = await db.findOne("users", { userId });
      if (currentUser?.role !== "admin") {
        return NextResponse.json({ error: "Only global super admins can broadcast messages" }, { status: 403 });
      }
    } else {
      // Must be workspace admin/owner or editor
      const auth = await authorizeWorkspaceAccess(workspaceId, userId);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
      }

      const isOwner = auth.workspace?.userId === userId;
      let isManager = isOwner;

      if (!isManager) {
        const membership = await db.findOne("workspacememberships", {
          workspaceId,
          userId
        });
        if (membership && (membership.accessLevel === "owner" || membership.accessLevel === "editor" || membership.accessLevel === "admin")) {
          isManager = true;
        }
      }

      if (!isManager) {
        return NextResponse.json({ error: "Only workspace admins can send notifications" }, { status: 403 });
      }
    }

    const notification = {
      workspaceId,
      recipientId, // "all" or specific user's ID
      senderId: userId,
      title,
      message,
      icon: icon || "bell", // "bell", "info", "sparkles", "award", "alert"
      readBy: [],
      createdAt: new Date()
    };

    const notificationId = await db.insertOne("mentoring_notifications", notification);
    return NextResponse.json({ success: true, notificationId });
  } catch (error) {
    console.error("[API/Mentoring/Notifications] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all notifications matching this user's viewable criteria and add their ID to readBy array
    const query: any = {
      $or: [
        { workspaceId: "global" },
        ...(workspaceId ? [{ workspaceId }] : [])
      ],
      readBy: { $ne: userId },
      senderId: { $ne: userId }
    };

    // Update notifications matching the query to append current user to the 'readBy' array
    await db.updateMany("mentoring_notifications", query, {
      $addToSet: { readBy: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Mentoring/Notifications] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
