"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, FileText, Loader2, CheckCircle2, LayoutGrid, Eye, ListChecks, CircleDollarSign, AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/stores";
import { useToast } from "@/lib/state/toast-context";
import { ChatIA } from "./ChatIA";
import { SmartOverviewCards } from "./SmartOverviewCards";
import { ChecklistTab } from "./ChecklistTab";
import { PropostaTab } from "./PropostaTab";

// ==========================================
// MAIN COMPONENT: BOARD
// ==========================================
export function IoEditaisBoard() {
  const workspace = useCurrentWorkspace();
  const { push } = useToast();

  const [editais, setEditais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEdital, setActiveEdital] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("resumo");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchEditais = async () => {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/openai/knowledge-bases?workspaceId=${workspace.id}`);
      const data = await res.json();
      if (data.success) {
        setEditais(data.knowledgeBases || []);
        // Sync active edital
        setActiveEdital((prev: any) => {
          if (!prev) return null;
          return data.knowledgeBases.find((e: any) => e._id === prev._id) || prev;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditais();
  }, [workspace]);

  // Polling silently when there are processing editais
  useEffect(() => {
    if (!workspace) return;
    const hasProcessing = editais.some(e => e.analysis?.status === 'processing');
    if (hasProcessing) {
      const interval = setInterval(fetchEditais, 5000);
      return () => clearInterval(interval);
    }
  }, [editais, workspace]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;

    setIsUploading(true);
    setUploadStatus("Enviando arquivo e criando infraestrutura...");
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspace.id);
      formData.append("type", "Geral"); // Podemos ter um seletor depois

      const res = await fetch("/api/io-editais/smart-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUploadProgress(60);
      setUploadStatus("Iniciando Análise Geral com IA...");

      // Kick off analysis
      fetch("/api/io-editais/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kbId: data.knowledgeBaseId, agentId: data.agentId })
      }).then(() => fetchEditais());

      setUploadProgress(100);
      push({ title: "Sucesso", description: "Edital adicionado e IA iniciada.", variant: "default" });
      await fetchEditais();

      // Open immediately
      const newEdital = { _id: data.knowledgeBaseId, name: file.name, status: 'active', analysis: { status: 'processing' } };
      setActiveEdital(newEdital);
      setActiveTab("resumo");

    } catch (err: any) {
      push({ title: "Erro no Upload", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (kbId: string) => {
    if (!confirm("Deletar este edital e toda a inteligência atrelada a ele?")) return;
    try {
      await fetch(`/api/openai/knowledge-bases/${kbId}`, { method: "DELETE" });
      setEditais(prev => prev.filter(e => e._id !== kbId));
      if (activeEdital?._id === kbId) setActiveEdital(null);
      push({ title: "Edital Deletado", description: "Documento apagado.", variant: "default" });
    } catch (e) {
      console.error(e);
      push({ title: "Erro", description: "Falha ao apagar.", variant: "destructive" });
    }
  };

  if (!workspace) return <div className="p-12 text-center text-slate-500">Selecione um workspace.</div>;

  // ------------------------------------------------------------
  // VIEW: LISTA DE EDITAIS
  // ------------------------------------------------------------
  if (!activeEdital) {
    return (
      <div className="flex-1 flex flex-col h-full bg-transparent">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-8 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Seus Editais</h1>
            <p className="text-sm text-slate-500 mt-1">Faça upload para o Assistente ler e extrair os dados na hora.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <ListChecks size={16} />
              </button>
            </div>
            <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-sm hover:shadow">
              <UploadCloud size={18} />
              Novo Edital (PDF)
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="px-8 mt-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
              <Loader2 size={24} className="text-blue-600 animate-spin" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 text-sm">Carregando Edital...</h3>
                <p className="text-blue-700 text-xs mt-1">{uploadStatus}</p>
                <div className="w-full h-1.5 bg-blue-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          {loading ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : editais.length === 0 ? (
             <div className="text-center py-20 text-slate-400">Nenhum edital cadastrado neste workspace.</div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {editais.map(edital => {
                const title = edital.analysis?.tipoEdital && edital.analysis.tipoEdital !== "Não identificado" ? edital.analysis.tipoEdital : edital.name;
                return (
                  <div 
                    key={edital._id} 
                    className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer flex flex-col relative"
                    onClick={() => setActiveEdital(edital)}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(edital._id); }}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 mb-4">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-tight mb-2" title={title}>
                      {title}
                    </h3>
                    {title !== edital.name && (
                      <p className="text-xs text-slate-400 truncate mb-2">{edital.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${
                        edital.analysis?.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        edital.analysis?.status === 'error' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {edital.analysis?.status === 'completed' ? <CheckCircle2 size={14} /> :
                         edital.analysis?.status === 'error' ? <AlertTriangle size={14} /> :
                         <Loader2 size={14} className="animate-spin" />}
                        {edital.analysis?.status === 'completed' ? 'Analisado' :
                         edital.analysis?.status === 'error' ? 'Erro na IA' : 'Analisando...'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Edital</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Arquivo original</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status IA</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editais.map(edital => {
                    const title = edital.analysis?.tipoEdital && edital.analysis.tipoEdital !== "Não identificado" ? edital.analysis.tipoEdital : edital.name;
                    return (
                      <tr 
                        key={edital._id} 
                        onClick={() => setActiveEdital(edital)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <span className="font-medium text-slate-800 line-clamp-1" title={title}>{title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500 truncate block max-w-[200px]" title={edital.name}>{edital.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                            edital.analysis?.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                            edital.analysis?.status === 'error' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {edital.analysis?.status === 'completed' ? <CheckCircle2 size={12} /> :
                             edital.analysis?.status === 'error' ? <AlertTriangle size={12} /> :
                             <Loader2 size={12} className="animate-spin" />}
                            {edital.analysis?.status === 'completed' ? 'Analisado' :
                             edital.analysis?.status === 'error' ? 'Erro na IA' : 'Analisando...'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(edital._id); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // VIEW: TABS DO EDITAL ATIVO
  // ------------------------------------------------------------
  const isAnalysisReady = activeEdital.analysis?.status === "completed";
  const isAnalysisProcessing = activeEdital.analysis?.status === "processing" || !activeEdital.analysis;

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-800 overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setActiveEdital(null); fetchEditais(); }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight line-clamp-1">{activeEdital.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">Workspace de Agentes Ocultos</span>
              {activeEdital.analysis?.tipoEdital && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {activeEdital.analysis.tipoEdital}
                </span>
              )}
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                isAnalysisReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {isAnalysisReady ? <><CheckCircle2 size={12} /> Análise Concluída</> : 'Lendo Documento...'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => handleDelete(activeEdital._id)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
        >
          <Trash2 size={16} /> Deletar Edital
        </button>
      </div>

      {/* TABS NAVEGAÇÃO */}
      <div className="flex items-center px-6 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/50 gap-6 shrink-0">
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "resumo" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("resumo")}
        >
          <FileText size={16} /> Visão Geral IA
        </button>
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "checklist" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("checklist")}
        >
          <ListChecks size={16} /> Checklist de Habilitação
        </button>
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "proposta" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("proposta")}
        >
          <CircleDollarSign size={16} /> Proposta e Custos
        </button>
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "chat" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          <Eye size={16} /> Chat & Análises
        </button>
      </div>

      {/* TABS CONTEUDO */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto w-full h-full">
          
          {/* TAB: VISÃO GERAL */}
          {activeTab === "resumo" && (
            <div className="min-h-full">
              {isAnalysisProcessing ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                  <h4 className="font-semibold text-slate-700 text-lg">Lendo as {activeEdital.name?.includes('pdf') ? 'páginas do ' : ''}edital...</h4>
                  <p className="text-slate-500 text-sm mt-2 max-w-md">Nosso Especialista IA está varrendo o documento com a ferramenta de Vector Store. A Visão Geral aparecerá aqui em instantes. Você já pode usar o Chat enquanto isso.</p>
                </div>
              ) : isAnalysisReady ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <LayoutGrid className="text-blue-600" /> Resumo Estratégico
                  </h3>
                  <SmartOverviewCards content={activeEdital.analysis?.visaoGeral} />
                </div>
              ) : (
                <div className="text-center py-12 text-red-500">Falha ao gerar análise.</div>
              )}
            </div>
          )}

          {/* TAB: CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="min-h-full">
               <ChecklistTab activeEdital={activeEdital} />
            </div>
          )}

          {/* TAB: PROPOSTA */}
          {activeTab === "proposta" && (
            <div className="min-h-full">
               <PropostaTab activeEdital={activeEdital} />
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === "chat" && (
            <div className="h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <ChatIA workspaceId={workspace.id} preselectedKbId={activeEdital._id} hideKbSelector={true} />
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
}
