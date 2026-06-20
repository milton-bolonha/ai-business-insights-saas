"use client";

import React, { useState, useEffect } from "react";
import { Bot, Loader2, Plus, BrainCircuit, Trash2 } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/stores";

export function AgentsView() {
  const workspace = useCurrentWorkspace();
  const [agents, setAgents] = useState<any[]>([]);
  const [kbs, setKbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newKbId, setNewKbId] = useState("");
  const [newPrompt, setNewPrompt] = useState("Você é um Especialista em Licitações Sênior. Responda com clareza, sempre citando as páginas e itens do edital quando aplicável.");

  useEffect(() => {
    if (!workspace) return;
    fetchData();
  }, [workspace]);

  const fetchData = async () => {
    try {
      const [resAgents, resKbs] = await Promise.all([
        fetch(`/api/openai/agents?workspaceId=${workspace?.id}`),
        fetch(`/api/openai/knowledge-bases?workspaceId=${workspace?.id}`)
      ]);
      const [dataAgents, dataKbs] = await Promise.all([resAgents.json(), resKbs.json()]);
      if (dataAgents.success) setAgents(dataAgents.agents);
      if (dataKbs.success) setKbs(dataKbs.knowledgeBases);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName || !newPrompt || !workspace) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/api/openai/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          name: newName,
          description: "Especialista criado no DashMaster",
          systemPrompt: newPrompt,
          knowledgeBaseId: newKbId || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewName("");
        setNewKbId("");
        await fetchData();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja apagar o especialista "${name}"?`)) return;
    try {
      const res = await fetch(`/api/openai/agents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAgents(agents.filter(a => a._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar especialista");
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Especialistas (Agentes IA)</h2>
        <p className="text-slate-500">Crie seus assistentes especializados atrelados às Bases de Conhecimento.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700 block mb-1">Nome do Especialista</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg" 
              placeholder="Ex: Especialista em Cultura"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="w-1/3">
            <label className="text-sm font-medium text-slate-700 block mb-1">Base de Conhecimento</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              value={newKbId}
              onChange={(e) => setNewKbId(e.target.value)}
            >
              <option value="">Nenhuma (Geral)</option>
              {kbs.map(kb => (
                <option key={kb._id} value={kb._id}>{kb.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Comportamento (System Prompt)</label>
          <textarea 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg min-h-[100px] text-sm"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleCreate}
            disabled={isCreating || !newName || !newPrompt}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={18} /> Criar Especialista</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <div key={agent._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative group">
            <button 
              onClick={() => handleDelete(agent._id, agent.name)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
              title="Apagar Especialista"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex items-start gap-4 mb-4 pr-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 line-clamp-2">{agent.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{agent.systemPrompt}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><BrainCircuit size={14}/> ID: {agent.openaiAssistantId?.substring(0, 10)}...</span>
                {agent.knowledgeBaseId && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Possui Base</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
