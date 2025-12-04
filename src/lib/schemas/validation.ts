/**
 * Centralized Zod Schemas for API Validation
 * 
 * These schemas ensure type safety and consistency across all API routes.
 * They should match the TypeScript interfaces in @/lib/types.ts
 */

import { z } from "zod";

// ============================================================================
// Contact Schemas
// ============================================================================

export const contactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  outreach: z.any().optional(),
  chatHistory: z.any().optional(),
});

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  dashboardId: z.string().min(1, "dashboardId is required"),
  workspaceId: z.string().min(1, "workspaceId is required"),
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().min(1, "Contact ID is required"),
});

// ============================================================================
// Note Schemas
// ============================================================================

export const noteSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  dashboardId: z.string().min(1, "dashboardId is required"),
  workspaceId: z.string().min(1, "workspaceId is required"),
});

export const updateNoteSchema = createNoteSchema.partial().extend({
  id: z.string().min(1, "Note ID is required"),
});

// ============================================================================
// Tile Schemas
// ============================================================================

export const tileSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string(),
  prompt: z.string(),
  templateId: z.string().optional(),
  templateTileId: z.string().optional(),
  category: z.string().optional(),
  model: z.string(),
  orderIndex: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  totalTokens: z.number().nullable().optional(),
  attempts: z.number(),
  history: z.array(z.any()),
  agentId: z.string().optional(),
  responseLength: z.enum(["short", "medium", "long"]).optional(),
  promptVariables: z.array(z.string()).optional(),
});

export const createTileSchema = z.object({
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
  useMaxPrompt: z.boolean().optional(),
  requestSize: z.enum(["small", "medium", "large"]).optional(),
  dashboardId: z.string().optional(),
  workspaceId: z.string().optional(),
});

export const updateTileSchema = createTileSchema.partial().extend({
  id: z.string().min(1, "Tile ID is required"),
});

// ============================================================================
// Dashboard Schemas
// ============================================================================

export const dashboardSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  workspaceId: z.string(),
  bgColor: z.string().optional(),
  templateId: z.string().optional(),
  tiles: z.array(tileSchema),
  notes: z.array(noteSchema),
  contacts: z.array(contactSchema),
  appearance: z.any().optional(),
  contrastMode: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isActive: z.boolean().optional(),
});

export const createDashboardSchema = z.object({
  name: z.string().min(1, "Dashboard name is required"),
  workspaceId: z.string().min(1, "workspaceId is required"),
  bgColor: z.string().optional(),
  templateId: z.string().optional(),
});

// ============================================================================
// Workspace Schemas
// ============================================================================

export const workspaceSnapshotSchema = z.object({
  sessionId: z.string(),
  name: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")),
  generatedAt: z.string().nullable(),
  tilesToGenerate: z.number(),
  promptSettings: z.any().optional(),
  appearance: z.any().optional(),
  tiles: z.array(tileSchema).optional(),
});

// ============================================================================
// Type exports (for use in API routes)
// ============================================================================

export type ContactInput = z.infer<typeof createContactSchema>;
export type ContactUpdateInput = z.infer<typeof updateContactSchema>;
export type NoteInput = z.infer<typeof createNoteSchema>;
export type NoteUpdateInput = z.infer<typeof updateNoteSchema>;
export type TileInput = z.infer<typeof createTileSchema>;
export type TileUpdateInput = z.infer<typeof updateTileSchema>;
export type DashboardInput = z.infer<typeof createDashboardSchema>;
export type WorkspaceSnapshotInput = z.infer<typeof workspaceSnapshotSchema>;

