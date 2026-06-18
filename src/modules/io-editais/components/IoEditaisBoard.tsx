// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  UploadCloud, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Circle,
  LayoutGrid, 
  Eye, 
  ChevronRight,
  ListChecks,
  CircleDollarSign,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  BellRing,
  TrendingUp,
  Clock,
  Trash2,
  Send,
  MessageSquare,
  Sparkles,
  Bot
} from "lucide-react";
import { useCurrentWorkspace, useCurrentDashboard, useWorkspaceActions } from "@/lib/stores";
import { useToast } from "@/lib/state/toast-context";
import * as pdfjsLib from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';

// Configurar o worker do PDF.js via CDN (jsdelivr é permitido pelo CSP)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// ─── Componentes de Abas do Edital ──────────────────────────────────────────────────────────

function ChecklistTab({ activeEdital }: { activeEdital: string }) {
  const workspace = useCurrentWorkspace();
  const dashboard = useCurrentDashboard();
  const content = useContent();
  const { push } = useToast();

  const ITEMS = [
    { key:"objeto", label:"Entendi completamente o objeto", grupo:"Análise inicial", desc:"O que será comprado? Minha empresa atende?" },
    { key:"especTecnica", label:"Atendo todas as especificações técnicas", grupo:"Análise inicial", desc:"Características, quantidades, normas, certificações" },
    { key:"tr", label:"Li integralmente o Termo de Referência", grupo:"Análise inicial", desc:"Escopo, execução, critérios de aceitação, obrigações" },
    { key:"dadosOp", label:"Registrei todos os dados operacionais", grupo:"Análise inicial", desc:"Plataforma, número do processo, data e horário da sessão" },
    { key:"estrutura", label:"Entendi a estrutura da contratação", grupo:"Análise inicial", desc:"Compra imediata ou ARP? Impacto no preço e estoque" },
    { key:"disputa", label:"Verifiquei se disputa é por item ou lote", grupo:"Análise inicial", desc:"Um item ruim em lote pode comprometer tudo" },
    { key:"habilitacao", label:"Possuo toda a documentação de habilitação", grupo:"Habilitação", desc:"Contrato social, regularidade fiscal, trabalhista, etc." },
    { key:"docsEspecificos", label:"Possuo documentos específicos exigidos", grupo:"Habilitação", desc:"Catálogos, fichas técnicas, licenças, declarações" },
    { key:"qualTecnica", label:"Atendo os requisitos de qualificação técnica", grupo:"Habilitação", desc:"Atestados, experiência anterior, certificações" },
    { key:"prazos", label:"Consigo cumprir todos os prazos", grupo:"Execução", desc:"Proposta, entrega, execução, amostras, correções" },
    { key:"amostras", label:"Amostras verificadas (se exigidas)", grupo:"Execução", desc:"Prazo, quantidade, local, critérios de avaliação" },
    { key:"localEntrega", label:"Conheço os locais de entrega", grupo:"Execução", desc:"Município, distância, frete incluído no preço?" },
    { key:"viabilidade", label:"A operação é lucrativa", grupo:"Financeiro", desc:"Custos, impostos, frete, garantias, administrativo" },
    { key:"precoRef", label:"Analisei o preço de referência", grupo:"Financeiro", desc:"Valor estimado compatível com meus custos?" },
    { key:"pagamento", label:"Consigo suportar o prazo de pagamento", grupo:"Financeiro", desc:"Fluxo de caixa considerado na formação do preço" },
    { key:"penalidades", label:"Compreendo as penalidades do contrato", grupo:"Riscos", desc:"Multas, suspensões, rescisão contratual" },
  ];

  const [dynamicItems, setDynamicItems] = useState<{key:string, label:string, grupo:string, desc:string}[]>([]);

  useEffect(() => {
    const overviewTile = dashboard?.tiles?.find(
      t => t.metadata?.fileName === activeEdital && (t.title.includes("Visão Geral") || t.metadata?.source === "io_editais_upload")
    );
    if (overviewTile?.content) {
      const parts = overviewTile.content.split("[CHECKLIST_EXTRA]");
      if (parts.length > 1) {
        const extraText = parts[1].split("[")[0];
        const lines = extraText.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
        const items = lines.map((l, i) => {
          const text = l.replace(/^[-*]+/, '').trim().replace(/\*\*/g, '');
          const label = text.split(':')[0] || text.substring(0, 60);
          return {
            key: `extra_${i}`,
            label: label,
            grupo: "Específicos do Edital (IA)",
            desc: text
          };
        });
        setDynamicItems(items);
      }
    }
  }, [dashboard?.tiles, activeEdital]);

  const allItems = [...ITEMS, ...dynamicItems];
  const grupos = [...new Set(allItems.map(i=>i.grupo))];
  const [checks, setChecks] = useState<Record<string,boolean>>({});

  // Carregar checklist salvo do dashboard.notes
  useEffect(() => {
    if (!dashboard?.notes) return;
    const note = dashboard.notes.find(n => n.category === "edital_checklist" && n.title === activeEdital);
    if (note && note.content) {
      try { setChecks(JSON.parse(note.content)); } catch(e) {}
    }
  }, [dashboard?.notes, activeEdital]);

  const saveChecks = (newChecks: Record<string,boolean>) => {
    if (!workspace || !dashboard) return;
    const note = dashboard.notes?.find(n => n.category === "edital_checklist" && n.title === activeEdital);
    if (note) {
      content.updateNote(note.id, { content: JSON.stringify(newChecks) });
    } else {
      content.createNote(dashboard.id, {
        title: activeEdital,
        category: "edital_checklist",
        content: JSON.stringify(newChecks)
      });
    }
    push({ title: "Salvo automaticamente", description: "Progresso atualizado no servidor.", variant: "default" });
  };

  const toggle = (k:string) => {
    const next = {...checks, [k]: !checks[k]};
    setChecks(next);
    saveChecks(next);
  };

  const total = allItems.length;
  const done = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((done/total)*100) || 0;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-6">
        {grupos.map(g => {
          const its = allItems.filter(i => i.grupo === g);
          return (
            <div key={g} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-blue-800 mb-4 text-sm uppercase tracking-wider">{g}</h3>
              <div className="space-y-3">
                {its.map(item => (
                  <div 
                    key={item.key} 
                    onClick={() => toggle(item.key)} 
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                      checks[item.key] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {checks[item.key] ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <Circle size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${checks[item.key] ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="w-full md:w-72 shrink-0 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6">
          <h3 className="font-semibold text-slate-800 mb-2">Progresso do Checklist</h3>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-4xl font-bold tracking-tight ${pct === 100 ? 'text-emerald-600' : pct > 60 ? 'text-amber-600' : 'text-slate-800'}`}>
              {pct}%
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-4">{done} de {total} itens verificados</p>
          
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
                Regra de Ouro
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                O objetivo da análise não é descobrir <em>como</em> participar — é descobrir <em>se vale a pena</em> participar.
              </p>
            </div>
          )}

          {pct === 100 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Checklist Completo
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Edital totalmente analisado. Você pode enviar a proposta com segurança.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PropostaTab({ activeEdital }: { activeEdital: string }) {
  const workspace = useCurrentWorkspace();
  const dashboard = useCurrentDashboard();
  const actions = useWorkspaceActions();
  const { push } = useToast();

  const [itens, setItens] = useState([
    { id:1, desc:"Novo Item", qtd:1, custo:0, margem:15, frete:0 },
  ]);
  const [garantia, setGarantia] = useState(5);

  useEffect(() => {
    if (!dashboard?.notes) return;
    const note = dashboard.notes.find(n => n.type === "edital_proposta" && n.title === activeEdital);
    if (note && note.content) {
      try { 
        const data = JSON.parse(note.content);
        if (data.itens) setItens(data.itens);
        if (data.garantia !== undefined) setGarantia(data.garantia);
      } catch(e) {}
    }
  }, [dashboard?.notes, activeEdital]);

  const saveProposta = (newItens: any[], newGarantia: number) => {
    if (!workspace || !dashboard) return;
    const note = dashboard.notes?.find(n => n.type === "edital_proposta" && n.title === activeEdital);
    const content = JSON.stringify({ itens: newItens, garantia: newGarantia });
    if (note) {
      actions.updateNoteInDashboard(workspace.id, dashboard.id, note.id, { content });
    } else {
      actions.addNoteToDashboard(workspace.id, dashboard.id, {
        id: crypto.randomUUID(),
        title: activeEdital,
        type: "edital_proposta",
        content,
        createdAt: new Date().toISOString()
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
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <CircleDollarSign size={20} className="text-blue-600" />
            Composição de Preço (Calculadora)
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
                      <span className="text-sm font-medium text-slate-700 min-w-[2.5rem] text-right">{it.margem}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-slate-700">{fmt(calcPreco(it))}</td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-blue-700">{fmt(calcPreco(it) * it.qtd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-full md:w-96 ml-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Resumo Financeiro</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Garantia:</span>
            <input 
              type="number" 
              value={garantia} 
              min={0} max={20}
              onChange={e => {
                const val = +e.target.value;
                setGarantia(val);
                saveProposta(itens, val);
              }} 
              className="w-14 text-right px-1.5 py-1 border border-slate-200 rounded-md text-xs outline-none"
            />
            <span className="text-xs text-slate-500">%</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-500">Total da proposta</span>
            <span className="text-sm font-bold text-slate-800">{fmt(totalProposta)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-500">Custo total (com frete)</span>
            <span className="text-sm font-medium text-slate-600">{fmt(totalCusto)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3">
            <span className="text-sm text-slate-500">Lucro bruto</span>
            <span className="text-sm font-bold text-emerald-600">{fmt(lucro)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-500">
              Custo de Garantia ({garantia}%)
            </span>
            <span className="text-sm font-medium text-amber-600">-{fmt(custoGarantia)}</span>
          </div>
          <div className="flex justify-between items-center py-3 mt-3 border-t-2 border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Lucro líquido estimado</span>
            <span className={`text-lg font-black ${lucroLiquido > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmt(lucroLiquido)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente de Visão Geral Smart (Cards) ────────────────────────────────────────────────
function SmartOverviewCards({ content }: { content: string }) {
  const extract = (tag: string, nextTags: string[]) => {
    const start = content.indexOf(`[${tag}]`);
    if (start === -1) return "";
    let end = content.length;
    for (const next of nextTags) {
      const nextIdx = content.indexOf(`[${next}]`, start);
      if (nextIdx !== -1 && nextIdx < end) end = nextIdx;
    }
    return content.substring(start + `[${tag}]`.length, end).trim();
  };

  const tags = ["RESUMO", "PRAZOS", "EXIGENCIAS", "RISCOS"];
  const resumo = extract("RESUMO", ["PRAZOS", "EXIGENCIAS", "RISCOS"]);
  const prazos = extract("PRAZOS", ["EXIGENCIAS", "RISCOS"]);
  const exigencias = extract("EXIGENCIAS", ["RISCOS"]);
  const riscos = extract("RISCOS", []);

  // Pre-processamento para citações: Transforma {{Pág 3, Art 4}} em `cite:Pág 3, Art 4`
  const processCitations = (text: string) => {
    if (!text) return "";
    return text.replace(/\{\{([^}]+)\}\}/g, '`cite:$1`');
  };

  const MarkdownComponents = {
    code({node, inline, className, children, ...props}: any) {
      const match = /cite:(.*)/.exec(String(children));
      if (match) {
        return (
          <span 
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-600 text-[10px] font-bold border border-slate-300/50 ml-1 cursor-help hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 transition-colors" 
            title={`Fonte da informação original: ${match[1]}`}
          >
            <FileText size={10} /> {match[1]}
          </span>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    }
  };

  // Se a IA ainda não produziu as tags, ou falhou em seguir o formato, fazemos fallback
  if (!resumo && !prazos && !exigencias && !riscos && content.length > 0) {
    return (
      <div className="prose prose-slate max-w-none bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <ReactMarkdown components={MarkdownComponents}>{processCitations(content)}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className={`bg-blue-50/50 border border-blue-200 rounded-2xl p-6 shadow-sm transition-all duration-500 ${!resumo ? 'opacity-50' : 'opacity-100'}`}>
        <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
           <FileText size={18} /> Resumo do Edital
        </h4>
        <div className="prose prose-sm prose-blue max-w-none text-slate-700">
          <ReactMarkdown components={MarkdownComponents}>{processCitations(resumo) || "*Analisando resumo...*"}</ReactMarkdown>
        </div>
      </div>

      <div className={`bg-amber-50/50 border border-amber-200 rounded-2xl p-6 shadow-sm transition-all duration-500 ${!prazos ? 'opacity-50' : 'opacity-100'}`}>
        <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
           <CalendarDays size={18} /> Prazos e Datas
        </h4>
        <div className="prose prose-sm prose-amber max-w-none text-slate-700">
          <ReactMarkdown components={MarkdownComponents}>{processCitations(prazos) || "*Lendo cronograma...*"}</ReactMarkdown>
        </div>
      </div>

      <div className={`bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 shadow-sm transition-all duration-500 ${!exigencias ? 'opacity-50' : 'opacity-100'}`}>
        <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
           <ListChecks size={18} /> Exigências e Habilitação
        </h4>
        <div className="prose prose-sm prose-emerald max-w-none text-slate-700">
          <ReactMarkdown components={MarkdownComponents}>{processCitations(exigencias) || "*Verificando habilitações...*"}</ReactMarkdown>
        </div>
      </div>

      <div className={`bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm transition-all duration-500 ${!riscos ? 'opacity-50' : 'opacity-100'}`}>
        <h4 className="font-bold text-red-800 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
           <AlertTriangle size={18} /> Riscos e Penalidades
        </h4>
        <div className="prose prose-sm prose-red max-w-none text-slate-700">
          <ReactMarkdown components={MarkdownComponents}>{processCitations(riscos) || "*Procurando armadilhas...*"}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ─── Componente de Chat & Análises (Premium) ────────────────────────────────────────────────
function EditalChatTab({ activeEdital }: { activeEdital: string }) {
  const workspace = useCurrentWorkspace();
  const dashboard = useCurrentDashboard();
  const content = useContent();
  const { push } = useToast();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Buscar o chat tile deste edital. Se não existir, criaremos no primeiro envio.
  const chatTile = dashboard?.tiles?.find(
    t => t.metadata?.fileName === activeEdital && t.metadata?.source === "io_editais_chat"
  );

  const [localHistory, setLocalHistory] = useState<any[]>(chatTile?.history || []);

  useEffect(() => {
    if (chatTile?.history && !isTyping) {
      setLocalHistory(chatTile.history);
    }
  }, [chatTile?.history, isTyping]);

  // Buscar o texto cru do edital (contexto da IA)
  const rawNote = dashboard?.notes?.find(
    n => n.title === activeEdital && (n as any).type === "raw_pdf"
  );

  // Buscar a URL do PDF gerada no upload
  const pdfUrl = rawNote?.metadata?.pdfUrl || dashboard?.tiles?.find(
    t => t.metadata?.fileName === activeEdital && t.metadata?.pdfUrl
  )?.metadata?.pdfUrl;

  const processCitations = (text: string) => {
    if (!text) return "";
    return text.replace(/\{\{([^}]+)\}\}/g, '`cite:$1`');
  };

  const MarkdownComponents = {
    code({node, inline, className, children, ...props}: any) {
      const match = /cite:(.*)/.exec(String(children));
      if (match) {
        const citation = match[1];
        let hoverContext = "Página não encontrada no extrato.";
        
        // Extrair o número da página
        const pageMatch = citation.match(/Pág\w*\s+(\d+)/i);
        if (pageMatch && pageMatch[1] && rawNote?.content) {
          const pageNum = pageMatch[1];
          const pageMarker = `--- PÁGINA ${pageNum} ---`;
          const parts = rawNote.content.split(pageMarker);
          if (parts.length > 1) {
            const nextPart = parts[1].split('--- PÁGINA')[0];
            hoverContext = nextPart.substring(0, 300).trim() + "...";
          }
        }

        return (
          <div className="group relative inline-block ml-1">
            <span 
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 cursor-help hover:bg-blue-200 transition-colors"
            >
              <FileText size={10} /> {citation}
            </span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-800 text-slate-100 text-xs rounded-xl p-3 shadow-xl z-50 pointer-events-none">
              <div className="font-bold text-blue-300 mb-1 border-b border-slate-700 pb-1">Trecho da Página {pageMatch?.[1] || "?"}:</div>
              <div className="leading-relaxed whitespace-pre-wrap">{hoverContext}</div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
            </div>
          </div>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    }
  };

  const handleSend = async (message: string) => {
    if (!message.trim() || !workspace || !dashboard || isTyping) return;
    
    setInput("");
    setIsTyping(true);

    let currentTileId = chatTile?.id || crypto.randomUUID();
    let newHistory = [...localHistory, { role: "user", content: message }];
    setLocalHistory(newHistory);

    // Preparar o contexto para a API
    const contextText = rawNote?.content 
      ? `CONTEXTO DO EDITAL:\n${rawNote.content.substring(0, 30000)}` 
      : "Aviso: Texto do edital não encontrado na memória.";

    const systemPrompt = `Você é um Especialista de Licitações Sênior ajudando o usuário a entender este edital.
Responda sempre em Markdown claro e objetivo.
EXTREMAMENTE IMPORTANTE: Para TODA informação factual, data, prazo, exigência ou valor que você extrair do contexto, você DEVE obrigatoriamente incluir a fonte no formato exato: {{Pág X, Art Y}}.
Exemplo: "A garantia é de 5% {{Pág 12, Item 4.2}}".

${contextText}`;

    try {
      const response = await fetch("/api/generate/tile-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${systemPrompt}\n\nUsuário: ${message}`,
          title: "Chat Resposta",
          model: "gpt-4o",
          maxTokens: 1500,
        }),
      });

      if (!response.ok) throw new Error("API stream error");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      let done = false;

      // Adiciona o placeholder do assistente na UI local
      setLocalHistory(prev => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setLocalHistory(prev => {
                    const next = [...prev];
                    next[next.length - 1].content = accumulated;
                    return next;
                  });
                }
                if (parsed.done) done = true;
              } catch {}
            }
          }
        }
      }

      // Agora sim salvar no MongoDB através da API updateTile
      const finalHistory = [...newHistory, { role: "assistant", content: accumulated }];
      content.updateTile(currentTileId, {
        title: `Chat - ${activeEdital.substring(0, 30)}`,
        model: "gpt-4o",
        history: finalHistory,
        metadata: { fileName: activeEdital, source: "io_editais_chat" }
      });

    } catch(err) {
      console.error("[ChatIA] Erro:", err);
      push({ title: "Erro na IA", description: "Falha ao processar resposta.", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "Quais as certidões exigidas para habilitação?",
    "Quais os motivos para desclassificação?",
    "Crie uma tabela com os itens e quantidades.",
    "Qual o prazo de validade da proposta?"
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
      
      {/* Coluna Esquerda: CHAT PRINCIPAL */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        
        {/* Cabeçalho do Chat */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Especialista IA</h3>
              <p className="text-xs text-slate-500">Tire dúvidas sobre o edital</p>
            </div>
          </div>
          <Sparkles size={20} className="text-blue-400" />
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {localHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <MessageSquare size={48} className="text-slate-200 mb-4" />
              <h4 className="text-lg font-bold text-slate-700">Como posso ajudar?</h4>
              <p className="text-sm text-slate-500 mt-2 mb-6">A inteligência artificial já leu as principais páginas do edital e está pronta para responder suas dúvidas.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(q)}
                    className="text-xs font-medium bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            localHistory.map((msg: any, i: number) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm prose prose-sm max-w-none'
                }`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    msg.content === "" && isTyping ? (
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                    ) : (
                      <ReactMarkdown components={MarkdownComponents}>{processCitations(msg.content)}</ReactMarkdown>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Campo de Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') handleSend(input); }}
              placeholder="Pergunte algo sobre o edital (ex: Quais as penalidades?)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              disabled={isTyping}
            />
            <button 
              onClick={() => handleSend(input)}
              disabled={isTyping || !input.trim()}
              className="absolute right-2 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Coluna Direita: PAINEL DE INSIGHTS / REFERÊNCIA */}
      <div className="w-full lg:w-[450px] shrink-0 space-y-6 hidden lg:block overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm shrink-0">
            <FileText size={16} className="text-blue-600" />
            Documento Ativo
          </h3>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 shrink-0">
            <p className="text-sm font-semibold text-slate-700 line-clamp-2" title={activeEdital}>{activeEdital}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              A IA já leu este documento e insere as páginas exatas como fontes nas respostas (tags azuis).
            </p>
          </div>

          {pdfUrl ? (
            <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 min-h-[400px]">
              <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400 p-6 text-center">
              <AlertTriangle size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">Visualização não disponível</p>
              <p className="text-xs mt-1">O PDF original não foi enviado para o Cloudinary (possivelmente enviado antes da atualização).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal (Fluxo Mestre/Detalhe) ───────────────────────────

export function IoEditaisBoard() {
  const workspace = useCurrentWorkspace();
  const dashboard = useCurrentDashboard();
  const actions = useWorkspaceActions();
  const { push } = useToast();

  const [activeEdital, setActiveEdital] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resumo");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reconstruindo a listagem de arquivos processados que existia antes, agora rastreando os ERROS.
  const editais = useMemo(() => {
    if (!dashboard?.tiles) return [];
    const map = new Map<string, { fileName: string, total: number, completed: number, error: number }>();
    dashboard.tiles.forEach(t => {
      const fn = t.metadata?.fileName;
      if (!fn) return; // Ignore tiles sem fileName
      if (!map.has(fn)) map.set(fn, { fileName: fn, total: 0, completed: 0, error: 0 });
      const e = map.get(fn)!;
      e.total++;
      if (t.status === 'completed') e.completed++;
      if (t.status === 'error') e.error++;
    });
    return Array.from(map.values());
  }, [dashboard?.tiles]);

  const handleDeleteEdital = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspace || !dashboard) return;
    
    if (!confirm(`Tem certeza que deseja apagar o edital "${fileName}" e excluir TODAS as suas notas, análises e dados persistidos?`)) {
      return;
    }

    const tilesToDelete = dashboard.tiles?.filter(t => t.metadata?.fileName === fileName) || [];
    const notesToDelete = dashboard.notes?.filter(n => n.title === fileName) || [];

    tilesToDelete.forEach(t => actions.removeTileFromDashboard(workspace.id, dashboard.id, t.id));
    notesToDelete.forEach(n => actions.removeNoteFromDashboard(workspace.id, dashboard.id, n.id));
    
    if (activeEdital === fileName) {
      setActiveEdital(null);
    }

    push({ title: "Edital removido", description: `${fileName} foi apagado do banco de dados.`, variant: "default" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace || !dashboard) return;
    
    if (file.type !== "application/pdf") {
      push({ title: "Erro", description: "Envie um arquivo PDF válido.", variant: "destructive" });
      return;
    }

    console.log(`[IoEditais] Iniciando upload do arquivo: ${file.name} (${Math.round(file.size / 1024)}KB)`);

    try {
      setIsProcessing(true);
      setProgress(5);
      
      // Upload PDF to Cloudinary
      console.log(`[IoEditais] Fazendo upload do PDF para o Cloudinary...`);
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const editalFolder = `editais/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileData: fileDataUrl, 
          folder: `ade/${editalFolder}`, 
          workspaceId: workspace.id,
          resourceType: "auto"
        })
      });

      let pdfUrl = "";
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        pdfUrl = data.url;
        console.log(`[IoEditais] Upload concluído! URL: ${pdfUrl}`);
      } else {
        console.warn(`[IoEditais] Falha no upload para o Cloudinary. Continuando com extração local apenas.`);
      }

      setProgress(15);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      console.log(`[IoEditais] PDF carregado com sucesso. Total de páginas: ${pdf.numPages}`);
      
      const pagesText: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        pagesText.push(`--- PÁGINA ${i} ---\n${strings.join(" ")}`);
        setProgress(10 + Math.floor((i / pdf.numPages) * 40));
      }

      console.log(`[IoEditais] Texto extraído. Salvando nota de raw_pdf no banco de dados para ${file.name}...`);

      const rawTextId = crypto.randomUUID();
      actions.addNoteToDashboard(workspace.id, dashboard.id, {
        id: rawTextId,
        title: file.name,
        type: "raw_pdf",
        content: pagesText.join('\n\n'),
        createdAt: new Date().toISOString(),
        metadata: { pdfUrl }
      });

      console.log(`[IoEditais] Nota salva. Disparando geração da Visão Geral (limite de 10 páginas)...`);

      const MAX_PAGES_OVERVIEW = Math.min(10, pagesText.length);
      const overviewChunk = pagesText.slice(0, MAX_PAGES_OVERVIEW).join('\n\n');

      const newTileId = crypto.randomUUID();
      const prompt = `Você é um Especialista de Licitações Sênior. Analise as primeiras ${MAX_PAGES_OVERVIEW} páginas deste edital e estruture os dados em MARKDOWN contendo OBRIGATORIAMENTE os 4 blocos abaixo usando EXATAMENTE essas tags como divisores de conteúdo:

[RESUMO]
Resumo claro do Objeto, Modalidade da licitação, Dotação e Valores.

[PRAZOS]
Datas importantes e Prazos Principais do certame.

[EXIGENCIAS]
Principais Exigências (Resumo da Qualificação Técnica e Habilitação).

[RISCOS]
Riscos Iniciais, Armadilhas e Penalidades em destaque.

[CHECKLIST_EXTRA]
Liste de 3 a 7 itens específicos e cruciais de habilitação ou exigência técnica peculiares deste edital que não são óbvios (ex: licença ambiental específica, atestado com mínimo X, vistoria obrigatória prévia). Cada item deve ser bem curto.

Importante: Não adicione nenhum texto fora ou antes dessas tags. Formate o texto dentro das tags usando listas (- item) ou negrito (**item**) para melhor leitura.

EXTREMAMENTE IMPORTANTE: Para TODA informação factual, data, prazo, exigência ou valor que você extrair, você DEVE obrigatoriamente incluir a fonte da informação no formato exato: {{Pág X, Art Y}}. 
Exemplo: "O prazo para envio é dia 20/05 {{Pág 3, Item 4.1}}". Se não souber o item exato, coloque pelo menos a página: {{Pág 2}}.

Trecho a analisar:
${overviewChunk}`;

      const newTile = {
        id: newTileId,
        title: `Visão Geral - ${file.name.substring(0, 30)}`,
        content: "",
        prompt,
        model: "gpt-4o-mini",
        status: "processing" as any,
        orderIndex: dashboard.tiles?.length || 0,
        attempts: 0,
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { fileName: file.name, chunkIndex: 0, source: "io_editais_upload", pdfUrl }
      };

      actions.addTileToDashboard(workspace.id, dashboard.id, newTile);
      
      setActiveEdital(file.name);
      setActiveTab("resumo");
      setIsProcessing(false); // Removemos o loader azul inicial para focar no streaming

      console.log(`[IoEditais] Disparando Streaming da IA na tela...`);
      try {
        const response = await fetch("/api/generate/tile-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            title: newTile.title,
            model: "gpt-4o-mini",
            maxTokens: 2000,
          }),
        });

        if (!response.ok) throw new Error("API stream error");
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulated = "";
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "").trim();
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulated += parsed.text;
                    actions.updateTileInDashboard(workspace.id, dashboard.id, newTileId, { content: accumulated }, newTile);
                  }
                  if (parsed.done) done = true;
                } catch {}
              }
            }
          }
        }
        
        actions.updateTileInDashboard(workspace.id, dashboard.id, newTileId, { content: accumulated, status: "completed" }, newTile);
        push({ title: "Análise Concluída", description: "A Visão Geral do edital foi finalizada com sucesso.", variant: "success" });

      } catch(err) {
        console.error("[IoEditais] Falha no streaming:", err);
        actions.updateTileInDashboard(workspace.id, dashboard.id, newTileId, { status: "error" }, newTile);
        push({ title: "Erro na IA", description: "Falha ao gerar o resumo via stream.", variant: "destructive" });
      }

    } catch (err) {
      console.error("[IoEditais] Erro fatal durante a extração do PDF:", err);
      push({ title: "Erro na Leitura", description: "Falha ao extrair o PDF.", variant: "destructive" });
      setIsProcessing(false);
    } finally {
      setProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  const navigateToAnalysis = () => {
    const btn = document.querySelector('[data-tab="cards"]') as HTMLButtonElement;
    if (btn) btn.click();
  };

  // ────────────────────────────────────────────────────────
  // TELA 1: MESTRE (PAINEL GERAL & LISTA DE EDITAIS)
  // ────────────────────────────────────────────────────────
  if (!activeEdital) {
    return (
      <div className="flex flex-col h-full bg-transparent overflow-y-auto p-6 text-slate-800">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Painel Operacional de Licitações</h1>
              <p className="text-slate-500 mt-1">Visão comercial e controle de editais para alta performance.</p>
            </div>
            <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer shrink-0">
              <UploadCloud size={20} />
              + Novo Edital
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-blue-700">
                  <CalendarDays size={20} />
                  <h3 className="font-semibold text-slate-800 text-sm">Próximas Sessões</h3>
                </div>
                <button className="text-blue-600 text-xs font-medium hover:underline">+ Add</button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <CalendarDays size={32} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">Agenda livre</p>
                <p className="text-xs text-slate-400 mt-1">Nenhuma sessão agendada para hoje.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-amber-600">
                  <BellRing size={20} />
                  <h3 className="font-semibold text-slate-800 text-sm">Avisos e Pendências</h3>
                </div>
                <button className="text-amber-600 text-xs font-medium hover:underline">+ Add</button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 bg-amber-50/50 border border-dashed border-amber-100 rounded-xl">
                <CheckCircle2 size={32} className="text-amber-200 mb-2" />
                <p className="text-sm font-medium text-amber-700">Tudo em dia</p>
                <p className="text-xs text-amber-600/70 mt-1">Nenhuma diligência urgente.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <TrendingUp size={100} />
              </div>
              <div className="flex items-center gap-3 text-emerald-600 mb-4">
                <TrendingUp size={20} />
                <h3 className="font-semibold text-slate-800 text-sm">Métricas do Mês</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-medium mb-1">Editais Lidos (IA)</p>
                  <p className="text-3xl font-black text-emerald-800">{editais.length}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center">
                  <span className="text-xs text-slate-500 mb-1">Taxa de Vitória</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-1 rounded-md">Em breve</span>
                </div>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center py-10">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <h4 className="font-semibold text-slate-800 mb-2">Processando e lendo edital...</h4>
              <p className="text-sm text-slate-500 mb-4 text-center">Extraindo as páginas para a visão geral e persistindo os dados para análise profunda.</p>
              <div className="w-full max-w-sm h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              Editais em Andamento
            </h2>
            
            {editais.length === 0 && !isProcessing ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl border-dashed">
                <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum edital processado ainda no seu workspace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {editais.map((edital: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group relative"
                    onClick={() => { setActiveEdital(edital.fileName); setActiveTab("resumo"); }}
                  >
                    <button 
                      onClick={(e) => handleDeleteEdital(edital.fileName, e)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Apagar Edital"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="flex items-start gap-4 mb-4 pr-6">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-tight" title={edital.fileName}>
                          {edital.fileName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <LayoutGrid size={12} /> {edital.total} Card{edital.total > 1 ? 's' : ''} de Análise
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${
                        edital.error > 0 ? 'bg-red-50 text-red-600' :
                        edital.completed === edital.total ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {edital.error > 0 ? <AlertTriangle size={14} /> : 
                         edital.completed === edital.total ? <Eye size={14} /> : 
                         <Loader2 size={14} className={edital.completed < edital.total ? "animate-spin" : ""} />}
                        
                        {edital.error > 0 ? `${edital.error} Erro(s) de IA` : `${edital.completed} / ${edital.total} IA`}
                      </div>
                      <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                        Abrir <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // TELA 2: DETALHES DO EDITAL (ABAS)
  // ────────────────────────────────────────────────────────
  const activeEditalObj = editais.find(e => e.fileName === activeEdital);
  
  // Buscar o Tile específico de "Visão Geral" para renderizar o resultado de fato
  const overviewTile = dashboard?.tiles?.find(t => 
    t.metadata?.fileName === activeEdital && 
    (t.title.includes("Visão Geral") || t.metadata?.source === "io_editais_upload")
  );

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden text-slate-800">
      
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveEdital(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight line-clamp-1">{activeEdital}</h2>
            <p className="text-xs text-slate-500">Trabalhando neste edital isoladamente.</p>
          </div>
        </div>
        <button 
          onClick={(e) => handleDeleteEdital(activeEdital, e)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
        >
          <Trash2 size={16} /> Deletar Documento
        </button>
      </div>

      <div className="flex items-center px-6 h-14 bg-white border-b border-slate-200 gap-6 shrink-0">
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "resumo" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("resumo")}
        >
          <FileText size={16} />
          Visão Geral IA
        </button>
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "checklist" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("checklist")}
        >
          <ListChecks size={16} />
          Checklist de Habilitação
        </button>
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "proposta" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("proposta")}
        >
          <CircleDollarSign size={16} />
          Proposta e Custos
        </button>
        <button 
          className={`flex items-center gap-2 px-1 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === "chat" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          <Eye size={16} />
          Chat & Análises
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto w-full">
          
          {activeTab === "resumo" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <LayoutGrid className="text-blue-600" /> Painel Analítico
                </h3>
                {overviewTile && (
                  <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${
                    overviewTile.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
                    overviewTile.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {overviewTile.status === 'completed' ? <CheckCircle2 size={16} /> : 
                     overviewTile.status === 'error' ? <AlertTriangle size={16} /> : 
                     <Loader2 size={16} className="animate-spin" />}
                    Status: {overviewTile.status.toUpperCase()}
                  </div>
                )}
              </div>

              {overviewTile ? (
                <div className="mb-8">
                  {overviewTile.status === 'completed' || overviewTile.status === 'processing' ? (
                    <SmartOverviewCards content={overviewTile.content} />
                  ) : overviewTile.status === 'error' ? (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-start gap-4">
                      <AlertTriangle className="text-red-600 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-red-800">Falha na geração da IA</h4>
                        <p className="text-red-600 text-sm mt-1">A IA não conseguiu interpretar o texto para extrair a Visão Geral. Verifique os logs do servidor para mais detalhes ou remova o edital e tente fazer o upload novamente.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                      <h4 className="font-semibold text-slate-700">Iniciando a leitura da IA...</h4>
                      <p className="text-slate-500 text-sm mt-2 max-w-md">O edital foi carregado, a IA começará a exibir os resultados a qualquer momento.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Nenhum card principal de "Visão Geral" atrelado a este documento.
                </div>
              )}

              {/* Removido o bloco "Próximos Passos" que direcionava para o Business Insights global */}

            </div>
          )}

          {activeTab === "checklist" && <ChecklistTab activeEdital={activeEdital} />}
          {activeTab === "proposta" && <PropostaTab activeEdital={activeEdital} />}
          {activeTab === "chat" && <EditalChatTab activeEdital={activeEdital} />}
        </div>
      </div>
      
    </div>
  );
}
