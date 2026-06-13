import { useState } from "react";
import { Edital } from "../hooks/useLicitaFlow";
import { SecaoItem, Prog } from "./UI";
import { ChatIA } from "./ChatIA";

export function EditalTab({ edital }: { edital: Edital }) {
  const [analyzed, setAnalyzed] = useState(!!edital?.secoes?.length);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("todos");

  const handleUpload = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAnalyzed(true);
    }, 2400);
  };

  const secoes = edital?.secoes || [];
  const filtradas = filter === "todos" ? secoes : secoes.filter(s => s.prioridade === filter);

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        {!analyzed ? (
          <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
            <div className="text-[13px] font-medium mb-3.5">Carregar edital de licitação</div>
            {loading ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-4 animate-spin">⚙️</div>
                <div className="font-medium mb-1.5">Lendo edital com IA...</div>
                <div className="text-xs text-gray-400 mb-5">Identificando objeto, TR, habilitação, prazos e pontos críticos</div>
                <div className="w-1/2 mx-auto"><Prog pct={65} /></div>
              </div>
            ) : (
              <div 
                onClick={handleUpload} 
                className="border border-dashed border-black/25 rounded-lg p-9 text-center cursor-pointer bg-[#F7F6F3] hover:bg-gray-100 transition-colors"
              >
                <div className="text-4xl mb-2.5">📑</div>
                <div className="font-medium mb-1">Arraste o PDF/DOC do edital ou clique para selecionar</div>
                <div className="text-xs text-gray-400 mb-4">A IA vai ler o edital completo e extrair todas as seções importantes</div>
                <button className="bg-blue-600 text-white border-none rounded-lg px-3.5 py-1.5 text-xs font-medium flex items-center gap-1 mx-auto">
                  Selecionar arquivo
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{edital?.nome}</div>
                  <div className="text-xs text-blue-600 mt-0.5">
                    {edital?.orgao} · Sessão: {edital?.sessao} às {edital?.horario} · Plataforma: {edital?.plataforma}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                    {secoes.filter(s => s.prioridade === "obrigatorio").length} obrigatórios
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800">
                    {secoes.filter(s => ["importante", "atencao"].includes(s.prioridade)).length} importantes
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-800">
                    {secoes.filter(s => s.prioridade === "info").length} informativos
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3.5">
                <div className="text-[13px] font-medium">Seções extraídas pela IA</div>
                <div className="flex gap-1.5">
                  {[
                    ["todos", "Todos"],
                    ["obrigatorio", "Obrigatórios"],
                    ["importante", "Importantes"],
                    ["info", "Informativos"]
                  ].map(([f, l]) => (
                    <button 
                      key={f} 
                      onClick={() => setFilter(f)} 
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        filter === f 
                          ? "bg-blue-600 text-white border-transparent" 
                          : "bg-white text-primary-text border border-black/20 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {filtradas.map(s => <SecaoItem key={s.id} s={s} />)}
            </div>
          </>
        )}
        <ChatIA edital={edital} />
      </div>

      <div className="w-72 shrink-0">
        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-3">Dados operacionais</div>
          {[
            ["Plataforma", edital?.plataforma || "—"],
            ["Nº do processo", edital?.processo || "—"],
            ["Data da sessão", edital?.sessao || "—"],
            ["Horário", edital?.horario || "—"],
            ["Tipo de contratação", edital?.tipo || "—"],
            ["Disputa", edital?.disputa || "—"],
            ["Critério", edital?.criterio || "—"],
            ["Valor estimado", edital?.vr || "—"],
            ["Pagamento", edital?.pagamento || "—"],
            ["Validade proposta", edital?.validade || "—"]
          ].map(([l, v], i, arr) => (
            <div key={l} className={`flex justify-between py-1.5 ${i < arr.length - 1 ? "border-b border-black/5" : ""}`}>
              <span className="text-xs text-gray-400">{l}</span>
              <span className="text-xs font-medium text-primary-text">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
          <div className="text-[13px] font-medium mb-2.5">Pontos fora do padrão</div>
          {(edital?.pontosFora || []).map((p, i) => (
            <div key={i} className="flex gap-2 mb-2 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-600">
              <span className="text-sm">⚠️</span>
              <span className="text-[11px] text-amber-800 leading-relaxed">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
