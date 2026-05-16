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

          // Sync usage and credits from DB for the member
          if (!hasClearedMemberCache.current) {
            fetch("/api/user/sync-usage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                userId: user.id,
                email: user.primaryEmailAddress?.emailAddress 
              })
            }).then(res => res.json()).then(data => {
              if (data.globalRole || data.usage) {
                console.log("[AuthSync] ✅ Member synced from DB:", data);
                if (data.usage) useAuthStore.getState().setUsage(data.usage);
                
                // Update user with globalRole
                const storeUser = useAuthStore.getState().user;
                if (storeUser) {
                  setUser({
                    ...storeUser,
                    globalRole: data.globalRole || "user"
                  });
                }
                hasClearedMemberCache.current = true;
              }
            }).catch(err => console.error("[AuthSync] Member usage sync failed:", err));
          }
        }
      } else { // User is NOT signed in
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
