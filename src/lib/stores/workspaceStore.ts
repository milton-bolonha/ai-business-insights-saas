import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Dashboard, WorkspaceWithDashboards } from "@/lib/types/dashboard";
import type { WorkspaceSnapshot, Contact, Note, Tile } from "@/lib/types";
import {
  loadWorkspacesWithDashboards,
  saveWorkspacesWithDashboards,
  getOrCreateWorkspaceFromWorkspaceSnapshot,
  createDashboard as createDashboardInStore,
  getActiveDashboard,
  setActiveDashboard as setActiveDashboardInStore,
  updateDashboard as updateDashboardInStore,
} from "@/lib/storage/dashboards-store";
import { useAuthStore } from "./authStore";

export interface CreateWorkspacePayload {
  name: string;
  website?: string;
}

export interface CreateDashboardPayload {
  name: string;
  bgColor?: string;
  templateId?: string;
}

export interface WorkspaceState {
  // Estado dos workspaces
  workspaces: WorkspaceWithDashboards[];
  currentWorkspace: WorkspaceWithDashboards | null;
  currentDashboard: Dashboard | null;

  // Loading states
  isLoading: boolean;

  // Ações básicas
  setWorkspaces: (workspaces: WorkspaceWithDashboards[]) => void;
  setCurrentWorkspace: (workspace: WorkspaceWithDashboards | null) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  refreshWorkspaces: () => Promise<void>;

  // Ações de navegação
  switchWorkspace: (workspaceId: string) => void;
  setActiveDashboard: (dashboardId: string) => void;

  // CRUD Workspaces
  createWorkspace: (
    data: CreateWorkspacePayload
  ) => Promise<WorkspaceWithDashboards>;
  updateWorkspace: (
    workspaceId: string,
    updates: Partial<WorkspaceWithDashboards>
  ) => void;
  deleteWorkspace: (workspaceId: string) => void;

  // CRUD Dashboards
  createDashboard: (
    workspaceId: string,
    data: CreateDashboardPayload
  ) => Promise<Dashboard>;
  updateDashboard: (
    workspaceId: string,
    dashboardId: string,
    updates: Partial<Dashboard>
  ) => void;
  deleteDashboard: (workspaceId: string, dashboardId: string) => void;

  // Integração com home page
  initializeWorkspaceFromHome: (
    workspaceData: WorkspaceSnapshot
  ) => Promise<WorkspaceWithDashboards>;
  clearWorkspace: () => void;

  // Sincronização após mutations (para members)
  addContactToDashboard: (
    workspaceId: string,
    dashboardId: string,
    contact: Contact
  ) => void;
  updateContactInDashboard: (
    workspaceId: string,
    dashboardId: string,
    contactId: string,
    updates: Partial<Contact>
  ) => void;
  removeContactFromDashboard: (
    workspaceId: string,
    dashboardId: string,
    contactId: string
  ) => void;
  addNoteToDashboard: (
    workspaceId: string,
    dashboardId: string,
    note: Note
  ) => void;
  updateNoteInDashboard: (
    workspaceId: string,
    dashboardId: string,
    noteId: string,
    updates: Partial<Note>
  ) => void;
  removeNoteFromDashboard: (
    workspaceId: string,
    dashboardId: string,
    noteId: string
  ) => void;
  addTileToDashboard: (
    workspaceId: string,
    dashboardId: string,
    tile: Tile
  ) => void;
  updateTileInDashboard: (
    workspaceId: string,
    dashboardId: string,
    tileId: string,
    updates: Partial<Tile>
  ) => void;
  removeTileFromDashboard: (
    workspaceId: string,
    dashboardId: string,
    tileId: string
  ) => void;
  reorderTilesLocal: (
    workspaceId: string,
    dashboardId: string,
    order: string[]
  ) => void;
}

// Funções auxiliares para determinar se deve persistir dados
function shouldPersistForUser(): boolean {
  try {
    const authState = useAuthStore.getState?.();
    if (!authState || !authState.user) {
      return true; // Usuário anônimo continua como guest
    }
    return authState.user.role === "guest";
  } catch {
    return true;
  }
}

function persistWorkspacesSafely(workspaces: WorkspaceWithDashboards[]) {
  if (shouldPersistForUser()) {
    saveWorkspacesWithDashboards(workspaces);
  } else if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("insights_workspaces");
    } catch {
      // Ignorar falhas ao limpar cache para members
    }
  }
}

function clearWorkspaceStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("insights_workspaces");
    localStorage.removeItem("insights_active_dashboard");
  } catch {
    // Ignorar
  }
}

function reconcileGuestWorkspaceUsage(workspaceCount: number) {
  try {
    const authState = useAuthStore.getState?.();
    if (!authState) return;
    const { user, usage, limits } = authState;
    // Apenas para guests (ou anônimo)
    if (user && user.role === "member") return;
    const current = usage?.createWorkspace ?? 0;
    const maxAllowed = limits?.createWorkspace ?? workspaceCount;
    if (workspaceCount > current) {
      const nextValue = Math.min(workspaceCount, maxAllowed);
      useAuthStore.setState((state) => ({
        usage: {
          ...state.usage,
          createWorkspace: nextValue,
        },
      }));
    }
  } catch (err) {
    console.warn("[workspaceStore] Failed to reconcile guest workspace usage", err);
  }
}

export const useWorkspaceStore = create<WorkspaceState>()(
  immer(
    persist(
      (set, get) => ({
        // Estado inicial
        workspaces: [],
        currentWorkspace: null,
        currentDashboard: null,
        isLoading: false,

        // Ações básicas
        setWorkspaces: (workspaces) => {
          set((state) => {
            state.workspaces = workspaces;
            // If current workspace is not in the new list, reset it
            if (state.currentWorkspace && !workspaces.find(w => w.id === state.currentWorkspace?.id)) {
              state.currentWorkspace = null;
              state.currentDashboard = null;
            }
          });
        },
        setCurrentWorkspace: (workspace) => {
          set((state) => {
            state.currentWorkspace = workspace;

            if (workspace) {
              // Encontrar dashboard ativo
              const activeDashboard = getActiveDashboard(workspace.id);
              state.currentDashboard = activeDashboard;
            } else {
              state.currentDashboard = null;
            }
          });
        },

        setCurrentDashboard: (dashboard) => {
          set((state) => {
            state.currentDashboard = dashboard;

            // Atualizar dashboard ativo se houver workspace atual
            if (dashboard && state.currentWorkspace) {
              setActiveDashboardInStore(
                state.currentWorkspace.id,
                dashboard.id
              );

              // Atualizar o workspace com dashboard ativo
              state.currentWorkspace.dashboards =
                state.currentWorkspace.dashboards.map((d) =>
                  d.id === dashboard.id
                    ? { ...d, isActive: true }
                    : { ...d, isActive: false }
                );
            }
          });
        },

        refreshWorkspaces: async () => {
          console.log("[DEBUG] workspaceStore.refreshWorkspaces called");

          if (shouldPersistForUser()) {
            const workspaces = loadWorkspacesWithDashboards();
            set((state) => {
              state.workspaces = workspaces;

              if (state.currentWorkspace) {
                const updatedWorkspace = workspaces.find(
                  (w) => w.id === state.currentWorkspace?.id
                );
                state.currentWorkspace = updatedWorkspace ?? state.currentWorkspace;

                if (updatedWorkspace && state.currentDashboard) {
                  const updatedDashboard = updatedWorkspace.dashboards.find(
                    (d) => d.id === state.currentDashboard?.id
                  );
                  if (updatedDashboard) {
                    state.currentDashboard = updatedDashboard;
                  }
                }
              } else if (workspaces.length > 0) {
                state.currentWorkspace = workspaces[0];
                state.currentDashboard =
                  workspaces[0].dashboards.find((d) => d.isActive) ??
                  workspaces[0].dashboards[0] ??
                  null;
              } else {
                state.currentDashboard = null;
              }
            });

            reconcileGuestWorkspaceUsage(workspaces.length);

            console.log("[DEBUG] workspaceStore.refreshWorkspaces completed (guest)", {
              workspacesCount: workspaces.length,
              currentWorkspaceId: get().currentWorkspace?.id,
              currentDashboardId: get().currentDashboard?.id,
            });
            return;
          }

          if (typeof window === "undefined") {
            return;
          }

          try {
            const response = await fetch("/api/workspace/list", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              cache: "no-store",
            });

            if (!response.ok) {
              console.warn("[DEBUG] workspaceStore.refreshWorkspaces member fetch failed", response.status);
              return;
            }

            const payload = await response.json().catch(() => ({ workspaces: [] }));
            const workspacesFromServer: WorkspaceWithDashboards[] = Array.isArray(
              payload?.workspaces
            )
              ? payload.workspaces
              : [];

            set((state) => {
              state.workspaces = workspacesFromServer;

              if (workspacesFromServer.length === 0) {
                state.currentWorkspace = null;
                state.currentDashboard = null;
                return;
              }

              const nextWorkspace =
                (state.currentWorkspace &&
                  workspacesFromServer.find((w) => w.id === state.currentWorkspace?.id)) ??
                workspacesFromServer[0];

              state.currentWorkspace = nextWorkspace;
              state.currentDashboard =
                nextWorkspace.dashboards.find((d) => d.isActive) ??
                nextWorkspace.dashboards[0] ??
                null;
            });

            console.log("[DEBUG] workspaceStore.refreshWorkspaces completed (member)", {
              workspacesCount: workspacesFromServer.length,
              currentWorkspaceId: get().currentWorkspace?.id,
              currentDashboardId: get().currentDashboard?.id,
            });
          } catch (error) {
            console.error("[DEBUG] workspaceStore.refreshWorkspaces error", error);
          }
        },

        // Ações de navegação
        switchWorkspace: (workspaceId) => {
          const { workspaces } = get();
          const workspace = workspaces.find((w) => w.id === workspaceId);

          if (workspace) {
            get().setCurrentWorkspace(workspace);
          }
        },

        setActiveDashboard: (dashboardId) => {
          console.log(
            "[DEBUG] workspaceStore.setActiveDashboard called:",
            dashboardId
          );
          const { currentWorkspace, workspaces } = get();

          let workspace =
            currentWorkspace ||
            workspaces.find((w) =>
              w.dashboards.some((d) => d.id === dashboardId)
            );

          if (!workspace) {
            console.warn(
              "[DEBUG] workspaceStore.setActiveDashboard - workspace not found for dashboard",
              dashboardId
            );
            return;
          }

          const dashboard = workspace.dashboards.find(
            (d) => d.id === dashboardId
          );
          if (!dashboard) {
            console.warn(
              "[DEBUG] workspaceStore.setActiveDashboard - dashboard not found",
              dashboardId
            );
            return;
          }

          setActiveDashboardInStore(workspace.id, dashboardId);

          set((state) => {
            const targetWorkspace =
              state.workspaces.find((w) => w.id === workspace!.id) || workspace!;

            targetWorkspace.dashboards = targetWorkspace.dashboards.map((d) =>
              d.id === dashboardId ? { ...d, isActive: true } : { ...d, isActive: false }
            );

            state.workspaces = state.workspaces.map((w) =>
              w.id === targetWorkspace.id ? targetWorkspace : w
            );

            state.currentWorkspace = targetWorkspace;
            state.currentDashboard =
              targetWorkspace.dashboards.find((d) => d.id === dashboardId) ??
              targetWorkspace.dashboards[0] ??
              null;
          });

          persistWorkspacesSafely(get().workspaces);
        },

        // CRUD Workspaces
        createWorkspace: async (data) => {
          const newWorkspace: WorkspaceWithDashboards = {
            id: `workspace_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            name: data.name,
            website: data.website,
            dashboards: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => {
            state.workspaces.push(newWorkspace);
          });

          // Salvar no storage
          persistWorkspacesSafely(get().workspaces);

          // Definir como atual
          get().setCurrentWorkspace(newWorkspace);

          return newWorkspace;
        },

        updateWorkspace: (workspaceId, updates) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (workspace) {
              Object.assign(workspace, updates, {
                updatedAt: new Date().toISOString(),
              });
            }

            // Atualizar currentWorkspace se for o mesmo
            if (state.currentWorkspace?.id === workspaceId) {
              state.currentWorkspace = {
                ...state.currentWorkspace,
                ...updates,
              };
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },

        deleteWorkspace: (workspaceId) => {
          set((state) => {
            state.workspaces = state.workspaces.filter(
              (w) => w.id !== workspaceId
            );

            // Limpar currentWorkspace se for o deletado
            if (state.currentWorkspace?.id === workspaceId) {
              state.currentWorkspace = null;
              state.currentDashboard = null;
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },

        // CRUD Dashboards
        createDashboard: async (workspaceId, data) => {
          const dashboard = createDashboardInStore(
            workspaceId,
            data.name,
            data.templateId
          );

          if (data.bgColor) {
            updateDashboardInStore(workspaceId, dashboard.id, {
              ...dashboard,
              bgColor: data.bgColor,
            });
            dashboard.bgColor = data.bgColor;
          }

          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (workspace) {
              workspace.dashboards.push(dashboard);
              workspace.updatedAt = new Date().toISOString();

              // Atualizar currentWorkspace se for o mesmo
              if (state.currentWorkspace?.id === workspaceId) {
                state.currentWorkspace = workspace;
              }
            }
          });

          persistWorkspacesSafely(get().workspaces);

          // Definir como ativo se for o primeiro
          if (get().currentWorkspace?.dashboards.length === 1) {
            get().setActiveDashboard(dashboard.id);
          }

          return dashboard;
        },

        updateDashboard: (workspaceId, dashboardId, updates) => {
          console.log("[DEBUG] workspaceStore.updateDashboard called:", { workspaceId, dashboardId, updates });
          
          // Ensure we have the workspace in our list
          let currentWorkspaces = get().workspaces;
          if (!currentWorkspaces.find(w => w.id === workspaceId)) {
            console.warn("[workspaceStore] Workspace not found in store, refreshing...", workspaceId);
            get().refreshWorkspaces();
          }

          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (workspace) {
              const dashboard = workspace.dashboards.find(
                (d) => d.id === dashboardId
              );
              if (dashboard) {
                console.log("[DEBUG] workspaceStore.updateDashboard: updating dashboard", { before: dashboard.bgColor, after: updates.bgColor });
                Object.assign(dashboard, updates);
                workspace.updatedAt = new Date().toISOString();
              } else {
                console.error("[workspaceStore] Dashboard not found in workspace", { dashboardId });
              }

              // Atualizar currentWorkspace
              if (state.currentWorkspace?.id === workspaceId) {
                state.currentWorkspace = workspace;
              }

              // Atualizar currentDashboard se for o mesmo
              if (state.currentDashboard?.id === dashboardId) {
                state.currentDashboard = {
                  ...state.currentDashboard,
                  ...updates,
                };
              }
            } else {
              console.error("[workspaceStore] Workspace still not found after refresh", { workspaceId });
            }
          });

          const updatedWorkspaces = get().workspaces;
          const updatedWorkspace = updatedWorkspaces.find(w => w.id === workspaceId);
          const updatedDashboard = updatedWorkspace?.dashboards.find(d => d.id === dashboardId);
          
          console.log("[DEBUG] workspaceStore.updateDashboard: saving to storage", { 
            workspaceFound: !!updatedWorkspace,
            dashboardFound: !!updatedDashboard,
            savedBgColor: updatedDashboard?.bgColor,
            updatesBgColor: updates.bgColor
          });
          
          persistWorkspacesSafely(updatedWorkspaces);
        },

        deleteDashboard: (workspaceId, dashboardId) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (workspace) {
              workspace.dashboards = workspace.dashboards.filter(
                (d) => d.id !== dashboardId
              );
              workspace.updatedAt = new Date().toISOString();

              // Atualizar currentWorkspace
              if (state.currentWorkspace?.id === workspaceId) {
                state.currentWorkspace = workspace;
              }

              // Limpar currentDashboard se for o deletado
              if (state.currentDashboard?.id === dashboardId) {
                state.currentDashboard = null;
              }
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },

        // Integração com home page
        initializeWorkspaceFromHome: async (workspaceData) => {
          const workspace = await getOrCreateWorkspaceFromWorkspaceSnapshot(
            workspaceData
          );

          if (!workspace) {
            throw new Error("Failed to create or get workspace from snapshot");
          }

          set((state) => {
            // Verificar se já existe
            const existingIndex = state.workspaces.findIndex(
              (w) => w.id === workspace.id
            );

            if (existingIndex >= 0) {
              // Atualizar existente
              state.workspaces[existingIndex] = workspace;
            } else {
              // Adicionar novo
              state.workspaces.push(workspace);
            }
          });

          persistWorkspacesSafely(get().workspaces);
          get().setCurrentWorkspace(workspace);

          return workspace;
        },

        clearWorkspace: () => {
          set((state) => {
            state.workspaces = [];
            state.currentWorkspace = null;
            state.currentDashboard = null;
          });

          persistWorkspacesSafely([]);
          clearWorkspaceStorage();
        },

        // Sincronização após mutations (para members - atualiza store local após API)
        addContactToDashboard: (workspaceId, dashboardId, contact) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard) return;

            if (!dashboard.contacts) {
              dashboard.contacts = [];
            }

            // Check if contact already exists
            const existingIndex = dashboard.contacts.findIndex(
              (c) => c.id === contact.id
            );
            if (existingIndex >= 0) {
              dashboard.contacts[existingIndex] = contact;
            } else {
              dashboard.contacts.push(contact);
            }

            dashboard.updatedAt = new Date().toISOString();
            workspace.updatedAt = new Date().toISOString();
          });

          // Only save to localStorage if guest (members use MongoDB)
          persistWorkspacesSafely(get().workspaces);
        },

        updateContactInDashboard: (
          workspaceId,
          dashboardId,
          contactId,
          updates
        ) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard || !dashboard.contacts) return;

            const contactIndex = dashboard.contacts.findIndex(
              (c) => c.id === contactId
            );
            if (contactIndex >= 0) {
              dashboard.contacts[contactIndex] = {
                ...dashboard.contacts[contactIndex],
                ...updates,
              };
              dashboard.updatedAt = new Date().toISOString();
              workspace.updatedAt = new Date().toISOString();
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },

        removeContactFromDashboard: (workspaceId, dashboardId, contactId) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard || !dashboard.contacts) return;

            dashboard.contacts = dashboard.contacts.filter(
              (c) => c.id !== contactId
            );
            dashboard.updatedAt = new Date().toISOString();
            workspace.updatedAt = new Date().toISOString();
          });

          persistWorkspacesSafely(get().workspaces);
        },

        addNoteToDashboard: (workspaceId, dashboardId, note) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard) return;

            if (!dashboard.notes) {
              dashboard.notes = [];
            }

            // Check if note already exists
            const existingIndex = dashboard.notes.findIndex(
              (n) => n.id === note.id
            );
            if (existingIndex >= 0) {
              dashboard.notes[existingIndex] = note;
            } else {
              dashboard.notes.push(note);
            }

            dashboard.updatedAt = new Date().toISOString();
            workspace.updatedAt = new Date().toISOString();
          });

          persistWorkspacesSafely(get().workspaces);
        },

        updateNoteInDashboard: (workspaceId, dashboardId, noteId, updates) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard || !dashboard.notes) return;

            const noteIndex = dashboard.notes.findIndex((n) => n.id === noteId);
            if (noteIndex >= 0) {
              dashboard.notes[noteIndex] = {
                ...dashboard.notes[noteIndex],
                ...updates,
              };
              dashboard.updatedAt = new Date().toISOString();
              workspace.updatedAt = new Date().toISOString();
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },

        removeNoteFromDashboard: (workspaceId, dashboardId, noteId) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard || !dashboard.notes) return;

            dashboard.notes = dashboard.notes.filter((n) => n.id !== noteId);
            dashboard.updatedAt = new Date().toISOString();
            workspace.updatedAt = new Date().toISOString();
          });

          persistWorkspacesSafely(get().workspaces);
        },

        addTileToDashboard: (workspaceId, dashboardId, tile) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard) return;

            if (!dashboard.tiles) {
              dashboard.tiles = [];
            }

            // Check if tile already exists
            const existingIndex = dashboard.tiles.findIndex(
              (t) => t.id === tile.id
            );
            if (existingIndex >= 0) {
              dashboard.tiles[existingIndex] = tile;
            } else {
              dashboard.tiles.push(tile);
            }

            dashboard.updatedAt = new Date().toISOString();
            workspace.updatedAt = new Date().toISOString();

            // Sincronizar referências atuais (currentWorkspace/currentDashboard)
            if (state.currentWorkspace?.id === workspaceId) {
              state.currentWorkspace = workspace;
              if (state.currentDashboard?.id === dashboardId) {
                state.currentDashboard = dashboard;
              }
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },

        updateTileInDashboard: (workspaceId, dashboardId, tileId, updates) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard || !dashboard.tiles) return;

            const tileIndex = dashboard.tiles.findIndex((t) => t.id === tileId);
            if (tileIndex >= 0) {
              dashboard.tiles[tileIndex] = {
                ...dashboard.tiles[tileIndex],
                ...updates,
              };
              dashboard.updatedAt = new Date().toISOString();
              workspace.updatedAt = new Date().toISOString();

              // Update current references
              if (state.currentWorkspace?.id === workspaceId) {
                state.currentWorkspace = workspace;
                if (state.currentDashboard?.id === dashboardId) {
                  state.currentDashboard = dashboard;
                }
              }
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },

        removeTileFromDashboard: (workspaceId, dashboardId, tileId) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard || !dashboard.tiles) return;

            dashboard.tiles = dashboard.tiles.filter((t) => t.id !== tileId);
            dashboard.updatedAt = new Date().toISOString();
            workspace.updatedAt = new Date().toISOString();
          });

          persistWorkspacesSafely(get().workspaces);
        },

        reorderTilesLocal: (workspaceId, dashboardId, order) => {
          set((state) => {
            const workspace = state.workspaces.find(
              (w) => w.id === workspaceId
            );
            if (!workspace) return;

            const dashboard = workspace.dashboards.find(
              (d) => d.id === dashboardId
            );
            if (!dashboard || !dashboard.tiles) return;

            const tileMap = new Map(dashboard.tiles.map((t) => [t.id, t]));
            const reorderedTiles = order
              .map((tileId, index) => {
                const tile = tileMap.get(tileId);
                if (!tile) return null;
                return {
                  ...tile,
                  orderIndex: index,
                  updatedAt: new Date().toISOString(),
                };
              })
              .filter((tile): tile is Tile => tile !== null);

            dashboard.tiles = reorderedTiles;
            dashboard.updatedAt = new Date().toISOString();
            workspace.updatedAt = new Date().toISOString();

// ensure current workspace/dash references updated
            if (state.currentWorkspace?.id === workspaceId) {
              state.currentWorkspace = workspace;
              if (state.currentDashboard?.id === dashboardId) {
                state.currentDashboard = dashboard;
              }
            }
          });

          persistWorkspacesSafely(get().workspaces);
        },
      }),
      {
        name: "workspace-store",
        storage: createJSONStorage(() => localStorage),
        // Partialize para persistir APENAS a seleção (estado de navegação)
        // Os dados reais (workspaces) são carregados do insights_workspaces via refreshWorkspaces
        // Isso evita conflito de dados velhos no cache do Zustand sobrescrevendo o localStorage manual
        partialize: (state) => ({
          currentWorkspace: state.currentWorkspace,
          currentDashboard: state.currentDashboard,
        }),
        // Só persistir para guests (members usam MongoDB)
        skipHydration: !shouldPersistForUser(),
        onRehydrateStorage: () => (state) => {
          console.log("[DEBUG] workspaceStore rehydrated. Triggering refreshWorkspaces to load data.");
          state?.refreshWorkspaces();
        },
      }
    )
  )
);

// Hooks auxiliares para facilitar uso
export const useWorkspaces = () =>
  useWorkspaceStore((state) => state.workspaces);
export const useCurrentWorkspace = () =>
  useWorkspaceStore((state) => state.currentWorkspace);
export const useCurrentDashboard = () =>
  useWorkspaceStore((state) => state.currentDashboard);
export const useWorkspaceActions = () => {
  const store = useWorkspaceStore();
  return {
    setCurrentWorkspace: store.setCurrentWorkspace,
    setCurrentDashboard: store.setCurrentDashboard,
    refreshWorkspaces: store.refreshWorkspaces,
    switchWorkspace: store.switchWorkspace,
    setActiveDashboard: store.setActiveDashboard,
    createWorkspace: store.createWorkspace,
    updateWorkspace: store.updateWorkspace,
    deleteWorkspace: store.deleteWorkspace,
    createDashboard: store.createDashboard,
    updateDashboard: store.updateDashboard,
    deleteDashboard: store.deleteDashboard,
    initializeWorkspaceFromHome: store.initializeWorkspaceFromHome,
    clearWorkspace: store.clearWorkspace,
    addContactToDashboard: store.addContactToDashboard,
    updateContactInDashboard: store.updateContactInDashboard,
    removeContactFromDashboard: store.removeContactFromDashboard,
    addNoteToDashboard: store.addNoteToDashboard,
    updateNoteInDashboard: store.updateNoteInDashboard,
    removeNoteFromDashboard: store.removeNoteFromDashboard,
    addTileToDashboard: store.addTileToDashboard,
    updateTileInDashboard: store.updateTileInDashboard,
    removeTileFromDashboard: store.removeTileFromDashboard,
    reorderTilesLocal: store.reorderTilesLocal,
  };
};
