"use client";

import React, { useState } from "react";
import { ArrowLeft, Save, Edit3, Trash2, SlidersHorizontal, List, ListOrdered, AlignLeft, Target, Palette, Plus, X, ShieldAlert, Activity, FileText, Star, Users, HandHeart, Scale } from "lucide-react";
import type { Survey, Question } from "../types";
import { NR1_TOPICS } from "../nr1-topics";

const AVAILABLE_ICONS = [
  { id: "FileText", icon: FileText }, { id: "Target", icon: Target },
  { id: "Star", icon: Star }, { id: "Users", icon: Users },
  { id: "ShieldAlert", icon: ShieldAlert }, { id: "Activity", icon: Activity },
  { id: "HandHeart", icon: HandHeart }, { id: "Scale", icon: Scale }
];

const ACCENT_COLORS = [
  "#2c3e50", "#e74c3c", "#8e44ad", "#2980b9",
  "#27ae60", "#f39c12", "#d35400", "#16a085"
];

function generateId() { return Math.random().toString(36).substring(2, 9); }

interface Props {
  initialSurvey: Survey;
  onSave: (updatedSurvey: Survey) => void;
  onCancel: () => void;
}

export function SurveyBuilder({ initialSurvey, onSave, onCancel }: Props) {
  const [survey, setSurvey] = useState<Survey>(() => {
    let qs = initialSurvey.questions || [];
    if (qs.length === 0 && initialSurvey.template === "nr1_compliance") {
      qs = NR1_TOPICS.flatMap(t => t.questions);
    }
    return {
      ...initialSurvey,
      questions: qs,
      accent: initialSurvey.accent || ACCENT_COLORS[0],
      iconId: initialSurvey.iconId || "ShieldAlert"
    };
  });
  
  const [activeTab, setActiveTab] = useState<"meta" | "questions">("meta");
  const [editingQ, setEditingQ] = useState<string | null>(null);

  function updateSurvey(key: keyof Survey, value: any) { 
    setSurvey(prev => ({ ...prev, [key]: value })); 
  }
  
  function addQuestion(type: Question["type"]) {
    const newQ: Question = { 
      id: `q_${generateId()}`, type, label: "Nova Pergunta...", weight: 2,
      ...(type.includes("choice") ? { options: ["Opção 1", "Opção 2"] } : {}),
      ...(type === "scale_0_10" ? { minLabel: "Discordo", maxLabel: "Concordo" } : {})
    };
    setSurvey(prev => ({ ...prev, questions: [...(prev.questions || []), newQ] }));
    setEditingQ(newQ.id);
    setActiveTab("questions");
  }

  function updateQuestion(qId: string, updates: Partial<Question>) {
    setSurvey(prev => ({ ...prev, questions: (prev.questions || []).map(q => q.id === qId ? { ...q, ...updates } : q) }));
  }

  function deleteQuestion(qId: string) {
    setSurvey(prev => ({ ...prev, questions: (prev.questions || []).filter(q => q.id !== qId) }));
    if (editingQ === qId) setEditingQ(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-50 animate-in fade-in duration-200">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-neutral-500 hover:text-neutral-800 transition-colors p-1 cursor-pointer bg-neutral-100 rounded-md hover:bg-neutral-200"><ArrowLeft size={18}/></button>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Estúdio do Avaliador (Maker)</div>
            <h2 className="font-serif text-lg font-semibold text-neutral-900">{survey.title || "Novo Formulário"}</h2>
          </div>
        </div>
        <button onClick={() => onSave(survey)} disabled={!survey.title.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer">
          <Save size={14} /> Salvar Formulário
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Options */}
        <div className="w-80 bg-white border-r border-neutral-200 flex flex-col z-0 shadow-sm shrink-0">
          <div className="flex border-b border-neutral-100">
            <button onClick={() => setActiveTab("meta")} className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${activeTab === 'meta' ? 'text-neutral-900 border-b-2 border-neutral-900 bg-neutral-50/50' : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600'}`}>Info. Básica</button>
            <button onClick={() => setActiveTab("questions")} className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${activeTab === 'questions' ? 'text-neutral-900 border-b-2 border-neutral-900 bg-neutral-50/50' : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600'}`}>Perguntas ({(survey.questions || []).length})</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "meta" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Título do Formulário</label>
                  <input type="text" value={survey.title} onChange={e => updateSurvey("title", e.target.value)} placeholder="Ex: Avaliação Ergonômica" className="w-full border border-neutral-300 rounded-md p-2.5 text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Descrição / Objetivo</label>
                  <textarea value={survey.desc} onChange={e => updateSurvey("desc", e.target.value)} className="w-full border border-neutral-300 rounded-md p-2.5 text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-emerald-500 min-h-[100px] resize-y transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 flex items-center gap-1.5"><Palette size={12}/> Identidade Visual (Cor)</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map(c => (
                      <button key={c} onClick={() => updateSurvey("accent", c)} className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${survey.accent === c ? 'border-neutral-900 scale-110 shadow-md' : 'border-transparent hover:scale-110 shadow-sm'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addQuestion("scale_0_10")} className="bg-neutral-50 border border-neutral-200 hover:border-emerald-400 p-3 rounded-lg flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-neutral-600 uppercase transition-all cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 shadow-sm"><SlidersHorizontal size={18}/> Escala Numérica</button>
                  <button onClick={() => addQuestion("multiple_choice_single")} className="bg-neutral-50 border border-neutral-200 hover:border-emerald-400 p-3 rounded-lg flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-neutral-600 uppercase transition-all cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 shadow-sm"><List size={18}/> Única Escolha</button>
                  <button onClick={() => addQuestion("multiple_choice_multiple")} className="bg-neutral-50 border border-neutral-200 hover:border-emerald-400 p-3 rounded-lg flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-neutral-600 uppercase transition-all cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 shadow-sm"><ListOrdered size={18}/> Múltipla</button>
                  <button onClick={() => addQuestion("text")} className="bg-neutral-50 border border-neutral-200 hover:border-emerald-400 p-3 rounded-lg flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-neutral-600 uppercase transition-all cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 shadow-sm"><AlignLeft size={18}/> Texto Aberto</button>
                </div>
                <div className="border-t border-neutral-200 pt-4 space-y-2.5">
                  {(survey.questions || []).map((q, idx) => (
                    <div key={q.id} onClick={() => setEditingQ(q.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${editingQ === q.id ? 'border-emerald-500 bg-emerald-50 shadow-md transform scale-[1.02]' : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'}`}>
                      <div className="truncate pr-2 w-full">
                        <div className="text-xs font-bold text-neutral-800 truncate mb-1">{idx + 1}. {q.label}</div>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9px] text-neutral-500 uppercase tracking-widest bg-neutral-100 px-1.5 py-0.5 rounded">{q.type.replace(/_/g, ' ')}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${q.weight === 3 ? 'bg-red-100 text-red-700' : q.weight === 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            Peso {q.weight || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Question Editor */}
        <div className="flex-1 bg-[#eae8e3] p-6 md:p-10 overflow-y-auto relative">
          <div className="max-w-3xl mx-auto">
            {!editingQ ? (
              <div className="flex flex-col items-center justify-center h-full text-center mt-32 opacity-60">
                <Target size={56} className="text-neutral-400 mb-5" />
                <h3 className="text-xl font-serif font-bold text-neutral-600">Topologia da Avaliação</h3>
                <p className="text-sm text-neutral-500 max-w-sm mt-2 leading-relaxed">Selecione uma pergunta para definir seu peso estrutural no cálculo global de risco corporativo.</p>
              </div>
            ) : (
              (() => {
                const q = (survey.questions || []).find(x => x.id === editingQ);
                if (!q) return null;
                return (
                  <div className="bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between">
                      <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Edit3 size={16}/> Configuração de Parâmetro</span>
                      <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-white hover:bg-red-600 p-1.5 bg-neutral-800 rounded transition-colors cursor-pointer" title="Excluir Pergunta"><Trash2 size={16}/></button>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-8">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-2">Enunciado / Pergunta (Visível ao Colaborador)</label>
                        <input type="text" value={q.label} autoFocus onChange={e => updateQuestion(q.id, { label: e.target.value })} className="w-full border-b-2 border-neutral-200 p-2 text-xl font-serif text-neutral-900 focus:outline-none focus:border-emerald-500 bg-transparent transition-colors" />
                      </div>

                      {/* Importância / Peso (Avaliador define) - CRITICAL FOR ALGORITHM */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider"><ShieldAlert size={16}/> Peso Estrutural (Importância)</label>
                            <p className="text-[11px] text-amber-700 mt-1.5 max-w-lg leading-relaxed">Este valor define o impacto matemático desta resposta na Média Ponderada da empresa. <strong>O colaborador não visualiza este peso.</strong></p>
                          </div>
                        </div>
                        <div className="flex bg-white rounded-lg border border-amber-200 p-1 shadow-sm max-w-md">
                          {[
                            { val: 1, label: "Baixo (Peso 1)", color: "#10b981", bg: "#ecfdf5" },
                            { val: 2, label: "Médio (Peso 2)", color: "#f59e0b", bg: "#fffbeb" },
                            { val: 3, label: "Alto (Peso 3)", color: "#ef4444", bg: "#fef2f2" }
                          ].map(opt => (
                            <button
                              key={opt.val}
                              onClick={() => updateQuestion(q.id, { weight: opt.val })}
                              className="flex-1 py-2.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer"
                              style={{
                                backgroundColor: (q.weight || 1) === opt.val ? opt.color : "transparent",
                                color: (q.weight || 1) === opt.val ? "#fff" : "#666"
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {q.type.includes("choice") && (
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-3">Opções de Resposta</label>
                          <div className="space-y-3">
                            {(q.options || []).map((opt, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded bg-neutral-100 text-[11px] font-bold text-neutral-500 flex items-center justify-center shrink-0 border border-neutral-200">{String.fromCharCode(65 + i)}</span>
                                <input type="text" value={opt} onChange={e => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[i] = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }} className="flex-1 border border-neutral-300 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 shadow-sm" />
                                <button onClick={() => {
                                  const newOpts = (q.options || []).filter((_, idx) => idx !== i);
                                  updateQuestion(q.id, { options: newOpts });
                                }} className="text-neutral-400 hover:text-red-500 p-2 cursor-pointer transition-colors bg-neutral-50 hover:bg-red-50 rounded-lg"><X size={18}/></button>
                              </div>
                            ))}
                            <button onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `Nova Opção ${(q.options || []).length + 1}`] })} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 mt-3 inline-flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-3 py-2 rounded-md transition-colors"><Plus size={14}/> Adicionar Opção</button>
                          </div>
                        </div>
                      )}

                      {q.type === "scale_0_10" && (
                        <div className="grid grid-cols-2 gap-5">
                          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-2">Rótulo Mínimo (Nota 0)</label>
                            <input type="text" value={q.minLabel || ""} onChange={e => updateQuestion(q.id, { minLabel: e.target.value })} placeholder="Ex: Excelente" className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                          </div>
                          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-2">Rótulo Máximo (Nota 10)</label>
                            <input type="text" value={q.maxLabel || ""} onChange={e => updateQuestion(q.id, { maxLabel: e.target.value })} placeholder="Ex: Risco Alto" className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
