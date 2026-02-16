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
      if (isSignedIn && user) {
        // User is logged in
        console.log("[AuthSync] User is signed in:", user.id);
        setUser({
          role: "member", // Assuming all authenticated users are members for now
          isPaid: false, // You might want to fetch this from publicMetadata
        });

        // Removed aggressive cache clearing. 
        // Migration logic (useGuestDataMigration) handles data movement and cleanup.
        // Clearing here causes race conditions and data loss on reload if migration hasn't run.
      } else {
        // User is guest
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
