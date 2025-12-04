import OpenAI from "openai";
import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_TEMPERATURE,
  resolveModel,
} from "@/lib/ai/settings";
import type { TileMessage } from "@/lib/types";

const MAX_GENERATION_ATTEMPTS = 3;

export interface TileGenerationOptions {
  client: OpenAI;
  prompt: string;
  title: string;
  templateId: string;
  templateTileId?: string;
  category?: string;
  model: string;
  orderIndex: number;
  maxTokens?: number;
}

export interface TileGenerationResult {
  content: string;
  prompt: string;
  totalTokens: number | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  history: TileMessage[];
  model: string;
}

function coerceToText(value: unknown): string {
  if (value === null || typeof value === "undefined") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(coerceToText).filter(Boolean).join("");
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if ("output_text" in obj) return coerceToText(obj.output_text);
    if ("text" in obj) return coerceToText(obj.text);
    if ("content" in obj) return coerceToText(obj.content);
  }
  return "";
}

function buildResponsesInput(prompt: string) {
  const responseLanguage = process.env.NEXT_PUBLIC_AI_RESPONSE_LANGUAGE || "English";
  const languageInstruction = `\n\nIMPORTANT: Respond ONLY in ${responseLanguage}. Do not use any other language.`;
  
  return [
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: prompt + languageInstruction,
        },
      ],
    },
  ];
}

function createHistoryEntry(
  role: TileMessage["role"],
  content: string,
  createdAt: string
): TileMessage {
  return {
    id: `${role}_${Date.now().toString(36)}`,
    role,
    content,
    createdAt,
  };
}

function extractResponseContent(response: unknown) {
  if (!response || typeof response !== "object") return "";
  const obj = response as Record<string, unknown>;
  const fromOutput = coerceToText(obj.output_text);
  if (fromOutput.trim()) {
    return fromOutput.trim();
  }
  if (Array.isArray(obj.output)) {
    const aggregated = (obj.output as unknown[])
      .map((item) => coerceToText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
    if (aggregated) {
      return aggregated;
    }
  }
  return "";
}

export async function generateTileContent(
  options: TileGenerationOptions
): Promise<TileGenerationResult> {
  const {
    client,
    prompt,
    title,
    orderIndex,
    model,
    maxTokens,
    templateId,
    templateTileId,
  } = options;

  const normalizedModel = resolveModel(model).trim();
  const lowerModel = normalizedModel.toLowerCase();
  const shouldSendTemperature =
    !lowerModel.startsWith("gpt-5") && Number.isFinite(DEFAULT_TEMPERATURE);

  const requestPayload: Record<string, unknown> = {
    model: normalizedModel,
    input: buildResponsesInput(prompt),
    max_output_tokens: maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    metadata: {
      templateId,
      templateTileId: templateTileId ?? "unknown",
      orderIndex: String(orderIndex),
      title,
    },
  };

  if (shouldSendTemperature) {
    requestPayload.temperature = DEFAULT_TEMPERATURE;
  }

  let attempts = 0;
  let lastError: Error | null = null;
  const createdAt = new Date().toISOString();
  const history: TileMessage[] = [
    createHistoryEntry("user", prompt, createdAt),
  ];

  while (attempts < MAX_GENERATION_ATTEMPTS) {
    attempts++;
    try {
      const response = await client.responses.create(requestPayload);
      const content = extractResponseContent(response);

      if (content) {
        const assistantMessage = createHistoryEntry(
          "assistant",
          content,
          new Date().toISOString()
        );
        history.push(assistantMessage);

        return {
          content,
          prompt,
          totalTokens: null,
          attempts,
          createdAt,
          updatedAt: new Date().toISOString(),
          history,
          model: normalizedModel,
        };
      }

      throw new Error("Empty response from OpenAI");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempts < MAX_GENERATION_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempts));
      }
    }
  }

  const fallbackContent = `⚠️ This insight could not be generated after ${attempts} attempts. ${lastError?.message || "Unknown error"}`;
  return {
    content: fallbackContent,
    prompt,
    totalTokens: null,
    attempts,
    createdAt,
    updatedAt: new Date().toISOString(),
    history,
    model: normalizedModel,
  };
}

