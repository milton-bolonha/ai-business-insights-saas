import type { Document } from "mongodb";

export interface KnowledgeBaseDocument extends Document {
  _id?: string;
  workspaceId: string;
  name: string;
  description?: string;
  editalType?: string;
  openaiVectorStoreId?: string;
  status: 'creating' | 'active' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export function knowledgeBaseToDocument(
  kb: Partial<KnowledgeBaseDocument>
): Omit<KnowledgeBaseDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    workspaceId: kb.workspaceId!,
    name: kb.name!,
    description: kb.description,
    editalType: kb.editalType,
    openaiVectorStoreId: kb.openaiVectorStoreId,
    status: kb.status || 'creating',
  };
}
