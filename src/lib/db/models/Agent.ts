import type { Document } from "mongodb";

export interface AgentDocument extends Document {
  _id?: string;
  workspaceId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  knowledgeBaseId?: string;
  openaiAssistantId?: string;
  model: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
