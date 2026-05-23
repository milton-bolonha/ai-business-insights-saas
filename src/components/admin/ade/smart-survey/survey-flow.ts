import type { Question, QuestionSkipRule } from "./types";

export function evaluateSkipRule(
  rule: QuestionSkipRule | undefined,
  answers: Record<string, unknown>
): boolean {
  if (!rule) return true;
  const val = answers[rule.questionKey];
  if (val === undefined || val === "") return false;

  switch (rule.operator) {
    case "equals":
      return val === rule.value;
    case "not_equals":
      return val !== rule.value;
    case "includes":
      return Array.isArray(val)
        ? (rule.value as string[]).every(v => val.includes(v))
        : Array.isArray(rule.value)
          ? (rule.value as string[]).includes(String(val))
          : false;
    default:
      return true;
  }
}

export function isQuestionVisible(q: Question, topicId: string, qIdx: number, answers: Record<string, unknown>) {
  if (!q.showIf) return true;
  return evaluateSkipRule(q.showIf, answers);
}

export function countVisibleQuestions(
  topics: { id: string; questions: Question[] }[],
  answers: Record<string, unknown>
) {
  let total = 0;
  topics.forEach(topic => {
    topic.questions.forEach((q, idx) => {
      if (isQuestionVisible(q, topic.id, idx, answers)) total++;
    });
  });
  return total;
}
