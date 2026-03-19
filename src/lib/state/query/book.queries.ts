import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Book } from "@/lib/db/models/Book";

export interface BookWithId extends Book {
    _id: string;
}

export function useBooks(workspaceId?: string) {
    return useQuery({
        queryKey: ["books", workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const res = await fetch(`/api/workspace/books?workspaceId=${workspaceId}`, {
                credentials: "include"
            });

            if (res.status === 401) {
                // Guest users will get 401. Catch this gracefully to avoid React Query retry loops
                return [];
            }

            if (!res.ok) {
                let msg = "Failed to fetch books";
                try {
                    const errorPayload = await res.json();
                    msg = errorPayload.error || msg;
                } catch { }
                throw new Error(msg);
            }

            const data = await res.json();
            return data.books as BookWithId[];
        },
        enabled: !!workspaceId,
        retry: (failureCount, error) => {
            if (error.message.includes("Unauthorized") || error.message.includes("Workspace not found")) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

export function useCreateBook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            workspaceId: string;
            dashboardId?: string;
            title: string;
            pages?: Book["pages"];
        }) => {
            const res = await fetch("/api/workspace/books/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });

            if (!res.ok) {
                let msg = "Failed to create book";
                try {
                    const data = await res.json();
                    msg = data.error || msg;
                } catch { }
                throw new Error(msg);
            }

            return res.json() as Promise<{ bookId: string; success: boolean; book: BookWithId }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
        },
        retry: (failureCount, error) => {
            if (error.message.includes("Unauthorized") || error.message.includes("Workspace not found")) {
                return false;
            }
            return failureCount < 2;
        }
    });
}

export function useUpdateBook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            bookId,
            updates,
        }: {
            bookId: string;
            updates: Partial<Book>;
        }) => {
            const res = await fetch(`/api/workspace/books/${bookId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
                credentials: "include",
            });

            if (!res.ok) {
                let msg = "Failed to update book";
                try {
                    const data = await res.json();
                    msg = data.error || msg;
                } catch { }
                throw new Error(msg);
            }

            return res.json() as Promise<{ success: boolean }>;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
        },
    });
}

export function useDeleteBook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bookId: string) => {
            const res = await fetch(`/api/workspace/books/${bookId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                let msg = "Failed to delete book";
                try {
                    const data = await res.json();
                    msg = data.error || msg;
                } catch { }
                throw new Error(msg);
            }

            return res.json() as Promise<{ success: boolean }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
        },
    });
}
