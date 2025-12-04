import type { Document } from "mongodb";
import type { Note } from "@/lib/types";

/**
 * Note model for MongoDB
 * Maps to Note but with MongoDB-specific fields
 */
export interface NoteDocument extends Document {
  _id?: string;
  userId: string;
  workspaceId: string;
  dashboardId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Note to NoteDocument
 */
export function noteToDocument(
  note: Note,
  userId: string,
  workspaceId: string,
  dashboardId: string
): Omit<NoteDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    workspaceId,
    dashboardId,
    title: note.title,
    content: note.content,
  };
}

/**
 * Convert NoteDocument to Note
 */
export function noteDocumentToNote(
  doc: NoteDocument
): Note {
  return {
    id: doc._id?.toString() || doc.id || `note_${Date.now()}`,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt instanceof Date 
      ? doc.createdAt.toISOString() 
      : typeof doc.createdAt === 'string' 
        ? doc.createdAt 
        : new Date().toISOString(),
    updatedAt: doc.updatedAt instanceof Date 
      ? doc.updatedAt.toISOString() 
      : typeof doc.updatedAt === 'string' 
        ? doc.updatedAt 
        : new Date().toISOString(),
  };
}

