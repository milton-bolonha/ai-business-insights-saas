import type { Document } from "mongodb";

export interface KnowledgeBaseFileDocument extends Document {
  _id?: string;
  workspaceId: string;
  knowledgeBaseId: string;
  name: string;
  cloudinaryUrl?: string;
  openaiFileId?: string;
  size?: number;
  pages?: number;
  status: 'processing' | 'ready' | 'error';
  createdAt: Date;
  updatedAt: Date;
}
