import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      workspaceId,
      title,
      content,
    }: {
      dashboardId: string;
      workspaceId?: string;
      title: string;
      content: string;
    }) => {
      console.log('[DEBUG] note.queries.useCreateNote executing:', { dashboardId, workspaceId, title, content });
      const response = await fetch("/api/workspace/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardId,
          workspaceId,
          title,
          content,
        }),
      });
      if (!response.ok) {
        console.error('[DEBUG] note.queries.useCreateNote failed:', response.status, response.statusText);
        throw new Error("Failed to create note");
      }
      const result = await response.json();
      console.log('[DEBUG] note.queries.useCreateNote success:', result);
      return result;
    },
    onSuccess: (data, { dashboardId, workspaceId }) => {
      console.log('[DEBUG] note.queries.useCreateNote onSuccess:', { data, dashboardId, workspaceId });
      queryClient.invalidateQueries({ queryKey: ["notes", dashboardId, workspaceId] });
      
      // Sincronizar workspaceStore (para members - atualiza store local após API)
      if (data.note && workspaceId && dashboardId) {
        import('@/lib/stores/workspaceStore').then(({ useWorkspaceStore }) => {
          const store = useWorkspaceStore.getState();
          store.addNoteToDashboard(workspaceId, dashboardId, data.note);
        }).catch(err => {
          console.warn('[DEBUG] Failed to sync note to workspaceStore:', err);
        });
      }
    },
    onError: (error) => {
      console.error('[DEBUG] note.queries.useCreateNote onError:', error);
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      title,
      content,
    }: {
      noteId: string;
      title?: string;
      content: string;
    }) => {
      const response = await fetch(`/api/workspace/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) throw new Error("Failed to update note");
      return response.json();
    },
    onSuccess: (data, { noteId }) => {
      // Invalidate all note queries (could be improved with more specific invalidation)
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      
      // Sincronizar workspaceStore se tiver dados necessários
      if (data.note && data.note.workspaceId && data.note.dashboardId) {
        import('@/lib/stores/workspaceStore').then(({ useWorkspaceStore }) => {
          const store = useWorkspaceStore.getState();
          store.updateNoteInDashboard(
            data.note.workspaceId,
            data.note.dashboardId,
            noteId,
            data.note
          );
        }).catch(err => {
          console.warn('[DEBUG] Failed to sync note update to workspaceStore:', err);
        });
      }
    },
    onError: (error) => {
      console.error('[DEBUG] note.queries.useUpdateNote onError:', error);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/workspace/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete note");
      return response.json();
    },
    onSuccess: (_, noteId) => {
      // Invalidate all note queries
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error) => {
      console.error('[DEBUG] note.queries.useDeleteNote onError:', error);
    },
  });
}
