import { CustomerEntity } from './CustomerEntity';
import { SupplierEntity } from './SupplierEntity';
import { ServiceCatalogEntity } from './ServiceCatalogEntity';

export type OSStatus = 
  | 'orcamento'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'entrada_recebida'
  | 'em_arte'
  | 'arte_aprovada'
  | 'em_impressao'
  | 'em_producao'
  | 'em_conferencia'
  | 'empacotado'
  | 'pronto_para_entrega'
  | 'entregue'
  | 'cancelado';

export interface OSTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  equipmentId?: string; // NOVO: Para vincular tarefas a um equipamento (Impressora, Prensa, etc)
  comments?: any[];
  createdAt: string;
}

export interface OSActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  userId?: string;
}

export interface OSEquipment {
  id: string;
  name: string;
  type: string;
  sector: 'design' | 'producao';
}

export interface OSProductDetails {
  modelo?: string;
  malha?: string;
  cor?: string;
  personalizacao?: string;
  quantidadeTotal?: number;
  grade?: Record<string, number>; // ex: { P: 10, M: 20 }
}

export interface OSArtDetails {
  arquivosUrl?: string[]; // Arrays de Cloudinary URLs
  designerName?: string;
  dataCriacao?: string;
  aprovacaoCliente?: boolean;
  dataAprovacao?: string;
}

export interface OSPrintDetails {
  equipamentoId?: string;
  equipamentoNome?: string;
  tipoImpressao?: 'dtf' | 'sublimacao' | 'plotter' | 'silk' | string;
  operadorName?: string;
  inicio?: string;
  fim?: string;
}

export interface OSProductionDetails {
  corte?: boolean;
  costura?: boolean;
  silk?: boolean;
  dtf?: boolean;
  prensagem?: boolean;
  acabamento?: boolean;
}

export interface OSConferenceDetails {
  quantidadePrevista?: number;
  quantidadeConferida?: number;
  divergencias?: string[];
  responsavel?: string;
  aprovado?: boolean;
}

export interface OSPackagingDetails {
  quantidadeVolumes?: number;
  tipoEmbalagem?: string;
  responsavel?: string;
  data?: string;
}

export interface OSEntity {
  id: string;
  osNumber: string; // Ex: OS-2024-001
  title: string; // Título do Projeto/Orçamento
  
  // Relações
  customerId: string;
  customer?: CustomerEntity;
  supplierId?: string;
  supplier?: SupplierEntity;

  // Status e Ciclo de Vida
  status: OSStatus;
  
  // Produto e Produção
  productDetails?: OSProductDetails;
  artDetails?: OSArtDetails;
  printDetails?: OSPrintDetails;
  productionDetails?: OSProductionDetails;
  conferenceDetails?: OSConferenceDetails;
  packagingDetails?: OSPackagingDetails;

  // Serviço genérico antigo
  serviceId?: string;
  service?: ServiceCatalogEntity;
  description: string;
  reportedDetails?: string;

  // Datas / SLA
  intakeDate: string;
  estimatedCompletionDate?: string;
  completionDate?: string;
  archivedAt?: string;
  
  // Produção e Kanban de Tarefas
  tasks?: OSTask[];
  checklist?: { id: string; label: string; isCompleted: boolean }[];
  technicianId?: string;
  technicianName?: string;
  
  // Arquivos e Anexos (Cloudinary)
  files?: { id: string; url: string; phase: string; filename: string; uploadedAt: string }[];
  
  // Histórico e Logs
  activityLog?: OSActivityLog[];

  // Financeiro e Comercial
  totalCost?: number;
  totalRevenue?: number;
  valorEntrada?: number;
  valorRestante?: number;
  desconto?: number;
  validadeDias?: number;
  profitMargin?: number;
  isPaid: boolean;
  paymentMethod?: string;
  invoiceIssued: boolean;
  invoiceUrl?: string; // Cloudinary
  
  // Entrega
  scheduledDeliveryDate?: string;
  signatureUrl?: string; // Cloudinary
  deliveryProofUrl?: string; // Cloudinary

  // Metadados do sistema
  createdAt: string;
  updatedAt: string;
}
