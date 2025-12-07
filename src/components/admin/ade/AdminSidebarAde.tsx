"use client";

import { Plus, User, UserPlus, Info, ChevronRight } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface WorkspaceOption {
  sessionId: string;
  name: string;
  generatedAt?: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number;
  dashboardsCount?: number;
  isActive: boolean;
}

interface AdminSidebarAdeProps {
  appearance: AdeAppearanceTokens;
  companyName: string;
  workspaces: WorkspaceOption[];
  onSelectWorkspace: (sessionId: string) => void;
  onAddWorkspace?: () => void;
  onAddContact?: () => void;
  onOpenWorkspaceDetails?: (sessionId: string) => void;
  onOpenUpgrade?: () => void;
}

export function AdminSidebarAde({
  appearance,
  companyName,
  workspaces = [],
  onSelectWorkspace,
  onAddWorkspace,
  onAddContact,
  onOpenWorkspaceDetails,
  onOpenUpgrade,
}: AdminSidebarAdeProps) {
  const activeWorkspace = workspaces.find(w => w.isActive);
  const otherWorkspaces = workspaces.filter(w => !w.isActive);
  const orderedWorkspaces = activeWorkspace
    ? [activeWorkspace, ...otherWorkspaces]
    : otherWorkspaces;

  return (
    <div className="flex h-full flex-col">
      {/* Company name */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: appearance.textColor }}>
          {companyName}
        </h2>
        {activeWorkspace && onOpenWorkspaceDetails && (
          <button
            onClick={() => onOpenWorkspaceDetails(activeWorkspace.sessionId)}
            className="p-1 rounded-full hover:bg-black/10 transition-colors"
            title="View Details"
          >
            <Info className="h-4 w-4" style={{ color: appearance.mutedTextColor }} />
          </button>
        )}
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
                    <span className="text-sm font-medium">{workspace.name}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4" style={{ color: appearance.mutedTextColor }} />
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
            console.log('[DEBUG] AdminSidebarAde Add Contact button clicked');
            onAddContact?.();
          }}
          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left transition hover:bg-black/5"
          style={{ color: appearance.textColor }}
        >
          <UserPlus className="h-4 w-4" />
          <span className="text-sm">Add Contact</span>
        </button>
      </div>

      {/* User info placeholder */}
      <div
        className="mt-4 border-t pt-4 cursor-pointer"
        style={{ borderColor: appearance.cardBorderColor }}
        onClick={() => onOpenUpgrade?.()}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: appearance.textColor }}>
              Guest User
            </div>
            <div className="text-xs" style={{ color: appearance.mutedTextColor }}>
              Free Plan
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

