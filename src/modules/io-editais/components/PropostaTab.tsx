"use client";

import React, { useState, useEffect } from "react";
import { CircleDollarSign } from "lucide-react";
import { useCurrentWorkspace, useCurrentDashboard, useWorkspaceActions } from "@/lib/stores";
import { SmartOverviewCards } from "./SmartOverviewCards";

export function PropostaTab({ activeEdital }: { activeEdital: any }) {
  const workspace = useCurrentWorkspace();
  const dashboard = useCurrentDashboard();
  const actions = useWorkspaceActions();

  const [itens, setItens] = useState([
    { id:1, desc:"Novo Item", qtd:1, custo:0, margem:15, frete:0 },
  ]);
  const [garantia, setGarantia] = useState(5);

  useEffect(() => {
    if (!dashboard?.notes) return;
    const note = dashboard.notes.find(n => n.type === "edital_proposta" && n.title === activeEdital._id);
    if (note && note.content) {
      try { 
        const data = JSON.parse(note.content);
        if (data.itens) setItens(data.itens);
        if (data.garantia !== undefined) setGarantia(data.garantia);
      } catch(e) {}
    }
  }, [dashboard?.notes, activeEdital._id]);

  const saveProposta = (newItens: any[], newGarantia: number) => {
    if (!workspace || !dashboard) return;
    const note = dashboard.notes?.find(n => n.type === "edital_proposta" && n.title === activeEdital._id);
    const content = JSON.stringify({ itens: newItens, garantia: newGarantia });
    if (note) {
      actions.updateNoteInDashboard(workspace.id, dashboard.id, note.id, { content });
    } else {
      actions.addNoteToDashboard(workspace.id, dashboard.id, {
        id: crypto.randomUUID(),
        title: activeEdital._id,
        type: "edital_proposta",
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const next = itens.map((x,i) => i === idx ? {...x, [field]: val} : x);
    setItens(next);
    saveProposta(next, garantia);
  };

  const addItem = () => {
    const next = [...itens, { id: Date.now(), desc:"Novo Item", qtd:1, custo:0, margem:15, frete:0 }];
    setItens(next);
    saveProposta(next, garantia);
  };

  const calcPreco = (item:any) => {
    const base = item.custo + item.frete;
    return base / (1 - item.margem/100);
  };
  
  const totalProposta = itens.reduce((acc,it) => acc + calcPreco(it) * it.qtd, 0);
  const totalCusto = itens.reduce((acc,it) => acc + (it.custo + it.frete) * it.qtd, 0);
  const lucro = totalProposta - totalCusto;
  const custoGarantia = totalProposta * (garantia/100);
  const lucroLiquido = lucro - custoGarantia;
  
  const fmt = (v:number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* INJEÇÃO DA IA */}
      {activeEdital.analysis?.proposta && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <CircleDollarSign className="text-emerald-600" size={20} /> Custos e Dicas da IA
          </h3>
          <SmartOverviewCards content={activeEdital.analysis.proposta} />
        </div>
      )}

      {/* CALCULADORA RESTAURADA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <CircleDollarSign size={20} className="text-blue-600" />
            Calculadora de Formação de Preço
          </h3>
          <button onClick={addItem} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
            + Adicionar Item
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Qtd</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Custo unit.</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Frete unit.</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Margem</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Preço proposta</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itens.map((it, idx) => (
                <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <input 
                      type="text" 
                      value={it.desc} 
                      onChange={e => updateItem(idx, 'desc', e.target.value)} 
                      className="w-full min-w-[150px] px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <input 
                      type="number" 
                      value={it.qtd} 
                      min={1} 
                      onChange={e => updateItem(idx, 'qtd', +e.target.value)} 
                      className="w-16 text-right px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <input 
                      type="number" 
                      value={it.custo} 
                      min={0} 
                      onChange={e => updateItem(idx, 'custo', +e.target.value)} 
                      className="w-24 text-right px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <input 
                      type="number" 
                      value={it.frete} 
                      min={0} 
                      onChange={e => updateItem(idx, 'frete', +e.target.value)} 
                      className="w-20 text-right px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 justify-end">
                      <input 
                        type="range" 
                        min={5} max={60} 
                        value={it.margem} 
                        onChange={e => updateItem(idx, 'margem', +e.target.value)} 
                        className="w-20 accent-blue-600"
                      />
                      <span className="text-sm font-medium w-8">{it.margem}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">
                    {fmt(calcPreco(it))}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-700">
                    {fmt(calcPreco(it) * it.qtd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <div className="text-sm text-slate-500 mb-1">Custo Total (Custo + Frete)</div>
            <div className="text-xl font-bold text-slate-800">{fmt(totalCusto)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1 flex items-center justify-between">
              Custo de Garantia 
              <input type="number" value={garantia} onChange={e=>{setGarantia(+e.target.value); saveProposta(itens, +e.target.value)}} className="w-12 px-1 text-right border border-slate-200 rounded" /> %
            </div>
            <div className="text-xl font-bold text-amber-600">{fmt(custoGarantia)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">Lucro Líquido Projetado</div>
            <div className="text-xl font-bold text-emerald-600">{fmt(lucroLiquido)}</div>
            <div className="text-xs text-emerald-600/80 mt-0.5">{(lucroLiquido/totalProposta*100 || 0).toFixed(1)}% do total</div>
          </div>
          <div className="pl-4 md:border-l border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Valor Total da Proposta</div>
            <div className="text-3xl font-black text-blue-700">{fmt(totalProposta)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
