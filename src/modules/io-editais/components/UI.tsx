// @ts-nocheck
import { useState } from "react";
import { SecaoEdital } from "../hooks/useLicitaFlow";

export function Prog({ pct, colorClass = "bg-blue-600" }: { pct: number; colorClass?: string }) {
  return (
    <div className="bg-black/10 rounded-full h-1.5 overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full transition-all duration-400 ease-out ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SecaoItem({ s }: { s: SecaoEdital }) {
  const [open, setOpen] = useState(false);
  const isObrig = s.prioridade === "obrigatorio";
  const isImportante = s.prioridade === "importante";
  const isAtencao = s.prioridade === "atencao";
  
  const corBadge = isObrig ? "bg-red-50 text-red-600" : isImportante || isAtencao ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800";
  const label = isObrig ? "Obrigatório" : isImportante ? "Importante" : isAtencao ? "Atenção" : "Informativo";

  return (
    <div className="border border-black/10 rounded-lg overflow-hidden mb-1.5">
      <div 
        onClick={() => setOpen(!open)} 
        className={`flex items-center gap-2 p-2.5 cursor-pointer transition-colors ${open ? "bg-[#F7F6F3]" : "bg-white"}`}
      >
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${corBadge}`}>{label}</span>
        <span className="text-xs font-medium flex-1 text-primary-text">{s.titulo}</span>
        <span className={`text-xs text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </div>
      {open && (
        <div className="p-3 border-t border-black/10 bg-[#FAFAF8]">
          <div className="text-[11px] text-blue-800 bg-blue-50 p-2 rounded-md mb-2.5 leading-relaxed">
            <strong>Contexto da IA:</strong> {s.contexto}
          </div>
          <ul className="pl-4 m-0 list-disc">
            {s.itens.map((it, i) => (
              <li key={i} className="text-xs text-[#333] mb-1 leading-relaxed">{it}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CheckItem({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <div 
      onClick={onToggle} 
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 mb-1 border ${done ? "bg-green-50 border-green-600" : "bg-[#F7F6F3] border-black/10"}`}
    >
      <span className={`text-sm ${done ? "text-green-600" : "text-gray-400"}`}>{done ? "✓" : "○"}</span>
      <span className={`text-xs ${done ? "text-green-800" : "text-primary-text"}`}>{label}</span>
    </div>
  );
}
