"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// from "react";
import { ShieldAlert, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SmartSurveyBoardViewProps } from "../SmartSurveyBoardView";

export function SurveyFormOverlay(props: SmartSurveyBoardViewProps) {
  const {
    activeCompany,
    activeSurvey,
    activeFormOverlay,
    setActiveFormOverlay,
    overlayAnswers,
    handleSelectAnswerValue,
    handleBackSequentialStep,
    handleNextSequentialStep,
  } = props;

  useEffect(() => {
    if (activeFormOverlay) {
      document.body.classList.add("survey-overlay-active");
    } else {
      document.body.classList.remove("survey-overlay-active");
    }
    return () => {
      document.body.classList.remove("survey-overlay-active");
    };
  }, [activeFormOverlay]);

  return typeof document !== 'undefined' ? createPortal(
      <AnimatePresence>
        {activeFormOverlay && activeCompany && activeSurvey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col"
          >
            {(() => {
              const { questionIndex, collaboratorId } = activeFormOverlay;
              const questions = activeSurvey.questions || [];
              const q = questions[questionIndex];
              const cName = activeCompany.collaborators.find(col => col.id === collaboratorId)?.name || "Colaborador";

              // Fallback if question index is out of bounds
              if (!q) {
                return (
                  <div className="flex flex-col items-center justify-center flex-1">
                    <Check size={48} className="text-emerald-500 mb-4" />
                    <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Questionário Concluído</h2>
                    <p className="text-neutral-500 max-w-md text-center mb-8">As respostas foram salvas. O avaliador já pode gerar o sumário e o diagnóstico IRO no painel.</p>
                    <button onClick={() => setActiveFormOverlay(null)} className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold">Voltar ao Portal</button>
                  </div>
                );
              }

              const answerKey = `q_${q.id}`;
              const answerVal = overlayAnswers[answerKey];
              const currentTotalQuestions = questions.length;
              const accent = activeSurvey.accent || "#059669";

              return (
                <>
                  {/* Slider Header */}
                  <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setActiveFormOverlay(null)}
                        className="text-neutral-500 hover:text-neutral-800 p-2 bg-neutral-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                      <div>
                        <div className="text-[10px] tracking-widest uppercase text-neutral-500 font-bold mb-0.5">
                          Inquérito &bull; {cName}
                        </div>
                        <h2 className="text-sm font-bold text-neutral-900 truncate max-w-sm">
                          {activeSurvey.title}
                        </h2>
                      </div>
                    </div>
                    <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                      {questionIndex + 1} / {currentTotalQuestions}
                    </div>
                  </div>

                  {/* Progress Bar Top */}
                  <div className="relative z-10 h-1.5 bg-neutral-100">
                    <div className="h-full transition-all duration-300 ease-out" style={{ background: accent, width: `${((questionIndex + 1) / currentTotalQuestions) * 100}%` }} />
                  </div>

                  {/* Slider Body Question Types Mapper */}
                  <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center justify-center bg-[#faf9f7] relative">
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="w-full flex flex-col items-center max-w-2xl mx-auto space-y-10 text-center"
                    >
                      <h3 className="text-2xl md:text-3xl font-medium text-neutral-900 font-serif leading-snug">
                        {q.label}
                      </h3>

                      {/* RENDER SCALE 0-10 CIRCLES */}
                      {q.type === "scale_0_10" && (
                        <div className="w-full flex flex-col items-center">
                          <div className="flex flex-wrap justify-center gap-2.5 max-w-xl">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                              const isSelected = answerVal === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleSelectAnswerValue(q.id, 0, val)}
                                  style={{
                                    width: 48, height: 48, borderRadius: 10, fontSize: 16,
                                    border: isSelected ? `2.5px solid ${accent}` : "1.5px solid #e2e2de",
                                    background: isSelected ? accent : "#ffffff",
                                    color: isSelected ? "#ffffff" : "#444444",
                                    fontWeight: isSelected ? 700 : 500,
                                    boxShadow: isSelected ? `0 6px 16px ${accent}40` : "0 2px 4px rgba(0,0,0,0.02)",
                                    transform: isSelected ? "scale(1.05)" : "scale(1)"
                                  }}
                                  className="transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-between w-full mt-6 text-xs font-bold text-neutral-400 max-w-lg px-2 uppercase tracking-wide">
                            <span>{q.minLabel || "0"}</span>
                            <span>{q.maxLabel || "10"}</span>
                          </div>
                        </div>
                      )}

                      {/* RENDER MULTIPLE CHOICE SINGLE CARDS */}
                      {q.type === "multiple_choice_single" && (
                        <div className="w-full max-w-md space-y-3 text-left">
                          {q.options?.map((opt, i) => {
                            const isSelected = answerVal === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  handleSelectAnswerValue(q.id, 0, opt);
                                  setTimeout(() => handleNextSequentialStep(), 250);
                                }}
                                style={{
                                  padding: "16px 20px", borderRadius: 10,
                                  border: isSelected ? `2px solid ${accent}` : "1.5px solid #e2e2de",
                                  background: isSelected ? `${accent}0a` : "#ffffff",
                                  color: isSelected ? accent : "#333333",
                                  fontWeight: isSelected ? 600 : 400,
                                  boxShadow: isSelected ? `0 4px 12px ${accent}15` : "0 2px 4px rgba(0,0,0,0.02)"
                                }}
                                className="w-full text-base transition-all flex items-center gap-4 cursor-pointer hover:border-neutral-300"
                              >
                                <div style={{
                                  width: 28, height: 28, borderRadius: 6, flexShrink: 0, fontSize: 12, fontWeight: 700,
                                  background: isSelected ? accent : "#f2f2f0", color: isSelected ? "#ffffff" : "#777777",
                                  display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                  {String.fromCharCode(65 + i)}
                                </div>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* RENDER MULTIPLE CHOICE MULTIPLE CHECKBOXES */}
                      {q.type === "multiple_choice_multiple" && (
                        <div className="w-full max-w-md space-y-3 text-left">
                          <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-2 text-center">Múltipla escolha (marque aplicáveis):</p>
                          {q.options?.map((opt, i) => {
                            const answersList = Array.isArray(answerVal) ? answerVal : [];
                            const isSelected = answersList.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  let nextVal = [...answersList];
                                  if (isSelected) {
                                    nextVal = nextVal.filter(item => item !== opt);
                                  } else {
                                    nextVal.push(opt);
                                  }
                                  handleSelectAnswerValue(q.id, 0, nextVal);
                                }}
                                style={{
                                  padding: "16px 20px", borderRadius: 10,
                                  border: isSelected ? `2px solid ${accent}` : "1.5px solid #e2e2de",
                                  background: isSelected ? `${accent}0a` : "#ffffff",
                                  color: isSelected ? accent : "#333333",
                                  fontWeight: isSelected ? 600 : 400,
                                  boxShadow: isSelected ? `0 4px 12px ${accent}15` : "0 2px 4px rgba(0,0,0,0.02)"
                                }}
                                className="w-full text-base transition-all flex items-center gap-4 cursor-pointer hover:border-neutral-300"
                              >
                                <div style={{
                                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                                  border: isSelected ? `2px solid ${accent}` : "1.5px solid #cccccc",
                                  background: isSelected ? accent : "#ffffff",
                                  display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                  {isSelected && <Check size={16} color="#ffffff" />}
                                </div>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* RENDER TEXT COMMENTS BOX */}
                      {q.type === "text" && (
                        <div className="w-full max-w-lg">
                          <textarea
                            value={answerVal || ""}
                            onChange={e => handleSelectAnswerValue(q.id, 0, e.target.value)}
                            placeholder={q.placeholder || "Escreva livremente..."}
                            className="w-full min-h-[160px] border border-neutral-200 rounded-xl p-5 text-base font-normal text-neutral-800 focus:outline-none bg-neutral-50/50 resize-y shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                            style={{ borderColor: answerVal ? accent : undefined }}
                          />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Slider Navigation Footer */}
                  <div className="p-5 border-t border-neutral-100 bg-white flex items-center justify-center relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                    <div className="w-full max-w-2xl flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {questions.map((_, idx) => (
                          <div
                            key={idx}
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{ background: idx <= questionIndex ? accent : "#e5e5e0", width: idx === questionIndex ? 24 : 8, opacity: idx < questionIndex ? 0.4 : 1 }}
                          />
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleBackSequentialStep}
                          disabled={questionIndex === 0}
                          className="border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-600 px-5 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                        >
                          <ChevronLeft size={16} />
                          Voltar
                        </button>

                        <button
                          type="button"
                          onClick={handleNextSequentialStep}
                          disabled={q.type !== "text" && (answerVal === undefined || answerVal === "" || (Array.isArray(answerVal) && answerVal.length === 0))}
                          className="text-white px-6 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-md disabled:opacity-50 hover:brightness-110"
                          style={{ background: (q.type !== "text" && (answerVal === undefined || answerVal === "" || (Array.isArray(answerVal) && answerVal.length === 0))) ? '#d4d4d4' : accent }}
                        >
                          {questionIndex === currentTotalQuestions - 1 ? "Concluir" : "Próximo"}
                          {questionIndex === currentTotalQuestions - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    ) : null;
}
