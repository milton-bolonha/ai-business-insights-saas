"use client";

import React from "react";
import { useLicitaFlow } from "../hooks/useLicitaFlow";
import { PainelTab } from "./PainelTab";
import { EditalTab } from "./EditalTab";
import { ChecklistTab } from "./ChecklistTab";
import { PropostaTab } from "./PropostaTab";

const TABS = [
  { key: "painel", label: "Painel", icon: "🏠" },
  { key: "edital", label: "Edital", icon: "📄" },
  { key: "checklist", label: "Checklist", icon: "✅" },
  { key: "proposta", label: "Proposta", icon: "💰" },
];

const TOP_TITLES: Record<string, string> = {
  painel: "Painel de licitações",
  edital: "Leitura do edital por IA",
  checklist: "Checklist de participação",
  proposta: "Composição de proposta",
};

export function IoEditaisBoard() {
  const { activeTab, edital, editais, navigate, toggleChecklist } = useLicitaFlow();

  return (
    <div className="flex h-[calc(100vh-64px)] font-sans bg-[#F7F6F3] text-sm overflow-hidden">
      <div className="w-[228px] min-w-[228px] bg-white border-r border-black/10 flex flex-col">
        <div className="px-4 pt-4 pb-3.5 border-b border-black/5">
          <div className="text-[15px] font-semibold text-blue-800 tracking-tight">⚖️ LicitaFlow</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Análise inteligente de editais</div>
        </div>

        <div>
          <div className="text-[10px] text-gray-400 px-4 pt-3 pb-1 uppercase tracking-widest">Principal</div>
          {TABS.map(t => (
            <div 
              key={t.key} 
              onClick={() => navigate(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] cursor-pointer transition-all border-l-2 ${
                activeTab === t.key 
                  ? "border-blue-600 bg-blue-50 text-blue-800 font-medium" 
                  : "border-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{t.icon}</span>{t.label}
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] text-gray-400 px-4 pt-3 pb-1 uppercase tracking-widest">Editais ativos</div>
          {editais.map(e => (
            <div 
              key={e.id} 
              onClick={() => navigate("edital", e.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] cursor-pointer transition-all border-l-2 ${
                edital?.id === e.id && activeTab === "edital"
                  ? "border-blue-600 bg-blue-50 text-blue-800 font-medium" 
                  : "border-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{e.progresso === 100 ? "✅" : "📋"}</span>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                {e.nome.split(" ").slice(0, 3).join(" ")}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1" />
        
        <div className="p-3.5 border-t border-black/5">
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-medium">
            ✨ IA ativa
          </span>
          <div className="text-[11px] text-gray-400 mt-1">Empresa: Comercial Tech Ltda</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-black/10 px-5 h-[52px] min-h-[52px] flex items-center justify-between">
          <div className="text-[15px] font-medium text-primary-text">{TOP_TITLES[activeTab]}</div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate("edital")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-black/20 bg-white text-primary-text hover:bg-gray-50 transition-colors"
            >
              + Novo edital
            </button>
            <button 
              onClick={() => navigate("proposta")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              💰 Montar proposta
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "painel" && <PainelTab editais={editais} nav={navigate} />}
          {activeTab === "edital" && <EditalTab edital={edital} />}
          {activeTab === "checklist" && <ChecklistTab edital={edital} toggleChecklist={toggleChecklist} />}
          {activeTab === "proposta" && <PropostaTab edital={edital} />}
        </div>
      </div>
    </div>
  );
}
