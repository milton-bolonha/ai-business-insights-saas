"use client";

import { Plus, User, UserPlus, Info } from "lucide-react";

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
  workspaceName: string;
  workspaces: WorkspaceOption[];
  onSelectWorkspace: (sessionId: string) => void;
  onAddWorkspace?: () => void;
  onAddContact?: () => void;
  onOpenWorkspaceDetails?: (sessionId: string) => void;
}

export function AdminSidebarAde({
  appearance,
  workspaceName,
  workspaces = [],
  onSelectWorkspace,
  onAddWorkspace,
  onAddContact,
  onOpenWorkspaceDetails,
}: AdminSidebarAdeProps) {
  const activeWorkspace = workspaces.find(w => w.isActive);
  const otherWorkspaces = workspaces.filter(w => !w.isActive);

  return (
    <div className="flex h-full flex-col">
      {/* Company name */}
      <div className="mb-6">
        <h2
          className="text-lg font-semibold"
          style={{ color: appearance.textColor }}
        >
          {workspaceName}
        </h2>
      </div>

      {/* Active workspace */}
      {activeWorkspace && (
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium" style={{ color: appearance.textColor }}>
            Current Workspace
          </div>
          <div
            className="rounded-lg border p-3 transition hover:bg-black/5"
            style={{
              borderColor: appearance.cardBorderColor,
              backgroundColor: appearance.overlayColor,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: appearance.textColor }}>
                  {activeWorkspace.name}
                </div>
                <div className="mt-1 text-xs" style={{ color: appearance.mutedTextColor }}>
                  {activeWorkspace.tilesCount} tiles, {activeWorkspace.contactsCount} contacts
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenWorkspaceDetails?.(activeWorkspace.sessionId);
                }}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
                title="View Details"
              >
                <Info className="h-4 w-4" style={{ color: appearance.mutedTextColor }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other workspaces */}
      {otherWorkspaces.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium" style={{ color: appearance.textColor }}>
            Other Workspaces
          </div>
          <div className="space-y-2">
            {otherWorkspaces.map((workspace) => (
              <button
                key={workspace.sessionId}
                onClick={() => onSelectWorkspace(workspace.sessionId)}
                className="w-full rounded-lg border p-3 text-left transition hover:bg-black/5"
                style={{
                  borderColor: appearance.cardBorderColor,
                  backgroundColor: appearance.overlayColor,
                }}
              >
                <div className="text-sm font-medium" style={{ color: appearance.textColor }}>
                  {workspace.name}
                </div>
                <div className="mt-1 text-xs" style={{ color: appearance.mutedTextColor }}>
                  {workspace.tilesCount} tiles, {workspace.contactsCount} contacts
                </div>
              </button>
            ))}
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
      <div className="mt-4 border-t pt-4" style={{ borderColor: appearance.cardBorderColor }}>
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

