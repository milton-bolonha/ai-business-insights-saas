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

  const handleCustomizeBackground = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!currentDashboard) {
        console.log('[DEBUG] useAppearanceManagement: no current dashboard');
        return;
      }

      // Cycle through some predefined colors
      const colors = ["#f5f5f0", "#e8f4fd", "#f0f9e8", "#fef7ed"];
      const currentBgColor = currentDashboard.bgColor || appearance.baseColor;
      const currentIndex = colors.indexOf(currentBgColor);
      const nextIndex = (currentIndex + 1) % colors.length;
      const nextColor = colors[nextIndex];

      console.log('[DEBUG] useAppearanceManagement:', {
        currentDashboardId: currentDashboard.id,
        currentBgColor,
        nextColor
      });

      // Update the dashboard's bgColor
      // 1. Optimistic update (local store)
      updateDashboard(currentDashboard.workspaceId, currentDashboard.id, {
        bgColor: nextColor
      });

      // 2. Persist to server (for both members and guests)
      // Guests: Updates server-side memory/logs for consistency
      // Members: Updates MongoDB
      console.log('[DEBUG] useAppearanceManagement: persisting to server via dedicated API', { dashboardId: currentDashboard.id, nextColor });
      updateBgColorApi({
        dashboardId: currentDashboard.id,
        workspaceId: currentDashboard.workspaceId,
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

      console.log('[DEBUG] useAppearanceManagement.handleSetBackground:', {
        currentDashboardId: currentDashboard.id,
        color
      });

      // Update the dashboard's bgColor
      // 1. Optimistic update (local store)
      updateDashboard(currentDashboard.workspaceId, currentDashboard.id, {
        bgColor: color
      });

      // 2. Persist to server (for both members and guests)
      console.log('[DEBUG] useAppearanceManagement: persisting to server via dedicated API', { dashboardId: currentDashboard.id, color });
      updateBgColorApi({
        dashboardId: currentDashboard.id,
        workspaceId: currentDashboard.workspaceId,
        bgColor: color
      });

      // Also update the global appearance for consistency
      setBaseColor(color);
    },
    [
      setBaseColor,
      updateDashboard,
      currentDashboard,
      updateBgColorApi,
    ]
  );

  return {
    appearance: appearance as AdeAppearanceTokens,
    handleCustomizeBackground,
    handleSetBackground,
  };
}

