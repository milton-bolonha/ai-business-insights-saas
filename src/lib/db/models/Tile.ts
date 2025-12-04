import type { Document } from "mongodb";
import type { Tile, TileMessage } from "@/lib/types";

/**
 * Tile model for MongoDB
 * Maps to Tile but with MongoDB-specific fields
 */
export interface TileDocument extends Document {
  _id?: string;
  userId: string;
  workspaceId: string;
  dashboardId: string;
  title: string;
  content: string;
  prompt: string;
  templateId?: string;
  category?: string;
  model: string;
  orderIndex: number;
  totalTokens?: number;
  attempts?: number;
  history?: TileMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Tile to TileDocument
 */
export function tileToDocument(
  tile: Tile,
  userId: string,
  workspaceId: string,
  dashboardId: string
): Omit<TileDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    workspaceId,
    dashboardId,
    title: tile.title,
    content: tile.content,
    prompt: tile.prompt,
    templateId: tile.templateId,
    category: tile.category,
    model: tile.model,
    orderIndex: tile.orderIndex,
    totalTokens: tile.totalTokens,
    attempts: tile.attempts,
    history: tile.history,
  };
}

/**
 * Convert TileDocument to Tile
 */
export function tileDocumentToTile(
  doc: TileDocument
): Tile {
  return {
    id: doc._id?.toString() || doc.id || `tile_${Date.now()}`,
    title: doc.title,
    content: doc.content,
    prompt: doc.prompt,
    templateId: doc.templateId,
    category: doc.category,
    model: doc.model,
    orderIndex: doc.orderIndex,
    totalTokens: doc.totalTokens,
    attempts: doc.attempts ?? 0,
    history: doc.history ?? [],
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

