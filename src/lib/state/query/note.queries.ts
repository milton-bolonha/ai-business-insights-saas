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
      // Check if user is guest or member
      const { useAuthStore } = await import("@/lib/stores/authStore");
      const user = useAuthStore.getState().user;
      const isMember = user?.role === "member";

      if (!isMember) {
        console.log('[DEBUG] note.queries.useCreateNote: Guest mode, skipping API call');
        return {
          success: true,
          note: {
            id: `note_${Date.now()}`, // Temporary ID, store will likely generate one or use this
            title,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      }

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
      workspaceId, // Optional, but needed for store sync for guests
      dashboardId, // Optional, but needed for store sync for guests
    }: {
      noteId: string;
      title?: string;
      content: string;
      workspaceId?: string;
      dashboardId?: string;
    }) => {
      // Check if user is guest or member
      const { useAuthStore } = await import("@/lib/stores/authStore");
      const user = useAuthStore.getState().user;
      const isMember = user?.role === "member";

      if (!isMember) {
        return { success: true, note: { id: noteId, title, content } };
      }

      const response = await fetch(`/api/workspace/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) throw new Error("Failed to update note");
      return response.json();
    },
    onSuccess: (data, { noteId, workspaceId, dashboardId }) => {
      // Invalidate all note queries
      queryClient.invalidateQueries({ queryKey: ["notes"] });

      // Sync with workspaceStore
      // Prioritize IDs from arguments (guest usage), fallback to response data (member usage)
      const wId = workspaceId || (data.note && data.note.workspaceId);
      const dId = dashboardId || (data.note && data.note.dashboardId);

      if (wId && dId) {
        import('@/lib/stores/workspaceStore').then(({ useWorkspaceStore }) => {
          const store = useWorkspaceStore.getState();
          // We need to pass the full note or partial updates?
          // The store expects Partial<Note>. 
          // If we are guest, we might not have the full note object here if we didn't construct it fully.
          // But we have title and content.
          store.updateNoteInDashboard(
            wId,
            dId,
            noteId,
            data.note || { title: data.note?.title, content: data.note?.content }
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
    mutationFn: async ({
      noteId,
      workspaceId,
      dashboardId,
    }: {
      noteId: string;
      workspaceId?: string;
      dashboardId?: string;
    }) => {
      // Check if user is guest or member
      const { useAuthStore } = await import("@/lib/stores/authStore");
      const user = useAuthStore.getState().user;
      const isMember = user?.role === "member";

      if (!isMember) {
        return { success: true };
      }

      const response = await fetch(`/api/workspace/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete note");
      return response.json();
    },
    onSuccess: (_, { noteId, workspaceId, dashboardId }) => {
      // Invalidate all note queries
      queryClient.invalidateQueries({ queryKey: ["notes"] });

      // Sync with workspaceStore for both guests and members (to be safe/instant)
      if (workspaceId && dashboardId) {
        import('@/lib/stores/workspaceStore').then(({ useWorkspaceStore }) => {
          const store = useWorkspaceStore.getState();
          store.removeNoteFromDashboard(workspaceId, dashboardId, noteId);
        }).catch(err => {
          console.warn('[DEBUG] Failed to sync note deletion to workspaceStore:', err);
        });
      }
    },
    onError: (error) => {
      console.error('[DEBUG] note.queries.useDeleteNote onError:', error);
    },
  });
}
