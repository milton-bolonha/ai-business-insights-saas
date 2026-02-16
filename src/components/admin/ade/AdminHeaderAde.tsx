"use client";

import { useState } from "react";
import { ChevronDown, Droplet, Plus, Settings } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { useUIStore } from "@/lib/stores";

interface AdminHeaderAdeProps {
  appearance: AdeAppearanceTokens;
  workspaceId?: string;
  currentDashboardId?: string;
  dashboards?: Array<{ id: string; name: string; isActive?: boolean }>;
  onCustomizeBackground?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSetSpecificColor?: (color: string) => void;
  onSaveTemplate?: () => void;
  onLogin?: () => void;
  onSignUp?: () => void;
  onCreateBlankDashboard?: () => void;
  onSelectDashboard?: (dashboardId: string) => void;
  onApplyTemplate?: (templateId: string) => void;
}

export function AdminHeaderAde({
  appearance,
  dashboards = [],
  onCustomizeBackground,
  onSetSpecificColor,
  onCreateBlankDashboard,
  onSelectDashboard,
}: AdminHeaderAdeProps) {
  const [showDashboards, setShowDashboards] = useState(false);
  const { setBaseColor } = useUIStore();

  const currentDashboard = dashboards.find(d => d.isActive);
  const otherDashboards = dashboards.filter(d => !d.isActive);

  const handleColorChange = (color: string) => {
    // If a specific color handler is provided (which handles persistence), use it
    if (onSetSpecificColor) {
      onSetSpecificColor(color);
    } else {
      // Fallback to just updating the UI store (no persistence)
      setBaseColor(color);
    }
  };

  return (
    <div className="flex w-full items-center justify-between">
      {/* Left side - Dashboard selector */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setShowDashboards(!showDashboards)}
            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-black/5"
            style={{ color: appearance.textColor }}
          >
            <span>{currentDashboard?.name || "Dashboard"}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showDashboards && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border bg-white shadow-lg"
              style={{
                borderColor: appearance.cardBorderColor,
                backgroundColor: appearance.surfaceColor,
              }}
            >
              {/* Current dashboard */}
              <div className="border-b p-3" style={{ borderColor: appearance.cardBorderColor }}>
                <div className="text-sm font-medium" style={{ color: appearance.textColor }}>
                  Current Dashboard
                </div>
                <div className="mt-1 text-sm" style={{ color: appearance.mutedTextColor }}>
                  {currentDashboard?.name}
                </div>
              </div>

              {/* Other dashboards */}
              {otherDashboards.length > 0 && (
                <div className="border-b p-3" style={{ borderColor: appearance.cardBorderColor }}>
                  <div className="text-sm font-medium" style={{ color: appearance.textColor }}>
                    Switch Dashboard
                  </div>
                  <div className="mt-2 space-y-1">
                    {otherDashboards.map((dashboard) => (
                      <button
                        key={dashboard.id}
                        onClick={() => {
                          console.log('[DEBUG] AdminHeaderAde dashboard clicked:', dashboard.id);
                          onSelectDashboard?.(dashboard.id);
                          setShowDashboards(false);
                        }}
                        className="w-full cursor-pointer rounded px-2 py-1 text-left text-sm transition hover:bg-black/5"
                        style={{ color: appearance.textColor }}
                      >
                        {dashboard.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-3">
                <button
                  onClick={() => {
                    onCreateBlankDashboard?.();
                    setShowDashboards(false);
                  }}
                  className="flex w-full items-center space-x-2 rounded px-2 py-1 text-left text-sm transition hover:bg-black/5"
                  style={{ color: appearance.textColor }}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Background color picker */}
        <div className="relative">
          <button
            onClick={onCustomizeBackground}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-black/5"
            style={{ color: appearance.actionColor }}
            title="Customize background"
          >
            <Droplet className="h-5 w-5" />
          </button>
        </div>

        {/* Quick color presets */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleColorChange("#f7f7f7")}
            className="h-6 w-6 rounded-full border-2 border-white bg-[#f7f7f7] shadow-sm"
            title="Beige"
          />
          <button
            onClick={() => handleColorChange("#e8f4fd")}
            className="h-6 w-6 rounded-full border-2 border-white bg-[#e8f4fd] shadow-sm"
            title="Blue"
          />
          <button
            onClick={() => handleColorChange("#f0f9e8")}
            className="h-6 w-6 rounded-full border-2 border-white bg-[#f0f9e8] shadow-sm"
            title="Green"
          />
          <button
            onClick={() => handleColorChange("#fef7ed")}
            className="h-6 w-6 rounded-full border-2 border-white bg-[#fef7ed] shadow-sm"
            title="Orange"
          />
        </div>

        {/* Settings */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-black/5"
          style={{ color: appearance.actionColor }}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

