import { NR1_TOPICS } from "./nr1-topics";
import type { Company, CollaboratorAnswers, IroSnapshot, Survey } from "./types";

export function effectiveTopicWeight(regulatoryWeight: number, criticalityMultiplier = 1): number {
  return regulatoryWeight * Math.max(0.1, criticalityMultiplier);
}

/** Coleta Sp_i válidos de todos os entrevistados cadastrados */
export function collectIndividualScores(
  company: Company,
  responses: Record<string, CollaboratorAnswers>
): number[] {
  const scores: number[] = [];
  company.collaborators.forEach(c => {
    const s = calculateCollaboratorGlobalRisk(responses, c.id);
    if (s !== null) scores.push(s);
  });
  return scores;
}

export function getDispersionLevel(stdDev: number | null) {
  if (stdDev === null || isNaN(stdDev)) {
    return { label: "Sem dados", color: "text-neutral-500", bg: "bg-neutral-100", border: "border-neutral-200" };
  }
  if (stdDev < 1.5) {
    return { label: "Consenso", color: "text-emerald-700", bg: "bg-emerald-50/50", border: "border-emerald-200" };
  }
  if (stdDev <= 3) {
    return { label: "Variabilidade", color: "text-amber-700", bg: "bg-amber-50/50", border: "border-amber-200" };
  }
  return { label: "Polarização organizacional", color: "text-red-700", bg: "bg-red-50/50", border: "border-red-200" };
}

/** σ_company — desvio padrão dos Sp_i (dispersão global) */
export function calculateCompanyDispersion(scores: number[]) {
  if (scores.length < 2) return { stdDev: null as number | null, count: scores.length };
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((acc, v) => acc + (v - avg) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return { stdDev, count: scores.length };
}

/** Entropia de Shannon sobre a distribuição de Sp (bins 0–10) — desorganização relativa */
export function calculateOrganizationalEntropy(scores: number[]) {
  if (scores.length < 2) return null;
  const bins = new Array(11).fill(0);
  scores.forEach(s => {
    const b = Math.min(10, Math.max(0, Math.round(s)));
    bins[b]++;
  });
  const n = scores.length;
  let H = 0;
  let activeBins = 0;
  bins.forEach(count => {
    if (count > 0) {
      activeBins++;
      const p = count / n;
      H -= p * Math.log2(p);
    }
  });
  const hMax = activeBins > 1 ? Math.log2(activeBins) : 1;
  const normalized = hMax > 0 ? H / hMax : 0;
  return {
    entropy: H,
    normalized: Math.round(normalized * 100),
    activeBins,
    label:
      normalized < 0.35
        ? "Baixa entropia (homogeneidade)"
        : normalized < 0.65
          ? "Entropia moderada"
          : "Alta entropia (múltiplas realidades)",
  };
}

/** Viés amostral por setor: |% respondentes − % cadastro| agregado */
export function calculateSamplingBias(company: Company, responses: Record<string, CollaboratorAnswers>) {
  const totalCollabs = company.collaborators.length;
  if (totalCollabs === 0) return null;

  const popBySector: Record<string, number> = {};
  company.collaborators.forEach(c => {
    popBySector[c.sector] = (popBySector[c.sector] || 0) + 1;
  });

  const respBySector: Record<string, number> = {};
  let nCompleted = 0;
  company.collaborators.forEach(c => {
    if (responses[c.id]?.completed) {
      nCompleted++;
      respBySector[c.sector] = (respBySector[c.sector] || 0) + 1;
    }
  });

  if (nCompleted === 0) return null;

  const sectorDeltas: { sector: string; popPct: number; respPct: number; delta: number }[] = [];
  let sumAbsDelta = 0;

  company.sectors.forEach(sector => {
    const popPct = ((popBySector[sector] || 0) / totalCollabs) * 100;
    const respPct = ((respBySector[sector] || 0) / nCompleted) * 100;
    const delta = Math.abs(respPct - popPct);
    sumAbsDelta += delta;
    sectorDeltas.push({ sector, popPct, respPct, delta });
  });

  const biasIndex = Math.round(Math.min(100, sumAbsDelta / 2));
  const label =
    biasIndex < 15
      ? "Amostra equilibrada"
      : biasIndex < 35
        ? "Viés leve"
        : "Viés amostral relevante";

  return { biasIndex, label, sectorDeltas, nCompleted };
}

/** Tendência temporal a partir do histórico da pesquisa */
export function calculateIroTrend(history: IroSnapshot[] | undefined, currentIro: number | null) {
  if (currentIro === null || !history || history.length === 0) {
    return { delta: null as number | null, acceleration: null as number | null, label: "Sem histórico" };
  }
  const last = history[history.length - 1];
  const delta = currentIro - last.iro;
  let acceleration: number | null = null;
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const prevDelta = last.iro - prev.iro;
    acceleration = delta - prevDelta;
  }
  const label =
    delta > 0.3
      ? "Deterioração"
      : delta < -0.3
        ? "Melhora"
        : Math.abs(delta) <= 0.1
          ? "Estável"
          : delta > 0
            ? "Leve alta"
            : "Leve queda";
  return { delta, acceleration, label, previousIro: last.iro, previousDate: last.date };
}

/** Registra snapshot se IRO ou n mudou materialmente */
export function appendIroSnapshot(
  survey: Survey,
  iro: number | null,
  n: number,
  sigmaGlobal: number | null
): Survey {
  if (iro === null) return survey;
  const history = [...(survey.iroHistory || [])];
  const last = history[history.length - 1];
  const changed =
    !last ||
    Math.abs(last.iro - iro) >= 0.05 ||
    last.n !== n ||
    (sigmaGlobal !== null && last.sigmaGlobal !== sigmaGlobal);
  if (!changed) return survey;
  history.push({
    date: new Date().toISOString(),
    iro,
    n,
    sigmaGlobal,
  });
  return { ...survey, iroHistory: history.slice(-48) };
}

export function getRiskLevel(score: number | null) {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      label: "Sem Dados",
      color: "text-neutral-500",
      bg: "bg-neutral-100",
      border: "border-neutral-200",
      hex: "#9ca3af"
    };
  }
  if (score < 4.0) {
    return {
      label: "Risco Baixo",
      color: "text-emerald-700",
      bg: "bg-emerald-50/50",
      border: "border-emerald-200",
      hex: "#10b981"
    };
  }
  if (score < 7.0) {
    return {
      label: "Alerta Moderado",
      color: "text-amber-700",
      bg: "bg-amber-50/50",
      border: "border-amber-200",
      hex: "#f59e0b"
    };
  }
  return {
    label: "Risco Crítico",
    color: "text-red-700",
    bg: "bg-red-50/50",
    border: "border-red-200",
    hex: "#ef4444"
  };
}

/** @deprecated Use calculateSamplingStats — evita confundir com "100% de confiança" */
export function calculateConfidenceLevel(n: number, N: number): number {
  return calculateSamplingStats(n, N).coveragePercent;
}

/** Cobertura n/N e margem de erro (95%, p=0,5, FPC) — conceitos separados */
export function calculateSamplingStats(n: number, N: number) {
  const safeN = Math.max(1, N);
  const safeN_sample = Math.max(0, n);

  if (safeN_sample === 0) {
    return {
      coveragePercent: 0,
      marginOfErrorPercent: null as number | null,
      isCensus: false,
      shortLabel: "Sem amostra",
      detail: "Nenhum inquérito concluído na pesquisa ativa",
    };
  }

  const coveragePercent = Math.min(100, Math.round((100 * safeN_sample) / safeN));

  if (safeN_sample >= safeN) {
    return {
      coveragePercent: 100,
      marginOfErrorPercent: 0,
      isCensus: true,
      shortLabel: "Censo do universo (N)",
      detail: `n=${safeN_sample} concluídos · universo declarado N=${safeN} totalmente coberto`,
    };
  }

  const p = 0.5;
  const standardError = Math.sqrt((p * (1 - p)) / safeN_sample);
  const fpc = safeN > 1 ? Math.sqrt((safeN - safeN_sample) / (safeN - 1)) : 1;
  const moe = 1.96 * standardError * fpc;
  const marginOfErrorPercent = Math.round(moe * 100);

  return {
    coveragePercent,
    marginOfErrorPercent,
    isCensus: false,
    shortLabel: "Amostra parcial",
    detail: `Cobertura ${coveragePercent}% (n=${safeN_sample} de N=${safeN}) · Margem de erro ≈ ±${marginOfErrorPercent}% (95%)`,
  };
}

// Calculate specific topic risk score for a single collaborator in a given responses dictionary
export function calculateCollaboratorTopicRisk(responses: Record<string, CollaboratorAnswers>, collabId: string, topicId: string): number | null {
  const respObj = responses[collabId];
  if (!respObj) return null;

  const topic = NR1_TOPICS.find(t => t.id === topicId);
  if (!topic) return null;

  let sumRisk = 0;
  let count = 0;

  topic.questions.forEach((q, idx) => {
    if (q.type === "scale_0_10") {
      const answerKey = `${topicId}_${idx}`;
      const value = respObj.answers[answerKey];
      if (value !== undefined && value !== "" && !isNaN(Number(value))) {
        const rawNum = Number(value);
        const polarity = q.polarity || "negative";
        const riskVal = polarity === "positive" ? 10 - rawNum : rawNum;
        sumRisk += riskVal;
        count++;
      }
    }
  });

  return count > 0 ? sumRisk / count : null;
}

// Calculate risk for dynamic questions
export function calculateCollaboratorDynamicRisk(responses: Record<string, CollaboratorAnswers>, collabId: string, questions: import("./types").Question[]): number | null {
  const respObj = responses[collabId];
  if (!respObj) return null;

  let sumRisk = 0;
  let totalWeight = 0;

  questions.forEach((q) => {
    if (q.type === "scale_0_10") {
      const answerKey = `q_${q.id}`;
      const value = respObj.answers[answerKey];
      if (value !== undefined && value !== "" && !isNaN(Number(value))) {
        const rawNum = Number(value);
        const polarity = q.polarity || "negative";
        const riskVal = polarity === "positive" ? 10 - rawNum : rawNum;
        const w = q.weight || 1;
        sumRisk += riskVal * w;
        totalWeight += w;
      }
    }
  });

  return totalWeight > 0 ? sumRisk / totalWeight : null;
}

// Calculate full global risk score for a collaborator in a given responses dictionary
export function calculateCollaboratorGlobalRisk(responses: Record<string, CollaboratorAnswers>, collabId: string, survey?: Survey): number | null {
  if (survey && survey.questions && survey.questions.length > 0) {
    return calculateCollaboratorDynamicRisk(responses, collabId, survey.questions);
  }

  let weightedSum = 0;
  let totalWeight = 0;

  NR1_TOPICS.forEach(topic => {
    const risk = calculateCollaboratorTopicRisk(responses, collabId, topic.id);
    if (risk !== null) {
      weightedSum += risk * topic.weight;
      totalWeight += topic.weight;
    }
  });

  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

// Calculate global risk score for a company using specific responses dictionary
export function calculateCompanyGlobalRisk(company: Company, responses: Record<string, CollaboratorAnswers>, survey?: Survey): number | null {
  const validScores: number[] = [];

  company.collaborators.forEach(c => {
    const score = calculateCollaboratorGlobalRisk(responses, c.id, survey);
    if (score !== null) {
      validScores.push(score);
    }
  });

  if (validScores.length === 0) return null;
  return validScores.reduce((sum, val) => sum + val, 0) / validScores.length;
}

/** Painel analítico agregado (NR-1) para uma pesquisa ativa */
export function buildOrganizationAnalytics(company: Company, responses: Record<string, CollaboratorAnswers>, survey?: Survey) {
  const scores: number[] = [];
  company.collaborators.forEach(c => {
    const s = calculateCollaboratorGlobalRisk(responses, c.id, survey);
    if (s !== null) scores.push(s);
  });
  
  const iro = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const { stdDev } = calculateCompanyDispersion(scores);
  return {
    iro,
    scores,
    dispersion: stdDev,
    dispersionLevel: getDispersionLevel(stdDev),
    entropy: calculateOrganizationalEntropy(scores),
    bias: calculateSamplingBias(company, responses),
  };
}
