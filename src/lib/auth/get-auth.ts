import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const clerkEnabled =
  Boolean(process.env.CLERK_SECRET_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Get authentication status and user ID
 * Returns userId for authenticated members, null for guests
 */
export async function getAuth(): Promise<{ userId: string | null }> {
  console.log("[Auth] Checking clerkEnabled:", { clerkEnabled, secret: !!process.env.CLERK_SECRET_KEY, pub: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY });

  if (clerkEnabled) {
    try {
      const { userId } = await auth();
      console.log("[Auth] Clerk auth() returned userId:", userId);
      if (userId) {
        return { userId };
      }
    } catch (error) {
      console.error("[Auth] Authentication error:", error);
    }
  }

  // Only check guest cookie if Clerk is not signed in
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_user_id")?.value;
    if (guestId) {
      return { userId: guestId };
    }
  } catch (e) {
    // Ignore cookie errors during weird edge case renders
  }

  if (!clerkEnabled) {
    // Clerk not configured (local/dev guest mode)
    console.log("[Auth] Clerk not enabled, returning default 'guest_temp'");
    return { userId: "guest_temp" };
  }

  return { userId: null };
}

import { NextRequest } from "next/server";

export async function getAuthWorkspace(req: NextRequest): Promise<{ workspaceId?: string; error?: string; status?: number }> {
  const { userId } = await getAuth();
  if (!userId) return { error: "Unauthorized", status: 401 };

  const cookieStore = await cookies();
  const workspaceId = req.nextUrl.searchParams.get("workspaceId") || cookieStore.get("insightsWorkspaceSession")?.value;

  if (!workspaceId) {
    return { error: "No workspace session found", status: 400 };
  }

  return { workspaceId, status: 200 };
}

