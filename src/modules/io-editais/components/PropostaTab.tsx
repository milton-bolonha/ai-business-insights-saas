import { useState } from "react";
import { Edital } from "../hooks/useLicitaFlow";

export function PropostaTab({ edital }: { edital: Edital }) {
  const [itens, setItens] = useState([
    { id: 1, desc: "Computador Desktop i5 12ª Gen", qtd: 20, custo: 2800, margem: 15, frete: 80 },
    { id: 2, desc: "Monitor 21,5\" Full HD IPS", qtd: 20, custo: 950, margem: 18, frete: 40 },
    { id: 3, desc: "Teclado e Mouse USB sem fio", qtd: 20, custo: 120, margem: 25, frete: 15 },
  ]);
  const [garantia, setGarantia] = useState(5);

  const calcPreco = (item: any) => {
    const base = item.custo + item.frete;
    const comMargem = base / (1 - item.margem / 100);
    return comMargem;
  };

  const totalProposta = itens.reduce((acc, it) => acc + calcPreco(it) * it.qtd, 0);
  const totalCusto = itens.reduce((acc, it) => acc + (it.custo + it.frete) * it.qtd, 0);
  const lucro = totalProposta - totalCusto;
  const custoGarantia = totalProposta * (garantia / 100);
  const lucroLiquido = lucro - custoGarantia;
  
  // MOCK: using vr from edital and converting string to number for calculation
  const vrNumber = Number(edital?.vr?.replace(/\D/g, '')) / 100 || 380000; 

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <div className="bg-white border border-black/10 rounded-xl p-4 mb-4">
        <div className="text-[13px] font-medium mb-3.5">Composição de preço — {edital?.nome}</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F6F3]">
                {["Item", "Qtd", "Custo unit.", "Frete unit.", "Margem", "Preço proposta", "Total"].map((h) => (
                  <th key={h} className={`p-2 text-[11px] text-gray-400 font-medium ${h === "Item" ? "text-left" : "text-right"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((it, idx) => (
                <tr key={it.id} className="border-b border-black/5">
                  <td className="p-2 text-xs">{it.desc}</td>
                  <td className="p-2 text-xs text-right">
                    <input 
                      type="number" 
                      value={it.qtd} 
                      min={1} 
                      onChange={e => setItens(arr => arr.map((x, i) => i === idx ? { ...x, qtd: +e.target.value } : x))} 
                      className="w-14 text-right px-1.5 py-1 rounded-md border border-black/20 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-2 text-xs text-right">
                    <input 
                      type="number" 
                      value={it.custo} 
                      min={0} 
                      onChange={e => setItens(arr => arr.map((x, i) => i === idx ? { ...x, custo: +e.target.value } : x))} 
                      className="w-20 text-right px-1.5 py-1 rounded-md border border-black/20 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-2 text-xs text-right text-gray-400">{fmt(it.frete)}</td>
                  <td className="p-2 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <input 
                        type="range" 
                        min={5} 
                        max={60} 
                        value={it.margem} 
                        onChange={e => setItens(arr => arr.map((x, i) => i === idx ? { ...x, margem: +e.target.value } : x))} 
                        className="w-16 accent-blue-600"
                      />
                      <span className="text-xs min-w-[30px] text-right">{it.margem}%</span>
                    </div>
                  </td>
                  <td className="p-2 text-xs text-right font-medium">{fmt(calcPreco(it))}</td>
                  <td className="p-2 text-xs text-right font-medium text-blue-800">{fmt(calcPreco(it) * it.qtd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white border border-black/10 rounded-xl p-4">
          <div className="text-[13px] font-medium mb-3.5">Resumo financeiro</div>
          {[
            ["Total da proposta", fmt(totalProposta), "text-primary-text"],
            ["Custo total", fmt(totalCusto), "text-gray-400"],
            ["Lucro bruto", fmt(lucro), "text-teal-600"],
            ["Garantia contratual (" + garantia + "%)", `-${fmt(custoGarantia)}`, "text-amber-800"],
            ["Lucro líquido estimado", fmt(lucroLiquido), lucroLiquido > 0 ? "text-green-600" : "text-red-600"]
          ].map(([l, v, c], i, arr) => (
            <div key={l as string} className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-black/5" : ""}`}>
              <span className="text-xs text-gray-400">{l as string}</span>
              <span className={`text-xs font-medium ${c}`}>{v as string}</span>
            </div>
          ))}
          <div className="mt-3">
            <div className="text-xs text-gray-400 mb-1">Garantia contratual: {garantia}%</div>
            <input 
              type="range" 
              min={0} max={10} step={0.5} 
              value={garantia} 
              onChange={e => setGarantia(+e.target.value)} 
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <div className="flex-1 bg-white border border-black/10 rounded-xl p-4">
          <div className="text-[13px] font-medium mb-3.5">Comparação com referência</div>
          <div className="mb-3">
            <div className="text-[11px] text-gray-400 mb-1">Valor estimado (PNCP)</div>
            <div className="text-2xl font-medium">{fmt(vrNumber)}</div>
          </div>
          <div className="mb-3">
            <div className="text-[11px] text-gray-400 mb-1">Sua proposta</div>
            <div className={`text-2xl font-medium ${totalProposta <= vrNumber ? "text-green-600" : "text-red-600"}`}>
              {fmt(totalProposta)}
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${totalProposta <= vrNumber ? "bg-green-50 border-green-600" : "bg-red-50 border-red-600"}`}>
            <div className={`text-xs font-medium ${totalProposta <= vrNumber ? "text-green-800" : "text-red-600"}`}>
              {totalProposta <= vrNumber 
                ? `✅ ${((1 - totalProposta / vrNumber) * 100).toFixed(1)}% abaixo do valor estimado` 
                : `⚠️ ${((totalProposta / vrNumber - 1) * 100).toFixed(1)}% acima do valor estimado`
              }
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {totalProposta <= vrNumber ? "Proposta elegível para participação" : "Revise os custos — proposta acima do teto pode ser desclassificada"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
