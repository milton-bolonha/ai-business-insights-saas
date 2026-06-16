import { NextRequest, NextResponse } from "next/server";
import { getAuthAndAuthorize } from "@/lib/auth/authorize";
import { db } from "@/lib/db/mongodb";
import { canManageMemberships } from "@/lib/auth/permissions";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// GET: List all members of a workspace
export async function GET(request: NextRequest) {
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
    // Determine user's access level to ensure they can view
    // (If authorized, they are either owner or have a membership)
    
    // Get all memberships for the workspace
    const memberships = await db.find("workspacememberships", {
      workspaceId: workspaceId
    });

    // We should also get the owner (from workspace document)
    const workspace = await db.findOne("workspaces", {
      $or: [{ sessionId: workspaceId }, { _id: workspaceId as any }]
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Populate user info for owner
    const ownerUser = await db.findOne("users", { userId: workspace.userId });
    
    const membersList = [];
    
    // Add owner
    if (ownerUser) {
      membersList.push({
        id: ownerUser.userId,
        userId: ownerUser.userId,
        email: ownerUser.email,
        name: ownerUser.fullName || ownerUser.firstName || "Owner",
        accessLevel: "owner",
        isOwner: true
      });
    }

    // Populate user info for other members
    for (const member of memberships) {
      if (member.userId === workspace.userId) continue; // Skip if owner somehow has a membership doc
      
      if (member.userId) {
        const user = await db.findOne("users", { userId: member.userId });
        const profile = await db.findOne("mentoring_profiles", { userId: member.userId });
        if (user || profile) {
          const name = profile?.name || (user ? (user.fullName || user.firstName) : null) || "Membro";
          membersList.push({
            id: member._id?.toString(),
            userId: member.userId,
            email: (user?.email || member.email) || "",
            name: name,
            accessLevel: member.accessLevel,
            status: member.status || 'active',
            isOwner: false,
            createdAt: member.createdAt
          });
          continue;
        }
      }
      
      // If user doc not found or userId is null (pending invitation)
      membersList.push({
        id: member._id?.toString(),
        userId: member.userId || null,
        email: member.email || "Sem e-mail",
        name: "Cadastro Pendente",
        accessLevel: member.accessLevel,
        status: member.status || 'pending',
        isOwner: false,
        createdAt: member.createdAt
      });
    }

    return NextResponse.json({ members: membersList });
  } catch (error) {
    console.error("[api/workspace/members] Error listing members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Invite/Add a member by email
export async function POST(request: NextRequest) {
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
    const { email, accessLevel } = body;

    if (!email || !accessLevel) {
      return NextResponse.json({ error: "Email and accessLevel are required" }, { status: 400 });
    }

    // Check if current user has permission to add members
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

    // Find the user to invite
    const userToInvite = await db.findOne("users", { email });
    const inviteUserId = userToInvite?.userId || null;

    // Prevent adding the owner as a member
    if (inviteUserId === workspace?.userId) {
      return NextResponse.json({ error: "User is already the owner of this workspace" }, { status: 400 });
    }

    // Check if already a member (either active or pending)
    const existingMembership = await db.findOne("workspacememberships", {
      workspaceId,
      $or: [
        { userId: inviteUserId },
        { email: email }
      ]
    });

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    // Create membership
    const result = await db.insertOne("workspacememberships", {
      workspaceId,
      userId: inviteUserId, // Can be null (pending)
      email: email, // Store email to link later
      accessLevel,
      status: inviteUserId ? 'active' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // If not a registered platform user yet (pending), send Clerk invite
    if (!inviteUserId) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        await client.invitations.createInvitation({
          emailAddress: email,
          ignoreExisting: true
        });
        console.log(`[Clerk Invite] Sent Clerk invitation email to ${email}`);
      } catch (clerkErr) {
        console.error("[Clerk Invite] Error sending Clerk invitation:", clerkErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      membershipId: result,
      status: inviteUserId ? 'active' : 'pending'
    });

  } catch (error) {
    console.error("[api/workspace/members] Error adding member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
