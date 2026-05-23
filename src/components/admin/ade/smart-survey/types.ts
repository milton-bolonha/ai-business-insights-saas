// Database & domain types

/** Ex.: pular pergunta se outra resposta = valor */
export interface QuestionSkipRule {
  questionKey: string;
  operator: "equals" | "not_equals" | "includes";
  value: string | number | string[];
}

export interface Question {
  id: string; // Add ID so it can be edited dynamically
  type: "scale_0_10" | "multiple_choice_single" | "multiple_choice_multiple" | "text";
  label: string;
  weight?: number; // Added weight for Maker algorithm
  minLabel?: string;
  maxLabel?: string;
  options?: string[];
  placeholder?: string;
  polarity?: "positive" | "negative";
  showIf?: QuestionSkipRule;
}

/** Formulário dentro de uma pesquisa (um módulo NR-1 ou bloco customizado) */
export interface SurveyForm {
  id: string;
  title: string;
  topicIds: string[];
  order: number;
}

export type SurveyFlowMode = "sequential" | "per_form";

export interface SurveyTopic {
  id: string;
  title: string;
  possibleConsequences: string[];
  weight: number; // Peso regulatório w_t
  /** Multiplicador de criticidade contextual c_t (default 1) */
  criticalityMultiplier?: number;
  questions: Question[];
}

/** Snapshot temporal do IRO (histórico para variação / tendência) */
export interface IroSnapshot {
  date: string; // ISO
  iro: number;
  n: number;
  sigmaGlobal: number | null;
}

export interface Collaborator {
  id: string;
  name: string;
  sector: string;
  role: string;
}

export interface CollaboratorAnswers {
  answers: Record<string, any>; // questionKey = topicId_qIndex -> value (number, string, string[])
  completed: boolean;
}

export interface ClerkInvite {
  id: string;
  email: string;
  role: "auditor" | "respondent";
  status: "pending" | "accepted";
  sentAt: string;
  companyId: string;
}

export interface ContinuousLog {
  id: string;
  date: string;
  collaboratorId: string;
  qtdVendas: number;
  apresentacoes: number;
  faturamento: number;
}

export type SurveyTemplateType = "nr1_compliance" | "continuous_reporting" | "todo_algorithm";

export interface Survey {
  id: string;
  title: string;
  desc: string;
  template: SurveyTemplateType;
  surveyMode: "auto" | "auditor";
  respondentLabel?: string;
  responses: Record<string, CollaboratorAnswers>;
  continuousLogs: ContinuousLog[];
  aiReport: string | null;
  createdAt: string;
  forms?: SurveyForm[];
  questions?: Question[];
  accent?: string;
  iconId?: string;
  flowMode?: SurveyFlowMode;
  iroHistory?: IroSnapshot[];
}

export interface Company {
  id: string;
  name: string;
  coverImage: string; // custom cover image theme class
  populationSize: number; // N
  respondentLabel: string; // rótulo configurável: "Entrevistados" (default), "Vendedores", etc.
  sectors: string[];
  collaborators: Collaborator[];
  surveys?: Survey[];
}
