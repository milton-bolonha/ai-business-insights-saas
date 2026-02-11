import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { computeAdeAppearanceTokens, type AdeAppearanceTokens } from '@/lib/ade-theme';
import type { Tile, Contact } from '@/lib/types';

export type ThemeType = 'ade' | 'classic' | 'dash';

export interface UIState {
  // Tema e aparência
  baseColor: string;
  theme: ThemeType;
  appearance: AdeAppearanceTokens;

  // Estado de modais
  modals: {
    isAddPromptOpen: boolean;
    isAddContactOpen: boolean;
    isCreateBlankDashboardOpen: boolean;
    isAddWorkspaceOpen: boolean;
    isBulkUploadOpen: boolean;
    isWorkspaceDetailOpen: boolean;
    isPreviewOpen: boolean;
    viewingWorkspaceId: string | null;
    selectedTile: Tile | null;
    selectedContact: Contact | null;
  };

  // Ações de tema
  setBaseColor: (color: string) => void;
  setTheme: (theme: ThemeType) => void;

  // Ações de modais
  openAddPrompt: () => void;
  closeAddPrompt: () => void;
  openAddContact: () => void;
  closeAddContact: () => void;
  openCreateBlankDashboard: () => void;
  closeCreateBlankDashboard: () => void;
  openAddWorkspace: () => void;
  closeAddWorkspace: () => void;
  openBulkUpload: () => void;
  closeBulkUpload: () => void;
  openWorkspaceDetail: (workspaceId: string) => void;
  closeWorkspaceDetail: () => void;
  openPreview: () => void;
  closePreview: () => void;
  setSelectedTile: (tile: Tile | null) => void;
  setSelectedContact: (contact: Contact | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      baseColor: '#f5f5f0',
      theme: 'ade',
      appearance: computeAdeAppearanceTokens('#f5f5f0'),

      modals: {
        isAddPromptOpen: false,
        isAddContactOpen: false,
        isCreateBlankDashboardOpen: false,
        isAddWorkspaceOpen: false,
        isBulkUploadOpen: false,
        isWorkspaceDetailOpen: false,
        isPreviewOpen: false,
        viewingWorkspaceId: null,
        selectedTile: null,
        selectedContact: null,
      },

      // Ações de tema
      setBaseColor: (color: string) => {
        const appearance = computeAdeAppearanceTokens(color);
        set({ baseColor: color, appearance });

        // Aplicar cor de fundo ao body (mesma lógica do context anterior)
        if (typeof window !== 'undefined') {
          document.body.style.backgroundColor = color;
        }
      },

      setTheme: (theme: ThemeType) => set({ theme }),

      // Ações de modais
      openAddPrompt: () => set(state => ({
        modals: { ...state.modals, isAddPromptOpen: true }
      })),

      closeAddPrompt: () => set(state => ({
        modals: { ...state.modals, isAddPromptOpen: false }
      })),

      openAddContact: () => set(state => ({
        modals: { ...state.modals, isAddContactOpen: true }
      })),

      closeAddContact: () => set(state => ({
        modals: { ...state.modals, isAddContactOpen: false }
      })),

      openCreateBlankDashboard: () => set(state => ({
        modals: { ...state.modals, isCreateBlankDashboardOpen: true }
      })),

      closeCreateBlankDashboard: () => set(state => ({
        modals: { ...state.modals, isCreateBlankDashboardOpen: false }
      })),

      openBulkUpload: () => set(state => ({
        modals: { ...state.modals, isBulkUploadOpen: true }
      })),

      closeBulkUpload: () => set(state => ({
        modals: { ...state.modals, isBulkUploadOpen: false }
      })),

      openAddWorkspace: () => set(state => ({
        modals: { ...state.modals, isAddWorkspaceOpen: true }
      })),

      closeAddWorkspace: () => set(state => ({
        modals: { ...state.modals, isAddWorkspaceOpen: false }
      })),

      // Workspace Detail
      openWorkspaceDetail: (workspaceId) =>
        set((state) => ({
          modals: { ...state.modals, isWorkspaceDetailOpen: true, viewingWorkspaceId: workspaceId },
        })),
      closeWorkspaceDetail: () =>
        set((state) => ({
          modals: { ...state.modals, isWorkspaceDetailOpen: false, viewingWorkspaceId: null },
        })),

      // Preview (Book Reader)
      openPreview: () =>
        set((state) => ({
          modals: { ...state.modals, isPreviewOpen: true },
        })),
      closePreview: () =>
        set((state) => ({
          modals: { ...state.modals, isPreviewOpen: false },
        })),

      setSelectedTile: (tile) => set(state => ({
        modals: { ...state.modals, selectedTile: tile }
      })),

      setSelectedContact: (contact) => set(state => ({
        modals: { ...state.modals, selectedContact: contact }
      })),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),
      // Partialize para persistir apenas o necessário
      partialize: (state) => ({
        baseColor: state.baseColor,
        theme: state.theme,
      }),
    }
  )
);

// Hooks auxiliares para compatibilidade
export const useBaseColor = () => useUIStore((state) => state.baseColor);
export const useAppearance = () => useUIStore((state) => state.appearance);
export const useTheme = () => useUIStore((state) => state.theme);
export const useModals = () => useUIStore((state) => state.modals);
