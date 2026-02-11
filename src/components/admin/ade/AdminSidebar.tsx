"use client";

import { Plus, User, UserPlus, Info, ChevronRight, RotateCcw } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface WorkspaceOption {
  sessionId: string;
  name: string;
  generatedAt?: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number; // Now represents Characters
  dashboardsCount?: number;
  isActive: boolean;
}

interface AdminSidebarProps {
  appearance: AdeAppearanceTokens;
  companyName: string;
  workspaces: WorkspaceOption[];
  onSelectWorkspace: (sessionId: string) => void;
  onAddWorkspace?: () => void;
  onAddContact?: () => void;
  onOpenWorkspaceDetails?: (sessionId: string) => void;
  onOpenUpgrade?: () => void;
  onPreviewBook?: () => void;
  onPublishBook?: () => void;
}

export function AdminSidebar({
  appearance,
  companyName,
  workspaces = [],
  onSelectWorkspace,
  onAddWorkspace,
  onAddContact,
  onOpenWorkspaceDetails,
  onPreviewBook,
  onPublishBook,
}: AdminSidebarProps) {
  const activeWorkspace = workspaces.find((w) => w.isActive);
  const otherWorkspaces = workspaces.filter((w) => !w.isActive);
  const orderedWorkspaces = activeWorkspace
    ? [activeWorkspace, ...otherWorkspaces]
    : otherWorkspaces;
  const totals = workspaces.reduce(
    (acc, ws) => {
      acc.tiles += ws.tilesCount || 0;
      acc.notes += ws.notesCount || 0;
      acc.contacts += ws.contactsCount || 0;
      return acc;
    },
    { tiles: 0, notes: 0, contacts: 0 }
  );

  return (
    <div className="flex h-full flex-col">
      {/* Company name */}
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ color: appearance.textColor }}
        >
          {companyName}
        </h2>
        {activeWorkspace && onOpenWorkspaceDetails && (
          <button
            onClick={() => onOpenWorkspaceDetails(activeWorkspace.sessionId)}
            className="p-1 rounded-full hover:bg-black/10 transition-colors"
            title="View Details"
          >
            <Info
              className="h-4 w-4"
              style={{ color: appearance.mutedTextColor }}
            />
          </button>
        )}
      </div>

      <div className="mb-4 flex space-x-2">
        <button
          onClick={onPreviewBook}
          disabled={true} // Disabled until first publish
          className="flex-1 rounded-md border py-1.5 text-xs font-semibold disabled:opacity-50"
          style={{
            borderColor: appearance.cardBorderColor,
            color: appearance.mutedTextColor
          }}
        >
          Preview
        </button>
        <button
          onClick={onPublishBook}
          className="flex-1 rounded-md py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: appearance.primaryColor || '#e11d48' }} // Default to Love Writers color
        >
          Publish
        </button>
      </div>

      {/* Workspaces list (active first) */}
      {orderedWorkspaces.length > 0 && (
        <div className="mb-6">
          <div className="space-y-1">
            {orderedWorkspaces.map((workspace) => {
              const isActive = workspace.isActive;
              return (
                <button
                  key={workspace.sessionId}
                  onClick={() => onSelectWorkspace(workspace.sessionId)}
                  className="w-full rounded-md px-3 py-2 text-left transition hover:bg-black/5"
                  style={{ color: appearance.textColor }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {workspace.name}
                    </span>
                    {isActive && (
                      <ChevronRight
                        className="h-4 w-4"
                        style={{ color: appearance.mutedTextColor }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto space-y-2">
        <button
          onClick={onAddWorkspace}
          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left transition hover:bg-black/5"
          style={{ color: appearance.textColor }}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">New Workspace</span>
        </button>

        <button
          onClick={() => {
            console.log("[DEBUG] AdminSidebar Add Contact button clicked");
            onAddContact?.();
          }}
          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left transition hover:bg-black/5"
          style={{ color: appearance.textColor }}
        >
          <UserPlus className="h-4 w-4" />
          <span className="text-sm">Add Character</span>
        </button>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to reset your user state? This will clear all local data and reload.")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left transition hover:bg-red-500/10"
          style={{ color: appearance.primaryColor || '#e11d48' }}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-sm">Reset User</span>
        </button>
      </div>

      {/* User info / contagem */}
      <div
        className="mt-4 space-y-3 rounded-xl border p-4"
        style={{
          borderColor: appearance.cardBorderColor,
          backgroundColor: appearance.surfaceColor,
        }}
      >
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div
            className="rounded-lg border px-2 py-1.5 text-center"
            style={{ borderColor: appearance.cardBorderColor }}
          >
            <div
              className="font-semibold"
              style={{ color: appearance.textColor }}
            >
              {totals.tiles}
            </div>
            <div style={{ color: appearance.mutedTextColor }}>Arcs</div>
          </div>
          <div
            className="rounded-lg border py-1.5 text-center"
            style={{ borderColor: appearance.cardBorderColor }}
          >
            <div
              className="font-semibold"
              style={{ color: appearance.textColor }}
            >
              {totals.contacts}
            </div>
            <div style={{ color: appearance.mutedTextColor }}>Chars</div>
          </div>
          <div
            className="rounded-lg border px-2 py-1.5 text-center"
            style={{ borderColor: appearance.cardBorderColor }}
          >
            <div
              className="font-semibold"
              style={{ color: appearance.textColor }}
            >
              {totals.notes}
            </div>
            <div style={{ color: appearance.mutedTextColor }}>Notes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
