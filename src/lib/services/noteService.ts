import type { Note } from "@/lib/types";

export interface CreateNotePayload {
  title: string;
  content: string;
  dashboardId: string;
  workspaceId: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
}

export async function createNote(payload: CreateNotePayload): Promise<Note> {
  const response = await fetch("/api/workspace/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title.trim(),
      content: payload.content.trim(),
      dashboardId: payload.dashboardId,
      workspaceId: payload.workspaceId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData.error as string) ?? "Failed to create note"
    );
  }

  const data = await response.json();
  return data.note as Note;
}

export async function updateNote(
  noteId: string,
  payload: UpdateNotePayload
): Promise<Note> {
  const response = await fetch(`/api/workspace/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData.error as string) ?? "Failed to update note"
    );
  }

  const data = await response.json();
  return data.note as Note;
}

export async function deleteNote(noteId: string): Promise<void> {
  const response = await fetch(`/api/workspace/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete note");
  }
}

