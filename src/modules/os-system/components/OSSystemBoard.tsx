"use client";
import React, { useState } from "react";
import { OSEntity } from "../types/OSEntity";
import { OSIntakeForm } from "./OSIntakeForm";
import { OrderDossier } from "./OrderDossier";
import { GenericSectorBoard, SectorColumnDef } from "./GenericSectorBoard";
import { OSFileGallery } from "./OSFileGallery";
import { IndustryLayoutManager } from "./IndustryLayoutManager";
import { Briefcase, Paintbrush, Scissors, Truck, FolderOpen, Plus, X, Search, Settings } from "lucide-react";

export function OSSystemBoard({ workspaceId }: { workspaceId?: string }) {
  const [activeTab, setActiveTab] = useState<"comercial" | "design" | "producao" | "expedicao" | "files">("comercial");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban"); // Salva preferncia do usurio (poderia vir de um contexto global)
  
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [osList, setOsList] = useState<OSEntity[]>([]);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOs = osList.find(os => os.id === selectedOsId) || null;

  const handleCreateOS = (data: any) => {
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
    
    setOsList([newOs, ...osList]);
    setIsIntakeModalOpen(false);
    setActiveTab("comercial");
    setSelectedOsId(newOs.id);
  };

  const handleUpdateOS = (id: string, updates: Partial<OSEntity>) => {
    setOsList(prev => prev.map(os => os.id === id ? { ...os, ...updates, updatedAt: new Date().toISOString() } : os));
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
    { id: 'conferencia', title: 'Em Conferência', statuses: ['em_conferencia'], color: 'orange' },
    { id: 'empacotado', title: 'Empacotado', statuses: ['empacotado'], color: 'amber' },
    { id: 'pronto', title: 'Pronto p/ Entrega', statuses: ['pronto_para_entrega'], color: 'teal' },
    { id: 'entregue', title: 'Entregue', statuses: ['entregue'], color: 'gray' },
  ];

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto rounded-xl shadow-sm border border-gray-100 relative">
      {/* Top Header & SubNavigation */}
      <div className="border-b border-gray-200 px-8 pt-8 bg-gray-50/50 sticky top-0 z-10 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">OS System - Vice Versa</h1>
            <p className="text-gray-500 mt-1">Gestão de Produção e Confecção</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar cliente ou OS..." 
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
              <Plus className="w-4 h-4" /> Novo Orçamento Comercial
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {[
            { id: "comercial", label: "Comercial", icon: Briefcase },
            { id: "design", label: "Arte & Impressão", icon: Paintbrush },
            { id: "producao", label: "Produção", icon: Scissors },
            { id: "expedicao", label: "Expedição", icon: Truck },
            { id: "files", label: "Galeria Geral", icon: FolderOpen },
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
            />
          )}
          {activeTab === 'design' && (
            <GenericSectorBoard 
              queue={filteredOsList} 
              columns={columnsDesign} 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onSelectOS={(os) => setSelectedOsId(os.id)} 
            />
          )}
          {activeTab === 'producao' && (
            <GenericSectorBoard 
              queue={filteredOsList} 
              columns={columnsProducao} 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onSelectOS={(os) => setSelectedOsId(os.id)} 
            />
          )}
          {activeTab === 'expedicao' && (
            <GenericSectorBoard 
              queue={filteredOsList} 
              columns={columnsExpedicao} 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onSelectOS={(os) => setSelectedOsId(os.id)} 
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
        <div className="fixed inset-0 bg-gray-50 z-[70] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="flex-1 max-w-4xl mx-auto w-full p-8 pt-12">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Novo Orçamento Comercial</h2>
                <p className="text-gray-500 mt-2 text-lg">Inicie um novo projeto de confecção ou estamparia.</p>
              </div>
              <button onClick={() => setIsIntakeModalOpen(false)} className="text-gray-400 hover:bg-gray-200 bg-gray-100 p-3 rounded-full transition-colors flex items-center gap-2">
                <X className="w-5 h-5" />
                <span className="text-sm font-medium pr-1">Cancelar</span>
              </button>
            </div>
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