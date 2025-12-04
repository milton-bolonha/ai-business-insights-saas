// Hook compatível com ContentContext, mas usando workspaceStore e queries
import { useCurrentDashboard, useCurrentWorkspace } from './workspaceStore';
import type { Contact, Note, Tile } from '@/lib/types';
import {
  useCreateTile,
  useRegenerateTile,
  useChatWithTile,
  useReorderTiles,
  useDeleteTile,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useChatWithContact,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '../state/query';

type RequestSize = "small" | "medium" | "large";

interface CreateTileInput {
  title?: string;
  prompt?: string;
  description?: string;
  model?: string;
  useMaxPrompt?: boolean;
  requestSize?: RequestSize;
}

type NoteInput = string | { title?: string; content?: string };
type ContactInput = Partial<Contact>;

interface TileChatPayload {
  message: string;
  attachments?: Array<Record<string, unknown>>;
}

const resolveNoteTitle = (input: NoteInput) =>
  typeof input === "string" ? "Note" : input.title ?? "Note";

const resolveNoteContent = (input: NoteInput) =>
  typeof input === "string" ? input : input.content ?? "";

export function useContent() {
  const currentDashboard = useCurrentDashboard();
  const currentWorkspace = useCurrentWorkspace();

  // Queries para operações server
  const createTileMutation = useCreateTile();
  const regenerateTileMutation = useRegenerateTile();
  const chatWithTileMutation = useChatWithTile();
  const reorderTilesMutation = useReorderTiles();
  const deleteTileMutation = useDeleteTile();

  // Queries para contacts
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const chatWithContactMutation = useChatWithContact();

  // Queries para notes
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  // Estados locais do dashboard atual
  const tiles = currentDashboard?.tiles || [];
  const notes = currentDashboard?.notes || [];
  const contacts = currentDashboard?.contacts || [];

  // Estados de loading
  const isCreatingTile = createTileMutation.isPending;
  const isCreatingNote = createNoteMutation.isPending;
  const isCreatingContact = createContactMutation.isPending;

  // Estados de regenerating/chatting
  const regeneratingTileIds = new Set<string>();
  const regeneratingContactId = null;
  const chattingTileId = chatWithTileMutation.isPending ? 'temp' : null;
  const chattingContactId = chatWithContactMutation.isPending ? 'temp' : null;

  return {
    // Tiles
    tiles,
    async createTile(dashboardId: string, data: CreateTileInput) {
      console.log('[DEBUG] useContent.createTile called:', { dashboardId, data });
      const result = await createTileMutation.mutateAsync({
        dashboardId,
        title: data.title || 'Custom Tile',
        prompt: data.prompt || data.description || '',
        model: data.model,
        useMaxPrompt: data.useMaxPrompt,
        requestSize: data.requestSize
      });
      console.log('[DEBUG] useContent.createTile result:', result);
      return result.tile;
    },
    async createSinglePrompt(dashboardId: string, data: CreateTileInput) {
      // createSinglePrompt é alias para createTile
      console.log('[DEBUG] useContent.createSinglePrompt called:', { dashboardId, data });

      // Mapear campos corretamente para a API
      const apiData = {
        dashboardId,
        title: data.title || data.prompt?.slice(0, 50) || "New Tile",
        prompt: data.prompt || data.description || "",
        model: data.model || "gpt-4",
        useMaxPrompt: data.useMaxPrompt || false,
        requestSize: data.requestSize || "medium",
      };

      console.log('[DEBUG] useContent.createSinglePrompt mapped data:', apiData);
      const result = await createTileMutation.mutateAsync(apiData);
      console.log('[DEBUG] useContent.createSinglePrompt result:', result);
      return result.tile;
    },
    async updateTile(tileId: string, updates: Partial<Tile>) {
      // TODO: implementar updateTile mutation
      console.warn('updateTile not implemented yet');
    },
    async deleteTile(tileId: string) {
      console.log('[DEBUG] useContent.deleteTile called:', { tileId, dashboardId: currentDashboard?.id, workspaceId: currentWorkspace?.id });
      if (!currentDashboard?.id) {
        throw new Error('No dashboard selected');
      }
      await deleteTileMutation.mutateAsync({
        tileId,
        dashboardId: currentDashboard.id,
        workspaceId: currentWorkspace?.id,
      });
    },
    async regenerateTile(tileId: string, prompt?: string, model?: string) {
      if (!currentWorkspace?.id || !currentDashboard?.id) {
        throw new Error("No dashboard selected");
      }
      const result = await regenerateTileMutation.mutateAsync({
        tileId,
        prompt,
        model,
        workspaceId: currentWorkspace.id,
        dashboardId: currentDashboard.id,
      });
      return result.tile;
    },
    async chatWithTile(tileId: string, payload: TileChatPayload) {
      if (!currentWorkspace?.id || !currentDashboard?.id) {
        throw new Error("No dashboard selected");
      }
      const result = await chatWithTileMutation.mutateAsync({
        tileId,
        workspaceId: currentWorkspace.id,
        dashboardId: currentDashboard.id,
        payload,
      });
      return result.tile;
    },
    async reorderTiles(dashboardId: string, order: string[]) {
      console.log('[DEBUG] useContent.reorderTiles called:', { dashboardId, workspaceId: currentWorkspace?.id, orderLength: order.length });
      await reorderTilesMutation.mutateAsync({ 
        dashboardId, 
        workspaceId: currentWorkspace?.id,
        order 
      });
    },

    // Notes
    notes,
    async createNote(dashboardId: string, data: NoteInput) {
      console.log('[DEBUG] useContent.createNote called:', { dashboardId, workspaceId: currentWorkspace?.id, data });
      const result = await createNoteMutation.mutateAsync({
        dashboardId,
        workspaceId: currentWorkspace?.id,
        title: resolveNoteTitle(data),
        content: resolveNoteContent(data)
      });
      console.log('[DEBUG] useContent.createNote result:', result);
      return result.note;
    },
    async updateNote(noteId: string, updates: NoteInput) {
      const result = await updateNoteMutation.mutateAsync({
        noteId,
        title: resolveNoteTitle(updates),
        content: resolveNoteContent(updates)
      });
      return result.note;
    },
    async deleteNote(noteId: string) {
      await deleteNoteMutation.mutateAsync(noteId);
    },

    // Contacts
    contacts,
    async createContact(dashboardId: string, data: ContactInput) {
      console.log('[DEBUG] useContent.createContact called:', { dashboardId, workspaceId: currentWorkspace?.id, data });
      try {
        // Garantir que name seja sempre uma string (obrigatório)
        if (!data.name) {
          throw new Error("Contact name is required");
        }
        
        const result = await createContactMutation.mutateAsync({ 
          dashboardId, 
          workspaceId: currentWorkspace?.id,
          contactData: {
            name: data.name,
            jobTitle: data.jobTitle,
            email: data.email,
            phone: data.phone,
            company: data.company,
            linkedinUrl: data.linkedinUrl,
            notes: data.notes,
          }
        });
        console.log('[DEBUG] useContent.createContact result:', result);
        return result.contact;
      } catch (error) {
        console.error('[DEBUG] useContent.createContact error:', error);
        throw error;
      }
    },
    async updateContact(contactId: string, updates: ContactInput) {
      const result = await updateContactMutation.mutateAsync({ contactId, updates });
      return result.contact;
    },
    async deleteContact(contactId: string) {
      await deleteContactMutation.mutateAsync(contactId);
    },
    async regenerateContact(contactId: string): Promise<Contact | null> {
      // TODO: implementar regenerate contact (similar ao regenerate tile)
      console.warn('regenerateContact not implemented yet');
      return null;
    },
    async chatWithContact(contactId: string, message: string) {
      const result = await chatWithContactMutation.mutateAsync({ contactId, message });
      return result.contact;
    },

    // Estados de loading
    isCreatingTile,
    isCreatingNote,
    isCreatingContact,
    regeneratingTileIds,
    regeneratingContactId,
    chattingTileId,
    chattingContactId,
  };
}
