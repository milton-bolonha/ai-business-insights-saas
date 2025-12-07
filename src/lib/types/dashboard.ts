import type { Tile, Note, Contact } from "@/lib/types";
import type { WorkspaceAppearance } from "@/lib/types";

/**
 * Dashboard representa uma vista/configuração dentro de um Workspace
 * Cada dashboard tem seus próprios dados isolados (tiles, notes, contacts, assets)
 * Dashboards pertencem a um workspace (não diretamente a uma company)
 */
export interface Dashboard {
  id: string;
  name: string;
  workspaceId: string; // Referência ao workspace ao qual este dashboard pertence
  bgColor?: string; // Cor de fundo para o dashboard
  templateId?: string; // Template usado para criar este dashboard (se houver)
  tiles: Tile[]; // Tiles isolados por dashboard
  notes: Note[]; // Notes isolados por dashboard
  contacts: Contact[]; // Contacts isolados por dashboard
  assets?: unknown[]; // Futuro: assets isolados por dashboard
  appearance?: WorkspaceAppearance;
  contrastMode?: boolean; // Preferência persistente de modo de contraste
  createdAt: string;
  updatedAt: string;
  isActive?: boolean; // Dashboard atualmente ativo
}

/**
 * Workspace com múltiplos dashboards
 * Isso substitui CompanyWithDashboards para clareza
 */
export interface WorkspaceWithDashboards {
  id: string; // Mesmo que sessionId
  name: string;
  website?: string;
  salesRepCompany?: string;
  salesRepWebsite?: string;
  dashboards: Dashboard[]; // Múltiplos dashboards por workspace
  createdAt: string;
  updatedAt: string;
}

