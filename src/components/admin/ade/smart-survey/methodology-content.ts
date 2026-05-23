import {
  calculateSamplingStats,
  buildOrganizationAnalytics,
  calculateIroTrend,
} from "./risk-engine";

type SamplingStats = ReturnType<typeof calculateSamplingStats>;
type OrgAnalytics = ReturnType<typeof buildOrganizationAnalytics>;
type IroTrend = ReturnType<typeof calculateIroTrend>;

export type MethodologyContext = {
  companyName: string;
  surveyTitle: string;
  samplingStats: SamplingStats | null;
  organizationAnalytics: OrgAnalytics | null;
  iroTrend: IroTrend;
  iro: number | null;
  iroLabel: string;
};

export const METHODOLOGY_SECTIONS = [
  {
    title: "IRO e score individual (Sp)",
    paragraphs: [
      "Escala 0–10 com polaridade: perguntas negativas usam o valor direto; positivas usam 10 − valor.",
      "Sp = média ponderada dos módulos NR-1 (pesos regulatórios 1, 2 ou 3, opcionalmente × criticidade c_t).",
      "IRO = média aritmética simples dos Sp dos entrevistados com inquérito válido na pesquisa ativa (não re-pondera módulos na agregação).",
    ],
  },
  {
    title: "Amostragem (n / N)",
    paragraphs: [
      "N = população-alvo declarada. n = inquéritos concluídos nesta pesquisa.",
      "Cobertura (%) = n/N — não confundir com margem de erro.",
      "Margem de erro ≈ ±% (95%, p=0,5, FPC) quando a amostra é parcial (n < N).",
    ],
  },
  {
    title: "Indicadores complementares",
    paragraphs: [
      "Dispersão global: desvio padrão dos Sp — detecta média estável com opiniões divididas.",
      "Variação do IRO: diferença em relação ao último registro salvo nesta pesquisa.",
      "Viés amostral: compara % de concluídos vs % cadastrados por setor.",
      "Diversidade de scores: entropia normalizada da distribuição de Sp.",
    ],
  },
  {
    title: "Referência normativa",
    paragraphs: [
      "Mapeamento psicossocial NR-1 (GRO/PGR) e ergonomia NR-17 — abordagem quantitativa, sem diagnóstico clínico.",
      "Especificação completa: algoritmo.md (repositório I/O Smart Survey).",
    ],
  },
] as const;

export function buildMethodologySnapshot(ctx: MethodologyContext): string[] {
  const lines: string[] = [];
  if (ctx.iro !== null) {
    lines.push(`IRO atual: ${ctx.iro.toFixed(1)} / 10 (${ctx.iroLabel})`);
  }
  if (ctx.samplingStats) {
    lines.push(ctx.samplingStats.detail);
  }
  const a = ctx.organizationAnalytics;
  if (a) {
    if (a.dispersion !== null) {
      lines.push(`Dispersão global: ${a.dispersion.toFixed(2)} (${a.dispersionLevel.label})`);
    }
    if (a.bias) {
      lines.push(`Viés amostral: ${a.bias.biasIndex}% — ${a.bias.label}`);
    }
    if (a.entropy) {
      lines.push(`Diversidade de scores: ${a.entropy.normalized}% — ${a.entropy.label}`);
    }
  }
  if (ctx.iroTrend.delta !== null) {
    const sign = ctx.iroTrend.delta > 0 ? "+" : "";
    lines.push(`Variação do IRO: ${sign}${ctx.iroTrend.delta.toFixed(2)} (${ctx.iroTrend.label})`);
  }
  return lines;
}

/** HTML da seção de metodologia para impressão PDF */
export function buildMethodologyPdfSection(ctx: MethodologyContext): string {
  const snapshot = buildMethodologySnapshot(ctx);
  const sectionsHtml = METHODOLOGY_SECTIONS.map(
    sec => `
    <div style="margin-bottom:18px;">
      <h4 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#374151;margin:0 0 6px;">${sec.title}</h4>
      ${sec.paragraphs.map(p => `<p style="font-size:11px;line-height:1.55;color:#4b5563;margin:0 0 6px;">${p}</p>`).join("")}
    </div>`
  ).join("");

  const snapshotHtml =
    snapshot.length > 0
      ? `
    <div style="margin-top:20px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#047857;margin:0 0 8px;">Valores desta pesquisa (${ctx.surveyTitle})</p>
      ${snapshot.map(l => `<p style="font-size:10px;color:#14532d;margin:0 0 4px;">• ${l}</p>`).join("")}
    </div>`
      : "";

  return `
    <section style="page-break-before:always; margin-bottom:40px;">
      <div style="border-bottom:2px solid #111827;padding-bottom:8px;margin-bottom:20px;">
        <span style="font-size:10px;font-weight:700;color:#047857;text-transform:uppercase;">Anexo metodológico</span>
        <h2 style="font-family:'DM Sans',sans-serif;font-size:18px;font-weight:800;color:#111827;margin:8px 0 0;">
          Metodologia quantitativa — ${ctx.companyName}
        </h2>
        <p style="font-size:11px;color:#6b7280;margin:4px 0 0;">Pesquisa: ${ctx.surveyTitle} · I/O Smart Survey (NR-1 / NR-17)</p>
      </div>
      ${sectionsHtml}
      ${snapshotHtml}
    </section>
  `;
}
