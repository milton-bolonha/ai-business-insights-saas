"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

export function AuthSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const setUser = useAuthStore((state) => state.setUser);
  const clearWorkspace = useWorkspaceStore((state) => state.clearWorkspace);
  const hasClearedMemberCache = useRef(false);

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        if (user) {
          // User is logged in AND user object is ready
          console.log("[AuthSync] User is signed in:", user.id);
          const currentStoreUser = useAuthStore.getState().user;
          setUser({
            role: "member",
            isPaid: currentStoreUser?.isPaid || false, // Maintain local payment claim until verified
            ...({ id: user.id } as any) // Pass the Clerk ID so modal can use it immediately
          });
        }
        // If isSignedIn is true but user is null/undefined, DO NOTHING.
        // Wait for the next render where user is populated.
      } else { // User is NOT signed in
        const currentStoreUser = useAuthStore.getState().user;
        const storedGuestId = typeof window !== "undefined" ? localStorage.getItem("guest_checkout_user_id") : null;

        if (storedGuestId) {
          console.log("[AuthSync] User is guest but has an active local payment token. Hydrating backend credits...");
          document.cookie = `guest_user_id=${storedGuestId}; path=/; max-age=31536000; SameSite=Lax`;
          fetch("/api/user/usage-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: storedGuestId })
          }).then(res => res.json()).then(data => {
            if (typeof data.creditsTotal === 'number' && data.creditsTotal > 0) {
              console.log(`[AuthSync] Hydrated ${data.creditsTotal} global dynamic credits from backend for unauthenticated buyer.`);
              useAuthStore.getState().setUsage({ creditsTotal: data.creditsTotal });
              setUser({ role: "member", isPaid: true });
            } else {
              console.warn("[AuthSync] Guest token has 0 lifetime credits. Purging stale session.");
              localStorage.removeItem("guest_checkout_user_id");
              document.cookie = "guest_user_id=; path=/; max-age=0; SameSite=Lax";
              useAuthStore.getState().setUsage({ creditsTotal: 0, creditsUsed: 0 });
            }
          }).catch(() => { });
          return;
        }

        if (currentStoreUser?.role === 'member' && currentStoreUser?.isPaid) {
          console.log("[AuthSync] User is guest but has an active local payment. Retaining temporary member role.");
          return;
        }

        console.log("[AuthSync] User is guest");
        setUser({
          role: "guest",
        });
        hasClearedMemberCache.current = false;
      }
    }
  }, [isLoaded, isSignedIn, user, setUser, clearWorkspace]);

  return null;
}
