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
          setUser({
            role: "member",
            isPaid: false, // You might want to fetch this from publicMetadata
          });
        }
        // If isSignedIn is true but user is null/undefined, DO NOTHING.
        // Wait for the next render where user is populated.
      } else {
        // User is strictly guest (not signed in)
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
