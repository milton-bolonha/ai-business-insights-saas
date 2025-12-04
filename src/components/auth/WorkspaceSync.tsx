"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

/**
 * Syncs workspace data from the server for authenticated members.
 * This ensures that members see their persisted data (MongoDB) instead of local storage.
 */
export function WorkspaceSync() {
  const { isMember, user } = useAuthStore();
  const refreshWorkspaces = useWorkspaceStore((state) => state.refreshWorkspaces);

  useEffect(() => {
    if (!isMember || !user) return;
    refreshWorkspaces();
  }, [isMember, user, refreshWorkspaces]);

  return null;
}
