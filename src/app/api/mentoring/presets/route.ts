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

    // Load custom presets stored in database
    const customPresets = await db.find("mentoring_presets", { workspaceId });
    return NextResponse.json({ presets: customPresets });
  } catch (error) {
    console.error("[API/Mentoring/Presets] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      workspaceId, 
      id, 
      label, 
      title, 
      objective, 
      description, 
      videoUrl, 
      pdfUrl, 
      meetingUrl 
    } = body;

    if (!workspaceId || !label || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    // Enforce Admin/Owner role check
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
      return NextResponse.json({ error: "Only workspace admins/owners can manage presets" }, { status: 403 });
    }

    const presetData = {
      workspaceId,
      label,
      title,
      objective: objective || "",
      description: description || "",
      videoUrl: videoUrl || "",
      pdfUrl: pdfUrl || "",
      meetingUrl: meetingUrl || "https://meet.google.com/abc-defg-hij",
      updatedAt: new Date()
    };

    if (id) {
      // Update existing preset
      await db.updateOne("mentoring_presets", { workspaceId, id }, { $set: presetData });
      return NextResponse.json({ success: true, id });
    } else {
      // Create new preset
      const newId = `preset_${Date.now()}`;
      const newPreset = {
        ...presetData,
        id: newId,
        createdAt: new Date()
      };
      await db.insertOne("mentoring_presets", newPreset);
      return NextResponse.json({ success: true, id: newId });
    }
  } catch (error) {
    console.error("[API/Mentoring/Presets] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const id = searchParams.get("id");

    if (!workspaceId || !id) {
      return NextResponse.json({ error: "Workspace ID and Preset ID are required" }, { status: 400 });
    }

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    // Enforce Admin/Owner role check
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
      return NextResponse.json({ error: "Only workspace admins/owners can manage presets" }, { status: 403 });
    }

    await db.deleteOne("mentoring_presets", { workspaceId, id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Mentoring/Presets] DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
