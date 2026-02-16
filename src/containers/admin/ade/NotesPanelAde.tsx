"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { Note } from "@/lib/types";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface NotesPanelAdeProps {
  notes: Note[];
  onAddNote?: (noteData: { title: string; content: string }) => Promise<void>;
  onUpdateNote?: (
    noteId: string,
    updates: { title: string; content: string }
  ) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  appearance?: AdeAppearanceTokens;
}

export function NotesPanelAde({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  appearance,
}: NotesPanelAdeProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const handleAddNote = () => {
    setIsAddingNote(true);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleSaveNewNote = async () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      console.log("[DEBUG] NotesPanelAde.handleSaveNewNote called:", {
        title: newNoteTitle,
        content: newNoteContent,
      });
      try {
        await onAddNote?.({ title: newNoteTitle, content: newNoteContent });
        setIsAddingNote(false);
        console.log("[DEBUG] NotesPanelAde.handleSaveNewNote completed");
      } catch (error) {
        console.error("[DEBUG] NotesPanelAde.handleSaveNewNote error:", error);
      }
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
    setEditingContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (editingTitle.trim() && editingContent.trim() && editingNoteId) {
      console.log(
        "[DEBUG] NotesPanelAde.handleSaveEdit called:",
        editingNoteId,
        { title: editingTitle, content: editingContent }
      );
      try {
        await onUpdateNote?.(editingNoteId, {
          title: editingTitle,
          content: editingContent,
        });
        setEditingNoteId(null);
        console.log("[DEBUG] NotesPanelAde.handleSaveEdit completed");
      } catch (error) {
        console.error("[DEBUG] NotesPanelAde.handleSaveEdit error:", error);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    console.log("[DEBUG] NotesPanelAde.handleDeleteNote called:", noteId);
    try {
      // Need workspaceId and dashboardId to properly delete from store (for guests)
      // These should be passed or available in context/props?
      // For now, let's assume the parent handles it OR we need to pass them.
      // Actually, NotesPanelAde doesn't know about workspaceId/dashboardId directly unless passed.
      // We should check where NotesPanelAde is used (AdminContainer) and see if we can pass them there.
      // But wait, the prop `onDeleteNote` signature in `NotesPanelAde` needs to match `note.queries.ts` mutation input?
      // No, `onDeleteNote` prop here is likely just `(id) => void`.
      // The CALLER (AdminContainer) calls `deleteNoteMutation.mutate(...)`.
      // So we need to update `AdminContainer.tsx`.

      await onDeleteNote?.(noteId);
      console.log("[DEBUG] NotesPanelAde.handleDeleteNote completed");
    } catch (error) {
      console.error("[DEBUG] NotesPanelAde.handleDeleteNote error:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: appearance?.textColor || "#111827" }}
          >
            Notes
          </h3>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <button
          onClick={handleAddNote}
          disabled={isAddingNote}
          type="button"
          className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition hover:bg-white disabled:opacity-60"
          style={{
            borderColor: appearance?.cardBorderColor || "#d1d5db",
            color: appearance?.mutedTextColor || "#6b7280",
            backgroundColor: appearance?.overlayColor || "#f8fafc",
          }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">Add Note</span>
        </button>

        {isAddingNote && (
          <div
            className="flex flex-col rounded-2xl border shadow-sm overflow-hidden"
            style={{
              borderColor: appearance?.cardBorderColor || "#e5e7eb",
            }}
          >
            <div className="flex items-center justify-between bg-[#E87C2A] px-4 py-3 text-white">
              <h4 className="text-sm font-semibold">New note</h4>
              <div className="flex space-x-2 text-xs">
                <button
                  onClick={() => setIsAddingNote(false)}
                  className="rounded px-2 py-1 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNewNote}
                  disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                  className="rounded bg-white/20 px-2 py-1 font-semibold text-white hover:bg-white/30 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 bg-white p-4">
              <input
                type="text"
                placeholder="Note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: appearance?.cardBorderColor || "#e5e7eb",
                  backgroundColor: appearance?.surfaceColor || "#ffffff",
                  color: appearance?.textColor || "#111827",
                }}
              />
              <textarea
                placeholder="Note content"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
                className="w-full resize-none rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: appearance?.cardBorderColor || "#e5e7eb",
                  backgroundColor: appearance?.surfaceColor || "#ffffff",
                  color: appearance?.textColor || "#111827",
                }}
              />
            </div>
          </div>
        )}

        {notes.map((note) => {
          const isEditing = editingNoteId === note.id;
          return (
            <div
              key={note.id}
              className="flex flex-col rounded-2xl border shadow-sm overflow-hidden"
              style={{
                borderColor: appearance?.cardBorderColor || "#e5e7eb",
              }}
            >
              <div className="flex items-center justify-between bg-[#E87C2A] px-4 py-3 text-white">
                <h4 className="text-sm font-semibold truncate">
                  {isEditing ? "Editando note" : note.title}
                </h4>
                <div className="flex space-x-2 text-xs">
                  {!isEditing ? (
                    <button
                      onClick={() => handleEditNote(note)}
                      className="rounded px-2 py-1 hover:bg-white/10"
                    >
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="rounded px-2 py-1 hover:bg-white/10"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={
                          !editingTitle.trim() || !editingContent.trim()
                        }
                        className="rounded bg-white/20 px-2 py-1 font-semibold text-white hover:bg-white/30 disabled:opacity-50"
                      >
                        Salvar
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                className="flex flex-1 flex-col gap-3 bg-white p-4 text-sm"
                style={{
                  color: appearance?.mutedTextColor || "#6b7280",
                }}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        borderColor: appearance?.cardBorderColor || "#e5e7eb",
                        backgroundColor: appearance?.surfaceColor || "#ffffff",
                        color: appearance?.textColor || "#111827",
                      }}
                    />
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        borderColor: appearance?.cardBorderColor || "#e5e7eb",
                        backgroundColor: appearance?.surfaceColor || "#ffffff",
                        color: appearance?.textColor || "#111827",
                      }}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded px-3 py-1 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    <div className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
