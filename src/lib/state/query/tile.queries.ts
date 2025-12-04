import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tile } from "@/lib/types";

type RequestSize = "small" | "medium" | "large";

interface CreateTileVariables {
  dashboardId: string;
  title: string;
  prompt: string;
  model?: string;
  useMaxPrompt?: boolean;
  requestSize?: RequestSize;
}

interface CreateTileResponse {
  success: boolean;
  tile: Tile;
  dashboardId?: string;
  workspaceId?: string;
}

interface RegenerateTileVariables {
  tileId: string;
  dashboardId: string;
  workspaceId: string;
  prompt?: string;
  model?: string;
}

interface RegenerateTileResponse {
  success: boolean;
  tile: Tile;
}

interface DeleteTileVariables {
  tileId: string;
  dashboardId: string;
  workspaceId?: string;
}

interface DeleteTileResponse {
  success: boolean;
  message: string;
}

interface ReorderTilesVariables {
  dashboardId: string;
  workspaceId?: string;
  order: string[];
}

interface ReorderTilesResponse {
  success: boolean;
  order: string[];
  updated: number;
}

interface ChatWithTileVariables {
  tileId: string;
  workspaceId: string;
  dashboardId: string;
  payload: {
    message: string;
    attachments?: Array<Record<string, unknown>>; 
  };
}

interface ChatWithTileResponse {
  success: boolean;
  tile: Tile;
}

export function useTiles(dashboardId: string) {
  return useQuery({
    queryKey: ["tiles", dashboardId],
    queryFn: async (): Promise<Tile[]> => {
      const response = await fetch(`/api/workspace/dashboards/${dashboardId}/tiles`);
      if (!response.ok) throw new Error("Failed to fetch tiles");
      const payload = (await response.json()) as { tiles?: Tile[] };
      return payload.tiles ?? [];
    },
    enabled: !!dashboardId,
  });
}

export function useCreateTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      title,
      prompt,
      model = "gpt-4",
      useMaxPrompt = false,
      requestSize = "medium",
    }: CreateTileVariables): Promise<CreateTileResponse> => {
      console.log('[DEBUG] tile.queries.useCreateTile executing:', { dashboardId, prompt, model, useMaxPrompt, requestSize });
      const response = await fetch("/api/workspace/tiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardId,
          title,
          prompt,
          model,
          useMaxPrompt,
          requestSize,
        }),
      });
      if (!response.ok) {
        console.error('[DEBUG] tile.queries.useCreateTile failed:', response.status, response.statusText);
        throw new Error("Failed to create tile");
      }
      const result = (await response.json()) as CreateTileResponse;
      console.log('[DEBUG] tile.queries.useCreateTile success:', result);
      return result;
    },
    onSuccess: (data, { dashboardId }) => {
      console.log('[DEBUG] tile.queries.useCreateTile onSuccess:', { data, dashboardId });
      // Invalidate tiles query
      queryClient.invalidateQueries({ queryKey: ["tiles", dashboardId] });
      
      // Sincronizar workspaceStore (para members - atualiza store local após API)
      if (data.tile && data.workspaceId && dashboardId) {
        import('@/lib/stores/workspaceStore').then(({ useWorkspaceStore }) => {
          const store = useWorkspaceStore.getState();
          store.addTileToDashboard(data.workspaceId!, dashboardId, data.tile);
        }).catch(err => {
          console.warn('[DEBUG] Failed to sync tile to workspaceStore:', err);
        });
      }
    },
    onError: (error) => {
      console.error('[DEBUG] tile.queries.useCreateTile onError:', error);
    },
  });
}

export function useRegenerateTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tileId,
      prompt,
      model = "gpt-4",
      workspaceId,
      dashboardId,
    }: RegenerateTileVariables): Promise<RegenerateTileResponse> => {
      const response = await fetch(`/api/workspace/tiles/${tileId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, workspaceId, dashboardId }),
      });
      if (!response.ok) throw new Error("Failed to regenerate tile");
      return response.json();
    },
    onSuccess: (data, { tileId }) => {
      // Optimistic update: update the tile in cache
      queryClient.setQueryData<Tile[] | undefined>(["tiles"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((tile) =>
          tile.id === tileId ? { ...tile, ...data.tile } : tile
        );
      });
    },
    onError: (error) => {
      console.error('[DEBUG] tile.queries.useRegenerateTile onError:', error);
    },
  });
}

export function useDeleteTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tileId,
      dashboardId,
      workspaceId,
    }: DeleteTileVariables): Promise<DeleteTileResponse> => {
      console.log("[DEBUG] useDeleteTile mutation called:", {
        tileId,
        dashboardId,
        workspaceId,
      });

      const response = await fetch(`/api/workspace/tiles/${tileId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId, workspaceId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to delete tile" }));
        throw new Error(error.error || "Failed to delete tile");
      }

      const result = (await response.json()) as DeleteTileResponse;
      console.log("[DEBUG] useDeleteTile mutation success:", result);
      return result;
    },
    onSuccess: (_, { tileId, dashboardId }) => {
      console.log("[DEBUG] useDeleteTile invalidating queries for dashboard:", dashboardId);
      // Optimistic update: remove tile from cache
      queryClient.setQueryData<Tile[] | undefined>(["tiles", dashboardId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((tile) => tile.id !== tileId);
      });
      queryClient.invalidateQueries({ queryKey: ["tiles", dashboardId] });
    },
    onError: (error) => {
      console.error("[DEBUG] useDeleteTile mutation error:", error);
    },
  });
}

export function useReorderTiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      workspaceId,
      order,
    }: ReorderTilesVariables): Promise<ReorderTilesResponse> => {
      console.log("[DEBUG] useReorderTiles mutation called:", {
        dashboardId,
        workspaceId,
        orderLength: order.length,
      });

      const response = await fetch("/api/workspace/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId, workspaceId, order }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to reorder tiles" }));
        throw new Error(error.error || "Failed to reorder tiles");
      }

      const result = (await response.json()) as ReorderTilesResponse;
      console.log("[DEBUG] useReorderTiles mutation success:", result);
      return result;
    },
    onSuccess: (_, { dashboardId }) => {
      console.log("[DEBUG] useReorderTiles invalidating queries for dashboard:", dashboardId);
      queryClient.invalidateQueries({ queryKey: ["tiles", dashboardId] });
    },
    onError: (error) => {
      console.error("[DEBUG] useReorderTiles mutation error:", error);
    },
  });
}

export function useChatWithTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tileId,
      payload,
      workspaceId,
      dashboardId,
    }: ChatWithTileVariables): Promise<ChatWithTileResponse> => {
      const response = await fetch(`/api/workspace/tiles/${tileId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payload.message,
          attachments: payload.attachments ?? [],
          workspaceId,
          dashboardId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(errorData.error ?? "Failed to generate follow-up insight");
      }
      return response.json();
    },
    onSuccess: (data, { tileId }) => {
      // Optimistic update: update the tile in cache
      queryClient.setQueryData<Tile[] | undefined>(["tiles"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((tile) =>
          tile.id === tileId ? { ...tile, ...data.tile } : tile
        );
      });
    },
    onError: (error) => {
      console.error('[DEBUG] tile.queries.useChatWithTile onError:', error);
    },
  });
}
