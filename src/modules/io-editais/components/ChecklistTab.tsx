import { Edital } from "../hooks/useLicitaFlow";
import { CheckItem, Prog } from "./UI";

const ITEMS = [
  { key: "objeto", label: "Entendi completamente o objeto", grupo: "Análise inicial", desc: "O que será comprado? Minha empresa atende?" },
  { key: "especTecnica", label: "Atendo todas as especificações técnicas", grupo: "Análise inicial", desc: "Características, quantidades, normas, certificações" },
  { key: "tr", label: "Li integralmente o Termo de Referência", grupo: "Análise inicial", desc: "Escopo, execução, critérios de aceitação, obrigações" },
  { key: "dadosOp", label: "Registrei todos os dados operacionais", grupo: "Análise inicial", desc: "Plataforma, número do processo, data e horário da sessão" },
  { key: "estrutura", label: "Entendi a estrutura da contratação", grupo: "Análise inicial", desc: "Compra imediata ou ARP? Impacto no preço e estoque" },
  { key: "disputa", label: "Verifiquei se disputa é por item ou lote", grupo: "Análise inicial", desc: "Um item ruim em lote pode comprometer tudo" },
  { key: "habilitacao", label: "Possuo toda a documentação de habilitação", grupo: "Habilitação", desc: "Contrato social, regularidade fiscal, trabalhista, etc." },
  { key: "docsEspecificos", label: "Possuo documentos específicos exigidos", grupo: "Habilitação", desc: "Catálogos, fichas técnicas, licenças, declarações" },
  { key: "qualTecnica", label: "Atendo os requisitos de qualificação técnica", grupo: "Habilitação", desc: "Atestados, experiência anterior, certificações" },
  { key: "prazos", label: "Consigo cumprir todos os prazos", grupo: "Execução", desc: "Proposta, entrega, execução, amostras, correções" },
  { key: "amostras", label: "Amostras verificadas (se exigidas)", grupo: "Execução", desc: "Prazo, quantidade, local, critérios de avaliação" },
  { key: "localEntrega", label: "Conheço os locais de entrega", grupo: "Execução", desc: "Município, distância, frete incluído no preço?" },
  { key: "viabilidade", label: "A operação é lucrativa", grupo: "Financeiro", desc: "Custos, impostos, frete, garantias, administrativo" },
  { key: "precoRef", label: "Analisei o preço de referência", grupo: "Financeiro", desc: "Valor estimado compatível com meus custos?" },
  { key: "pagamento", label: "Consigo suportar o prazo de pagamento", grupo: "Financeiro", desc: "Fluxo de caixa considerado na formação do preço" },
  { key: "penalidades", label: "Compreendo as penalidades do contrato", grupo: "Riscos", desc: "Multas, suspensões, rescisão contratual" },
];

interface ChecklistTabProps {
  edital: Edital;
  toggleChecklist: (editalId: number, key: string) => void;
}

export function ChecklistTab({ edital, toggleChecklist }: ChecklistTabProps) {
  const grupos = [...new Set(ITEMS.map(i => i.grupo))];
  const checks = edital?.checklist || {};
  
  const total = ITEMS.length;
  const done = ITEMS.filter(i => checks[i.key]).length;
  const pct = Math.round((done / total) * 100) || 0;

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        {grupos.map(g => {
          const its = ITEMS.filter(i => i.grupo === g);
          return (
            <div key={g} className="bg-white border border-black/10 rounded-xl p-4 mb-4">
              <div className="text-[13px] font-medium mb-2.5 text-blue-800">{g}</div>
              {its.map(item => (
                <div 
                  key={item.key} 
                  onClick={() => toggleChecklist(edital.id, item.key)} 
                  className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 mb-1.5 border ${
                    checks[item.key] ? "bg-green-50 border-green-600" : "bg-[#F7F6F3] border-black/10 hover:bg-gray-50"
                  }`}
                >
                  <span className={`text-[15px] mt-0.5 ${checks[item.key] ? "text-green-600" : "text-gray-400"}`}>
                    {checks[item.key] ? "✓" : "○"}
                  </span>
                  <div>
                    <div className={`text-xs font-medium ${checks[item.key] ? "text-green-800" : "text-primary-text"}`}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="w-72 shrink-0">
        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-2">Progresso do checklist</div>
          <div className={`text-4xl font-medium ${pct === 100 ? "text-green-600" : pct > 60 ? "text-[#BA7517]" : "text-red-600"}`}>
            {pct}%
          </div>
          <div className="text-xs text-gray-400 mb-2">{done} de {total} itens verificados</div>
          <Prog pct={pct} colorClass={pct === 100 ? "bg-green-600" : pct > 60 ? "bg-[#BA7517]" : "bg-red-600"} />
          
          {pct < 100 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-600">
              <div className="text-xs text-amber-800 font-medium">Regra de ouro</div>
              <div className="text-[11px] text-amber-800 leading-relaxed mt-1">
                O objetivo da análise não é descobrir <em>como</em> participar — é descobrir <em>se vale a pena</em> participar.
              </div>
            </div>
          )}
          {pct === 100 && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-600">
              <div className="text-xs text-green-800 font-medium">✅ Checklist completo</div>
              <div className="text-[11px] text-green-600 mt-1">Edital totalmente analisado. Você pode enviar a proposta com segurança.</div>
            </div>
          )}
        </div>

        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-2.5">Itens pendentes</div>
          {ITEMS.filter(i => !checks[i.key]).slice(0, 5).map(i => (
            <div key={i.key} className="flex gap-2 mb-1.5 items-start">
              <span className="text-red-600 text-[13px] mt-0.5">○</span>
              <span className="text-xs text-primary-text">{i.label}</span>
            </div>
          ))}
          {ITEMS.filter(i => !checks[i.key]).length === 0 && (
            <div className="text-xs text-green-600">Nenhum item pendente!</div>
          )}
        </div>
      </div>
    </div>
  );
}
