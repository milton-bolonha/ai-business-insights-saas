"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Tile, Note, Contact, TileChatAttachment } from "@/lib/types";
import type { Dashboard } from "@/lib/types/dashboard";
import { useWorkspace } from "./WorkspaceContext";
import { useAuth } from "./AuthContext";
import { contactService, noteService, tileService } from "@/lib/services";
import { updateDashboard as updateDashboardInStore } from "@/lib/storage/dashboards-store";

export interface CreateTilePayload {
  title: string;
  prompt: string;
  model?: string;
  useMaxPrompt?: boolean;
  requestSize?: "small" | "medium" | "large";
}

export interface CreateNotePayload {
  title: string;
  content: string;
}

export interface CreateContactPayload {
  name: string;
  jobTitle: string;
  linkedinUrl: string;
}

export interface TileChatPayload {
  message: string;
  attachments?: TileChatAttachment[];
}

export interface ContentContextValue {
  tiles: Tile[];
  createTile: (dashboardId: string, data: CreateTilePayload) => Promise<Tile>;
  updateTile: (tileId: string, updates: Partial<Tile>) => Promise<void>;
  deleteTile: (tileId: string) => Promise<void>;
  reorderTiles: (dashboardId: string, order: string[]) => Promise<void>;
  regenerateTile: (tileId: string) => Promise<Tile>;
  chatWithTile: (tileId: string, payload: TileChatPayload) => Promise<Tile>;
  createSinglePrompt: (dashboardId: string, data: CreateTilePayload) => Promise<Tile>;
  notes: Note[];
  createNote: (dashboardId: string, data: CreateNotePayload) => Promise<Note>;
  updateNote: (noteId: string, updates: Partial<CreateNotePayload>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  contacts: Contact[];
  createContact: (dashboardId: string, data: CreateContactPayload) => Promise<Contact>;
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  regenerateContact: (contactId: string) => Promise<Contact>;
  isCreatingTile: boolean;
  isCreatingNote: boolean;
  isCreatingContact: boolean;
  regeneratingTileIds: Set<string>;
  regeneratingContactId: string | null;
}

const ContentContext = createContext<ContentContextValue | undefined>(undefined);

export function ContentProvider({ children }: PropsWithChildren) {
  const { currentWorkspace, currentDashboard, updateDashboard } = useWorkspace();
  const { canPerformAction, evaluateUsage, consumeUsage } = useAuth();

  const [isCreatingTile, setIsCreatingTile] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [regeneratingTileIds, setRegeneratingTileIds] = useState<Set<string>>(new Set());
  const [regeneratingContactId, setRegeneratingContactId] = useState<string | null>(null);

  const tiles = useMemo(() => currentDashboard?.tiles ?? [], [currentDashboard?.tiles]);
  const notes = useMemo(() => currentDashboard?.notes ?? [], [currentDashboard?.notes]);
  const contacts = useMemo(() => currentDashboard?.contacts ?? [], [currentDashboard?.contacts]);

  const createTile = useCallback(
    async (dashboardId: string, data: CreateTilePayload): Promise<Tile> => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      setIsCreatingTile(true);
      try {
        const response = await fetch("/api/workspace/tiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            dashboardId,
            workspaceId: currentWorkspace.id,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create tile");
        }

        const result = await response.json();
        const newTile = result.tile as Tile;

        updateDashboard(currentWorkspace.id, dashboardId, {
          tiles: [...tiles, newTile],
        });

        consumeUsage("createWorkspace");
        return newTile;
      } finally {
        setIsCreatingTile(false);
      }
    },
    [currentWorkspace, currentDashboard, tiles, consumeUsage, updateDashboard]
  );

  const createSinglePrompt = useCallback(
    async (dashboardId: string, data: CreateTilePayload): Promise<Tile> => {
      return createTile(dashboardId, data);
    },
    [createTile]
  );

  const updateTile = useCallback(
    async (tileId: string, updates: Partial<Tile>) => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      const updatedTiles = tiles.map((t) => (t.id === tileId ? { ...t, ...updates } : t));
      updateDashboard(currentWorkspace.id, currentDashboard.id, {
        tiles: updatedTiles,
      });
    },
    [currentWorkspace, currentDashboard, tiles, updateDashboard]
  );

  const deleteTile = useCallback(
    async (tileId: string) => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      await tileService.deleteTile(tileId);
      const updatedTiles = tiles.filter((t) => t.id !== tileId);
      updateDashboard(currentWorkspace.id, currentDashboard.id, {
        tiles: updatedTiles,
      });
    },
    [currentWorkspace, currentDashboard, tiles, updateDashboard]
  );

  const reorderTiles = useCallback(
    async (dashboardId: string, order: string[]) => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      await tileService.reorderTiles(order);

      const tileMap = new Map(tiles.map((t) => [t.id, t]));
      const reorderedTiles = order
        .map((id, index) => {
          const tile = tileMap.get(id);
          return tile ? { ...tile, orderIndex: index } : null;
        })
        .filter((t): t is Tile => t !== null);

      updateDashboard(currentWorkspace.id, dashboardId, {
        tiles: reorderedTiles,
      });
    },
    [currentWorkspace, currentDashboard, tiles, updateDashboard]
  );

  const regenerateTile = useCallback(
    async (tileId: string): Promise<Tile> => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      setRegeneratingTileIds((prev) => new Set([...prev, tileId]));
      try {
        const tile = await tileService.regenerateTile(tileId);
        const updatedTiles = tiles.map((t) => (t.id === tileId ? tile : t));
        updateDashboard(currentWorkspace.id, currentDashboard.id, {
          tiles: updatedTiles,
        });
        return tile;
      } finally {
        setRegeneratingTileIds((prev) => {
          const next = new Set(prev);
          next.delete(tileId);
          return next;
        });
      }
    },
    [currentWorkspace, currentDashboard, tiles, updateDashboard]
  );

  const chatWithTile = useCallback(
    async (tileId: string, payload: TileChatPayload): Promise<Tile> => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      const tile = await tileService.chatWithTile(tileId, payload);
      const updatedTiles = tiles.map((t) => (t.id === tileId ? tile : t));
      updateDashboard(currentWorkspace.id, currentDashboard.id, {
        tiles: updatedTiles,
      });
      return tile;
    },
    [currentWorkspace, currentDashboard, tiles, updateDashboard]
  );

  const createNote = useCallback(
    async (dashboardId: string, data: CreateNotePayload): Promise<Note> => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      setIsCreatingNote(true);
      try {
        const newNote: Note = {
          id: `note_${Date.now()}`,
          title: data.title.trim(),
          content: data.content.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        updateDashboard(currentWorkspace.id, dashboardId, {
          notes: [...notes, newNote],
        });

        try {
          await noteService.createNote({
            title: data.title.trim(),
            content: data.content.trim(),
            dashboardId,
            workspaceId: currentWorkspace.id,
          });
        } catch (error) {
          updateDashboard(currentWorkspace.id, dashboardId, {
            notes: notes,
          });
          throw error;
        }

        return newNote;
      } finally {
        setIsCreatingNote(false);
      }
    },
    [currentWorkspace, currentDashboard, notes, updateDashboard]
  );

  const updateNote = useCallback(
    async (noteId: string, updates: Partial<CreateNotePayload>) => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      await noteService.updateNote(noteId, updates);
      const updatedNotes = notes.map((n) =>
        n.id === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      );
      updateDashboard(currentWorkspace.id, currentDashboard.id, {
        notes: updatedNotes,
      });
    },
    [currentWorkspace, currentDashboard, notes, updateDashboard]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      await noteService.deleteNote(noteId);
      const updatedNotes = notes.filter((n) => n.id !== noteId);
      updateDashboard(currentWorkspace.id, currentDashboard.id, {
        notes: updatedNotes,
      });
    },
    [currentWorkspace, currentDashboard, notes, updateDashboard]
  );

  const createContact = useCallback(
    async (dashboardId: string, data: CreateContactPayload): Promise<Contact> => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      if (!canPerformAction("createContact")) {
        const usage = evaluateUsage("createContact");
        throw new Error(`Contact limit reached: ${usage.used}/${usage.limit}`);
      }

      setIsCreatingContact(true);
      try {
        const newContact: Contact = {
          id: `contact_${Date.now()}`,
          name: data.name.trim(),
          jobTitle: data.jobTitle.trim(),
          linkedinUrl: data.linkedinUrl.trim(),
          createdAt: new Date().toISOString(),
        };

        updateDashboard(currentWorkspace.id, dashboardId, {
          contacts: [...contacts, newContact],
        });

        try {
          await contactService.createContact({
            name: data.name.trim(),
            jobTitle: data.jobTitle.trim(),
            linkedinUrl: data.linkedinUrl.trim(),
            dashboardId,
            workspaceId: currentWorkspace.id,
          });
          consumeUsage("createContact");
        } catch (error) {
          updateDashboard(currentWorkspace.id, dashboardId, {
            contacts: contacts,
          });
          throw error;
        }

        return newContact;
      } finally {
        setIsCreatingContact(false);
      }
    },
    [currentWorkspace, currentDashboard, contacts, canPerformAction, evaluateUsage, consumeUsage, updateDashboard]
  );

  const updateContact = useCallback(
    async (contactId: string, updates: Partial<Contact>) => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      const updatedContacts = contacts.map((c) =>
        c.id === contactId ? { ...c, ...updates } : c
      );
      updateDashboard(currentWorkspace.id, currentDashboard.id, {
        contacts: updatedContacts,
      });
    },
    [currentWorkspace, currentDashboard, contacts, updateDashboard]
  );

  const deleteContact = useCallback(
    async (contactId: string) => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      const updatedContacts = contacts.filter((c) => c.id !== contactId);
      updateDashboard(currentWorkspace.id, currentDashboard.id, {
        contacts: updatedContacts,
      });
    },
    [currentWorkspace, currentDashboard, contacts, updateDashboard]
  );

  const regenerateContact = useCallback(
    async (contactId: string): Promise<Contact> => {
      if (!currentWorkspace || !currentDashboard) {
        throw new Error("No dashboard loaded");
      }

      setRegeneratingContactId(contactId);
      try {
        const contact = await contactService.regenerateContact(contactId);
        const updatedContacts = contacts.map((c) => (c.id === contactId ? contact : c));
        updateDashboard(currentWorkspace.id, currentDashboard.id, {
          contacts: updatedContacts,
        });
        return contact;
      } finally {
        setRegeneratingContactId(null);
      }
    },
    [currentWorkspace, currentDashboard, contacts, updateDashboard]
  );

  const contextValue = useMemo<ContentContextValue>(
    () => ({
      tiles,
      createTile,
      updateTile,
      deleteTile,
      reorderTiles,
      regenerateTile,
      chatWithTile,
      createSinglePrompt,
      notes,
      createNote,
      updateNote,
      deleteNote,
      contacts,
      createContact,
      updateContact,
      deleteContact,
      regenerateContact,
      isCreatingTile,
      isCreatingNote,
      isCreatingContact,
      regeneratingTileIds,
      regeneratingContactId,
    }),
    [
      tiles,
      createTile,
      updateTile,
      deleteTile,
      reorderTiles,
      regenerateTile,
      chatWithTile,
      createSinglePrompt,
      notes,
      createNote,
      updateNote,
      deleteNote,
      contacts,
      createContact,
      updateContact,
      deleteContact,
      regenerateContact,
      isCreatingTile,
      isCreatingNote,
      isCreatingContact,
      regeneratingTileIds,
      regeneratingContactId,
    ]
  );

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within ContentProvider");
  }
  return context;
}

