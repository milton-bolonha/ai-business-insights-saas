"use client";

import { useState } from "react";
import { Edit3, Plus } from "lucide-react";

import type { Note } from "@/lib/types";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface NotesPanelAdeProps {
  notes: Note[];
  onAddNote?: (noteData: { title: string; content: string }) => Promise<void>;
  onUpdateNote?: (noteId: string, updates: { title: string; content: string }) => Promise<void>;
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
      console.log('[DEBUG] NotesPanelAde.handleSaveNewNote called:', { title: newNoteTitle, content: newNoteContent });
      try {
        await onAddNote?.({ title: newNoteTitle, content: newNoteContent });
        setIsAddingNote(false);
        console.log('[DEBUG] NotesPanelAde.handleSaveNewNote completed');
      } catch (error) {
        console.error('[DEBUG] NotesPanelAde.handleSaveNewNote error:', error);
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
      console.log('[DEBUG] NotesPanelAde.handleSaveEdit called:', editingNoteId, { title: editingTitle, content: editingContent });
      try {
        await onUpdateNote?.(editingNoteId, { title: editingTitle, content: editingContent });
        setEditingNoteId(null);
        console.log('[DEBUG] NotesPanelAde.handleSaveEdit completed');
      } catch (error) {
        console.error('[DEBUG] NotesPanelAde.handleSaveEdit error:', error);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    console.log('[DEBUG] NotesPanelAde.handleDeleteNote called:', noteId);
    try {
      await onDeleteNote?.(noteId);
      console.log('[DEBUG] NotesPanelAde.handleDeleteNote completed');
    } catch (error) {
      console.error('[DEBUG] NotesPanelAde.handleDeleteNote error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold"
          style={{ color: appearance?.textColor || "#111827" }}
        >
          Notes
        </h3>
        <button
          onClick={handleAddNote}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-black/5"
          style={{ color: appearance?.actionColor || "#374151" }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Add note form */}
      {isAddingNote && (
        <div
          className="rounded-lg border p-4"
          style={{
            borderColor: appearance?.cardBorderColor || "#e5e7eb",
            backgroundColor: appearance?.surfaceColor || "#ffffff",
          }}
        >
          <div className="space-y-3">
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
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingNote(false)}
                className="rounded px-3 py-1 text-sm transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewNote}
                disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-lg border p-4"
            style={{
              borderColor: appearance?.cardBorderColor || "#e5e7eb",
              backgroundColor: appearance?.surfaceColor || "#ffffff",
            }}
          >
            {editingNoteId === note.id ? (
              /* Edit form */
              <div className="space-y-3">
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
                  rows={3}
                  className="w-full resize-none rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    borderColor: appearance?.cardBorderColor || "#e5e7eb",
                    backgroundColor: appearance?.surfaceColor || "#ffffff",
                    color: appearance?.textColor || "#111827",
                  }}
                />
                <div className="flex justify-between">
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="rounded px-3 py-1 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="rounded px-3 py-1 text-sm transition hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editingTitle.trim() || !editingContent.trim()}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Display mode */
              <div>
                <div className="flex items-start justify-between">
                  <h4
                    className="font-medium"
                    style={{ color: appearance?.textColor || "#111827" }}
                  >
                    {note.title}
                  </h4>
                  <button
                    onClick={() => handleEditNote(note)}
                    className="flex h-6 w-6 items-center justify-center rounded transition hover:bg-gray-100"
                    style={{ color: appearance?.actionColor || "#374151" }}
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: appearance?.mutedTextColor || "#6b7280" }}
                >
                  {note.content}
                </p>
                <div
                  className="mt-2 text-xs"
                  style={{ color: appearance?.mutedTextColor || "#9ca3af" }}
                >
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}

        {notes.length === 0 && !isAddingNote && (
          <div
            className="rounded-lg border-2 border-dashed p-6 text-center"
            style={{
              borderColor: appearance?.cardBorderColor || "#e5e7eb",
              backgroundColor: appearance?.overlayColor || "#f9fafb",
            }}
          >
            <p
              className="text-sm"
              style={{ color: appearance?.mutedTextColor || "#6b7280" }}
            >
              No notes yet. Add your first note.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

