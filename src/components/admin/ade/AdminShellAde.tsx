"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
// Removed sidebar related imports
import { AdminTopHeader } from "./AdminTopHeader";
import { SaaSLimitsModal } from "./SaaSLimitsModal";
import { AuthSync } from "@/components/auth/AuthSync";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface AdminShellAdeProps {
  // sidebar prop removed
  header?: ReactNode; // Keeping header prop optional if we want to pass something custom or legacy
  navigation?: ReactNode; // New prop for Sidebar/Navigation
  chatOverlay?: ReactNode;
  children: ReactNode;
  appearance: AdeAppearanceTokens;
  viewMode?: "chat" | "menu";
  // New props for Top Header
  onOpenWorkspaceDetail?: () => void;
  onDeleteWorkspace?: (workspaceId: string) => void;
  onSetSpecificColor?: (color: string) => void;
  fullScreenContent?: boolean;
}

export function AdminShellAde({
  // sidebar, removed
  header,
  navigation,
  chatOverlay,
  children,
  appearance,
  viewMode = "menu",
  onOpenWorkspaceDetail,
  onDeleteWorkspace,
  onSetSpecificColor,
  fullScreenContent
}: AdminShellAdeProps) {
  // Use lazy initialization to avoid self-reference or hydration issues
  const [mounted, setMounted] = useState(false);
  const { modals, openSaaSLimits, closeSaaSLimits } = useUIStore();

  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted and appearance is ready
  if (!mounted || !appearance) {
    return null;
  }

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: appearance.baseColor || "white",
        color: appearance.textColor,
      }}
    >
      <AuthSync />

      {/* Desktop Sidebar / Mobile Floating Menu */}
      {navigation}

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        {/* Main Content containing both header and body, so they scroll together */}
        <main
          className="flex-1 flex flex-col overflow-y-auto"
          style={{ backgroundColor: "transparent" }}
        >
          {/* Top Header */}
          <AdminTopHeader
            appearance={appearance}
            onOpenSaaSLimits={openSaaSLimits}
            onOpenWorkspaceDetail={onOpenWorkspaceDetail}
            onDeleteWorkspace={onDeleteWorkspace}
            onSetSpecificColor={onSetSpecificColor}
            hideWorkspaceSwitcher={false}
          />
          <div
            className={fullScreenContent ? "flex-1 flex flex-col w-full min-h-0" : cn(
              "container mx-auto min-h-full px-2",
              chatOverlay ? "pb-8" : "pb-8 md:pb-8"
            )}
            style={{ color: appearance.textColor }}
          >
            {children}
          </div>
        </main>
      </div>

      {chatOverlay}

      {/* Modals */}
      <SaaSLimitsModal
        isOpen={modals.isSaaSLimitsOpen}
        onClose={closeSaaSLimits}
        appearance={appearance}
      />
    </div>
  );
}


