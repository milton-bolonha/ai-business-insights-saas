"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Dashboard, WorkspaceWithDashboards } from "@/lib/types/dashboard";
import type { WorkspaceSnapshot } from "@/lib/types";
import {
  loadWorkspacesWithDashboards,
  saveWorkspacesWithDashboards,
  getWorkspaceById,
  getOrCreateWorkspaceFromWorkspaceSnapshot,
  createDashboard as createDashboardInStore,
  getActiveDashboard,
  setActiveDashboard as setActiveDashboardInStore,
  updateDashboard as updateDashboardInStore,
  deleteDashboard as deleteDashboardInStore,
} from "@/lib/storage/dashboards-store";

export interface CreateWorkspacePayload {
  name: string;
  website?: string;
}

export interface CreateDashboardPayload {
  name: string;
  bgColor?: string;
  templateId?: string;
}

export interface WorkspaceContextValue {
  workspaces: WorkspaceWithDashboards[];
  currentWorkspace: WorkspaceWithDashboards | null;
  currentDashboard: Dashboard | null;
  setCurrentWorkspace: (workspace: WorkspaceWithDashboards | null) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  switchWorkspace: (workspaceId: string) => void;
  setActiveDashboard: (dashboardId: string) => void;
  createWorkspace: (data: CreateWorkspacePayload) => Promise<WorkspaceWithDashboards>;
  createDashboard: (workspaceId: string, data: CreateDashboardPayload) => Promise<Dashboard>;
  updateDashboard: (workspaceId: string, dashboardId: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (workspaceId: string, dashboardId: string) => void;
  refreshWorkspaces: () => void;
  initializeWorkspaceFromHome: (workspaceData: WorkspaceSnapshot) => Promise<WorkspaceWithDashboards>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithDashboards[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<WorkspaceWithDashboards | null>(null);
  const [currentDashboard, setCurrentDashboardState] = useState<Dashboard | null>(null);

  const refreshWorkspaces = useCallback(() => {
    const loaded = loadWorkspacesWithDashboards();
    setWorkspaces(loaded);

    if (loaded.length > 0 && !currentWorkspace) {
      const firstWorkspace = loaded[0];
      setCurrentWorkspaceState(firstWorkspace);
      const activeDashboard = getActiveDashboard(firstWorkspace.id);
      setCurrentDashboardState(activeDashboard);
    }

    return loaded;
  }, [currentWorkspace]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      refreshWorkspaces();
    });
    return () => cancelAnimationFrame(frame);
  }, [refreshWorkspaces]);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const workspaceToSwitch = workspaces.find((w) => w.id === workspaceId);
      if (workspaceToSwitch) {
        setCurrentWorkspaceState(workspaceToSwitch);
        const activeDashboard = getActiveDashboard(workspaceId);
        setCurrentDashboardState(activeDashboard);
      }
    },
    [workspaces]
  );

  const setCurrentWorkspace = useCallback(
    (workspace: WorkspaceWithDashboards | null) => {
      setCurrentWorkspaceState(workspace);
      if (workspace) {
        const activeDashboard = getActiveDashboard(workspace.id);
        setCurrentDashboardState(activeDashboard);
      } else {
        setCurrentDashboardState(null);
      }
    },
    []
  );

  const setActiveDashboard = useCallback(
    (dashboardId: string) => {
      if (!currentWorkspace) return;
      
      const dashboard = currentWorkspace.dashboards.find((d) => d.id === dashboardId);
      if (!dashboard) return;

      setActiveDashboardInStore(currentWorkspace.id, dashboardId);
      
      const updatedWorkspace = {
        ...currentWorkspace,
        dashboards: currentWorkspace.dashboards.map((d) =>
          d.id === dashboardId ? { ...d, isActive: true } : { ...d, isActive: false }
        ),
      };
      setCurrentWorkspaceState(updatedWorkspace);
      setCurrentDashboardState(dashboard);
      
      const updatedWorkspaces = workspaces.map((w) =>
        w.id === currentWorkspace.id ? updatedWorkspace : w
      );
      setWorkspaces(updatedWorkspaces);
      saveWorkspacesWithDashboards(updatedWorkspaces);
    },
    [currentWorkspace, workspaces]
  );

  const setCurrentDashboard = useCallback(
    (dashboard: Dashboard | null) => {
      setCurrentDashboardState(dashboard);
      if (dashboard && currentWorkspace) {
        setActiveDashboardInStore(currentWorkspace.id, dashboard.id);
        const updatedWorkspace = {
          ...currentWorkspace,
          dashboards: currentWorkspace.dashboards.map((d) =>
            d.id === dashboard.id ? { ...d, isActive: true } : { ...d, isActive: false }
          ),
        };
        setCurrentWorkspaceState(updatedWorkspace);
        const updatedWorkspaces = workspaces.map((w) =>
          w.id === currentWorkspace.id ? updatedWorkspace : w
        );
        setWorkspaces(updatedWorkspaces);
        saveWorkspacesWithDashboards(updatedWorkspaces);
      }
    },
    [currentWorkspace, workspaces]
  );

  const createWorkspace = useCallback(
    async (data: CreateWorkspacePayload): Promise<WorkspaceWithDashboards> => {
      const newWorkspace: WorkspaceWithDashboards = {
        id: `workspace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
        website: data.website,
        dashboards: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedWorkspaces = [...workspaces, newWorkspace];
      setWorkspaces(updatedWorkspaces);
      saveWorkspacesWithDashboards(updatedWorkspaces);
      setCurrentWorkspace(newWorkspace);

      return newWorkspace;
    },
    [workspaces, setCurrentWorkspace]
  );

  const createDashboard = useCallback(
    async (
      workspaceId: string,
      data: CreateDashboardPayload
    ): Promise<Dashboard> => {
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

      const updatedWorkspaces = loadWorkspacesWithDashboards();
      setWorkspaces(updatedWorkspaces);
      const updatedWorkspace = updatedWorkspaces.find((w) => w.id === workspaceId);
      if (updatedWorkspace) {
        setCurrentWorkspace(updatedWorkspace);
      }

      return dashboard;
    },
    [setCurrentWorkspace]
  );

  const updateDashboard = useCallback(
    (
      workspaceId: string,
      dashboardId: string,
      updates: Partial<Dashboard>
    ) => {
      updateDashboardInStore(workspaceId, dashboardId, updates);

      const updatedWorkspaces = loadWorkspacesWithDashboards();
      setWorkspaces(updatedWorkspaces);
      const updatedWorkspace = updatedWorkspaces.find((w) => w.id === workspaceId);
      if (updatedWorkspace) {
        if (currentWorkspace?.id === workspaceId) {
          setCurrentWorkspace(updatedWorkspace);
        }
        const updatedDashboard = updatedWorkspace.dashboards.find(
          (d) => d.id === dashboardId
        );
        if (updatedDashboard && currentDashboard?.id === dashboardId) {
          setCurrentDashboardState(updatedDashboard);
        }
      }
    },
    [currentWorkspace, currentDashboard, setCurrentWorkspace]
  );

  const deleteDashboard = useCallback(
    (workspaceId: string, dashboardId: string) => {
      deleteDashboardInStore(workspaceId, dashboardId);

      const updatedWorkspaces = loadWorkspacesWithDashboards();
      setWorkspaces(updatedWorkspaces);
      const updatedWorkspace = updatedWorkspaces.find((w) => w.id === workspaceId);
      if (updatedWorkspace) {
        setCurrentWorkspace(updatedWorkspace);
      }
    },
    [setCurrentWorkspace]
  );

  const initializeWorkspaceFromHome = useCallback(
    async (workspaceData: WorkspaceSnapshot): Promise<WorkspaceWithDashboards> => {
      const workspaceEntity = getOrCreateWorkspaceFromWorkspaceSnapshot(workspaceData);

      if (!workspaceEntity) {
        throw new Error("Failed to create workspace from home data");
      }

      const updatedWorkspaces = loadWorkspacesWithDashboards();
      setWorkspaces(updatedWorkspaces);

      setCurrentWorkspace(workspaceEntity);

      return workspaceEntity;
    },
    [setCurrentWorkspace]
  );

  const contextValue = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      currentWorkspace,
      currentDashboard,
      setCurrentWorkspace,
      setCurrentDashboard,
      switchWorkspace,
      setActiveDashboard,
      createWorkspace,
      createDashboard,
      updateDashboard,
      deleteDashboard,
      refreshWorkspaces,
      initializeWorkspaceFromHome,
    }),
    [
      workspaces,
      currentWorkspace,
      currentDashboard,
      setCurrentWorkspace,
      setCurrentDashboard,
      switchWorkspace,
      setActiveDashboard,
      createWorkspace,
      createDashboard,
      updateDashboard,
      deleteDashboard,
      refreshWorkspaces,
      initializeWorkspaceFromHome,
    ]
  );

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}

