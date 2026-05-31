import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { authorizeWorkspaceAccess } from "@/lib/auth/authorize";
import { getAuth } from "@/lib/auth/get-auth";
import type { MentoringTrack } from "@/lib/types/mentoring-tracks";

/**
 * GET /api/mentoring/tracks?workspaceId=xxx
 * Returns workspace tracks + all global templates
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const { userId } = await getAuth();
    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    // Own workspace tracks + global templates
    const tracks = await db.find("mentoring_tracks", {
      $or: [{ workspaceId }, { isGlobalTemplate: true }],
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("[API/Mentoring/Tracks] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/mentoring/tracks
 * Create a new track (owner only)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      workspaceId,
      name,
      program,
      description,
      unlockMode = "automatic",
      levels,
      sessions,
    } = body;

    if (!workspaceId || !name || !sessions?.length) {
      return NextResponse.json(
        { error: "workspaceId, name and sessions are required" },
        { status: 400 }
      );
    }

    const { userId } = await getAuth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auth = await authorizeWorkspaceAccess(workspaceId, userId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Workspace access denied" }, { status: 403 });
    }

    // Only workspace owner can create tracks
    const isOwner = auth.workspace?.userId === userId;
    if (!isOwner) {
      return NextResponse.json({ error: "Only workspace owners can create tracks" }, { status: 403 });
    }

    const track: Omit<MentoringTrack, "_id"> = {
      workspaceId,
      createdByUserId: userId,
      name,
      program: program || "",
      description: description || "",
      isGlobalTemplate: false,
      unlockMode: unlockMode === "manual" ? "manual" : "automatic",
      levels: levels || [
        { id: "reserva",  emoji: "🥉", name: "Reserva",  minXP: 0,   maxXP: 60  },
        { id: "titular",  emoji: "🥈", name: "Titular",  minXP: 61,  maxXP: 130 },
        { id: "destaque", emoji: "🥇", name: "Destaque", minXP: 131, maxXP: 199 },
        { id: "mvp",      emoji: "🏆", name: "MVP",      minXP: 200, maxXP: null },
      ],
      sessions,
      totalSessions: sessions.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const trackId = await db.insertOne("mentoring_tracks", track);
    return NextResponse.json({ success: true, trackId });
  } catch (error) {
    console.error("[API/Mentoring/Tracks] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
