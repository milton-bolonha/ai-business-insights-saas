import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { isAdmin } from "@/lib/auth/permissions";

export const runtime = 'nodejs';

// PATCH: Update user's global role (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetUserId } = await params;
  const { userId: currentUserId } = await getAuth();

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify current user is admin
    const currentUser = await db.findOne("users", { userId: currentUserId });
    if (!currentUser || !isAdmin(currentUser as any)) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "special", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Prevent removing your own admin rights (safeguard)
    if (targetUserId === currentUserId && role !== "admin") {
      return NextResponse.json({ error: "Cannot remove your own admin rights" }, { status: 400 });
    }

    const targetUser = await db.findOne("users", { userId: targetUserId });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Update the role
    await db.updateOne(
      "users",
      { userId: targetUserId },
      {
        $set: {
          role,
          updatedAt: new Date(),
        }
      }
    );

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("[api/admin/users/[id]/role] Error updating user role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
