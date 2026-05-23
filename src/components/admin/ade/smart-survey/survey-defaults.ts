import { NR1_TOPICS } from "./nr1-topics";
import type { Survey, SurveyForm } from "./types";

export function buildDefaultNr1Forms(): SurveyForm[] {
  return NR1_TOPICS.map((t, i) => ({
    id: `form_${t.id}`,
    title: t.title,
    topicIds: [t.id],
    order: i,
  }));
}

export function createDefaultSurvey(companyId: string, template: Survey["template"]): Survey {
  const isNr1 = template === "nr1_compliance";
  return {
    id: `survey_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: isNr1 ? "Diagnóstico NR-1" : "Métricas operacionais",
    desc: isNr1
      ? "Mapeamento ergonômico psicossocial (13 módulos)."
      : "Acompanhamento contínuo por participante.",
    template,
    surveyMode: "auto",
    respondentLabel: "Entrevistados",
    responses: {},
    continuousLogs: [],
    aiReport: null,
    createdAt: new Date().toISOString(),
    forms: isNr1 ? buildDefaultNr1Forms() : [],
    questions: isNr1 ? NR1_TOPICS.flatMap(t => t.questions) : [],
    flowMode: "per_form",
  };
}
