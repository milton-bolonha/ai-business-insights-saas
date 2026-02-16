"use client";

import { useCallback } from "react";
import { useUIStore, useWorkspaceStore, useAuthStore } from "@/lib/stores";
import { useUpdateBgColor } from "@/lib/state/query/dashboard.queries";
import type { Dashboard } from "@/lib/types/dashboard";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";

export function useAppearanceManagement(currentDashboard?: Dashboard) {
  const { appearance, setBaseColor } = useUIStore();
  const { updateDashboard } = useWorkspaceStore();
  const { isGuest } = useAuthStore();
  const { mutate: updateBgColorApi } = useUpdateBgColor();
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const currentWorkspace = workspaces.find(w => w.dashboards.find(d => d.id === currentDashboard?.id)) || workspaces[0];

  const handleCustomizeBackground = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!currentDashboard) {
        console.log('[DEBUG] useAppearanceManagement: no current dashboard');
        return;
      }

      // Cycle through some predefined colors
      const colors = ["#f7f7f7", "#e8f4fd", "#f0f9e8", "#fef7ed"];
      const currentBgColor = currentDashboard.bgColor || appearance.baseColor;
      const currentIndex = colors.indexOf(currentBgColor);
      const nextIndex = (currentIndex + 1) % colors.length;
      const nextColor = colors[nextIndex];

      const workspaceId = currentDashboard.workspaceId || currentWorkspace?.id;

      if (!workspaceId) {
        console.warn('[DEBUG] useAppearanceManagement: missing workspaceId, skipping API call');
        // Still update local state though
        if (currentDashboard.workspaceId) {
          updateDashboard(currentDashboard.workspaceId, currentDashboard.id, {
            bgColor: nextColor
          });
        }
        setBaseColor(nextColor);
        return;
      }

      console.log('[DEBUG] useAppearanceManagement:', {
        currentDashboardId: currentDashboard.id,
        currentBgColor,
        nextColor,
        workspaceId
      });

      // Update the dashboard's bgColor
      // 1. Optimistic update (local store)
      updateDashboard(workspaceId, currentDashboard.id, {
        bgColor: nextColor
      });

      // 2. Persist to server (for both members and guests)
      updateBgColorApi({
        dashboardId: currentDashboard.id,
        workspaceId: workspaceId,
        bgColor: nextColor
      });

      // Also update the global appearance for consistency
      setBaseColor(nextColor);
    },
    [
      appearance.baseColor,
      setBaseColor,
      updateDashboard,
      currentDashboard,
      currentWorkspace,
      isGuest,
      updateBgColorApi,
    ]
  );

  const handleSetBackground = useCallback(
    (color: string) => {
      if (!currentDashboard) {
        console.log('[DEBUG] useAppearanceManagement: no current dashboard');
        return;
      }

      const workspaceId = currentDashboard.workspaceId || currentWorkspace?.id;

      if (!workspaceId) {
        console.warn('[DEBUG] useAppearanceManagement.handleSetBackground: missing workspaceId');
        setBaseColor(color);
        return;
      }

      console.log('[DEBUG] useAppearanceManagement.handleSetBackground:', {
        currentDashboardId: currentDashboard.id,
        color,
        workspaceId
      });

      // Update the dashboard's bgColor
      // 1. Optimistic update (local store)
      updateDashboard(workspaceId, currentDashboard.id, {
        bgColor: color
      });

      // 2. Persist to server (for both members and guests)
      updateBgColorApi({
        dashboardId: currentDashboard.id,
        workspaceId: workspaceId,
        bgColor: color
      });

      // Also update the global appearance for consistency
      setBaseColor(color);
    },
    [
      setBaseColor,
      updateDashboard,
      currentDashboard,
      currentWorkspace,
      updateBgColorApi,
    ]
  );

  return {
    appearance: appearance as AdeAppearanceTokens,
    handleCustomizeBackground,
    handleSetBackground,
  };
}

