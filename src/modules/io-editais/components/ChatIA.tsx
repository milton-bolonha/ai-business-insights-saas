import { useState } from "react";

const CHAT_INICIAL = [
  { role: "bot", text: "Analisei o Pregão 042/2025 da Prefeitura de Campinas. Encontrei 6 seções, 2 pontos fora do padrão críticos e 4 itens do checklist pendentes. Por onde quer começar?" }
];

export function ChatIA({ edital }: { edital: any }) {
  const [msgs, setMsgs] = useState(CHAT_INICIAL);
  const [input, setInput] = useState("");

  const respostas: Record<string, string> = {
    "falta": "No checklist do Pregão 042/2025 faltam: habilitação verificada, documentos específicos, viabilidade financeira e penalidades analisadas. São 4 itens críticos — especialmente habilitação, que é eliminatório.",
    "prazo": "A sessão pública é em 28/01/2025 às 10h na plataforma Comprasnet. O prazo para envio da proposta é 25/01/2025. Você tem 3 dias para finalizar.",
    "habilitação": "Para este edital você precisa de: certidão negativa federal, estadual e municipal; FGTS regular; CNDT (trabalhista); contrato social atualizado; balanço patrimonial; e atestado de capacidade técnica (mín. 30% do objeto).",
    "habilitacao": "Para este edital você precisa de: certidão negativa federal, estadual e municipal; FGTS regular; CNDT (trabalhista); contrato social atualizado; balanço patrimonial; e atestado de capacidade técnica (mín. 30% do objeto).",
    "atestado": "O edital aceita somatório de atestados para atingir 30% da quantidade licitada. Separe notas fiscais ou ordens de compra que comprovem entregas anteriores para diligência.",
    "amostra": "Este edital não exige amostras físicas — apenas fichas técnicas e catálogos do fabricante que comprovem atendimento às especificações.",
    "garantia": "A garantia contratual é de 5% do valor do contrato, a ser apresentada em até 5 dias após a assinatura. Pode ser seguro-garantia ou fiança bancária. Inclua esse custo na sua precificação.",
    "penalidade": "Multa por atraso: 0,5% ao dia. Multa por inexecução total: 10%. Atenção: 0,5% ao dia é acima da média — 20 dias de atraso já representam 10% de multa. Só aceite se tiver estoque confirmado.",
    "plataforma": "Este pregão é realizado no Comprasnet (comprasnet.gov.br). Verifique se sua empresa tem cadastro no SICAF ativo — sem SICAF regularizado não é possível participar.",
  };

  const responder = (q: string) => {
    const lower = q.toLowerCase();
    const chave = Object.keys(respostas).find(k => lower.includes(k));
    return chave ? respostas[chave] : `Sobre "${q}" no ${edital?.nome || "edital"}: recomendo verificar a seção correspondente. Posso ajudar com prazo, habilitação, atestados, amostras, garantia, penalidades ou plataforma.`;
  };

  const enviar = () => {
    if (!input.trim()) return;
    const p = input.trim();
    setInput("");
    setMsgs(m => [...m, { role: "user", text: p }]);
    setTimeout(() => setMsgs(m => [...m, { role: "bot", text: responder(p) }]), 700);
  };

  return (
    <div className="bg-white border border-black/10 rounded-xl p-4">
      <div className="text-[13px] font-medium mb-3">Perguntar à IA sobre o edital</div>
      
      <div className="flex flex-col gap-2 mb-3 max-h-[220px] overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`text-xs leading-relaxed px-3 py-2 rounded-xl max-w-[90%] ${
              m.role === "bot" ? "bg-blue-50 text-blue-900" : "bg-[#F1EFE8] text-primary-text"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-1.5 mb-2.5">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === "Enter" && enviar()} 
          placeholder="Pergunte sobre o edital..." 
          className="flex-1 px-3 py-2 rounded-lg border border-black/20 text-xs outline-none focus:border-blue-500"
        />
        <button 
          onClick={enviar} 
          className="bg-blue-600 text-white border-none rounded-lg px-3.5 py-2 flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          →
        </button>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {[
          "O que falta?", "Prazo e sessão", "Habilitação", 
          "Atestado técnico", "Garantia contratual", "Penalidades", "Plataforma"
        ].map(q => (
          <span 
            key={q} 
            onClick={() => setInput(q)}
            className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-medium cursor-pointer bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}
