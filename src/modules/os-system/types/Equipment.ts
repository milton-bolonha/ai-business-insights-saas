export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'maintenance' | 'offline';
  lastMaintenance?: string;
  nextMaintenance?: string;
  wikiContent?: string; // HTML ou JSON do TipTap com o know-how
  assigneeId?: string; // NOVO: Usuário responsável pelo equipamento
  assigneeName?: string; // NOVO: Nome do responsável
}
