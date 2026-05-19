import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";

export function useWorkspace(sessionId?: string) {
  return useQuery({
    queryKey: ["workspace", sessionId],
    queryFn: async () => {
      const url = sessionId
        ? `/api/workspace?sessionId=${sessionId}`
        : "/api/workspace";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch workspace");
      return response.json();
    },
    enabled: true, // Sempre habilitado, mas podemos adicionar condições se necessário
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      targetCompany: string;
      targetWebsite?: string;
    }) => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create workspace");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      console.log("Workspace created:", data);

      const cost = 10 + ((data.tilesCount || 0) * 5);
      const currentUsed = useAuthStore.getState().usage?.creditsUsed || 0;
      useAuthStore.getState().setUsage({ creditsUsed: currentUsed + cost });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const response = await fetch("/api/workspace", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!response.ok) throw new Error("Failed to delete workspace");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
}

// MEMBERSHIP QUERIES

export function useWorkspaceMembers(workspaceId?: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspace/members?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
    enabled: !!workspaceId,
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { workspaceId: string; email: string; accessLevel: string }) => {
      const response = await fetch(`/api/workspace/members?workspaceId=${payload.workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to add member");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", variables.workspaceId] });
    },
  });
}

export function useUpdateWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { workspaceId: string; memberId: string; accessLevel: string }) => {
      const response = await fetch(`/api/workspace/members/${payload.memberId}?workspaceId=${payload.workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessLevel: payload.accessLevel }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to update member");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", variables.workspaceId] });
    },
  });
}

export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { workspaceId: string; memberId: string }) => {
      const response = await fetch(`/api/workspace/members/${payload.memberId}?workspaceId=${payload.workspaceId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to remove member");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", variables.workspaceId] });
    },
  });
}
