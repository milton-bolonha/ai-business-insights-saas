import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { getAuth } from "@/lib/auth/get-auth";
import { AURORA_TRACK_SEED } from "@/lib/db/seeds/aurora-track-seed";

/**
 * POST /api/mentoring/tracks/seed
 * Inserts the "Aurora x Educandário" global template.
 * Idempotent: skips if a global template with the same program already exists.
 *
 * Only super-admins (workspace admins at system level) should call this.
 * In practice, protect this behind an env secret or super-admin check.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret = body.secret || req.headers.get("x-seed-secret");

    // Protect with env secret
    const expectedSecret = process.env.SEED_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await getAuth().catch(() => ({ userId: null }));

    // Check if already seeded
    const existing = await db.findOne("mentoring_tracks", {
      isGlobalTemplate: true,
      program: AURORA_TRACK_SEED.program,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: `Template "${AURORA_TRACK_SEED.program}" already exists`,
        trackId: existing._id?.toString(),
      });
    }

    const trackId = await db.insertOne("mentoring_tracks", {
      ...AURORA_TRACK_SEED,
      seededBy: userId || "system",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      skipped: false,
      trackId,
      message: `Template "${AURORA_TRACK_SEED.program}" seeded successfully`,
    });
  } catch (error) {
    console.error("[API/Mentoring/Tracks/Seed] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
