import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/get-auth";
import { db } from "@/lib/db/mongodb";
import { isAdmin } from "@/lib/auth/permissions";

export const runtime = 'nodejs';

// GET: List all users (Admin only)
export async function GET(request: NextRequest) {
  const { userId } = await getAuth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify current user is admin
    const currentUser = await db.findOne("users", { userId });
    if (!currentUser || !isAdmin(currentUser as any)) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // Fetch all users
    const users = await db.find("users", {});

    // Map to a safe DTO (excluding sensitive fields if any)
    const usersList = users.map(u => ({
      id: u._id?.toString(),
      userId: u.userId,
      email: u.email,
      name: u.fullName || u.firstName || "Sem Nome",
      role: u.role || 'user',
      plan: u.plan || 'free',
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: usersList });
  } catch (error) {
    console.error("[api/admin/users] Error listing users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
