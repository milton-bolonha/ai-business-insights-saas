import { CustomerEntity } from './CustomerEntity';
import { SupplierEntity } from './SupplierEntity';
import { ServiceCatalogEntity } from './ServiceCatalogEntity';

export type OSStatus = 
  | 'intake' // Triagem/Entrada (Aguardando orçamento)
  | 'quote_pending' // Orçamento sendo construído
  | 'quote_approved' // Orçamento aprovado pelo cliente
  | 'production_pending' // Aguardando início de produção
  | 'in_production' // Em produção / Execução do projeto
  | 'production_completed' // Produção finalizada, aguardando aprovação final
  | 'ready_for_pickup' // Pronto para retirada/entrega
  | 'delivered' // Entregue ao cliente
  | 'archived'; // Soft archive

export interface OSTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
}

export interface OSActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  userId?: string;
}

export interface OSEntity {
  id: string;
  osNumber: string; // Número amigável da OS (ex: OS-2024-001)
  title: string; // Título do Projeto/Orçamento
  
  // Relações
  customerId: string;
  customer?: CustomerEntity;
  supplierId?: string;
  supplier?: SupplierEntity;

  // Status e Ciclo de Vida
  status: OSStatus;
  
  // Serviço
  serviceId?: string;
  service?: ServiceCatalogEntity;
  description: string; // Ex: Notebook Dell Inspiron / 50 Camisetas brancas
  reportedDetails?: string; // Ex: Relato do defeito ou detalhes do pedido
  technicalDiagnosis?: string;

  // Datas / SLA
  intakeDate: string; // Data de entrada
  estimatedCompletionDate?: string; // Previsão de entrega
  completionDate?: string; // Data de conclusão real
  archivedAt?: string; // Data do soft archive
  
  // Produção e Kanban de Tarefas
  technicianId?: string;
  technicianName?: string;
  tasks?: OSTask[]; // Sub-tarefas no estilo Jira
  checklist?: { id: string; label: string; isCompleted: boolean }[];
  
  // Arquivos e Anexos (Cloudinary)
  files?: { id: string; url: string; phase: string; filename: string; uploadedAt: string }[];
  
  // Histórico e Logs
  activityLog?: OSActivityLog[];

  // Financeiro e Fiscal
  totalCost?: number;
  totalRevenue?: number;
  profitMargin?: number;
  isPaid: boolean;
  paymentMethod?: string;
  invoiceIssued: boolean; // Nota fiscal emitida
  invoiceUrl?: string; // Link para DANFE (Cloudinary)
  
  // Triagem/Checklist
  additionalItems?: string[]; // Ex: Acessórios, cabos, pen drive, artes
  itemCondition?: string; // Estado do item / produto

  // Entrega
  scheduledDeliveryDate?: string;
  signatureUrl?: string; // Assinatura digital do cliente (Cloudinary)
  deliveryProofUrl?: string; // Comprovante de entrega (Cloudinary)

  // Metadados do sistema
  createdAt: string;
  updatedAt: string;
}
