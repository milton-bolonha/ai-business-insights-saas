import { describe, it, expect, beforeEach, vi } from "vitest";
import { useUIStore } from "./uiStore";

// Mock computeAdeAppearanceTokens
vi.mock("@/lib/ade-theme", () => ({
  computeAdeAppearanceTokens: (color: string) => ({
    backgroundColor: color,
    borderColor: "#e8e5dd",
  }),
}));

describe("useUIStore", () => {
  beforeEach(() => {
    // Reset Zustand store state to defaults
    useUIStore.setState({
      baseColor: "#f7f7f7",
      theme: "ade",
      isDesktopSidebarOpen: false,
      modals: {
        isAddPromptOpen: false,
        isAddContactOpen: false,
        isCreateBlankDashboardOpen: false,
        isAddWorkspaceOpen: false,
        isBulkUploadOpen: false,
        isWorkspaceDetailOpen: false,
        isPreviewOpen: false,
        isSaaSLimitsOpen: false,
        viewingWorkspaceId: null,
        selectedTile: null,
        selectedContact: null,
      },
    });
    vi.clearAllMocks();
  });

  it("deve inicializar com o estado padrão correto", () => {
    const state = useUIStore.getState();
    expect(state.baseColor).toBe("#f7f7f7");
    expect(state.theme).toBe("ade");
    expect(state.isDesktopSidebarOpen).toBe(false);
    expect(state.modals.isAddPromptOpen).toBe(false);
  });

  it("deve alterar a cor base e computar novos tokens de aparência", () => {
    const store = useUIStore.getState();
    store.setBaseColor("#111111");

    const updatedState = useUIStore.getState();
    expect(updatedState.baseColor).toBe("#111111");
    expect(updatedState.appearance.backgroundColor).toBe("#111111");
  });

  it("deve alternar e definir o estado da sidebar", () => {
    const store = useUIStore.getState();
    
    store.toggleDesktopSidebar();
    expect(useUIStore.getState().isDesktopSidebarOpen).toBe(true);

    store.setDesktopSidebarOpen(false);
    expect(useUIStore.getState().isDesktopSidebarOpen).toBe(false);
  });

  it("deve gerenciar a abertura e fechamento de modais com precisão", () => {
    const store = useUIStore.getState();

    // Modal de prompt
    store.openAddPrompt();
    expect(useUIStore.getState().modals.isAddPromptOpen).toBe(true);
    store.closeAddPrompt();
    expect(useUIStore.getState().modals.isAddPromptOpen).toBe(false);

    // Modal de Workspace Detail
    store.openWorkspaceDetail("workspace-123");
    expect(useUIStore.getState().modals.isWorkspaceDetailOpen).toBe(true);
    expect(useUIStore.getState().modals.viewingWorkspaceId).toBe("workspace-123");

    store.closeWorkspaceDetail();
    expect(useUIStore.getState().modals.isWorkspaceDetailOpen).toBe(false);
    expect(useUIStore.getState().modals.viewingWorkspaceId).toBeNull();
  });

  it("deve definir o tile e contato selecionados", () => {
    const store = useUIStore.getState();
    const mockTile = { id: "tile-1", title: "Custom Title", category: "IA" } as any;
    const mockContact = { id: "contact-1", name: "Carlos" } as any;

    store.setSelectedTile(mockTile);
    expect(useUIStore.getState().modals.selectedTile).toEqual(mockTile);

    store.setSelectedContact(mockContact);
    expect(useUIStore.getState().modals.selectedContact).toEqual(mockContact);
  });
});
