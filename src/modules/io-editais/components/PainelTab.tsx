import { Edital } from "../hooks/useLicitaFlow";
import { Prog, SecaoItem } from "./UI";

interface PainelTabProps {
  editais: Edital[];
  nav: (tab: string, id?: number) => void;
}

export function PainelTab({ editais, nav }: PainelTabProps) {
  const ativos = editais.length;
  const prontos = editais.filter(e => e.progresso === 100).length;
  const editalDestaque = editais[0];

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="flex gap-2.5 mb-4">
          {[
            [ativos, "Editais ativos", "text-[#111]"],
            [prontos, "Prontos p/ envio", "text-green-600"],
            [ativos - prontos, "Em análise", "text-[#BA7517]"],
            [3, "Dias até sessão", "text-red-600"]
          ].map(([v, l, c], i) => (
            <div key={i} className="bg-[#F7F6F3] rounded-lg px-3.5 py-2.5 flex-1">
              <div className={`text-2xl font-medium ${c}`}>{v}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{l as string}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-3.5 flex items-center gap-1.5 text-primary-text">
            Editais em andamento
          </div>
          {editais.map((e) => (
            <div 
              key={e.id} 
              onClick={() => nav("edital", e.id)} 
              className="flex items-center gap-2.5 p-2.5 border border-black/10 rounded-lg mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className={`w-9.5 h-9.5 rounded-lg flex items-center justify-center text-base ${e.cor === "teal" ? "bg-teal-50" : "bg-blue-50"}`}>
                {e.cor === "teal" ? "🏥" : "🏛"}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-primary-text">{e.nome}</div>
                <div className="text-[11px] text-gray-400">{e.orgao} · Sessão: {e.sessao} {e.horario}</div>
              </div>
              <div className="text-right min-w-[72px]">
                <div className={`text-[11px] font-medium ${e.progresso === 100 ? "text-green-600" : "text-[#BA7517]"}`}>
                  {e.progresso}%
                </div>
                <Prog pct={e.progresso} colorClass={e.progresso === 100 ? "bg-green-600" : "bg-[#BA7517]"} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-3 text-primary-text">Análise IA — {editalDestaque.nome}</div>
          {editalDestaque.secoes.slice(0, 3).map(s => <SecaoItem key={s.id} s={s} />)}
        </div>
      </div>

      <div className="w-72 shrink-0">
        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-3">Cronograma</div>
          {editalDestaque.timeline.map((t, i) => (
            <div key={i} className={`flex gap-2.5 pb-2.5 mb-2 ${i < 3 ? "border-b border-black/5" : ""}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${t.status === "ok" ? "bg-green-600" : t.status === "warn" ? "bg-[#BA7517]" : "bg-gray-400"}`} />
              <div>
                <div className="text-xs">{t.texto}</div>
                <div className="text-[10px] text-gray-400">{t.data}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-2.5">Pontos fora do padrão</div>
          {editalDestaque.pontosFora.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-600">
              <span className="text-sm">⚠️</span>
              <span className="text-[11px] text-amber-800 leading-relaxed">{p}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-2.5">Checklist — progresso</div>
          {/* Note: In a real app we might want to iterate the items rather than hardcode. Kept prototype logic for now. */}
          {Object.entries({
            objeto: "Objeto compreendido",
            especTecnica: "Especificações técnicas",
            habilitacao: "Habilitação verificada",
            viabilidade: "Viabilidade financeira",
            penalidades: "Penalidades analisadas"
          }).map(([k, l]) => (
            <div key={k} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg mb-1 border ${editalDestaque.checklist[k] ? "bg-green-50 border-green-600" : "bg-[#F7F6F3] border-black/10"}`}>
              <span className={`text-sm ${editalDestaque.checklist[k] ? "text-green-600" : "text-gray-400"}`}>
                {editalDestaque.checklist[k] ? "✓" : "○"}
              </span>
              <span className={`text-xs ${editalDestaque.checklist[k] ? "text-green-800" : "text-primary-text"}`}>
                {l}
              </span>
            </div>
          ))}
          <Prog pct={72} colorClass="bg-blue-600" />
          <div className="text-[10px] text-gray-400 mt-1">11 de 15 itens concluídos</div>
        </div>
      </div>
    </div>
  );
}
