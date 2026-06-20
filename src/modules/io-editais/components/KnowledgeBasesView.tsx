"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, FileText, Loader2, BookOpen, Search, Plus, Trash2 } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/stores";

export function KnowledgeBasesView() {
  const workspace = useCurrentWorkspace();
  const [kbs, setKbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [newKbType, setNewKbType] = useState("Pregão Eletrônico");

  useEffect(() => {
    if (!workspace) return;
    fetchKbs();
  }, [workspace]);

  const fetchKbs = async () => {
    try {
      const res = await fetch(`/api/openai/knowledge-bases?workspaceId=${workspace?.id}`);
      const data = await res.json();
      if (data.success) {
        setKbs(data.knowledgeBases);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKbName || !workspace) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/api/openai/knowledge-bases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          name: newKbName,
          editalType: newKbType,
          description: `Base para ${newKbType}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewKbName("");
        await fetchKbs();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async (kbId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;
    
    // Upload logic here...
    // In a real scenario we'd show progress for this specific KB
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspace.id);
    formData.append("knowledgeBaseId", kbId);

    try {
      const res = await fetch(`/api/openai/files/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert("Arquivo enviado com sucesso!");
        // Refresh KBs or files list if we had one
      } else {
        alert("Erro ao enviar arquivo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar arquivo.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja apagar a base "${name}"?`)) return;
    try {
      const res = await fetch(`/api/openai/knowledge-bases/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKbs(kbs.filter(kb => kb._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar base");
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bases de Conhecimento</h2>
          <p className="text-slate-500">Gerencie seus editais e documentos de referência para a IA.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-end gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-slate-700 block mb-1">Nome da Base</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg" 
            placeholder="Ex: Licitação Material Escolar 2026"
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
          />
        </div>
        <div className="w-64">
          <label className="text-sm font-medium text-slate-700 block mb-1">Tipo de Edital (Metadado)</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
            value={newKbType}
            onChange={(e) => setNewKbType(e.target.value)}
          >
            <option value="Pregão Eletrônico">Pregão Eletrônico</option>
            <option value="Artístico">Artístico</option>
            <option value="Cultural">Cultural</option>
            <option value="Social">Social</option>
            <option value="Obras">Obras e Engenharia</option>
          </select>
        </div>
        <button 
          onClick={handleCreate}
          disabled={isCreating || !newKbName}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="animate-spin" size={20} /> : "Criar Nova Base"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kbs.map(kb => (
          <div key={kb._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative group">
            <button 
              onClick={() => handleDelete(kb._id, kb.name)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
              title="Apagar Base"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex items-start gap-4 mb-4 pr-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 line-clamp-2">{kb.name}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                  {kb.editalType || "Geral"}
                </span>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Arquivos sincronizados</span>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-slate-200 hover:border-blue-200">
                <UploadCloud size={16} /> Anexar PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(kb._id, e)} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
