"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useToast } from "@/lib/state/toast-context";
import { NR1_TOPICS } from "@/components/admin/ade/smart-survey/nr1-topics";
import {
  getRiskLevel,
  calculateSamplingStats,
  calculateCollaboratorTopicRisk,
  calculateCollaboratorGlobalRisk,
  calculateCompanyGlobalRisk,
  buildOrganizationAnalytics,
  calculateIroTrend,
  appendIroSnapshot,
} from "@/components/admin/ade/smart-survey/risk-engine";
import { buildDefaultCompaniesWithSurveys } from "@/components/admin/ade/smart-survey/default-companies";
import {
  createDefaultSurvey,
  buildDefaultNr1Forms,
} from "@/components/admin/ade/smart-survey/survey-defaults";
import { buildMethodologyPdfSection } from "@/components/admin/ade/smart-survey/methodology-content";
import { isQuestionVisible } from "@/components/admin/ade/smart-survey/survey-flow";
import type {
  Company,
  Collaborator,
  ClerkInvite,
  ContinuousLog,
  Survey,
  SurveyTemplateType,
} from "@/components/admin/ade/smart-survey/types";

export function useSmartSurveyBoard(
  workspaceId: string,
  dashboardId?: string,
  tiles?: any[],
  updateTileMutation?: any,
) {
  const { push } = useToast();

  // Multi-Company States
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );

  // Phase 4 State Hook additions
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);
  const [selectedCollabIdForDetails, setSelectedCollabIdForDetails] = useState<
    string | null
  >(null);

  // Active Company Context derived
  const activeCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Active Survey Context derived
  const activeSurvey = useMemo(() => {
    if (!activeCompany) return null;
    const list = activeCompany.surveys || [];
    return list.find((s) => s.id === selectedSurveyId) || list[0] || null;
  }, [activeCompany, selectedSurveyId]);

  // Sync selected survey upon company switch
  useEffect(() => {
    if (activeCompany) {
      const list = activeCompany.surveys || [];
      if (list.length > 0) {
        const exists = list.some((s) => s.id === selectedSurveyId);
        if (!exists) {
          setSelectedSurveyId(list[0].id);
        }
      }
    } else {
      setSelectedSurveyId(null);
    }
    // Also reset split panel and subTab
    setSelectedCollabIdForDetails(null);
    if (activeCompany) {
      setSubTab("surveys");
    }
  }, [selectedCompanyId, activeCompany]);

  // Clerk Mock Role Switcher
  const [sessionRole, setSessionRole] = useState<
    "admin" | "auditor" | "respondent"
  >("admin");

  // Mock Clerk Invites Store
  const [clerkInvites, setClerkInvites] = useState<ClerkInvite[]>([]);

  // Sub tab inside company view
  const [subTab, setSubTab] = useState<
    | "dashboard"
    | "collaborators"
    | "settings"
    | "auditor_panel"
    | "interviewee_panel"
    | "surveys"
  >("surveys");

  // CRUD state inputs
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyN, setNewCompanyN] = useState("100");
  const [newCompanyLabel, setNewCompanyLabel] = useState("Entrevistados");
  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [newSurveyTemplate, setNewSurveyTemplate] =
    useState<SurveyTemplateType>("nr1_compliance");
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);
  const [newCompanyTemplate, setNewCompanyTemplate] = useState<
    "nr1_compliance" | "continuous_reporting"
  >("nr1_compliance");
  const [newCompanyCover, setNewCompanyCover] = useState(
    "from-emerald-400 to-teal-500",
  );

  // Search & Filter state for Company Directory
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companyTemplateFilter, setCompanyTemplateFilter] = useState<
    "all" | "nr1_compliance" | "continuous_reporting"
  >("all");

  // Sector state inputs
  const [newSectorName, setNewSectorName] = useState("");

  // Collaborator Registration inputs
  const [showAddCollab, setShowAddCollab] = useState(false);
  const [newCollabName, setNewCollabName] = useState("");
  const [newCollabSector, setNewCollabSector] = useState("");
  const [newCollabRole, setNewCollabRole] = useState("");

  // Clerk Invite form inputs
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"auditor" | "respondent">(
    "auditor",
  );

  // Continuous metrics logging inputs
  const [logDate, setLogDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [logCollabId, setLogCollabId] = useState("");
  const [logQtdVendas, setLogQtdVendas] = useState("0");
  const [logApresentacoes, setLogApresentacoes] = useState("0");
  const [logFaturamento, setLogFaturamento] = useState("0");

  // Selection dropdown for active auditor / respondent guest screens
  const [guestAuditorId, setGuestAuditorId] = useState("");
  const [guestRespondentId, setGuestRespondentId] = useState("");

  // Continuous View scopes
  const [reportScope, setReportScope] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [continuousViewTab, setContinuousViewTab] = useState<
    "consolidated" | "history"
  >("consolidated");

  // Zero-Distraction Form Overlay state
  const [activeFormOverlay, setActiveFormOverlay] = useState<{
    topicIndex: number;
    questionIndex: number;
    collaboratorId: string;
    singleModuleOnly: boolean;
  } | null>(null);

  const [overlayAnswers, setOverlayAnswers] = useState<Record<string, any>>({});

  // AI Parecer status
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const surveyTile = useMemo(() => {
    return tiles?.find(
      (t: any) =>
        t.templateId === "template_smart_survey" || t.category === "survey",
    );
  }, [tiles]);

  // Sync state from LocalStorage/DB on mount/workspace change
  useEffect(() => {
    if (!workspaceId) return;
    const storageKey = `smart_survey_v5_${workspaceId}`;
    try {
      let parsed = null;
      if (surveyTile?.content && surveyTile.content.length > 10) {
        try {
          parsed = JSON.parse(surveyTile.content);
        } catch (e) {
          console.warn("Could not parse tile content JSON", e);
        }
      }

      if (!parsed) {
        // localStorage.getItem(storageKey); // Removido para garantir single source of truth
      }

      if (parsed) {
        const migratedCompanies = (parsed.companies || []).map(
          (company: Company) => {
            if (!company.surveys || company.surveys.length === 0) {
              company.surveys = [
                {
                  id: `survey_default_${company.id}`,
                  title:
                    company.surveys?.[0]?.template === "nr1_compliance"
                      ? "Diagnóstico Inicial NR-1"
                      : "Métricas de Vendas",
                  desc:
                    company.surveys?.[0]?.template === "nr1_compliance"
                      ? "Campanha inicial de mapeamento ergonômico psicossocial."
                      : "Acompanhamento comercial contínuo por vendedor.",
                  template: company.surveys?.[0]?.template || "nr1_compliance",
                  surveyMode: "auto",
                  respondentLabel: company.respondentLabel || "Entrevistados",
                  responses: company.surveys?.[0]?.responses || {},
                  continuousLogs: company.surveys?.[0]?.continuousLogs || [],
                  aiReport: company.surveys?.[0]?.aiReport || null,
                  createdAt: new Date().toISOString(),
                  forms:
                    company.surveys?.[0]?.template === "nr1_compliance"
                      ? buildDefaultNr1Forms()
                      : [],
                  flowMode: "per_form",
                },
              ];
            }
            company.surveys = (company.surveys || []).map((s: Survey) => ({
              ...s,
              forms: s.forms?.length
                ? s.forms
                : s.template === "nr1_compliance"
                  ? buildDefaultNr1Forms()
                  : [],
              flowMode: s.flowMode || "per_form",
            }));
            if (!company.respondentLabel)
              company.respondentLabel = "Entrevistados";
            return company;
          },
        );
        setCompanies(migratedCompanies);
        setClerkInvites(parsed.clerkInvites || []);
        // Removido: if (parsed.activeCompanyId) setSelectedCompanyId(parsed.activeCompanyId);
      } else {
        const defaultCompaniesWithSurveys = buildDefaultCompaniesWithSurveys();
        setCompanies(defaultCompaniesWithSurveys);
        saveState(defaultCompaniesWithSurveys, []);
      }
    } catch (e) {
      console.error("Erro carregando LocalStorage", e);
    }
  }, [workspaceId]);

  // Save changes helper
  const saveState = (
    updatedCompanies: Company[],
    updatedInvites: ClerkInvite[] = clerkInvites,
    activeId: string | null = selectedCompanyId,
  ) => {
    if (!workspaceId) return;
    const storageKey = `smart_survey_v5_${workspaceId}`;
    try {
      const dataString = JSON.stringify({
        companies: updatedCompanies,
        clerkInvites: updatedInvites,
        activeCompanyId: activeId,
      });
      // localStorage.setItem(storageKey, dataString); // Removido

      // Save to DB via React Query mutation
      if (dashboardId && surveyTile && updateTileMutation) {
        updateTileMutation.mutate({
          tileId: surveyTile.id,
          dashboardId,
          workspaceId,
          updates: { content: dataString },
        });
      }
    } catch (e) {
      console.error("Erro salvando LocalStorage/DB", e);
    }
  };

  // Sync state helpers
  const syncSurveyIroHistory = (
    company: Company,
    surveyId: string | null,
  ): Company => {
    if (!surveyId) return company;
    const existingSurveys = company.surveys || [];
    const targetSurvey = existingSurveys.find((s) => s.id === surveyId);
    if (!targetSurvey || targetSurvey.template !== "nr1_compliance")
      return company;
    const responses = targetSurvey.responses || {};
    const analytics = buildOrganizationAnalytics(company, responses);
    if (analytics?.iro === null || analytics?.iro === undefined) return company;
    const n = Object.values(responses).filter((r) => r.completed).length;
    const patched = appendIroSnapshot(
      targetSurvey,
      analytics.iro,
      n,
      analytics.dispersion,
    );
    if (patched === targetSurvey) return company;
    return {
      ...company,
      surveys: existingSurveys.map((s) => (s.id === surveyId ? patched : s)),
    };
  };

  const updateCompanyInState = (updated: Company) => {
    const withHistory = syncSurveyIroHistory(updated, selectedSurveyId);
    const list = companies.map((c) =>
      c.id === withHistory.id ? withHistory : c,
    );
    setCompanies(list);
    saveState(list, clerkInvites, selectedCompanyId);
  };

  // Auto-populate helper selects on company changes
  useEffect(() => {
    if (activeCompany) {
      if (activeCompany.collaborators.length > 0) {
        setLogCollabId(activeCompany.collaborators[0].id);
        setGuestRespondentId(activeCompany.collaborators[0].id);
      }
      if (activeCompany.sectors.length > 0) {
        setNewCollabSector(activeCompany.sectors[0]);
      }
    }
  }, [selectedCompanyId, activeCompany]);

  // ==========================================
  // 📐 Math Engine & Polarity Scoring
  // ==========================================

  // Active Survey Responses derived helper
  const activeSurveyResponses = useMemo(() => {
    return activeSurvey?.responses || {};
  }, [activeCompany, activeSurvey]);

  // Calculate specific topic risk score for a single collaborator
  const getCollaboratorTopicRisk = (
    collabId: string,
    topicId: string,
  ): number | null => {
    if (!activeCompany) return null;
    return calculateCollaboratorTopicRisk(
      activeSurveyResponses,
      collabId,
      topicId,
    );
  };

  // Calculate full global risk score for a collaborator
  const getCollaboratorGlobalRisk = (collabId: string): number | null => {
    if (!activeCompany) return null;
    return calculateCollaboratorGlobalRisk(activeSurveyResponses, collabId);
  };

  // Get completed sample size (n) for active company / survey
  const completedSamplesCount = useMemo(() => {
    if (!activeCompany) return 0;
    return Object.values(activeSurveyResponses).filter((r) => r.completed)
      .length;
  }, [activeCompany, activeSurveyResponses]);

  // Company Global Average Risk Score
  const companyGlobalRiskAverage = useMemo(() => {
    if (
      !activeCompany ||
      !activeSurvey ||
      activeSurvey.template !== "nr1_compliance"
    )
      return null;

    const validScores: number[] = [];
    activeCompany.collaborators.forEach((c) => {
      const s = getCollaboratorGlobalRisk(c.id);
      if (s !== null) validScores.push(s);
    });

    if (validScores.length === 0) return null;
    return validScores.reduce((sum, val) => sum + val, 0) / validScores.length;
  }, [activeCompany, activeSurveyResponses, companies]);

  const samplingStats = useMemo(() => {
    if (!activeCompany) return null;
    return calculateSamplingStats(
      completedSamplesCount,
      activeCompany.populationSize,
    );
  }, [activeCompany, completedSamplesCount]);

  /** @deprecated alias — use samplingStats.coveragePercent */
  const companyConfidenceLevel = samplingStats?.coveragePercent ?? 0;

  // Group and aggregate continuous logs depending on reportScope
  const aggregatedLogs = useMemo(() => {
    if (!activeSurvey || !activeSurvey.continuousLogs) return [];

    const groups: Record<
      string,
      {
        label: string;
        sortKey: string;
        qtdVendas: number;
        apresentacoes: number;
        faturamento: number;
        sellerMap: Record<string, number>;
      }
    > = {};

    activeSurvey.continuousLogs.forEach((log) => {
      let key = "";
      let label = "";
      let sortKey = "";

      if (reportScope === "daily") {
        key = log.date;
        try {
          label = new Date(log.date + "T00:00:00").toLocaleDateString("pt-BR");
        } catch (e) {
          label = log.date;
        }
        sortKey = log.date;
      } else if (reportScope === "weekly") {
        try {
          const date = new Date(log.date + "T00:00:00");
          const oneJan = new Date(date.getFullYear(), 0, 1);
          const numberOfDays = Math.floor(
            (date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000),
          );
          const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
          key = `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
          label = `Semana ${week} (${date.getFullYear()})`;
          sortKey = key;
        } catch (e) {
          key = log.date;
          label = log.date;
          sortKey = log.date;
        }
      } else {
        try {
          const date = new Date(log.date + "T00:00:00");
          const months = [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
          ];
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          label = `${months[date.getMonth()]} / ${date.getFullYear()}`;
          sortKey = key;
        } catch (e) {
          key = log.date;
          label = log.date;
          sortKey = log.date;
        }
      }

      if (!groups[key]) {
        groups[key] = {
          label,
          sortKey,
          qtdVendas: 0,
          apresentacoes: 0,
          faturamento: 0,
          sellerMap: {},
        };
      }

      groups[key].qtdVendas += log.qtdVendas;
      groups[key].apresentacoes += log.apresentacoes;
      groups[key].faturamento += log.faturamento;

      const collabName =
        activeCompany?.collaborators.find((c) => c.id === log.collaboratorId)
          ?.name || "Excluído";
      groups[key].sellerMap[collabName] =
        (groups[key].sellerMap[collabName] || 0) + log.faturamento;
    });

    return Object.entries(groups)
      .map(([key, data]) => {
        let topSellerName = "Nenhum";
        let topSellerFaturamento = 0;
        Object.entries(data.sellerMap).forEach(([name, fat]) => {
          if (fat > topSellerFaturamento) {
            topSellerFaturamento = fat;
            topSellerName = name;
          }
        });

        return {
          periodKey: key,
          label: data.label,
          sortKey: data.sortKey,
          qtdVendas: data.qtdVendas,
          apresentacoes: data.apresentacoes,
          faturamento: data.faturamento,
          topSellerName,
          topSellerFaturamento,
        };
      })
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [activeCompany, reportScope]);

  // Sector breakdown stats
  const sectorBreakdowns = useMemo(() => {
    if (!activeCompany) return {};
    const res: Record<
      string,
      {
        count: number;
        sum: number;
        scores: number[];
        avg: number | null;
        stdDev: number;
        isPolarized: boolean;
      }
    > = {};

    activeCompany.sectors.forEach((s) => {
      res[s] = {
        count: 0,
        sum: 0,
        scores: [],
        avg: null,
        stdDev: 0,
        isPolarized: false,
      };
    });

    activeCompany.collaborators.forEach((collab) => {
      const score = getCollaboratorGlobalRisk(collab.id);
      if (score !== null) {
        if (!res[collab.sector]) {
          res[collab.sector] = {
            count: 0,
            sum: 0,
            scores: [],
            avg: null,
            stdDev: 0,
            isPolarized: false,
          };
        }
        res[collab.sector].count++;
        res[collab.sector].sum += score;
        res[collab.sector].scores.push(score);
      }
    });

    Object.keys(res).forEach((s) => {
      const sec = res[s];
      if (sec.count > 0) {
        sec.avg = sec.sum / sec.count;
      }
      if (sec.count >= 2 && sec.avg !== null) {
        const avg = sec.avg;
        const variance =
          sec.scores.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
          sec.count;
        sec.stdDev = Math.sqrt(variance);
        sec.isPolarized = sec.stdDev >= 2.0; // Consensus rupture alert threshold
      }
    });

    return res;
  }, [activeCompany, activeSurveyResponses, companies]);

  const polarizedSectorsCount = useMemo(() => {
    return Object.values(sectorBreakdowns).filter((s) => s.isPolarized).length;
  }, [sectorBreakdowns]);

  const organizationAnalytics = useMemo(() => {
    if (!activeCompany) return null;
    return buildOrganizationAnalytics(activeCompany, activeSurveyResponses);
  }, [activeCompany, activeSurveyResponses]);

  const iroTrend = useMemo(() => {
    const iro = organizationAnalytics?.iro ?? companyGlobalRiskAverage;
    return calculateIroTrend(activeSurvey?.iroHistory, iro);
  }, [activeSurvey, organizationAnalytics, companyGlobalRiskAverage]);

  // ==========================================
  // 🏢 Multi-Company Directory Operations
  // ==========================================

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const newComp: Company = {
      id: `comp_${Math.random().toString(36).substring(2, 9)}`,
      name: newCompanyName.trim(),
      coverImage: newCompanyCover,
      populationSize: Math.max(2, Number(newCompanyN) || 100),
      respondentLabel: newCompanyLabel.trim() || "Entrevistados",
      sectors: ["Geral", "Administrativo"],
      collaborators: [],
      surveys: [
        {
          ...createDefaultSurvey(`comp_new`, newCompanyTemplate),
          surveyMode: "auditor",
        },
      ],
    };
    newComp.surveys![0].id = `survey_default_${newComp.id}`;

    const updated = [...companies, newComp];
    setCompanies(updated);
    setNewCompanyName("");
    saveState(updated, clerkInvites);
    setIsCreateModalOpen(false);
    push({
      title: "Empresa criada",
      description: `"${newComp.name}" adicionada ao diretório.`,
      variant: "success",
    });
  };

  const handleAddSurvey = () => {
    if (!activeCompany || !newSurveyTitle.trim()) return;
    const survey = createDefaultSurvey(activeCompany.id, newSurveyTemplate);
    survey.title = newSurveyTitle.trim();
    const updated: Company = {
      ...activeCompany,
      surveys: [...(activeCompany.surveys || []), survey],
    };
    updateCompanyInState(updated);
    setSelectedSurveyId(survey.id);
    setNewSurveyTitle("");
    push({
      title: "Pesquisa criada",
      description: survey.title,
      variant: "success",
    });
  };

  const handleDeleteSurvey = (surveyId: string) => {
    if (!activeCompany) return;
    if (!confirm("Excluir esta pesquisa e todas as respostas vinculadas?"))
      return;
    const updated: Company = {
      ...activeCompany,
      surveys: (activeCompany.surveys || []).filter((s) => s.id !== surveyId),
    };
    updateCompanyInState(updated);
    if (selectedSurveyId === surveyId)
      setSelectedSurveyId(updated.surveys?.[0]?.id || null);
  };

  const handleUpdateSurveyMeta = (surveyId: string, patch: Partial<Survey>) => {
    if (!activeCompany) return;
    const updated: Company = {
      ...activeCompany,
      surveys: (activeCompany.surveys || []).map((s) =>
        s.id === surveyId ? { ...s, ...patch } : s,
      ),
    };
    updateCompanyInState(updated);
    setEditingSurveyId(null);
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (
      confirm(
        `Tem certeza que deseja apagar a empresa "${name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      const updated = companies.filter((c) => c.id !== id);
      setCompanies(updated);
      if (selectedCompanyId === id) {
        setSelectedCompanyId(null);
      }
      saveState(updated, clerkInvites, null);
      push({
        title: "Empresa apagada",
        description: `"${name}" removida com sucesso.`,
        variant: "default",
      });
    }
  };

  // ==========================================
  // 👤 Roster / Collaborators Operations
  // ==========================================

  const handleAddCollabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !newCollabName.trim() || !newCollabSector) return;

    const newC: Collaborator = {
      id: `col_${Math.random().toString(36).substring(2, 9)}`,
      name: newCollabName.trim(),
      sector: newCollabSector,
      role: newCollabRole.trim() || "Colaborador",
    };

    const updatedCollabs = [...activeCompany.collaborators, newC];
    const updatedCompany: Company = {
      ...activeCompany,
      collaborators: updatedCollabs,
    };
    updateCompanyInState(updatedCompany);

    setNewCollabName("");
    setNewCollabRole("");
    setShowAddCollab(false);
    push({
      title: "Cadastro Concluído",
      description: `"${newC.name}" foi registrado com sucesso.`,
      variant: "success",
    });
  };

  const handleDeleteCollab = (id: string, name: string) => {
    if (!activeCompany) return;
    if (
      confirm(
        `Excluir o cadastro de ${name}? Todas as respostas ligadas serão perdidas.`,
      )
    ) {
      const updatedCollabs = activeCompany.collaborators.filter(
        (c) => c.id !== id,
      );
      if (!activeSurvey) return;
      const updatedResponses = { ...activeSurvey.responses };
      delete updatedResponses[id];
      const updatedCompany: Company = {
        ...activeCompany,
        collaborators: updatedCollabs,
      };
      updateCompanyInState(updatedCompany);
      push({
        title: "Colaborador removido",
        description: `${name} excluído do banco de dados.`,
        variant: "default",
      });
    }
  };

  // ==========================================
  // ⚙️ Settings / Sectors & Info CRUD
  // ==========================================

  const handleUpdateCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    updateCompanyInState(activeCompany);
    push({
      title: "Parâmetros atualizados",
      description: "Configurações SST salvas com sucesso.",
      variant: "success",
    });
  };

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !newSectorName.trim()) return;
    const name = newSectorName.trim();
    if (activeCompany.sectors.includes(name)) {
      push({
        title: "Setor já existe",
        description: "Setor já cadastrado.",
        variant: "destructive",
      });
      return;
    }

    const updatedSectors = [...activeCompany.sectors, name];
    const updatedCompany: Company = {
      ...activeCompany,
      sectors: updatedSectors,
    };
    updateCompanyInState(updatedCompany);
    setNewSectorName("");
    push({
      title: "Setor adicionado",
      description: `"${name}" incluído.`,
      variant: "success",
    });
  };

  const handleDeleteSector = (secName: string) => {
    if (!activeCompany) return;
    if (activeCompany.sectors.length <= 1) {
      push({
        title: "Ação não permitida",
        description: "Pelo menos um setor deve estar cadastrado.",
        variant: "destructive",
      });
      return;
    }
    const updatedSectors = activeCompany.sectors.filter((s) => s !== secName);
    const updatedCompany: Company = {
      ...activeCompany,
      sectors: updatedSectors,
    };
    updateCompanyInState(updatedCompany);
    push({
      title: "Setor removido",
      description: `"${secName}" removido.`,
      variant: "default",
    });
  };

  // ==========================================
  // 🔑 Clerk Mock Invites System
  // ==========================================

  const handleSendMockInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedCompanyId) return;

    const newInvite: ClerkInvite = {
      id: `inv_${Math.random().toString(36).substring(2, 9)}`,
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "pending",
      sentAt: new Date().toLocaleDateString("pt-BR"),
      companyId: selectedCompanyId,
    };

    const updated = [...clerkInvites, newInvite];
    setClerkInvites(updated);
    setInviteEmail("");
    saveState(companies, updated);

    push({
      title: "Convite enviado",
      description: `Link de acesso enviado para ${newInvite.email}.`,
      variant: "success",
    });
  };

  const handleDeleteInvite = (id: string) => {
    const updated = clerkInvites.filter((inv) => inv.id !== id);
    setClerkInvites(updated);
    saveState(companies, updated);
    push({
      title: "Convite revogado",
      description: "O link foi invalidado.",
      variant: "default",
    });
  };

  // ==========================================
  // 📈 Continuous Reporting Logging Operations
  // ==========================================

  const handleAddContinuousLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !logCollabId) return;

    const entry: ContinuousLog = {
      id: `log_${Math.random().toString(36).substring(2, 9)}`,
      date: logDate,
      collaboratorId: logCollabId,
      qtdVendas: Math.max(0, Number(logQtdVendas) || 0),
      apresentacoes: Math.max(0, Number(logApresentacoes) || 0),
      faturamento: Math.max(0, Number(logFaturamento) || 0),
    };

    if (!activeSurvey) return;
    const updatedLogs = [entry, ...(activeSurvey.continuousLogs || [])];
    const updatedSurvey = { ...activeSurvey, continuousLogs: updatedLogs };
    const updatedCompany: Company = {
      ...activeCompany,
      surveys: activeCompany.surveys?.map((s) =>
        s.id === activeSurvey.id ? updatedSurvey : s,
      ),
    };
    updateCompanyInState(updatedCompany);

    setLogQtdVendas("0");
    setLogApresentacoes("0");
    setLogFaturamento("0");

    push({
      title: "Registro Salvo",
      description: "Entrada contínua adicionada ao histórico.",
      variant: "success",
    });
  };

  const handleDeleteContinuousLog = (id: string) => {
    if (!activeCompany) return;
    if (!activeSurvey) return;
    const updatedLogs = activeSurvey.continuousLogs.filter((l) => l.id !== id);
    const updatedSurvey = { ...activeSurvey, continuousLogs: updatedLogs };
    const updatedCompany: Company = {
      ...activeCompany,
      surveys: activeCompany.surveys?.map((s) =>
        s.id === activeSurvey.id ? updatedSurvey : s,
      ),
    };
    updateCompanyInState(updatedCompany);
    push({
      title: "Registro removido",
      description: "Entrada excluída do histórico contínuo.",
      variant: "default",
    });
  };

  // Dev simulation tool
  const handleSimulateSurveyResponses = () => {
    if (!activeCompany) return;

    if (!activeSurvey) return;
    const newResponses = { ...activeSurvey.responses };

    const hasDynamicQuestions =
      activeSurvey?.questions && activeSurvey.questions.length > 0;

    activeCompany.collaborators.forEach((collab) => {
      const answers: Record<string, any> = {};
      let bias = 0;

      if (collab.sector === "Operações")
        bias = 8; // High stress sector
      else if (collab.sector === "RH") bias = 2; // Low stress

      if (hasDynamicQuestions) {
        activeSurvey!.questions!.forEach((q) => {
          const key = `q_${q.id}`;
          if (q.type === "scale_0_10") {
            const randomVal =
              bias > 0
                ? Math.max(
                    0,
                    Math.min(10, bias + Math.round(Math.random() * 2 - 1)),
                  )
                : Math.round(Math.random() * 7);
            answers[key] = randomVal;
          } else if (q.type === "multiple_choice_single") {
            answers[key] = q.options
              ? q.options[Math.floor(Math.random() * q.options.length)]
              : "";
          } else if (q.type === "multiple_choice_multiple") {
            answers[key] = q.options ? [q.options[0]] : [];
          } else {
            answers[key] = "";
          }
        });
      } else {
        NR1_TOPICS.forEach((topic) => {
          topic.questions.forEach((q, idx) => {
            const key = `${topic.id}_${idx}`;
            if (q.type === "scale_0_10") {
              const randomVal =
                bias > 0
                  ? Math.max(
                      0,
                      Math.min(10, bias + Math.round(Math.random() * 2 - 1)),
                    )
                  : Math.round(Math.random() * 7);
              answers[key] = randomVal;
            } else if (q.type === "multiple_choice_single") {
              answers[key] = q.options
                ? q.options[Math.floor(Math.random() * q.options.length)]
                : "";
            } else if (q.type === "multiple_choice_multiple") {
              answers[key] = q.options ? [q.options[0]] : [];
            } else {
              answers[key] = "";
            }
          });
        });
      }

      newResponses[collab.id] = { answers, completed: true };
    });

    const updatedCompany = { ...activeCompany, responses: newResponses };
    updateCompanyInState(updatedCompany);
    push({
      title: "Dados Simulados",
      description: "Respostas ergonômicas registradas em lote.",
      variant: "success",
    });
  };

  // ==========================================
  // 🤖 AI Technical Report Generation
  // ==========================================

  const handleGenerateAIReport = () => {
    if (!activeCompany || completedSamplesCount === 0) {
      push({
        title: "Erro de análise",
        description:
          "Responda a pelo menos um inquérito completo para processar a IA.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);

    setTimeout(() => {
      const riskLevel = getRiskLevel(companyGlobalRiskAverage);
      const overallAvg = companyGlobalRiskAverage
        ? companyGlobalRiskAverage.toFixed(1)
        : "0.0";
      const dateStr = new Date().toLocaleDateString("pt-BR");

      let recommendations = "";
      if (companyGlobalRiskAverage && companyGlobalRiskAverage >= 7.0) {
        recommendations = `
1. **Medida Ergonômica Organizacional (NR-17):** Implantação urgente de rodízio operacional e pausas psicossociais estruturadas obrigatórias de 10 minutos a cada 50 minutos de digitação/atividade repetitiva.
2. **Canal Independente de Mediação de Atritos:** Estabelecer canal seguro e anônimo sob tutela de profissional especializado para blindar desvios éticos graves.
3. **Plano de Redefinição de Metas:** Mitigar cobrança excessiva e metas com prazo incompatível que acarretam fadiga mental e burnout.
        `.trim();
      } else if (companyGlobalRiskAverage && companyGlobalRiskAverage >= 4.0) {
        recommendations = `
1. **Treinamento Sistêmico de Lideranças SST:** Qualificar chefias imediatas para atuar como facilitadores de suporte psicossocial e ergonômico.
2. **Comunicação Estruturada de Mudanças:** Adotar prazos razoáveis para treinamento e aviso prévio durante processos de reestruturação de tarefas.
3. **Equilíbrio Trabalho Remoto:** Oferecer diretrizes e subsídios para regulação ergonômica de postos home-office.
        `.trim();
      } else {
        recommendations = `
1. **Manutenção Preventiva:** Auditoria anual regular para verificação de clima organizacional e manutenção de postos ergonômicos normativos.
2. **Campanhas de Cooperação Interna:** Incentivar rotinas horizontais de feedback positivo e cooperação técnica.
        `.trim();
      }

      let polarizedAlerts = "";
      Object.entries(sectorBreakdowns).forEach(([sec, data]) => {
        if (data.isPolarized) {
          polarizedAlerts += `\n- **Setor ${sec}:** Divergência aguda interna com desvio padrão de **${data.stdDev.toFixed(2)}**. O time apresenta polarização grave de clima ergonômico.`;
        }
      });

      const analytics = organizationAnalytics;
      const stats =
        samplingStats ||
        calculateSamplingStats(
          completedSamplesCount,
          activeCompany.populationSize,
        );
      const trend = iroTrend;
      const analyticsBlock = analytics
        ? `
- **Dispersão global (desvio dos Sp):** ${analytics.dispersion !== null ? analytics.dispersion.toFixed(2) : "—"} (${analytics.dispersionLevel.label})
- **Viés amostral:** ${analytics.bias ? `${analytics.bias.biasIndex}% — ${analytics.bias.label}` : "não calculado"}
- **Diversidade de scores (entropia):** ${analytics.entropy ? `${analytics.entropy.normalized}% — ${analytics.entropy.label}` : "—"}
- **Cobertura da amostra:** ${stats.coveragePercent}% (n=${completedSamplesCount}, N=${activeCompany.populationSize})${stats.marginOfErrorPercent !== null ? ` · margem de erro ≈ ±${stats.marginOfErrorPercent}%` : ""}
- **Variação do IRO:** ${trend.delta !== null ? `${trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(2)} (${trend.label})` : "sem histórico anterior"}
`
        : "";

      const aiText = `### LAUDO COMPLETO E PARECER TÉCNICO ERGONÔMICO (NR-1 / NR-17)

**Empresa Auditada:** ${activeCompany.name}  
**Pesquisa:** ${activeSurvey?.title || "Ativa"}  
**População (N):** ${activeCompany.populationSize} &nbsp;|&nbsp; **Amostra concluída (n):** ${completedSamplesCount}  
**Data da Emissão:** ${dateStr}

---

#### ⚖️ ANÁLISE LEGAL DO PROGRAMA DE GERENCIAMENTO DE RISCOS (PGR)
Em cumprimento à **Portaria MTE n° 1.419/2024 (NR-1)** e **NR-17**, este parecer avalia riscos psicossociais com metodologia quantitativa (Sp ponderado por módulo, IRO como média dos Sp).

---

#### 📊 RESULTADOS CONSOLIDADOS E DIAGNÓSTICO
- **IRO (média dos Sp):** **${overallAvg} / 10**
- **Classificação:** **${riskLevel.label.toUpperCase()}**
- **Setores com polarização interna (σ≥2):** ${polarizedSectorsCount}
${polarizedAlerts}
${analyticsBlock}

---

#### 🛠️ PLANO DE CONTROLE SST E CRONOGRAMA DE AÇÃO
O auditor do trabalho e os gestores SST devem priorizar imediatamente as seguintes remediações:
${recommendations}

---
*Laudo corporativo normativo em SST emitido em conformidade com as regras ministeriais brasileiras.*`;

      const updatedSurveys = (activeCompany.surveys || []).map((s) =>
        s.id === activeSurvey?.id ? { ...s, aiReport: aiText } : s,
      );
      const updatedCompany: Company = {
        ...activeCompany,
        surveys: updatedSurveys,
      };
      updateCompanyInState(updatedCompany);
      setIsGeneratingAI(false);
      push({
        title: "Parecer IA Gerado",
        description: "O parecer foi arquivado e incorporado ao GRO.",
        variant: "success",
      });
    }, 1800);
  };

  // ==========================================
  // 🖨️ PDF Print Premium Layout
  // ==========================================

  const handlePrintPremiumPDF = () => {
    if (!activeCompany) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const risk = getRiskLevel(companyGlobalRiskAverage);
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const stats =
      samplingStats ||
      calculateSamplingStats(
        completedSamplesCount,
        activeCompany.populationSize,
      );
    const surveyTitle = activeSurvey?.title || "Pesquisa ativa";
    const analyticsPdf = organizationAnalytics;
    const trendPdf = iroTrend;
    const extraMetricsPdf =
      analyticsPdf && activeSurvey?.template === "nr1_compliance"
        ? `<br/>Dispersão global: ${analyticsPdf.dispersion !== null ? analyticsPdf.dispersion.toFixed(2) : "—"} (${analyticsPdf.dispersionLevel.label})
             · Viés amostral: ${analyticsPdf.bias ? analyticsPdf.bias.biasIndex + "%" : "—"}
             · Variação IRO: ${trendPdf.delta !== null ? (trendPdf.delta > 0 ? "+" : "") + trendPdf.delta.toFixed(2) : "sem histórico"}`
        : "";

    const sectorsHtml = Object.entries(sectorBreakdowns)
      .map(([name, data]) => {
        const secRisk = getRiskLevel(data.avg);
        const polAlert = data.isPolarized
          ? `<span style="background:#fee2e2; color:#ef4444; border: 1px solid #fecaca; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; margin-left:10px;">RUPTURA DE CONSENSO</span>`
          : "";
        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding:14px; font-weight:bold; font-size:13px; color:#111827;">${name}</td>
          <td style="padding:14px; text-align:center; font-size:13px; color:#374151;">${data.count}</td>
          <td style="padding:14px; text-align:right; font-weight:bold; color:${secRisk.hex}; font-size:13px;">${data.avg ? data.avg.toFixed(1) : "0.0"} / 10 ${polAlert}</td>
        </tr>
      `;
      })
      .join("");

    const individualsHtml = activeCompany.collaborators
      .map((c) => {
        const score = getCollaboratorGlobalRisk(c.id);
        const cRisk = getRiskLevel(score);
        return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding:10px; font-size:12px; font-weight:600; color:#374151;">${c.name}</td>
          <td style="padding:10px; font-size:12px; color:#6b7280;">${c.sector} • ${c.role}</td>
          <td style="padding:10px; text-align:right; font-weight:bold; color:${cRisk.hex}; font-size:12px;">${score ? score.toFixed(1) : "Pendente"}</td>
        </tr>
      `;
      })
      .join("");

    const methodologyPdfHtml =
      activeSurvey?.template === "nr1_compliance"
        ? buildMethodologyPdfSection({
            companyName: activeCompany.name,
            surveyTitle,
            samplingStats: stats,
            organizationAnalytics: analyticsPdf!,
            iroTrend: trendPdf,
            iro: companyGlobalRiskAverage,
            iroLabel: risk.label,
          })
        : "";

    let aiReportHtml = "";
    if (activeSurvey?.aiReport) {
      aiReportHtml = `
        <div style="margin-top: 40px; padding: 24px; background: #fafaf9; border: 2px solid #e5e7eb; border-radius: 12px; page-break-inside: avoid;">
          <h3 style="font-family: Georgia, serif; font-size: 17px; margin-top: 0; border-bottom: 2px solid #111827; padding-bottom: 8px; color:#111827; text-transform: uppercase; letter-spacing: 0.5px;">3. Parecer Analítico de Riscos por Inteligência Artificial</h3>
          <div style="font-size: 12px; line-height: 1.7; color:#374151; white-space: pre-wrap; font-family: 'Georgia', serif;">${activeSurvey?.aiReport
            .replace(/###/g, "")
            .replace(/\*\*/g, "")
            .replace(/####/g, "")
            .replace(/&nbsp;/g, " ")}</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>LAUDO SST NR-1 - ${activeCompany.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
            body { font-family: 'DM Sans', sans-serif; color: #1f2937; margin: 45px; line-height: 1.6; }
            .corporate-header { border-bottom: 3px double #111827; padding-bottom: 15px; margin-bottom: 35px; }
            .mte-stamp { font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #a7f3d0; background: #ecfdf5; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
            .doc-title { font-family: Georgia, serif; font-size: 26px; font-weight: 900; color: #111827; margin: 0 0 4px 0; }
            .meta-text { font-size: 11px; color: #6b7280; font-weight: 500; }
            .executive-summary { border: 2px solid #111827; border-radius: 12px; padding: 24px; margin-bottom: 40px; background: #fff; page-break-inside: avoid; }
            .summary-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #4b5563; text-align: center; }
            .score-display { font-size: 58px; font-weight: 900; color: ${risk.hex}; text-align: center; font-family: Georgia, serif; margin: 10px 0; }
            .classification { font-size: 13px; font-weight: 700; color: ${risk.hex}; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
            .sec-header { font-family: Georgia, serif; font-size: 16px; font-weight: 900; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 5px; margin: 35px 0 15px 0; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; background: #f3f4f6; padding: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #4b5563; border-bottom: 2px solid #d1d5db; letter-spacing: 0.5px; }
            .signature-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-top: 60px; page-break-inside: avoid; }
            .sig-box { border-top: 1px solid #111827; text-align: center; padding-top: 10px; font-size: 11px; font-weight: 600; color: #374151; }
            .sig-role { font-size: 10px; color: #6b7280; font-weight: 500; margin-top: 2px; }
            .stamp-badge { margin-top: 10px; display: inline-block; border: 1.5px solid #000; font-size: 9px; font-weight: bold; padding: 2px 8px; text-transform: uppercase; }
            .footer { font-size: 10px; color: #9ca3af; text-align: center; margin-top: 70px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
            .cert-page { min-height: 92vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 4px double #111827; padding: 48px 36px; margin-bottom: 48px; page-break-after: always; background: linear-gradient(180deg, #fafaf9 0%, #ffffff 40%); }
            .cert-seal { width: 88px; height: 88px; border: 3px solid #047857; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 11px; font-weight: 800; color: #047857; letter-spacing: 0.08em; }
            .cert-title { font-family: 'DM Sans', sans-serif; font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 8px; letter-spacing: -0.02em; }
            .cert-sub { font-size: 13px; color: #4b5563; max-width: 520px; line-height: 1.5; margin: 0 auto 32px; }
            .cert-iro { font-size: 64px; font-weight: 900; color: ${risk.hex}; line-height: 1; margin: 16px 0 8px; }
          </style>
        </head>
        <body>
          <section class="cert-page">
            <div class="cert-seal">NR-1 · NR-17</div>
            <p class="mte-stamp">Laudo técnico preliminar · I/O Smart Survey</p>
            <h1 class="cert-title">${activeCompany.name}</h1>
            <p class="cert-sub">
              Certificado de diagnóstico psicossocial e ergonômico organizacional<br/>
              <strong>${surveyTitle}</strong> · Emitido em ${dateStr}
            </p>
            <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin:0;">Índice IRO (média dos scores ponderados Sp)</p>
            <div class="cert-iro">${companyGlobalRiskAverage ? companyGlobalRiskAverage.toFixed(1) : "—"}<span style="font-size:22px;color:#9ca3af;"> / 10</span></div>
            <p style="font-size:14px;font-weight:700;color:${risk.hex};text-transform:uppercase;letter-spacing:0.06em;">${risk.label}</p>
            <p style="font-size:11px;color:#6b7280;margin-top:24px;max-width:440px;line-height:1.6;">
              Universo N=${activeCompany.populationSize} · Amostra concluída n=${completedSamplesCount}<br/>
              ${stats.detail}${extraMetricsPdf}
            </p>
          </section>

          ${methodologyPdfHtml}

          <div class="corporate-header">
            <span class="mte-stamp">Corpo técnico do laudo</span>
            <h1 class="doc-title" style="font-family:'DM Sans',sans-serif;font-size:20px;">Anexo estatístico</h1>
            <div class="meta-text">Pesquisa: ${surveyTitle}</div>
          </div>

          <div class="executive-summary">
            <div class="summary-title">IRO — média dos Sp por entrevistado</div>
            <div class="score-display">${companyGlobalRiskAverage ? companyGlobalRiskAverage.toFixed(1) : "0.0"} / 10</div>
            <div class="classification">${risk.label}</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-align: center; margin-top: 10px;">
              Cobertura ${stats.coveragePercent}% · ${stats.marginOfErrorPercent !== null ? `Margem de erro ±${stats.marginOfErrorPercent}%` : stats.shortLabel}
            </div>
          </div>

          <h2 class="sec-header">1. Média de risco por setor (Sp agregado)</h2>
          <table>
            <thead>
              <tr>
                <th>Setor Ocupacional</th>
                <th style="text-align:center; width:100px;">Amostras (n)</th>
                <th style="text-align:right;">Média de Risco Ponderado</th>
              </tr>
            </thead>
            <tbody>
              ${sectorsHtml}
            </tbody>
          </table>

          <h2 class="sec-header" style="page-break-before: always;">2. Índice individual por entrevistado (Sp)</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Setor / Cargo Ocupacional</th>
                <th style="text-align:right;">Índice Individual (Sp)</th>
              </tr>
            </thead>
            <tbody>
              ${individualsHtml}
            </tbody>
          </table>

          ${aiReportHtml}

          <div class="signature-grid">
            <div class="sig-box">
              MILTON BOLONHA
              <div class="sig-role">CEO / CTO - I/O Institute</div>
              <div class="stamp-badge">HOMOLOGADO SST</div>
            </div>
            <div class="sig-box">
              RESPONSÁVEL TÉCNICO SST
              <div class="sig-role">Médico do Trabalho / Ergonomista Co-Auditor</div>
              <div class="stamp-badge" style="border-color:#047857; color:#047857;">MTE REGISTRO</div>
            </div>
          </div>

          <div class="footer">
            Relatório de Conformidade GRO/PGR gerado de forma autônoma pelo módulo I/O - Smart Survey.<br/>
            Para comprovação de adequação ergonômica preliminar (AEP) conforme normatização aplicável.
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ==========================================
  // 📝 Sequential Slide Form Operations
  // ==========================================

  const handleStartSurveySequential = (collabId: string) => {
    if (!activeCompany) return;
    if (!activeSurvey) return;
    const existingResponses = activeSurvey.responses[collabId]?.answers || {};
    setOverlayAnswers(existingResponses);
    setActiveFormOverlay({
      topicIndex: 0,
      questionIndex: 0,
      collaboratorId: collabId,
      singleModuleOnly: false,
    });
  };

  const handleStartSurveySingleModule = (collabId: string, topicId: string) => {
    if (!activeCompany) return;
    const topicIdx = NR1_TOPICS.findIndex((t) => t.id === topicId);
    if (topicIdx === -1) return;

    if (!activeSurvey) return;
    const existingResponses = activeSurvey.responses[collabId]?.answers || {};
    setOverlayAnswers(existingResponses);
    setActiveFormOverlay({
      topicIndex: topicIdx,
      questionIndex: 0,
      collaboratorId: collabId,
      singleModuleOnly: true,
    });
  };

  const handleSelectAnswerValue = (topicId: string, qIdx: number, val: any) => {
    const key = `${topicId}_${qIdx}`;
    const updatedAnswers = { ...overlayAnswers, [key]: val };
    setOverlayAnswers(updatedAnswers);

    if (activeCompany && activeFormOverlay) {
      const currentTopic = NR1_TOPICS[activeFormOverlay.topicIndex];

      // Auto-save progress to localstate immediately to protect against crash
      const isCollabComplete = NR1_TOPICS.every((topic) => {
        return topic.questions.every((q, idx) => {
          const checkKey = `${topic.id}_${idx}`;
          // If it's the text comment (optional), it's okay to be blank
          if (q.type === "text") return true;
          return (
            updatedAnswers[checkKey] !== undefined &&
            updatedAnswers[checkKey] !== ""
          );
        });
      });

      const updatedResponses = {
        ...(activeSurvey?.responses || {}),
        [activeFormOverlay.collaboratorId]: {
          answers: updatedAnswers,
          completed: isCollabComplete,
        },
      };

      const updatedSurveys = (activeCompany.surveys || []).map((s) => {
        const isTarget =
          s.id === selectedSurveyId ||
          (!selectedSurveyId && s.id.startsWith("survey_default"));
        if (isTarget) {
          return {
            ...s,
            responses: {
              ...s.responses,
              [activeFormOverlay.collaboratorId]: {
                answers: updatedAnswers,
                completed: isCollabComplete,
              },
            },
          };
        }
        return s;
      });

      const updatedCompany = {
        ...activeCompany,
        surveys: updatedSurveys,
      };
      updateCompanyInState(updatedCompany);
    }
  };

  const findAdjacentVisibleStep = (
    topicIndex: number,
    questionIndex: number,
    answers: Record<string, unknown>,
    forward: boolean,
    singleModuleOnly: boolean,
  ): { topicIndex: number; questionIndex: number } | null => {
    const maxTopic = singleModuleOnly ? topicIndex : NR1_TOPICS.length - 1;
    const minTopic = singleModuleOnly ? topicIndex : 0;

    let t = topicIndex;
    let q = questionIndex + (forward ? 1 : -1);

    const tryTopic = (
      ti: number,
      startQ: number,
      dir: number,
    ): { topicIndex: number; questionIndex: number } | null => {
      const topic = NR1_TOPICS[ti];
      for (
        let qi = startQ;
        dir > 0 ? qi < topic.questions.length : qi >= 0;
        qi += dir
      ) {
        if (isQuestionVisible(topic.questions[qi], topic.id, qi, answers)) {
          return { topicIndex: ti, questionIndex: qi };
        }
      }
      return null;
    };

    while (t >= minTopic && t <= maxTopic) {
      const hit = tryTopic(t, q, forward ? 1 : -1);
      if (hit) return hit;
      t += forward ? 1 : -1;
      if (t < minTopic || t > maxTopic) break;
      q = forward ? 0 : NR1_TOPICS[t].questions.length - 1;
    }
    return null;
  };

  const handleNextSequentialStep = () => {
    if (!activeFormOverlay || !activeCompany) return;
    const { topicIndex, questionIndex, singleModuleOnly, collaboratorId } =
      activeFormOverlay;

    const next = findAdjacentVisibleStep(
      topicIndex,
      questionIndex,
      overlayAnswers,
      true,
      singleModuleOnly,
    );
    if (!next) {
      setActiveFormOverlay(null);
      push({
        title: "Inquérito salvo",
        description: "Respostas arquivadas na pesquisa ativa.",
        variant: "success",
      });
      return;
    }
    setActiveFormOverlay({ ...next, collaboratorId, singleModuleOnly });
  };

  const handleBackSequentialStep = () => {
    if (!activeFormOverlay) return;
    const { topicIndex, questionIndex, singleModuleOnly, collaboratorId } =
      activeFormOverlay;
    const prev = findAdjacentVisibleStep(
      topicIndex,
      questionIndex,
      overlayAnswers,
      false,
      singleModuleOnly,
    );
    if (!prev) return;
    setActiveFormOverlay({ ...prev, collaboratorId, singleModuleOnly });
  };

  // Locked guest view redirection logic
  useEffect(() => {
    if (sessionRole === "auditor") {
      setSubTab("auditor_panel");
    } else if (sessionRole === "respondent") {
      setSubTab("interviewee_panel");
    }
  }, [sessionRole]);

  return {
    workspaceId,
    companies,
    setCompanies,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedSurveyId,
    setSelectedSurveyId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isMethodologyModalOpen,
    setIsMethodologyModalOpen,
    selectedCollabIdForDetails,
    setSelectedCollabIdForDetails,
    activeCompany,
    activeSurvey,
    sessionRole,
    setSessionRole,
    clerkInvites,
    setClerkInvites,
    subTab,
    setSubTab,
    newCompanyName,
    setNewCompanyName,
    newCompanyN,
    setNewCompanyN,
    newCompanyLabel,
    setNewCompanyLabel,
    newCompanyTemplate,
    setNewCompanyTemplate,
    newCompanyCover,
    setNewCompanyCover,
    companySearchQuery,
    setCompanySearchQuery,
    companyTemplateFilter,
    setCompanyTemplateFilter,
    newSectorName,
    setNewSectorName,
    showAddCollab,
    setShowAddCollab,
    newCollabName,
    setNewCollabName,
    newCollabSector,
    setNewCollabSector,
    newCollabRole,
    setNewCollabRole,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    logDate,
    setLogDate,
    logCollabId,
    setLogCollabId,
    logQtdVendas,
    setLogQtdVendas,
    logApresentacoes,
    setLogApresentacoes,
    logFaturamento,
    setLogFaturamento,
    guestAuditorId,
    setGuestAuditorId,
    guestRespondentId,
    setGuestRespondentId,
    reportScope,
    setReportScope,
    continuousViewTab,
    setContinuousViewTab,
    activeFormOverlay,
    setActiveFormOverlay,
    overlayAnswers,
    setOverlayAnswers,
    isGeneratingAI,
    activeSurveyResponses,
    completedSamplesCount,
    companyGlobalRiskAverage,
    companyConfidenceLevel,
    samplingStats,
    aggregatedLogs,
    newSurveyTitle,
    setNewSurveyTitle,
    newSurveyTemplate,
    setNewSurveyTemplate,
    editingSurveyId,
    setEditingSurveyId,
    handleAddSurvey,
    handleDeleteSurvey,
    handleUpdateSurveyMeta,
    sectorBreakdowns,
    polarizedSectorsCount,
    organizationAnalytics,
    iroTrend,
    getCollaboratorTopicRisk,
    getCollaboratorGlobalRisk,
    handleCreateCompany,
    handleDeleteCompany,
    handleAddCollabSubmit,
    handleDeleteCollab,
    handleUpdateCompanySettings,
    handleAddSector,
    handleDeleteSector,
    handleSendMockInvite,
    handleDeleteInvite,
    handleAddContinuousLog,
    handleDeleteContinuousLog,
    handleSimulateSurveyResponses,
    handleGenerateAIReport,
    handlePrintPremiumPDF,
    handleStartSurveySequential,
    handleStartSurveySingleModule,
    handleSelectAnswerValue,
    handleNextSequentialStep,
    handleBackSequentialStep,
    updateCompanyInState,
    push,
    getRiskLevel,
    calculateCompanyGlobalRisk,
    NR1_TOPICS,
  };
}
