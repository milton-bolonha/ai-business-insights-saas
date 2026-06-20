import type { Document } from "mongodb";
import type { ChatMessage } from "@/lib/types/chat";

/**
 * ChatMessage model for MongoDB
 */
export interface ChatMessageDocument extends Document {
  _id?: string;
  id?: string;
  userId: string; // The owner of the message
  workspaceId: string;
  dashboardId?: string;
  chatId?: string;
  openaiMessageId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
  createdAt: Date;
}

/**
 * Convert ChatMessage to ChatMessageDocument
 */
export function chatMessageToDocument(
  message: ChatMessage,
  userId: string
): Omit<ChatMessageDocument, "_id" | "createdAt"> {
  return {
    id: message.id,
    userId,
    workspaceId: message.workspaceId,
    dashboardId: message.dashboardId,
    role: message.role,
    content: message.content,
    metadata: message.metadata,
  };
}

/**
 * Convert ChatMessageDocument to ChatMessage
 */
export function chatMessageDocumentToMessage(doc: ChatMessageDocument): ChatMessage {
  return {
    id: doc.id || doc._id?.toString() || `msg_${Date.now()}`,
    workspaceId: doc.workspaceId,
    dashboardId: doc.dashboardId,
    role: doc.role,
    content: doc.content,
    metadata: doc.metadata,
    createdAt: doc.createdAt instanceof Date 
      ? doc.createdAt.toISOString() 
      : typeof doc.createdAt === 'string' 
        ? doc.createdAt 
        : new Date().toISOString(),
  };
}
