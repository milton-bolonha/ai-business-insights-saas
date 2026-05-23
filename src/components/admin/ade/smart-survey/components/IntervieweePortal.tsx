"use client";

import React from "react";
import { User2, PlayCircle, Settings } from "lucide-react";
import { NR1_TOPICS } from "../nr1-topics";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";

/** Portal restrito: o entrevistado só vê o próprio perfil e formulários — sem dados da empresa. */
export function IntervieweePortal(props: SmartSurveyBoardViewProps) {
  const {
    activeCompany,
    activeSurvey,
    guestRespondentId,
    setGuestRespondentId,
    activeSurveyResponses,
    handleStartSurveySequential,
    setSubTab,
  } = props;

  if (!activeCompany) return null;

  const target = activeCompany.collaborators.find(c => c.id === guestRespondentId);
  const respObj = guestRespondentId ? activeSurveyResponses[guestRespondentId] : undefined;
  const isCustomSurvey = activeSurvey?.questions && activeSurvey.questions.length > 0;
  const totalQ = isCustomSurvey ? (activeSurvey?.questions?.length || 0) : NR1_TOPICS.reduce((s, t) => s + t.questions.length, 0);
  const progress = respObj && totalQ > 0
    ? Math.round(
        (Object.keys(respObj.answers).filter(k => respObj.answers[k] !== undefined && respObj.answers[k] !== "").length /
          totalQ) *
          100
      )
    : 0;

  const forms = isCustomSurvey ? [] : activeSurvey?.forms || [];

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-in fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">
          Meu espaço de entrevista
        </h2>
        <p className="text-xs text-neutral-500">
          Pesquisa: <strong>{activeSurvey?.title || "—"}</strong>
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 shadow-sm space-y-4">
        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">
          Identifique-se
        </label>
        <select
          value={guestRespondentId}
          onChange={e => setGuestRespondentId(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500"
        >
          <option value="">Selecione seu nome...</option>
          {activeCompany.collaborators.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {target && (
        <>
          <div className="bg-[#fafaf9] rounded-[2rem] border border-neutral-200/80 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <User2 size={26} />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900">{target.name}</h3>
              <p className="text-xs text-neutral-500">{target.sector} · {target.role}</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase text-neutral-400">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleStartSurveySequential(target.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <PlayCircle size={16} />
              {progress > 0 ? "Retomar inquérito" : "Iniciar inquérito"}
            </button>
          </div>

          {forms.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">
                Ou inicie um formulário
              </h4>
              {forms.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    const topicIdx = NR1_TOPICS.findIndex(t => f.topicIds.includes(t.id));
                    if (topicIdx >= 0) props.handleStartSurveySingleModule(target.id, NR1_TOPICS[topicIdx].id);
                  }}
                  className="w-full text-left p-4 bg-white border border-neutral-200 rounded-2xl hover:border-emerald-300 text-xs font-bold text-neutral-800 cursor-pointer"
                >
                  {f.title}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSubTab("settings")}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-800 cursor-pointer"
          >
            <Settings size={14} />
            Meu perfil (configuração)
          </button>
        </>
      )}
    </div>
  );
}
