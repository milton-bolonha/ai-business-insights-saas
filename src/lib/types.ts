export type TileMessageRole = "assistant" | "user" | "system";

export interface TileMessage {
  id: string;
  role: TileMessageRole;
  content: string;
  createdAt: string;
}

export interface Tile {
  id: string;
  title: string;
  content: string;
  prompt: string;
  templateId?: string;
  templateTileId?: string;
  category?: string;
  model: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  totalTokens?: number | null;
  attempts: number;
  history: TileMessage[];
  agentId?: string;
  responseLength?: "short" | "medium" | "long";
  promptVariables?: string[];
}

export interface TileChatAttachment {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
  size?: number;
  textContent?: string;
  dataUrl?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactOutreachTile {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactOutreach {
  contactInsights?: ContactOutreachTile;
  emailPitch?: ContactOutreachTile;
  coldCallScript?: ContactOutreachTile;
}

export interface Contact {
  id: string;
  name: string;
  jobTitle?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  outreach?: ContactOutreach;
  chatHistory?: TileMessage[];
}

export interface WorkspaceAppearance {
  baseColor: string;
  surfaceColor?: string;
  sidebarColor?: string;
  headingColor?: string;
  textColor?: string;
  mutedTextColor?: string;
}

export interface WorkspacePromptSettings {
  templateId: string;
  model?: string;
  promptAgent?: string;
  responseLength?: "short" | "medium" | "long";
  promptVariables?: string[];
  bulkPrompts?: string[];
  target?: string;
  sellingSolutionsFor?: string;
  targetWebsite?: string;
}

/**
 * Workspace representa a entidade raiz
 * Contém metadados name/website e referências a dashboards
 * 
 * Nota: tiles é opcional e usado apenas durante a criação/transição
 * Os tiles são então movidos para o dashboard padrão
 */
export interface WorkspaceSnapshot {
  sessionId: string;
  name: string; // Nome do workspace (anteriormente company.name)
  website?: string; // Website do workspace (anteriormente company.website)
  salesRepCompany?: string; // Empresa do responsável pela pesquisa (user/guest)
  salesRepWebsite?: string; // Website da empresa do responsável
  generatedAt: string | null;
  tilesToGenerate: number;
  promptSettings?: WorkspacePromptSettings;
  appearance?: WorkspaceAppearance;
  tiles?: Tile[]; // Opcional: usado durante criação, depois movido para dashboard
  // Nota: notes e contacts são sempre armazenados em dashboards
}

