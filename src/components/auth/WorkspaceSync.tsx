"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

/**
 * Syncs workspace data from the server for authenticated members.
 * This ensures that members see their persisted data (MongoDB) instead of local storage.
 */
export function WorkspaceSync() {
  const { isSignedIn } = useUser();
  const { isMember, user } = useAuthStore();
  const refreshWorkspaces = useWorkspaceStore((state) => state.refreshWorkspaces);

  useEffect(() => {
    if (!isMember || !user || !isSignedIn) return;
    refreshWorkspaces();
  }, [isMember, user, isSignedIn, refreshWorkspaces]);

  return null;
}
