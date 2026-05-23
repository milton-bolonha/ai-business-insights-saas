"use client";

import React from "react";
import { X, PlayCircle } from "lucide-react";
import { NR1_TOPICS } from "../nr1-topics";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";

type Props = SmartSurveyBoardViewProps & {
  collaboratorId: string;
  onClose: () => void;
};

export function CollaboratorDetailPanel({ collaboratorId, onClose, ...props }: Props) {
  const {
    activeCompany,
    activeSurvey,
    activeSurveyResponses,
    getCollaboratorGlobalRisk,
    getCollaboratorTopicRisk,
    getRiskLevel,
    handleStartSurveySequential,
    handleStartSurveySingleModule,
  } = props;

  if (!activeCompany) return null;
  const collab = activeCompany.collaborators.find(c => c.id === collaboratorId);
  if (!collab) return null;

  const respObj = activeSurveyResponses[collaboratorId];
  const globalScore = getCollaboratorGlobalRisk(collaboratorId);
  const globalRisk = getRiskLevel(globalScore);

  const hasDynamicQuestions = activeSurvey?.questions && activeSurvey.questions.length > 0;

  return (
    <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
      <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-800">{collab.name}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {collab.sector} · {collab.role}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 cursor-pointer text-neutral-500">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Sp — média ponderada por módulo</span>
          <span className={`text-3xl font-black font-mono ${globalRisk.color}`}>
            {globalScore !== null ? globalScore.toFixed(1) : "—"}
          </span>
          <span className={`ml-2 text-[9px] font-black uppercase ${globalRisk.color}`}>{globalRisk.label}</span>
        </div>
        <button
          type="button"
          onClick={() => handleStartSurveySequential(collaboratorId)}
          className="ml-auto bg-neutral-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <PlayCircle size={14} />
          {respObj ? "Retomar inquérito" : "Iniciar inquérito"}
        </button>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {hasDynamicQuestions ? (
          <div className="p-4 border border-neutral-200/70 rounded-2xl bg-neutral-50/40 space-y-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wide">Inquérito Customizado</h4>
                <p className="text-[10px] text-neutral-400 font-semibold">
                  {Object.keys(respObj?.answers || {}).length}/{activeSurvey.questions!.length} respondidas
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-dashed border-neutral-200 pb-4">
              <button
                type="button"
                onClick={() => handleStartSurveySequential(collaboratorId)}
                className="text-[9px] font-black uppercase tracking-widest border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Abrir questionário
              </button>
            </div>
            {respObj && (
              <ul className="text-[10px] text-neutral-600 space-y-2">
                {activeSurvey.questions!.map((q, idx) => {
                  const key = `q_${q.id}`;
                  const ans = respObj.answers[key];
                  if (ans === undefined || ans === "") return null;
                  const display = Array.isArray(ans) ? ans.join(", ") : String(ans);
                  return (
                    <li key={key}>
                      <span className="font-bold text-neutral-500">P{idx + 1}:</span> {q.label} <br />
                      <span className="font-mono text-emerald-700">→ {display}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          NR1_TOPICS.map(topic => {
            const topicScore = getCollaboratorTopicRisk(collaboratorId, topic.id);
            const topicRisk = getRiskLevel(topicScore);
            const answeredInTopic = topic.questions.filter((q, idx) => {
              const key = `${topic.id}_${idx}`;
              const v = respObj?.answers?.[key];
              return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
            }).length;

            return (
              <div key={topic.id} className="p-4 border border-neutral-200/70 rounded-2xl bg-neutral-50/40 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wide">{topic.title}</h4>
                    <p className="text-[10px] text-neutral-400 font-semibold">
                      {answeredInTopic}/{topic.questions.length} perguntas · peso {topic.weight}
                    </p>
                  </div>
                  <span className={`text-sm font-black font-mono shrink-0 ${topicRisk.color}`}>
                    {topicScore !== null ? topicScore.toFixed(1) : "—"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartSurveySingleModule(collaboratorId, topic.id)}
                    className="text-[9px] font-black uppercase tracking-widest border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Abrir módulo
                  </button>
                </div>
                {respObj && (
                  <ul className="text-[10px] text-neutral-600 space-y-1 border-t border-dashed border-neutral-200 pt-2">
                    {topic.questions.map((q, idx) => {
                      const key = `${topic.id}_${idx}`;
                      const ans = respObj.answers[key];
                      if (ans === undefined || ans === "") return null;
                      const display = Array.isArray(ans) ? ans.join(", ") : String(ans);
                      return (
                        <li key={key}>
                          <span className="font-bold text-neutral-500">P{idx + 1}:</span> {q.label.slice(0, 80)}… → <span className="font-mono">{display}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
