"use client";

import { X, Building2, Calendar, FileText, Users, LayoutDashboard, StickyNote } from "lucide-react";
import { useWorkspaceStore } from "@/lib/stores";
import { useUIStore } from "@/lib/stores";

interface WorkspaceDetailModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string | null;
}

export function WorkspaceDetailModal({
  open,
  onClose,
  workspaceId,
}: WorkspaceDetailModalProps) {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const appearance = useUIStore((state) => state.appearance);

  if (!open || !workspaceId) return null;

  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) return null;

  const stats = {
    tiles: workspace.dashboards.reduce((sum, d) => sum + (d.tiles?.length || 0), 0),
    contacts: workspace.dashboards.reduce((sum, d) => sum + (d.contacts?.length || 0), 0),
    notes: workspace.dashboards.reduce((sum, d) => sum + (d.notes?.length || 0), 0),
    dashboards: workspace.dashboards.length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div 
        className="relative max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-lg shadow-xl"
        style={{ backgroundColor: appearance.surfaceColor }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: appearance.headingColor }}>{workspace.name}</h2>
                {workspace.website && (
                  <a 
                    href={workspace.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {workspace.website}
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full p-1 hover:bg-black/5 transition-colors"
            >
              <X className="h-5 w-5" style={{ color: appearance.mutedTextColor }} />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-lg border" style={{ borderColor: appearance.cardBorderColor, backgroundColor: appearance.baseColor }}>
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4" style={{ color: appearance.mutedTextColor }} />
                <span className="text-sm font-medium" style={{ color: appearance.mutedTextColor }}>Tiles</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: appearance.headingColor }}>{stats.tiles}</div>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: appearance.cardBorderColor, backgroundColor: appearance.baseColor }}>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4" style={{ color: appearance.mutedTextColor }} />
                <span className="text-sm font-medium" style={{ color: appearance.mutedTextColor }}>Contacts</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: appearance.headingColor }}>{stats.contacts}</div>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: appearance.cardBorderColor, backgroundColor: appearance.baseColor }}>
              <div className="flex items-center space-x-2 mb-2">
                <StickyNote className="h-4 w-4" style={{ color: appearance.mutedTextColor }} />
                <span className="text-sm font-medium" style={{ color: appearance.mutedTextColor }}>Notes</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: appearance.headingColor }}>{stats.notes}</div>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: appearance.cardBorderColor, backgroundColor: appearance.baseColor }}>
              <div className="flex items-center space-x-2 mb-2">
                <LayoutDashboard className="h-4 w-4" style={{ color: appearance.mutedTextColor }} />
                <span className="text-sm font-medium" style={{ color: appearance.mutedTextColor }}>Dashboards</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: appearance.headingColor }}>{stats.dashboards}</div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3 uppercase tracking-wider" style={{ color: appearance.headingColor }}>Created At</h3>
              <div className="flex items-center space-x-2" style={{ color: appearance.mutedTextColor }}>
                <Calendar className="h-4 w-4" />
                <span>{new Date(workspace.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            {/* Dashboards List */}
            <div>
              <h3 className="text-sm font-medium mb-3 uppercase tracking-wider" style={{ color: appearance.headingColor }}>Dashboards</h3>
              <div className="space-y-2">
                {workspace.dashboards.map((dashboard) => (
                  <div 
                    key={dashboard.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-black/5 transition-colors"
                    style={{ borderColor: appearance.cardBorderColor }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: dashboard.bgColor || '#f5f5f0', borderColor: appearance.sidebarBorderColor }}
                      />
                      <span className="font-medium" style={{ color: appearance.textColor }}>{dashboard.name}</span>
                    </div>
                    <div className="text-xs" style={{ color: appearance.mutedTextColor }}>
                      {dashboard.tiles?.length || 0} tiles
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t flex justify-end" style={{ borderColor: appearance.cardBorderColor }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-black/5 transition-colors font-medium"
              style={{ backgroundColor: appearance.baseColor, color: appearance.textColor }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
