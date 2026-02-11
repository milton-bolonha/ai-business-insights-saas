import type { Dashboard, WorkspaceWithDashboards } from "@/lib/types/dashboard";
import type { WorkspaceSnapshot, Tile, Contact, Note } from "@/lib/types";

// Re-export types for convenience
export type { Dashboard, WorkspaceWithDashboards };

// Storage keys for workspace-dashboards architecture
const WORKSPACES_STORAGE_KEY = "insights_workspaces";
const ACTIVE_DASHBOARD_KEY = "insights_active_dashboard";

const serverGlobal = globalThis as typeof globalThis & {
  __GUEST_WORKSPACES__?: WorkspaceWithDashboards[];
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getServerStore(): WorkspaceWithDashboards[] {
  if (!serverGlobal.__GUEST_WORKSPACES__) {
    serverGlobal.__GUEST_WORKSPACES__ = [];
  }
  return serverGlobal.__GUEST_WORKSPACES__;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Load all workspaces with their dashboards
 * Architecture: Workspace (root) → Dashboards (isolated data)
 */
export function loadWorkspacesWithDashboards(): WorkspaceWithDashboards[] {
  if (isBrowser()) {
    try {
      const raw = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WorkspaceWithDashboards[]) : [];
    } catch {
      return [];
    }
  }

  const store = getServerStore();
  return store.map((workspace) => deepClone(workspace));
}

/**
 * Save workspaces with dashboards
 */
export function saveWorkspacesWithDashboards(
  workspaces: WorkspaceWithDashboards[]
) {
  if (isBrowser()) {
    try {
      console.log("[DEBUG] saveWorkspacesWithDashboards: saving to localStorage", { count: workspaces.length });
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    } catch (e) {
      console.error("[DEBUG] saveWorkspacesWithDashboards: failed to save", e);
    }
    return;
  }

  const store = getServerStore();
  store.length = 0;
  workspaces.forEach((workspace) => {
    store.push(deepClone(workspace));
  });
}

/**
 * Get workspace by ID
 */
export function getWorkspaceById(
  workspaceId: string
): WorkspaceWithDashboards | null {
  const workspaces = loadWorkspacesWithDashboards();
  return workspaces.find((w) => w.id === workspaceId) ?? null;
}

/**
 * Get or create workspace from workspace snapshot
 * Architecture: Workspace (root) → Dashboards (isolated data)
 */
export function getOrCreateWorkspaceFromWorkspaceSnapshot(
  workspace: WorkspaceSnapshot | null
): WorkspaceWithDashboards | null {
  if (!workspace) return null;

  const workspaces = loadWorkspacesWithDashboards();

  // Try to find existing workspace by sessionId
  let workspaceEntity = workspaces.find((w) => w.id === workspace.sessionId);

  // Also try to find by name + website to avoid duplicates
  if (!workspaceEntity) {
    workspaceEntity = workspaces.find(
      (w) =>
        w.name === workspace.name &&
        w.website === workspace.website
    );
    // If found by name/website, update the ID to match sessionId
    if (workspaceEntity) {
      workspaceEntity.id = workspace.sessionId;
      saveWorkspacesWithDashboards(workspaces);
    }
  }

  if (!workspaceEntity) {
    // Create new workspace with default dashboard
    workspaceEntity = {
      id: workspace.sessionId,
      name: workspace.name,
      website: workspace.website,
      salesRepCompany: workspace.salesRepCompany,
      salesRepWebsite: workspace.salesRepWebsite,
      promptSettings: workspace.promptSettings,
      dashboards: [
        {
          id: `dashboard_${workspace.sessionId}_default`,
          name: "Default Dashboard",
          workspaceId: workspace.sessionId,
          templateId: workspace.promptSettings?.templateId,
          tiles: workspace.tiles || [],
          notes: [],
          contacts: [],
          bgColor: workspace.appearance?.baseColor || "#f5f5f0",
          appearance:
            workspace.appearance?.baseColor &&
            workspace.appearance.baseColor.trim()
              ? workspace.appearance
              : undefined,
          createdAt: workspace.generatedAt ?? new Date().toISOString(),
          updatedAt: workspace.generatedAt ?? new Date().toISOString(),
          isActive: true,
        },
      ],
      createdAt: workspace.generatedAt ?? new Date().toISOString(),
      updatedAt: workspace.generatedAt ?? new Date().toISOString(),
    };

    workspaces.push(workspaceEntity);
    saveWorkspacesWithDashboards(workspaces);
  } else {
    // Update existing workspace
    workspaceEntity.name = workspace.name;
    workspaceEntity.website = workspace.website;
    workspaceEntity.salesRepWebsite = workspace.salesRepWebsite ?? workspaceEntity.salesRepWebsite;
    workspaceEntity.promptSettings = workspace.promptSettings ?? workspaceEntity.promptSettings;
    workspaceEntity.updatedAt = new Date().toISOString();

    // Update tiles in the default dashboard if workspace has tiles
    if (workspace.tiles && workspace.tiles.length > 0) {
      const defaultDashboard = workspaceEntity.dashboards.find(d => d.isActive) || workspaceEntity.dashboards[0];
      if (defaultDashboard) {
        defaultDashboard.tiles = workspace.tiles;
        defaultDashboard.updatedAt = new Date().toISOString();
      }
    }

    saveWorkspacesWithDashboards(workspaces);
  }

  return workspaceEntity;
}

/**
 * Create a new dashboard for a workspace
 */
export function createDashboard(
  workspaceId: string,
  dashboardName: string,
  templateId?: string
): Dashboard {
  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  const newDashboard: Dashboard = {
    id: `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: dashboardName,
    workspaceId,
    templateId: templateId || undefined,
    tiles: [],
    notes: [],
    contacts: [],
    bgColor: "#f5f5f0", // Default background color
    appearance: undefined,
    contrastMode: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: false,
  };

  // Set all other dashboards as inactive
  workspace.dashboards.forEach((d) => {
    d.isActive = false;
  });
  newDashboard.isActive = true;

  workspace.dashboards.push(newDashboard);
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
  setActiveDashboard(workspaceId, newDashboard.id);

  return newDashboard;
}

/**
 * Get active dashboard for a workspace
 */
export function getActiveDashboard(workspaceId: string): Dashboard | null {
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) return null;

  return (
    workspace.dashboards.find((d) => d.isActive) ?? workspace.dashboards[0] ?? null
  );
}

/**
 * Set active dashboard
 */
export function setActiveDashboard(workspaceId: string, dashboardId: string) {
  if (isBrowser()) {
    try {
      localStorage.setItem(
        ACTIVE_DASHBOARD_KEY,
        JSON.stringify({ workspaceId, dashboardId })
      );
    } catch {
      // Ignore errors
    }
  }

  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return;

  workspace.dashboards.forEach((d) => {
    d.isActive = d.id === dashboardId;
  });

  saveWorkspacesWithDashboards(workspaces);
}

/**
 * Update dashboard
 */
export function updateDashboard(
  workspaceId: string,
  dashboardId: string,
  updates: Partial<Dashboard>
) {
  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) {
    console.error("[updateDashboard] ❌ Workspace not found", { workspaceId });
    return;
  }

  const dashboardIndex = workspace.dashboards.findIndex(
    (d) => d.id === dashboardId
  );
  if (dashboardIndex === -1) {
    console.error("[updateDashboard] ❌ Dashboard not found", {
      workspaceId,
      dashboardId,
    });
    return;
  }

  const currentDashboard = workspace.dashboards[dashboardIndex];

  workspace.dashboards[dashboardIndex] = {
    ...currentDashboard,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
}

/**
 * Delete dashboard
 */
export function deleteDashboard(workspaceId: string, dashboardId: string) {
  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return;

  workspace.dashboards = workspace.dashboards.filter((d) => d.id !== dashboardId);

  // If deleted dashboard was active, activate first remaining dashboard
  if (
    workspace.dashboards.length > 0 &&
    !workspace.dashboards.some((d) => d.isActive)
  ) {
    workspace.dashboards[0].isActive = true;
    setActiveDashboard(workspaceId, workspace.dashboards[0].id);
  }

  workspace.updatedAt = new Date().toISOString();
  saveWorkspacesWithDashboards(workspaces);
}

/**
 * Add contact to dashboard
 */
export function addContactToDashboard(
  workspaceId: string,
  dashboardId: string,
  contact: Contact
): void {
  if (!isBrowser()) return;

  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    console.error("[addContactToDashboard] ❌ Workspace not found", { workspaceId });
    return;
  }

  const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
  if (!dashboard) {
    console.error("[addContactToDashboard] ❌ Dashboard not found", { dashboardId });
    return;
  }

  // Initialize contacts array if it doesn't exist
  if (!dashboard.contacts) {
    dashboard.contacts = [];
  }

  // Add contact
  dashboard.contacts.push(contact);
  dashboard.updatedAt = new Date().toISOString();
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
  console.log("[addContactToDashboard] ✅ Contact added", { contactId: contact.id, dashboardId });
}

/**
 * Add note to dashboard
 */
export function addNoteToDashboard(
  workspaceId: string,
  dashboardId: string,
  note: Note
): void {
  if (!isBrowser()) return;

  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    console.error("[addNoteToDashboard] ❌ Workspace not found", { workspaceId });
    return;
  }

  const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
  if (!dashboard) {
    console.error("[addNoteToDashboard] ❌ Dashboard not found", { dashboardId });
    return;
  }

  // Initialize notes array if it doesn't exist
  if (!dashboard.notes) {
    dashboard.notes = [];
  }

  // Add note
  dashboard.notes.push(note);
  dashboard.updatedAt = new Date().toISOString();
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
  console.log("[addNoteToDashboard] ✅ Note added", { noteId: note.id, dashboardId });
}

/**
 * Update contact in dashboard
 */
export function updateContactInDashboard(
  workspaceId: string,
  dashboardId: string,
  contactId: string,
  updates: Partial<Contact>
): void {
  if (!isBrowser()) return;

  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    console.error("[updateContactInDashboard] ❌ Workspace not found", { workspaceId });
    return;
  }

  const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
  if (!dashboard || !dashboard.contacts) {
    console.error("[updateContactInDashboard] ❌ Dashboard or contacts not found", { dashboardId });
    return;
  }

  const contactIndex = dashboard.contacts.findIndex((c) => c.id === contactId);
  if (contactIndex === -1) {
    console.error("[updateContactInDashboard] ❌ Contact not found", { contactId });
    return;
  }

  // Update contact
  dashboard.contacts[contactIndex] = { ...dashboard.contacts[contactIndex], ...updates };
  dashboard.updatedAt = new Date().toISOString();
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
  console.log("[updateContactInDashboard] ✅ Contact updated", { contactId, dashboardId });
}

/**
 * Update note in dashboard
 */
export function updateNoteInDashboard(
  workspaceId: string,
  dashboardId: string,
  noteId: string,
  updates: Partial<Note>
): void {
  if (!isBrowser()) return;

  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    console.error("[updateNoteInDashboard] ❌ Workspace not found", { workspaceId });
    return;
  }

  const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
  if (!dashboard || !dashboard.notes) {
    console.error("[updateNoteInDashboard] ❌ Dashboard or notes not found", { dashboardId });
    return;
  }

  const noteIndex = dashboard.notes.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) {
    console.error("[updateNoteInDashboard] ❌ Note not found", { noteId });
    return;
  }

  // Update note
  dashboard.notes[noteIndex] = { ...dashboard.notes[noteIndex], ...updates };
  dashboard.updatedAt = new Date().toISOString();
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
  console.log("[updateNoteInDashboard] ✅ Note updated", { noteId, dashboardId });
}

/**
 * Delete contact from dashboard
 */
export function deleteContactFromDashboard(
  workspaceId: string,
  dashboardId: string,
  contactId: string
): void {
  if (!isBrowser()) return;

  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    console.error("[deleteContactFromDashboard] ❌ Workspace not found", { workspaceId });
    return;
  }

  const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
  if (!dashboard || !dashboard.contacts) {
    console.error("[deleteContactFromDashboard] ❌ Dashboard or contacts not found", { dashboardId });
    return;
  }

  // Remove contact
  dashboard.contacts = dashboard.contacts.filter((c) => c.id !== contactId);
  dashboard.updatedAt = new Date().toISOString();
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
  console.log("[deleteContactFromDashboard] ✅ Contact deleted", { contactId, dashboardId });
}

/**
 * Delete note from dashboard
 */
export function deleteNoteFromDashboard(
  workspaceId: string,
  dashboardId: string,
  noteId: string
): void {
  if (!isBrowser()) return;

  const workspaces = loadWorkspacesWithDashboards();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    console.error("[deleteNoteFromDashboard] ❌ Workspace not found", { workspaceId });
    return;
  }

  const dashboard = workspace.dashboards.find((d) => d.id === dashboardId);
  if (!dashboard || !dashboard.notes) {
    console.error("[deleteNoteFromDashboard] ❌ Dashboard or notes not found", { dashboardId });
    return;
  }

  // Remove note
  dashboard.notes = dashboard.notes.filter((n) => n.id !== noteId);
  dashboard.updatedAt = new Date().toISOString();
  workspace.updatedAt = new Date().toISOString();

  saveWorkspacesWithDashboards(workspaces);
  console.log("[deleteNoteFromDashboard] ✅ Note deleted", { noteId, dashboardId });
}

/**
 * Clear all workspaces and dashboards
 */
export function clearAllCompanies(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(WORKSPACES_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_DASHBOARD_KEY);
    console.log("🗑️ All workspaces and dashboards cleared");
  } catch (error) {
    console.error("Failed to clear workspaces:", error);
  }
}

