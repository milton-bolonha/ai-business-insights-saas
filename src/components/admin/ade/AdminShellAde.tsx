"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
// Removed sidebar related imports
import { AdminTopHeader } from "./AdminTopHeader";
import { SaaSLimitsModal } from "./SaaSLimitsModal";
import { useUIStore } from "@/lib/stores/uiStore";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface AdminShellAdeProps {
  // sidebar prop removed
  header?: ReactNode; // Keeping header prop optional if we want to pass something custom or legacy
  children: ReactNode;
  appearance: AdeAppearanceTokens;
  // New props for Top Header
  // New props for Top Header
  onOpenWorkspaceDetail?: () => void;
  onSetSpecificColor?: (color: string) => void;
}

export function AdminShellAde({
  // sidebar, removed
  header,
  children,
  appearance,
  onOpenWorkspaceDetail,
  onSetSpecificColor
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
      className="flex h-screen overflow-hidden flex-col transition-colors duration-300"
      style={{
        backgroundColor: "transparent", // Deixa o body controlar a cor de fundo
        color: appearance.textColor,
      }}
    >
      {/* Top Header */}
      <AdminTopHeader
        appearance={appearance}
        onOpenSaaSLimits={openSaaSLimits}
        onOpenWorkspaceDetail={onOpenWorkspaceDetail}
        onSetSpecificColor={onSetSpecificColor}
      />

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: "transparent" }}
      >
        <div
          className="container mx-auto min-h-full px-6 pb-8"
          style={{ color: appearance.textColor }}
        >
          {children}
        </div>
      </main>

      {/* Modals */}
      <SaaSLimitsModal
        isOpen={modals.isSaaSLimitsOpen}
        onClose={closeSaaSLimits}
        appearance={appearance}
      />
    </div>
  );
}


