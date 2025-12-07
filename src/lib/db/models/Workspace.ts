import type { Document } from "mongodb";
import type {
  WorkspaceSnapshot,
  WorkspaceAppearance,
  WorkspacePromptSettings,
  Tile,
  Note,
  Contact,
} from "@/lib/types";

/**
 * Workspace model for MongoDB
 * Maps to WorkspaceSnapshot but with MongoDB-specific fields
 */
export interface WorkspaceDocument extends Document {
  _id?: string;
  sessionId: string; // Unique session identifier
  userId: string; // Clerk user ID (required for security isolation)
  name: string; // Workspace name
  website?: string; // Workspace website
  salesRepCompany?: string; // Responsible company's name
  salesRepWebsite?: string; // Responsible company's website
  generatedAt: string | null;
  tilesToGenerate: number;
  promptSettings?: WorkspacePromptSettings;
  appearance?: WorkspaceAppearance;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert WorkspaceSnapshot to WorkspaceDocument
 */
export function workspaceSnapshotToDocument(
  snapshot: WorkspaceSnapshot
): Omit<WorkspaceDocument, "_id" | "createdAt" | "updatedAt"> {
  if (!snapshot || !snapshot.sessionId) {
    throw new Error("Invalid WorkspaceSnapshot: missing sessionId");
  }
  if (!snapshot.name) {
    throw new Error("Invalid WorkspaceSnapshot: missing name");
  }

  return {
    sessionId: snapshot.sessionId,
    name: snapshot.name,
    website: snapshot.website,
    salesRepCompany: snapshot.salesRepCompany,
    salesRepWebsite: snapshot.salesRepWebsite,
    generatedAt: snapshot.generatedAt,
    tilesToGenerate: snapshot.tilesToGenerate ?? 0,
    promptSettings: snapshot.promptSettings,
    appearance: snapshot.appearance,
  };
}

/**
 * Convert WorkspaceDocument to WorkspaceSnapshot
 */
export function workspaceDocumentToSnapshot(
  doc: WorkspaceDocument
): WorkspaceSnapshot {
  if (!doc || !doc.sessionId) {
    throw new Error("Invalid WorkspaceDocument: missing sessionId");
  }

  return {
    sessionId: doc.sessionId,
    name: doc.name,
    website: doc.website,
    salesRepCompany: doc.salesRepCompany,
    salesRepWebsite: doc.salesRepWebsite,
    generatedAt: doc.generatedAt,
    tilesToGenerate: doc.tilesToGenerate,
    promptSettings: doc.promptSettings,
    appearance: doc.appearance,
  };
}

