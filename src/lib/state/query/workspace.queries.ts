import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
      // Invalidate and refetch workspace
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      // Set current workspace in Zustand store se necessário
      console.log("Workspace created:", data);
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
