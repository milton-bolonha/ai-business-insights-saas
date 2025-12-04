import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDashboards(workspaceId: string) {
  return useQuery({
    queryKey: ["dashboards", workspaceId],
    queryFn: async () => {
      const response = await fetch(
        `/api/workspace/dashboards?workspaceId=${workspaceId}`
      );
      if (!response.ok) throw new Error("Failed to fetch dashboards");
      return response.json();
    },
    enabled: !!workspaceId,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: { name: string; templateId?: string; bgColor?: string };
    }) => {
      const response = await fetch(`/api/workspace/dashboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, ...data }),
      });
      if (!response.ok) throw new Error("Failed to create dashboard");
      return response.json();
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards", workspaceId] });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      data,
    }: {
      dashboardId: string;
      data: Partial<{ name: string; bgColor: string }>;
    }) => {
      const response = await fetch(`/api/workspace/dashboards/${dashboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update dashboard");
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate dashboards query
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dashboardId: string) => {
      const response = await fetch(`/api/workspace/dashboards/${dashboardId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete dashboard");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

export function useUpdateBgColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      workspaceId,
      bgColor,
    }: {
      dashboardId: string;
      workspaceId: string;
      bgColor: string;
    }) => {
      const response = await fetch(`/api/workspace/bgcolor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId, workspaceId, bgColor }),
      });
      if (!response.ok) throw new Error("Failed to update background color");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate dashboards query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}
