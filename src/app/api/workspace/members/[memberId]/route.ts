import { NextRequest, NextResponse } from "next/server";
import { getAuthAndAuthorize } from "@/lib/auth/authorize";
import { db } from "@/lib/db/mongodb";
import { canManageMemberships } from "@/lib/auth/permissions";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// PATCH: Update member access level
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const auth = await getAuthAndAuthorize(workspaceId);
  if (!auth.authorized || !auth.userId) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { accessLevel } = body;

    if (!accessLevel) {
      return NextResponse.json({ error: "accessLevel is required" }, { status: 400 });
    }

    // Check if current user has permission to manage memberships
    const workspace = await db.findOne("workspaces", {
      $or: [{ sessionId: workspaceId }, { _id: workspaceId as any }]
    });

    let currentUserAccessLevel = 'viewer';
    if (workspace?.userId === auth.userId) {
      currentUserAccessLevel = 'owner';
    } else {
      const myMembership = await db.findOne("workspacememberships", {
        workspaceId,
        userId: auth.userId
      });
      if (myMembership) {
        currentUserAccessLevel = myMembership.accessLevel;
      }
    }

    if (!canManageMemberships(currentUserAccessLevel as any)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Find the membership to update
    const filter = {
      _id: new ObjectId(memberId),
      workspaceId
    };

    const existingMembership = await db.findOne("workspacememberships", filter);
    if (!existingMembership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    // Update the membership
    await db.updateOne("workspacememberships", filter, {
      $set: {
        accessLevel,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[api/workspace/members/[id]] Error updating member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const auth = await getAuthAndAuthorize(workspaceId);
  if (!auth.authorized || !auth.userId) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if current user has permission to manage memberships
    const workspace = await db.findOne("workspaces", {
      $or: [{ sessionId: workspaceId }, { _id: workspaceId as any }]
    });

    let currentUserAccessLevel = 'viewer';
    if (workspace?.userId === auth.userId) {
      currentUserAccessLevel = 'owner';
    } else {
      const myMembership = await db.findOne("workspacememberships", {
        workspaceId,
        userId: auth.userId
      });
      if (myMembership) {
        currentUserAccessLevel = myMembership.accessLevel;
      }
    }

    if (!canManageMemberships(currentUserAccessLevel as any)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Ensure they are not trying to delete the owner (which wouldn't have a membership doc anyway, but just in case)
    
    // Find the membership to delete
    const filter = {
      _id: new ObjectId(memberId),
      workspaceId
    };

    const existingMembership = await db.findOne("workspacememberships", filter);
    if (!existingMembership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    // Delete the membership
    await db.deleteOne("workspacememberships", filter);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[api/workspace/members/[id]] Error deleting member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
