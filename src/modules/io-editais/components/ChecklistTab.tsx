"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, AlertTriangle, ListChecks, Clock, LayoutGrid, List } from "lucide-react";
import { useCurrentWorkspace, useCurrentDashboard, useWorkspaceActions } from "@/lib/stores";
import { useToast } from "@/lib/state/toast-context";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { cn } from "@/lib/utils";

type TaskStatus = 'todo' | 'doing' | 'done';

const COLUMNS = [
  { id: 'todo', label: 'ioEditais.checklist.columns.todo', color: 'bg-slate-100 text-slate-600 border-slate-200/60', icon: Circle },
  { id: 'doing', label: 'ioEditais.checklist.columns.doing', color: 'bg-amber-100/80 text-amber-700 border-amber-200/40', icon: Clock },
  { id: 'done', label: 'ioEditais.checklist.columns.done', color: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/40', icon: CheckCircle2 },
];

export function ChecklistTab({ activeEdital }: { activeEdital: any }) {
  const workspace = useCurrentWorkspace();
  const dashboard = useCurrentDashboard();
  const actions = useWorkspaceActions();
  const { push } = useToast();
  const { t } = useTranslation();

  const ITEMS = [
    { key:"leitura_tr", label: t("ioEditais.checklist.items.leitura"), grupo: t("ioEditais.checklist.groups.preliminar"), desc: t("ioEditais.checklist.desc.leitura") },
    { key:"viabilidade", label: t("ioEditais.checklist.items.viabilidade"), grupo: t("ioEditais.checklist.groups.preliminar"), desc: t("ioEditais.checklist.desc.viabilidade") },
    { key:"documentacao", label: t("ioEditais.checklist.items.documentacao"), grupo: t("ioEditais.checklist.groups.preparacao"), desc: t("ioEditais.checklist.desc.documentacao") },
    { key:"proposta", label: t("ioEditais.checklist.items.proposta"), grupo: t("ioEditais.checklist.groups.preparacao"), desc: t("ioEditais.checklist.desc.proposta") },
    { key:"sessao", label: t("ioEditais.checklist.items.sessao"), grupo: t("ioEditais.checklist.groups.execucao"), desc: t("ioEditais.checklist.desc.sessao") },
  ];

  const [dynamicItems, setDynamicItems] = useState<{key:string, label:string, grupo:string, desc:string}[]>([]);
  const [checks, setChecks] = useState<Record<string, TaskStatus>>({});
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Load checklist from DB and extract from AI
  useEffect(() => {
    // 1. Extrair itens da IA se houver
    const aiItems: {key:string, label:string, grupo:string, desc:string}[] = [];
    if (activeEdital.analysis?.checklist) {
      let text = activeEdital.analysis.checklist;
      
      // Clean possible JSON wrapping (from bad parses)
      if (text.startsWith('```json')) {
        try {
          const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
          text = parsed.checklist || text;
        } catch(e) {}
      }

      const lines = text.split('\n');
      let currentGroup = "Específicos do Edital";
      
      lines.forEach((line: string, i: number) => {
        let l = line.trim();
        if (!l) return;
        
        const headingMatch = l.match(/^#+\s+(.*)/);
        const boldMatch = l.match(/^\*\*([^*]+)\*\*$/);
        
        if (headingMatch) {
          currentGroup = headingMatch[1].trim();
          return;
        } else if (boldMatch) {
          currentGroup = boldMatch[1].trim();
          return;
        }

        if (l.startsWith('-') || l.startsWith('*')) {
          let clean = l.substring(1).trim();
          
          // Limpa negritos
          clean = clean.replace(/\*\*/g, '').trim();
          
          // Remove citações brutas geradas pela IA (ex: 【4:17†guarda565.pdf】)
          clean = clean.replace(/【.*?】/g, '');
          
          // Remove links markdown que possam ter sido injetados pelo backend
          clean = clean.replace(/\[.*?\]\(.*?\)/g, '');
          
          let parts = clean.split(/:(.+)/);
          let label = parts[0].trim() || "Exigência Específica";
          let desc = (parts[1] || "").trim();

          if (label.length > 65) label = label.substring(0, 65) + "...";
          
          aiItems.push({
            key: `ai_${i}`,
            label: label,
            grupo: `IA: ${currentGroup}`,
            desc: desc
          });
        }
      });
      setDynamicItems(aiItems);
    }

    // 2. Carregar estado salvo
    if (!dashboard?.notes) return;
    const note = dashboard.notes.find(n => n.type === "edital_checklist" && n.title === activeEdital._id);
    if (note && note.content) {
      try { 
        const parsed = JSON.parse(note.content);
        const upgraded: Record<string, TaskStatus> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'boolean') {
            upgraded[k] = v ? 'done' : 'todo';
          } else {
            upgraded[k] = v as TaskStatus;
          }
        }
        setChecks(upgraded);
      } catch(e) {}
    }
  }, [dashboard?.notes, activeEdital._id, activeEdital.analysis?.checklist]);

  const allItems = [...ITEMS, ...dynamicItems];
  const grupos = Array.from(new Set(allItems.map(i => i.grupo)));

  const saveChecks = (newChecks: Record<string, TaskStatus>) => {
    if (!workspace || !dashboard) return;
    const note = dashboard.notes?.find(n => n.type === "edital_checklist" && n.title === activeEdital._id);
    const contentStr = JSON.stringify(newChecks);
    if (note) {
      actions.updateNoteInDashboard(workspace.id, dashboard.id, note.id, { content: contentStr });
    } else {
      actions.addNoteToDashboard(workspace.id, dashboard.id, {
        id: crypto.randomUUID(),
        title: activeEdital._id,
        type: "edital_checklist",
        content: contentStr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleUpdateStatus = (k: string, newStatus: TaskStatus) => {
    const next = {...checks, [k]: newStatus};
    setChecks(next);
    saveChecks(next);
  };

  const toggle = (k: string) => {
    const current = checks[k] || 'todo';
    const nextStatus = current === 'done' ? 'todo' : 'done';
    handleUpdateStatus(k, nextStatus);
  };

  const total = allItems.length;
  const done = Object.values(checks).filter(v => v === 'done').length;
  const pct = total === 0 ? 0 : Math.round((done/total)*100) || 0;

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      
      {/* HEADER E TOGGLE DE VISÃO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
            <ListChecks className="text-blue-600" />
            {t("ioEditais.checklist.title")}
          </h2>
          <p className="text-sm text-blue-700 leading-relaxed max-w-3xl">
            {t("ioEditais.checklist.subtitle")}
          </p>
        </div>
        
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              viewMode === 'list' ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List size={16} />
            {t("ioEditais.checklist.views.list")}
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              viewMode === 'kanban' ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid size={16} />
            {t("ioEditais.checklist.views.kanban")}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[500px]">
        <div className="flex-1">
          {viewMode === 'list' ? (
            /* LIST VIEW */
            <div className="space-y-6">
              {grupos.map(g => {
                const its = allItems.filter(i => i.grupo === g);
                if (its.length === 0) return null;
                return (
                  <div key={g} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-blue-800 mb-4 text-sm uppercase tracking-wider">{g}</h3>
                    <div className="space-y-3">
                      {its.map(item => {
                        const status = checks[item.key] || 'todo';
                        return (
                          <div 
                            key={item.key} 
                            onClick={() => toggle(item.key)} 
                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                              status === 'done' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {status === 'done' ? (
                                <CheckCircle2 size={18} className="text-emerald-600" />
                              ) : (
                                <Circle size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className={`text-sm font-medium ${status === 'done' ? 'text-emerald-800' : 'text-slate-700'}`}>
                                {item.label}
                              </div>
                              {item.desc && item.desc !== item.label && (
                                <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* KANBAN VIEW */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {COLUMNS.map(column => {
                const Icon = column.icon;
                const columnItems = allItems.filter(i => (checks[i.key] || 'todo') === column.id);
                
                return (
                  <div 
                    key={column.id} 
                    className={cn(
                      "flex flex-col gap-4 bg-slate-50/50 rounded-3xl p-4 border transition-all h-full",
                      column.color.split(' ')[2]
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e: any) => {
                      e.preventDefault();
                      const key = e.dataTransfer.getData("text/plain") || (window as any).__draggedTaskId__;
                      if (key) handleUpdateStatus(key, column.id as TaskStatus);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("p-1.5 rounded-xl", column.color.split(' ')[0], column.color.split(' ')[1])}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className={cn("font-bold", column.color.split(' ')[1])}>
                        {t(column.label)}
                      </h3>
                      <span className="ml-auto text-xs font-bold text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">
                        {columnItems.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-10">
                      {columnItems.map(item => (
                        <div
                          key={item.key}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", item.key);
                            (window as any).__draggedTaskId__ = item.key;
                          }}
                          className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                        >
                          <div className="text-xs font-semibold text-blue-600 mb-2 truncate">
                            {item.grupo}
                          </div>
                          <div className="text-sm font-medium text-slate-800 leading-snug">
                            {item.label}
                          </div>
                          {item.desc && item.desc !== item.label && (
                            <div className="text-xs text-slate-500 mt-2 line-clamp-3">
                              {item.desc}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* SIDEBAR DE PROGRESSO */}
        <div className="w-full md:w-72 shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="font-semibold text-slate-800 mb-2">{t("ioEditais.checklist.progress")}</h3>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-4xl font-bold tracking-tight ${pct === 100 ? 'text-emerald-600' : pct > 60 ? 'text-amber-600' : 'text-slate-800'}`}>
                {pct}%
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {t("ioEditais.checklist.itemsVerified").replace("{done}", done.toString()).replace("{total}", total.toString())}
            </p>
            
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div 
                className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }} 
              />
            </div>

            {pct < 100 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  {t("ioEditais.checklist.goldenRule")}
                </h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t("ioEditais.checklist.goldenRuleText")}
                </p>
              </div>
            )}

            {pct === 100 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  {t("ioEditais.checklist.complete")}
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {t("ioEditais.checklist.completeText")}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
