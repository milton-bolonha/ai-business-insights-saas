import { ObjectId } from "mongodb";

export interface AppBuilderProject {
  _id?: string | ObjectId;
  userId: string;          // Tenant isolation
  workspaceId: string;     // Context isolation
  name: string;
  sandboxName: string;
  description?: string;
  businessRules?: string;
  designGuidelines?: string;
  status: 'creating' | 'ready' | 'stopped' | 'error';
  framework: 'next';
  createdAt: Date;
  updatedAt: Date;
}

export interface AppBuilderMessage {
  _id?: string | ObjectId;
  projectId: string | ObjectId;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  createdAt: Date;
}
