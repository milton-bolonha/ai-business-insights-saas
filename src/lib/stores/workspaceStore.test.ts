import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWorkspaceStore } from "./workspaceStore";
import { useAuthStore } from "./authStore";

// Mock das funções de storage de dashboard
vi.mock("@/lib/storage/dashboards-store", () => ({
  loadWorkspacesWithDashboards: vi.fn(() => []),
  saveWorkspacesWithDashboards: vi.fn(),
  getOrCreateWorkspaceFromWorkspaceSnapshot: vi.fn(async (snapshot) => ({
    id: snapshot.id || "mock-snapshot-ws",
    name: snapshot.name || "Mock Snapshot Workspace",
    dashboards: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  createDashboard: vi.fn((workspaceId, name, templateId) => ({
    id: `dash_${Date.now()}`,
    name,
    templateId,
    tiles: [],
    contacts: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  getActiveDashboard: vi.fn(),
  setActiveDashboard: vi.fn(),
  updateDashboard: vi.fn(),
}));

// Mock window globals e fetch
if (typeof window !== "undefined") {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
}

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    // Mock do fetch global
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workspaces: [] }),
      } as Response)
    );

    // Reset Zustand store state to defaults
    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspace: null,
      currentDashboard: null,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it("deve inicializar com o estado padrão correto", () => {
    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toEqual([]);
    expect(state.currentWorkspace).toBeNull();
    expect(state.currentDashboard).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("deve definir workspaces e redefinir se o atual for removido", () => {
    const store = useWorkspaceStore.getState();
    const mockWs = [
      {
        id: "ws-1",
        name: "Workspace 1",
        dashboards: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    store.setWorkspaces(mockWs);
    expect(useWorkspaceStore.getState().workspaces).toEqual(mockWs);

    // Set current workspace
    useWorkspaceStore.setState({ currentWorkspace: mockWs[0] });

    // Set empty workspaces list
    useWorkspaceStore.getState().setWorkspaces([]);
    expect(useWorkspaceStore.getState().currentWorkspace).toBeNull();
  });

  it("deve alternar workspaces usando switchWorkspace", () => {
    const store = useWorkspaceStore.getState();
    const mockWs = [
      {
        id: "ws-1",
        name: "Workspace 1",
        dashboards: [{ id: "dash-1", name: "Dashboard 1", tiles: [], contacts: [], notes: [] }],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "ws-2",
        name: "Workspace 2",
        dashboards: [{ id: "dash-2", name: "Dashboard 2", tiles: [], contacts: [], notes: [] }],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    useWorkspaceStore.setState({ workspaces: mockWs });

    store.switchWorkspace("ws-2");
    expect(useWorkspaceStore.getState().currentWorkspace?.id).toBe("ws-2");
  });

  it("deve criar um novo workspace", async () => {
    const store = useWorkspaceStore.getState();
    const payload = { name: "Workspace Criado", website: "https://example.com" };

    const newWs = await store.createWorkspace(payload);

    expect(newWs.name).toBe(payload.name);
    expect(newWs.website).toBe(payload.website);
    expect(useWorkspaceStore.getState().workspaces).toContainEqual(newWs);
    expect(useWorkspaceStore.getState().currentWorkspace).toEqual(newWs);
  });

  it("deve atualizar um workspace existente", () => {
    const store = useWorkspaceStore.getState();
    const mockWs = {
      id: "ws-1",
      name: "Workspace Original",
      dashboards: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useWorkspaceStore.setState({
      workspaces: [mockWs],
      currentWorkspace: mockWs,
    });

    store.updateWorkspace("ws-1", { name: "Workspace Atualizado" });

    const updatedWs = useWorkspaceStore.getState().workspaces[0];
    expect(updatedWs.name).toBe("Workspace Atualizado");
    expect(useWorkspaceStore.getState().currentWorkspace?.name).toBe("Workspace Atualizado");
  });

  it("deve deletar um workspace existente", () => {
    const store = useWorkspaceStore.getState();
    const mockWs = {
      id: "ws-1",
      name: "Workspace Original",
      dashboards: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useWorkspaceStore.setState({
      workspaces: [mockWs],
      currentWorkspace: mockWs,
    });

    store.deleteWorkspace("ws-1");

    expect(useWorkspaceStore.getState().workspaces).toEqual([]);
    expect(useWorkspaceStore.getState().currentWorkspace).toBeNull();
  });

  it("deve limpar a store inteira usando clearWorkspace", () => {
    const store = useWorkspaceStore.getState();
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: "ws-1",
          name: "WS 1",
          dashboards: [],
          createdAt: "2026",
          updatedAt: "2026",
        },
      ],
      currentWorkspace: {
        id: "ws-1",
        name: "WS 1",
        dashboards: [],
        createdAt: "2026",
        updatedAt: "2026",
      },
      currentDashboard: { id: "dash-1" } as any,
    });

    store.clearWorkspace();

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toEqual([]);
    expect(state.currentWorkspace).toBeNull();
    expect(state.currentDashboard).toBeNull();
  });
});
