import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Contact } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

export function useCreateContact() {
  const queryClient = useQueryClient();
  const isMember = useAuthStore((state) => state.isMember);
  const addContactToDashboard = useWorkspaceStore(
      (state) => state.addContactToDashboard
  );
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);

  return useMutation({
    mutationFn: async ({
      dashboardId,
      workspaceId,
      contactData,
    }: {
      dashboardId: string;
      workspaceId?: string;
      contactData: {
        name: string;
        jobTitle?: string;
        email?: string;
        phone?: string;
        company?: string;
        linkedinUrl?: string;
        notes?: string;
      };
    }) => {
      console.log('[DEBUG] contact.queries.useCreateContact executing:', { dashboardId, workspaceId, contactData });

      if (!isMember) {
        const targetWorkspaceId = workspaceId || currentWorkspace?.id;
        if (!targetWorkspaceId) {
          throw new Error("No workspace available to add contact");
        }

        const generatedId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36);

        const contact: Contact = {
          id: `contact_${generatedId}`,
          name: contactData.name,
          jobTitle: contactData.jobTitle,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          linkedinUrl: contactData.linkedinUrl,
          notes: contactData.notes,
          createdAt: new Date().toISOString(),
        };

        addContactToDashboard(targetWorkspaceId, dashboardId, contact);

        return {
          success: true,
          contact,
        };
      }

      const response = await fetch("/api/workspace/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardId,
          workspaceId,
          ...contactData,
        }),
      });
      if (!response.ok) {
        console.error('[DEBUG] contact.queries.useCreateContact failed:', response.status, response.statusText);
        throw new Error("Failed to create contact");
      }
      const result = await response.json();
      console.log('[DEBUG] contact.queries.useCreateContact success:', result);
      return result;
    },
    onSuccess: (data, { dashboardId, workspaceId }) => {
      console.log('[DEBUG] contact.queries.useCreateContact onSuccess:', { data, dashboardId, workspaceId });
      queryClient.invalidateQueries({ queryKey: ["contacts", dashboardId, workspaceId] });
      
      // Sincronizar workspaceStore (para members - atualiza store local após API)
      if (data.contact && workspaceId && dashboardId) {
        // Importar workspaceStore dinamicamente para evitar circular dependency
        import('@/lib/stores/workspaceStore').then(({ useWorkspaceStore }) => {
          const store = useWorkspaceStore.getState();
          store.addContactToDashboard(workspaceId, dashboardId, data.contact);
        }).catch(err => {
          console.warn('[DEBUG] Failed to sync contact to workspaceStore:', err);
        });
      }
    },
    onError: (error) => {
      console.error('[DEBUG] contact.queries.useCreateContact onError:', error);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      updates,
    }: {
      contactId: string;
      updates: Partial<{
        name: string;
        email: string;
        phone: string;
        company: string;
        role: string;
        linkedinUrl: string;
        notes: string;
      }>;
    }) => {
      const response = await fetch(`/api/workspace/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update contact");
      return response.json();
    },
    onSuccess: (data, { contactId }) => {
      // Invalidate all contact queries (could be improved with more specific invalidation)
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      
      // Sincronizar workspaceStore se tiver dados necessários
      if (data.contact && data.contact.workspaceId && data.contact.dashboardId) {
        import('@/lib/stores/workspaceStore').then(({ useWorkspaceStore }) => {
          const store = useWorkspaceStore.getState();
          store.updateContactInDashboard(
            data.contact.workspaceId,
            data.contact.dashboardId,
            contactId,
            data.contact
          );
        }).catch(err => {
          console.warn('[DEBUG] Failed to sync contact update to workspaceStore:', err);
        });
      }
    },
    onError: (error) => {
      console.error('[DEBUG] contact.queries.useUpdateContact onError:', error);
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/workspace/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete contact");
      return response.json();
    },
    onSuccess: (_, contactId) => {
      // Invalidate all contact queries
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      
      // Nota: Para deletar, precisamos do workspaceId e dashboardId
      // Isso deve ser passado no mutationFn ou obtido de outra forma
      // Por enquanto, apenas invalidamos queries
    },
    onError: (error) => {
      console.error('[DEBUG] contact.queries.useDeleteContact onError:', error);
    },
  });
}

export function useChatWithContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      message,
    }: {
      contactId: string;
      message: string;
    }) => {
      const response = await fetch(`/api/workspace/contacts/${contactId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to chat with contact");
      return response.json();
    },
    onSuccess: (data, { contactId }) => {
      // Invalidate contact queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      console.error('[DEBUG] contact.queries.useChatWithContact onError:', error);
    },
  });
}
