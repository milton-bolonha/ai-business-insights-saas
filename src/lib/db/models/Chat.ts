import type { Document } from "mongodb";

export interface ChatDocument extends Document {
  _id?: string;
  workspaceId: string;
  agentId: string;
  knowledgeBaseId?: string;
  openaiThreadId: string;
  title: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
