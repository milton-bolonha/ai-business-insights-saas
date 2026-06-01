"use client";
import React, { useState } from "react";
import { OSEntity } from "../types/OSEntity";
import { OSIntakeForm } from "./OSIntakeForm";
import { QuoteBuilder } from "./QuoteBuilder"; // This will become our Project Details / Jira-like panel
import { ProductionQueueBoard } from "./ProductionQueueBoard";
import { PickupQueue } from "./PickupQueue";
import { OSFileGallery } from "./OSFileGallery";
import { ClipboardList, Settings, Package, FolderOpen, Plus, X, Search, Filter } from "lucide-react";

export function OSSystemBoard({ workspaceId }: { workspaceId?: string }) {
  const [activeTab, setActiveTab] = useState<"budgets" | "production" | "pickup" | "files">("budgets");
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  
  const [osList, setOsList] = useState<OSEntity[]>([]);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOs = osList.find(os => os.id === selectedOsId) || null;

  const handleCreateOS = (data: any) => {
    const newOs: OSEntity = {
      id: crypto.randomUUID(),
      title: data.itemDescription || "Novo Projeto",
      status: "quote_pending", // Automatically skips intake and goes to quoting
      customerId: "mock-customer-id",
      customer: {
        id: "mock-customer-id",
        name: data.customerName || "Sem Nome",
        phone: data.customerPhone || "",
      } as any,
      description: data.itemDescription || "",
      itemCondition: data.itemCondition || "",
      reportedDetails: data.reportedDetails || "",
      additionalItems: data.additionalItems || [],
      osNumber: "OS-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 10000),
      intakeDate: new Date().toISOString(),
      isPaid: false,
      invoiceIssued: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
      activityLog: [
        {
          id: crypto.randomUUID(),
          action: "Orçamento Iniciado",
          description: "Projeto registrado no sistema.",
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    setOsList([newOs, ...osList]);
    setIsIntakeModalOpen(false);
    setActiveTab("budgets");
    setSelectedOsId(newOs.id);
  };

  const handleUpdateOS = (id: string, updates: Partial<OSEntity>) => {
    setOsList(prev => prev.map(os => os.id === id ? { ...os, ...updates, updatedAt: new Date().toISOString() } : os));
  };

  const filteredOsList = osList.filter(os => {
    const query = searchQuery.toLowerCase();
    return os.title.toLowerCase().includes(query) || 
           os.osNumber.toLowerCase().includes(query) ||
           os.customer?.name.toLowerCase().includes(query);
  });

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto rounded-xl shadow-sm border border-gray-100 relative">
      {/* Top Header & SubNavigation */}
      <div className="border-b border-gray-200 px-8 pt-8 bg-gray-50/50 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">I/O - OS System</h1>
            <p className="text-gray-500 mt-1">Projetos, Orçamentos e Produção de Serviços</p>
          </div>
        </div>

        <div className="flex gap-6">
          {[
            { id: "budgets", label: "Projetos & Orçamentos", icon: ClipboardList },
            { id: "production", label: "Fila de Produção", icon: Settings },
            { id: "pickup", label: "Retirada & Entrega", icon: Package },
            { id: "files", label: "Galeria e Arquivos", icon: FolderOpen },
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
      <div className="p-8">
        {activeTab === "budgets" && (
          <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List of Budgets */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Histórico de Projetos</h3>
                <button 
                  onClick={() => setIsIntakeModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Orçamento
                </button>
              </div>

              {/* Filters */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por OS, cliente..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2">
                {filteredOsList.map(os => (
                  <div 
                    key={os.id}
                    onClick={() => setSelectedOsId(os.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedOsId === os.id ? 'border-violet-500 bg-violet-50 shadow-sm' : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50 bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-900 text-sm">{os.osNumber}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                        {os.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="font-medium text-sm text-gray-800">{os.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{os.customer?.name}</div>
                  </div>
                ))}
                {filteredOsList.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                    <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhum projeto encontrado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Details Panel (QuoteBuilder) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {selectedOs ? (
                <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                  <QuoteBuilder 
                    os={selectedOs} 
                    onUpdate={(updates) => handleUpdateOS(selectedOs.id, updates)} 
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Search className="w-8 h-8 text-gray-300 mb-3" />
                  <p className="text-gray-400 font-medium">Selecione um projeto na lista para visualizar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "production" && (
          <div className="animate-in fade-in duration-300 h-full min-h-[600px]">
            <ProductionQueueBoard 
              queue={osList} 
              onUpdateOS={(id, updates) => handleUpdateOS(id, updates)} 
            />
          </div>
        )}

        {activeTab === "pickup" && (
          <div className="animate-in fade-in duration-300">
            <PickupQueue
              queue={osList}
              onSelectForDelivery={(os) => setSelectedOsId(os.id)}
              onUpdateOS={(id, updates) => handleUpdateOS(id, updates)}
            />
          </div>
        )}

        {activeTab === "files" && (
          <div className="animate-in fade-in duration-300">
            {selectedOs ? (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <h3 className="font-semibold text-gray-900">Arquivos da OS {selectedOs.osNumber}</h3>
                    <p className="text-sm text-gray-500">Cliente: {selectedOs.customer?.name || "Sem Nome"} | Projeto: {selectedOs.title}</p>
                  </div>
                  <button onClick={() => setSelectedOsId(null)} className="text-sm text-violet-600 font-medium hover:underline">
                    Trocar OS
                  </button>
                </div>
                <OSFileGallery 
                  os={selectedOs} 
                  workspaceId={workspaceId || ""} 
                  onUpdateOS={handleUpdateOS} 
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {osList.map(os => (
                  <div 
                    key={os.id}
                    onClick={() => setSelectedOsId(os.id)}
                    className="p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-violet-400 hover:shadow-md transition-all bg-white"
                  >
                    <div className="font-bold text-gray-900 mb-1">{os.customer?.name || "Sem Nome"}</div>
                    <div className="text-sm text-gray-600 truncate">{os.title}</div>
                    <div className="text-xs text-gray-400 mt-2">{os.files?.length || 0} arquivos</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Intake Modal Overlay */}
      {isIntakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsIntakeModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Novo Orçamento / Projeto</h2>
              <p className="text-gray-500 text-sm">Preencha os detalhes iniciais para abrir um novo processo.</p>
            </div>
            <div className="p-6">
              <OSIntakeForm onSubmit={handleCreateOS} onCancel={() => setIsIntakeModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}