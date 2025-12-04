const VALID_MODELS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
] as const;

type ValidModel = (typeof VALID_MODELS)[number];

export const DEFAULT_MODEL = (process.env.OPENAI_MODEL ||
  "gpt-4o-mini") as ValidModel;

function safeNumber(source: string | undefined, fallback: number): number {
  const parsed = Number(source);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_MAX_OUTPUT_TOKENS = safeNumber(
  process.env.OPENAI_MAX_OUTPUT_TOKENS,
  600
);

export const DEFAULT_TEMPERATURE = (() => {
  const parsed = Number(process.env.OPENAI_TEMPERATURE);
  return Number.isFinite(parsed) ? parsed : 0.7;
})();

export function resolveModel(preferred?: string | null): string {
  if (!preferred) return DEFAULT_MODEL;
  const candidate = preferred.trim();

  if (VALID_MODELS.includes(candidate as ValidModel)) {
    return candidate;
  }

  if (candidate.length > 0 && candidate !== DEFAULT_MODEL) {
    console.warn(
      `[resolveModel] Invalid model "${candidate}", falling back to "${DEFAULT_MODEL}"`
    );
  }

  return DEFAULT_MODEL;
}

