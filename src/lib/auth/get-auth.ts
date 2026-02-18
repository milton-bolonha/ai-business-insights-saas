import { auth } from "@clerk/nextjs/server";

const clerkEnabled =
  Boolean(process.env.CLERK_SECRET_KEY) &&
  Boolean(process.env.CLERK_PUBLISHABLE_KEY);

/**
 * Get authentication status and user ID
 * Returns userId for authenticated members, null for guests
 */
export async function getAuth(): Promise<{ userId: string | null }> {
  if (!clerkEnabled) {
    // Clerk not configured (local/dev guest mode)
    return { userId: null };
  }

  try {
    const { userId } = await auth();

    if (userId) {
      return { userId };
    }

    // Guest user (no Clerk authentication)
    return { userId: null };
  } catch (error) {
    console.warn("[Auth] Authentication error:", error);
    // Treat as guest on auth errors
    return { userId: null };
  }
}
