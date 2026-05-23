import type { Company } from "./types";
import { buildDefaultNr1Forms } from "./survey-defaults";

const DEFAULT_COMPANIES: Company[] = [
  {
    id: "comp_1",
    name: "Milhas Aéreas Logística S.A.",
    coverImage: "from-emerald-400 to-teal-500",
    populationSize: 120,
    respondentLabel: "Colaboradores",
    sectors: ["Administrativo", "Logística", "Engenharia/Operações"],
    collaborators: [
      { id: "c_1", name: "Milton Bolonha", sector: "Engenharia/Operações", role: "Auditor Chefe" },
      { id: "c_2", name: "Ana Clara", sector: "Administrativo", role: "Coordenadora de RH" },
      { id: "c_3", name: "Roberto Silva", sector: "Logística", role: "Supervisor de Frota" }
    ],
    surveys: [
      {
        id: "survey_default_comp_1",
        title: "Diagnóstico Inicial NR-1",
        desc: "Campanha inicial de mapeamento ergonômico psicossocial.",
        template: "nr1_compliance",
        surveyMode: "auditor",
        respondentLabel: "Colaboradores",
        aiReport: `### PARECER TÉCNICO ANUAL DE SAÚDE PSICOSSOCIAL (NR-1 / NR-17)\n\n**Organização:** Milhas Aéreas Logística S.A.\n**Nível de Confiança SST:** 88% (n=3 completados de N=120)\n\n---\n\n#### ⚖️ ANÁLISE LEGAL E CONFORMIDADE\nO inquérito indica um **IRO Global de 5.2 / 10 (Alerta Moderado)**.\n\n#### ⚠️ DIVERGÊNCIAS CRÍTICAS E POLARIZAÇÃO INTERNA\nDetectamos uma quebra de consenso grave no setor de **Engenharia/Operações** (Desvio Padrão > 2.8). O Auditor *Milton Bolonha* pontuou riscos críticos de assédio moral e esgotamento, contrastando com relatos mais neutros. Recomenda-se fiscalização assistida e blindagem ergonômica.`,
        createdAt: new Date().toISOString(),
        forms: buildDefaultNr1Forms(),
        flowMode: "per_form",
        iroHistory: [
          {
            date: new Date(Date.now() - 7 * 86400000).toISOString(),
            iro: 4.2,
            n: 2,
            sigmaGlobal: 1.9,
          },
        ],
        continuousLogs: [],
        responses: {
          "c_1": {
            answers: {
              "assedio_1": 8, "assedio_2": 9,
              "gestao_mudancas_0": 8, "gestao_mudancas_3": 8,
              "clareza_funcao_0": 9, "clareza_funcao_3": 8,
              "reconhecimento_0": 8, "reconhecimento_3": 9,
              "suporte_0": 8, "suporte_3": 8,
              "autonomia_0": 8, "autonomia_3": 9,
              "justica_organizacional_0": 9, "justica_organizacional_3": 8,
              "eventos_violentos_2": 9,
              "subcarga_0": 8, "subcarga_3": 8,
              "sobrecarga_0": 9, "sobrecarga_3": 9,
              "relacionamentos_0": 9, "relacionamentos_3": 8,
              "comunicacao_0": 8, "comunicacao_3": 8,
              "trabalho_remoto_1": 8, "trabalho_remoto_3": 8
            },
            completed: true
          },
          "c_2": {
            answers: {
              "assedio_1": 2, "assedio_2": 1,
              "gestao_mudancas_0": 3, "gestao_mudancas_3": 3,
              "clareza_funcao_0": 2, "clareza_funcao_3": 2,
              "reconhecimento_0": 3, "reconhecimento_3": 3,
              "suporte_0": 2, "suporte_3": 2,
              "autonomia_0": 2, "autonomia_3": 2,
              "justica_organizacional_0": 3, "justica_organizacional_3": 2,
              "eventos_violentos_2": 1,
              "subcarga_0": 2, "subcarga_3": 3,
              "sobrecarga_0": 4, "sobrecarga_3": 3,
              "relacionamentos_0": 2, "relacionamentos_3": 2,
              "comunicacao_0": 3, "comunicacao_3": 2,
              "trabalho_remoto_1": 2, "trabalho_remoto_3": 3
            },
            completed: true
          },
          "c_3": {
            answers: {
              "assedio_1": 2, "assedio_2": 3,
              "gestao_mudancas_0": 2, "gestao_mudancas_3": 8,
              "clareza_funcao_0": 3, "clareza_funcao_3": 7,
              "reconhecimento_0": 2, "reconhecimento_3": 8,
              "suporte_0": 2, "suporte_3": 8,
              "autonomia_0": 2, "autonomia_3": 9,
              "justica_organizacional_0": 2, "justica_organizacional_3": 8,
              "eventos_violentos_2": 8,
              "subcarga_0": 3, "subcarga_3": 8,
              "sobrecarga_0": 9, "sobrecarga_3": 9,
              "relacionamentos_0": 2, "relacionamentos_3": 8,
              "comunicacao_0": 2, "comunicacao_3": 8,
              "trabalho_remoto_1": 8, "trabalho_remoto_3": 8
            },
            completed: true
          }
        }
      }
    ]
  },
  {
    id: "comp_2",
    name: "21 Miles Comercial Ltda",
    coverImage: "from-indigo-400 to-purple-500",
    populationSize: 25,
    respondentLabel: "Vendedores",
    sectors: ["Vendas Internas", "Vendas Externas", "Parcerias"],
    collaborators: [
      { id: "v_1", name: "Bruno Silva", sector: "Vendas Internas", role: "SDR Comercial" },
      { id: "v_2", name: "Mariana Abreu", sector: "Vendas Externas", role: "Key Account Manager" },
      { id: "v_3", name: "Felipe Melo", sector: "Parcerias", role: "Head of Partnerships" }
    ],
    surveys: [
      {
        id: "survey_default_comp_2",
        title: "Métricas de Vendas",
        desc: "Acompanhamento comercial contínuo por vendedor.",
        template: "continuous_reporting",
        surveyMode: "auto",
        respondentLabel: "Vendedores",
        aiReport: null,
        createdAt: new Date().toISOString(),
        forms: [],
        flowMode: "per_form",
        iroHistory: [],
        responses: {},
        continuousLogs: [
          { id: "l_1", date: "2026-05-20", collaboratorId: "v_1", qtdVendas: 4, apresentacoes: 8, faturamento: 12000 },
          { id: "l_2", date: "2026-05-20", collaboratorId: "v_2", qtdVendas: 7, apresentacoes: 12, faturamento: 34000 },
          { id: "l_3", date: "2026-05-21", collaboratorId: "v_1", qtdVendas: 3, apresentacoes: 6, faturamento: 9500 },
          { id: "l_4", date: "2026-05-21", collaboratorId: "v_2", qtdVendas: 9, apresentacoes: 15, faturamento: 45000 },
          { id: "l_5", date: "2026-05-22", collaboratorId: "v_3", qtdVendas: 2, apresentacoes: 4, faturamento: 60000 }
        ]
      }
    ]
  }
];

export function buildDefaultCompaniesWithSurveys(): Company[] {
  return DEFAULT_COMPANIES;
}
