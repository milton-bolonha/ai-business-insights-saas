"use client";
import React, { useState, useEffect } from "react";
import { OSEntity } from "../types/OSEntity";
import { OSIntakeForm } from "./OSIntakeForm";
import { OrderDossier } from "./OrderDossier";
import { GenericSectorBoard, SectorColumnDef } from "./GenericSectorBoard";
import { OSFileGallery } from "./OSFileGallery";
import { OSTasksGlobalBoard } from "./OSTasksGlobalBoard";
import { OSArchivedBoard } from "./OSArchivedBoard";
import { OSCustomersBoard } from "./OSCustomersBoard";
import { IndustryLayoutManager } from "./IndustryLayoutManager";
import { VetorizeStudioPro } from "./VetorizeStudioPro";
import { Briefcase, Paintbrush, Scissors, Truck, FolderOpen, Plus, X, Search, Settings, Archive, Users, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function OSSystemBoard({ workspaceId }: { workspaceId?: string }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"comercial" | "design" | "producao" | "expedicao" | "arquivadas" | "files" | "tarefas" | "clientes" | "vetorize">("comercial");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban"); // Salva preferência do usuário
  
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [osList, setOsList] = useState<OSEntity[]>([]);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados da API ao carregar
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/os-system${workspaceId ? `?workspaceId=${workspaceId}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          setOsList(data.orders || []);
        }
      } catch (err) {
        console.error("Erro ao buscar OS:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const selectedOs = osList.find(os => os.id === selectedOsId) || null;

  const handleCreateOS = async (data: any) => {
    const newOs: OSEntity = {
      id: crypto.randomUUID(),
      title: data.itemDescription || "Novo Orçamento Comercial",
      status: "orcamento",
      customerId: "mock-customer-id",
      customer: {
        id: "mock-customer-id",
        name: data.customerName || "Sem Nome",
        phone: data.customerPhone || "",
      } as any,
      description: data.itemDescription || "",
      osNumber: "OS-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 10000),
      intakeDate: new Date().toISOString(),
      productDetails: {
        modelo: data.modelo || "",
        malha: data.malha || "",
        cor: data.cor || "",
        personalizacao: data.personalizacao || "",
        quantidadeTotal: data.quantidadeTotal || 0,
      },
      totalRevenue: data.totalRevenue || 0,
      isPaid: false,
      invoiceIssued: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
      activityLog: [
        {
          id: crypto.randomUUID(),
          action: "Orçamento Criado",
          description: "Entrou no Setor Comercial.",
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    // Atualiza o estado local imediatamente
    setOsList(prev => [newOs, ...prev]);
    setIsIntakeModalOpen(false);
    setActiveTab("comercial");
    setSelectedOsId(newOs.id);

    // Salva no banco de dados via API
    try {
      await fetch(`/api/os-system${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOs),
      });
    } catch (err) {
      console.error("Erro ao salvar OS:", err);
    }
  };

  const handleUpdateOS = async (id: string, updates: Partial<OSEntity>) => {
    // Atualização otimista
    setOsList(prev => prev.map(os => os.id === id ? { ...os, ...updates, updatedAt: new Date().toISOString() } : os));
    
    // Atualiza no banco de dados
    try {
      await fetch(`/api/os-system/${id}${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Erro ao atualizar OS:", err);
    }
  };

  const filteredOsList = osList.filter(os => {
    const query = searchQuery.toLowerCase();
    return os.title.toLowerCase().includes(query) || 
           os.osNumber.toLowerCase().includes(query) ||
           (os.customer?.name || '').toLowerCase().includes(query);
  });

  // Definio das Colunas de cada Setor (Mapeando do JSON)
  const columnsComercial: SectorColumnDef[] = [
    { id: 'orcamentos', title: 'Orçamentos (Em criação)', statuses: ['orcamento'], color: 'gray' },
    { id: 'aguardando', title: 'Aguardando Aprovação', statuses: ['aguardando_aprovacao'], color: 'yellow' },
    { id: 'aprovados', title: 'Aprovados', statuses: ['aprovado', 'entrada_recebida'], color: 'emerald' },
  ];

  const columnsDesign: SectorColumnDef[] = [
    { id: 'fila_arte', title: 'Fila de Arte', statuses: ['em_arte'], color: 'pink' },
    { id: 'arte_aprovada', title: 'Arte Aprovada', statuses: ['arte_aprovada'], color: 'fuchsia' },
    { id: 'fila_impressao', title: 'Em Impressão', statuses: ['em_impressao'], color: 'violet' },
  ];

  const columnsProducao: SectorColumnDef[] = [
    { id: 'fila_producao', title: 'Fila de Produção (Confecção)', statuses: ['em_producao'], color: 'blue' },
  ];

  const columnsExpedicao: SectorColumnDef[] = [
    { id: 'preparar_entrega', title: 'Preparar Entrega', statuses: ['em_conferencia', 'empacotado'], color: 'orange' },
    { id: 'conferidos_prontos', title: 'Conferidos e Prontos', statuses: ['pronto_para_entrega'], color: 'teal' },
    { id: 'entregue', title: 'Entregue', statuses: ['entregue'], color: 'gray' },
  ];

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto rounded-xl shadow-sm border border-gray-100 relative">
      {/* Top Header & SubNavigation */}
      <div className="border-b border-gray-200 px-8 pt-8 bg-gray-50/50 sticky top-0 z-10 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("osSystem.title")}</h1>
            <p className="text-gray-500 mt-1">{t("osSystem.subtitle")}</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={t("osSystem.searchPlaceholder")} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <button 
              onClick={() => setIsEquipmentModalOpen(true)}
              className="p-2 border border-gray-300 text-gray-500 hover:text-violet-600 hover:border-violet-300 rounded-lg transition-colors flex items-center justify-center bg-white shadow-sm"
              title="Gerenciar Equipamentos"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsIntakeModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> {t("osSystem.newCommercialOrder")}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {[
            { id: "comercial", label: `${t("osSystem.tabs.comercial")} (${osList.filter(os => columnsComercial.flatMap(c=>c.statuses).includes(os.status)).length})`, icon: Briefcase },
            { id: "design", label: `${t("osSystem.tabs.design")} (${osList.filter(os => columnsDesign.flatMap(c=>c.statuses).includes(os.status)).length})`, icon: Paintbrush },
            { id: "producao", label: `${t("osSystem.tabs.producao")} (${osList.filter(os => columnsProducao.flatMap(c=>c.statuses).includes(os.status)).length})`, icon: Scissors },
            { id: "expedicao", label: `${t("osSystem.tabs.expedicao")} (${osList.filter(os => columnsExpedicao.flatMap(c=>c.statuses).includes(os.status)).length})`, icon: Truck },
            { id: "arquivadas", label: t("osSystem.tabs.arquivadas"), icon: Archive },
            { id: "clientes", label: t("osSystem.tabs.clientes"), icon: Users },
            { id: "files", label: t("osSystem.tabs.files"), icon: FolderOpen },
            { id: "vetorize", label: t("osSystem.tabs.vetorize"), icon: ImageIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === tab.id ? "border-violet-600 text-violet-700" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-gray-50/30">
        <div className="h-full overflow-y-auto">
          {activeTab === 'comercial' && (
            <GenericSectorBoard 
              queue={filteredOsList} 
              columns={columnsComercial} 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onSelectOS={(os) => setSelectedOsId(os.id)} 
              onUpdateTask={async (osId, taskId, updates) => {
                const targetOs = osList.find(o => o.id === osId);
                if (!targetOs) return;
                const updatedTasks = targetOs.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
                await handleUpdateOS(osId, { tasks: updatedTasks });
              }}
            />
          )}
          {activeTab === 'design' && (
            <GenericSectorBoard 
              queue={filteredOsList} 
              columns={columnsDesign} 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onSelectOS={(os) => setSelectedOsId(os.id)} 
              onUpdateTask={async (osId, taskId, updates) => {
                const targetOs = osList.find(o => o.id === osId);
                if (!targetOs) return;
                const updatedTasks = targetOs.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
                await handleUpdateOS(osId, { tasks: updatedTasks });
              }}
            />
          )}
          {activeTab === 'producao' && (
            <GenericSectorBoard 
              queue={filteredOsList} 
              columns={columnsProducao} 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onSelectOS={(os) => setSelectedOsId(os.id)} 
              onUpdateTask={async (osId, taskId, updates) => {
                const targetOs = osList.find(o => o.id === osId);
                if (!targetOs) return;
                const updatedTasks = targetOs.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
                await handleUpdateOS(osId, { tasks: updatedTasks });
              }}
            />
          )}
          {activeTab === 'expedicao' && (
            <GenericSectorBoard 
              queue={filteredOsList} 
              columns={columnsExpedicao} 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onSelectOS={(os) => setSelectedOsId(os.id)} 
              onUpdateTask={async (osId, taskId, updates) => {
                const targetOs = osList.find(o => o.id === osId);
                if (!targetOs) return;
                const updatedTasks = targetOs.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
                await handleUpdateOS(osId, { tasks: updatedTasks });
              }}
            />
          )}
          {activeTab === 'files' && (
            <div className="p-8">
               <OSFileGallery 
                 os={null} 
                 workspaceId={workspaceId || ""} 
                 onUpdateOS={() => {}} 
               />
            </div>
          )}
          {activeTab === 'arquivadas' && (
            <div className="h-full">
               <OSArchivedBoard 
                 osList={osList} 
                 onViewOS={(osId) => setSelectedOsId(osId)}
               />
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="h-full">
               <OSCustomersBoard osList={osList} />
            </div>
          )}
          {activeTab === 'vetorize' && (
            <div className="h-full">
               <VetorizeStudioPro />
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Dossiê do Pedido */}
      {selectedOs && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
            onClick={() => setSelectedOsId(null)}
          />
          <div className="fixed inset-y-0 right-0 w-[950px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-1 overflow-hidden">
              <OrderDossier 
                os={selectedOs} 
                onUpdate={(updates) => handleUpdateOS(selectedOs.id, updates)} 
                onClose={() => setSelectedOsId(null)}
              />
            </div>
          </div>
        </>
      )}

      {/* Intake Fullscreen Modal */}
      {isIntakeModalOpen && (
        <div className="fixed inset-0 bg-gray-50 z-[70] flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="relative max-w-4xl mx-auto w-full p-8">
            <button 
              onClick={() => setIsIntakeModalOpen(false)} 
              className="absolute top-4 right-4 z-10 group text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 shadow-sm p-2 rounded-full transition-all flex items-center gap-0 hover:gap-2 overflow-hidden"
            >
              <span className="w-0 overflow-hidden group-hover:w-14 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 pl-1">Cancelar</span>
              <X className="w-5 h-5 shrink-0" />
            </button>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <OSIntakeForm onSubmit={handleCreateOS} onCancel={() => setIsIntakeModalOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Industry Layout Manager (Replaces Equipment Manager) */}
      <IndustryLayoutManager 
        isOpen={isEquipmentModalOpen} 
        onClose={() => setIsEquipmentModalOpen(false)} 
      />

    </div>
  );
}