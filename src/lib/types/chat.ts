export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  workspaceId: string;
  dashboardId?: string; // Optional if tied to a specific dashboard, or null if workspace-wide
  role: ChatRole;
  content: string;
  metadata?: any; // e.g. for action logs, function calls, or confirmation state
  createdAt: string;
}
