export interface PromptAgentDefinition {
  id: string;
  label: string;
  description: string;
  defaultModel: string;
}

export const PROMPT_AGENTS = [
  {
    id: "ade_research_analyst",
    label: "Research Analyst (Ade)",
    description: "Consultoria focada em dados verificáveis e insights acionáveis.",
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "ade_sales_coach",
    label: "Sales Coach (Ade)",
    description:
      "Fala direta, CTA forte e direcionamento para movimento comercial imediato.",
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "publisher",
    label: "Book Publisher",
    description: "Especialista em criar narrativas de livros e storytelling.",
    defaultModel: "gpt-4o",
  },
] as const satisfies PromptAgentDefinition[];

export type PromptAgentId = (typeof PROMPT_AGENTS)[number]["id"];

export const PROMPT_RESPONSE_LENGTHS = [
  { id: "short" as const, label: "Curta" },
  { id: "medium" as const, label: "Média" },
  { id: "long" as const, label: "Longa" },
] as const;

export type PromptResponseLength =
  (typeof PROMPT_RESPONSE_LENGTHS)[number]["id"];

export const PROMPT_VARIABLE_DEFINITIONS = [
  {
    id: "includeRevenueSignals",
    label: "Sinais de receita",
    description: "Inclui dados financeiros, MRR e menções a funding.",
  },
  {
    id: "includeHiringSignals",
    label: "Contratações",
    description: "Destaca vagas abertas e movimentos de expansão de equipe.",
  },
  {
    id: "includeProductLaunches",
    label: "Lançamentos",
    description: "Menciona releases recentes, roadmap e novos produtos.",
  },
] as const;

export type PromptVariableId =
  (typeof PROMPT_VARIABLE_DEFINITIONS)[number]["id"];

export const DEFAULT_PROMPT_AGENT_ID: PromptAgentId =
  PROMPT_AGENTS[0]?.id ?? "ade_research_analyst";

interface TemplateTile {
  id: string;
  templateTileId?: string;
  title: string;
  prompt: string;
  category: string;
  orderIndex: number;
  agentId?: PromptAgentId;
  preferredLength?: PromptResponseLength;
  useMaxMode?: boolean;
  requestSize?: "small" | "medium" | "large";
}

interface GuestTemplate {
  id: string;
  name: string;
  description: string;
  generationMode?: "parallel" | "sequential"; // Defaults to "parallel"
  tiles: TemplateTile[];
}

export interface ResolvedTemplateTile extends TemplateTile {
  agentId: PromptAgentId;
  preferredLength: PromptResponseLength;
  runtimeVariables: PromptVariableId[];
}

export function getPromptAgent(id?: PromptAgentId): PromptAgentDefinition {
  return (
    PROMPT_AGENTS.find((a) => a.id === id) ?? PROMPT_AGENTS[0]
  );
}

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function flattenContext(
  source: Record<string, unknown>,
  prefix = "",
  target: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    const composedKey = prefix ? `${prefix}.${key}` : key;
    target[composedKey] = value;

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      flattenContext(value as Record<string, unknown>, composedKey, target);
    }
  }
  return target;
}

export function processPromptVariables(
  prompt: string,
  context: Record<string, unknown>
): string {
  let processed = prompt;
  const flattenedContext = flattenContext(context);

  for (const [key, value] of Object.entries(flattenedContext)) {
    // Support both {{key}} and {key} formats, escaping regex characters
    const doubleBracePlaceholder = `{{${key}}}`;
    const singleBracePlaceholder = `{${key}}`;

    processed = processed.replace(
      new RegExp(escapeRegexLiteral(doubleBracePlaceholder), "g"),
      String(value ?? "")
    );

    processed = processed.replace(
      new RegExp(escapeRegexLiteral(singleBracePlaceholder), "g"),
      String(value ?? "")
    );
  }
  return processed;
}

export function resolveTemplateTiles(
  template: GuestTemplate,
  options: {
    templateId: string;
    agentId?: PromptAgentId;
    responseLength?: PromptResponseLength;
    promptVariables?: PromptVariableId[];
    bulkPrompts?: string[];
  }
): ResolvedTemplateTile[] {
  const defaultAgent = getPromptAgent(options.agentId);
  const defaultLength = options.responseLength ?? "medium";

  return template.tiles.map((tile) => ({
    ...tile,
    agentId: tile.agentId ?? (defaultAgent.id as PromptAgentId),
    preferredLength: tile.preferredLength ?? defaultLength,
    runtimeVariables: options.promptVariables ?? [],
  }));
}

// Template básico para começar
export const GUEST_DASHBOARD_TEMPLATES: Record<string, GuestTemplate> = {
  template_1: {
    id: "template_1",
    name: "Essential Research",
    description: "Eight high-signal tiles for accelerated research.",
    tiles: [
      {
        id: "company_description",
        title: "What They Do",
        prompt:
          "Describe {company.name}'s core offering, primary customers, and differentiator in three short sentences (≤12 words each). Synthesize key information concisely. If information is unavailable, state 'No verified public information available yet.'",
        category: "basic",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "revenue_model",
        title: "Revenue Generation",
        prompt:
          "Summarize how {company.name} earns revenue in three short sentences (≤14 words each). Mention specific products, services, or fee structures when known. Synthesize the revenue model concisely. If unclear, state 'Revenue model not publicly disclosed yet.'",
        category: "financial",
        orderIndex: 1,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "international_offices",
        title: "International Presence",
        prompt:
          "Describe {company.name}'s geographic footprint in up to three short sentences (≤14 words each). Cover HQ location, key regions, and notable offices. Synthesize the international presence concisely. If unknown, state 'Geographic footprint not publicly disclosed yet.'",
        category: "market",
        orderIndex: 2,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "business_goals_2025",
        title: "2025 Business Goals",
        prompt:
          "Describe {company.name}'s 2025 priorities in up to two short sentences (≤14 words each). Include source/year in parentheses when known. Synthesize strategic goals concisely. If no public goals, state 'Strategic priorities not publicly available yet.'",
        category: "strategy",
        orderIndex: 3,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "business_challenges",
        title: "2025 Business Challenges",
        prompt:
          "Highlight 2025 challenges for {company.name} in up to two short sentences (≤14 words each). Reference a recent signal in parentheses when available. Synthesize key challenges concisely. If unclear, state 'Challenges not publicly available yet.'",
        category: "insights",
        orderIndex: 4,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "solution_need",
        title: "Solution Need",
        prompt:
          "Write two concise sentences (≤30 words each) explaining why {company.name} needs {sellingSolutionsFor}. Reference one goal or challenge. If evidence is missing, end with 'Need not publicly verified yet.'",
        category: "sales",
        orderIndex: 5,
        agentId: "ade_sales_coach",
        preferredLength: "medium",
      },
      {
        id: "ceo_info",
        title: "CEO Information",
        prompt:
          "Provide CEO information in three short sentences (≤14 words each): CEO name and role, tenure, and one leadership focus. Synthesize executive details concisely. If CEO not public, mention highest-ranking executive and note 'Role not publicly confirmed.'",
        category: "people",
        orderIndex: 6,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "sales_email",
        title: "CEO Sales Email",
        prompt:
          "Draft a four-line email: line 1 greeting (≤8 words); line 2 value proposition referencing one goal/challenge (≤18 words); line 3 two hyphen bullets with specific benefits (≤10 words each); line 4 clear CTA (≤12 words). If data missing, mention 'Information not publicly available yet.'",
        category: "sales",
        orderIndex: 7,
        agentId: "ade_sales_coach",
        preferredLength: "long",
      },
    ],
  },
  template_love_writers: {
    id: "template_love_writers",
    name: "Love Writers Book",
    description: "Generates the initial structure for a couple's book.",
    generationMode: "sequential",
    tiles: [
      {
        id: "arc_destiny",
        title: "I. The Before (Destiny)",
        prompt:
          "Write a short arc about the lives of {user_name} and {partner_name} right before they met. Contextualize with their eventual meeting story: '{meeting_story}'. Use this to add ironic foreshadowing or a sense of 'almost crossing paths' before the actual event.\n\n[EXCERPT]\nWrite a short 2-sentence teaser of this arc.",
        category: "arc",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "arc_meeting",
        title: "II. The Spark (Meeting)",
        prompt:
          "Analyze the user's story: '{meeting_story}'. Identify the 'Meet-Cute' dynamic: 1) Pull/Pull (Instant attraction), 2) Push/Push (Initial dislike/banter), 3) Push/Pull (One pursues, one resists), or 4) Neutral/Nervous (One awkward, one oblivious). Write a cinematic scene focusing on this dynamic. Maintain the tone established in the previous arc: {previous_arc}.\n\n[EXCERPT]\nWrite a short 2-sentence teaser of this arc.",
        category: "arc",
        orderIndex: 1,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      },
      {
        id: "arc_realization",
        title: "III. The Realization",
        prompt:
          "Describe the specific moment {user_name} realized {partner_name} was 'the one'. Contrast this moment with the initial spark described in the meeting story: '{meeting_story}' and the previous arc: {previous_arc}. Show how their connection has deepened.\n\n[EXCERPT]\nWrite a short 2-sentence teaser of this arc.",
        category: "arc",
        orderIndex: 2,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "arc_journey",
        title: "IV. The Journey",
        prompt:
          "Describe a significant challenge or adventure {user_name} and {partner_name} faced together. ensure the dynamic is consistent with their history ('{meeting_story}') and the previous arc: {previous_arc}. Focus on growth and partnership.\n\n[EXCERPT]\nWrite a short 2-sentence teaser of this arc.",
        category: "arc",
        orderIndex: 3,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "arc_vows",
        title: "V. The Promise (Vows)",
        prompt:
          "Draft a heartfelt letter or set of vows from {user_name} to {partner_name}. Reference specific details from their history (including how they met: '{meeting_story}') as described in the previous arc: {previous_arc}. Focus on gratitude and the promise of forever.\n\n[EXCERPT]\nWrite a short 2-sentence teaser of this arc.",
        category: "arc",
        orderIndex: 4,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      },
      {
        id: "arc_future",
        title: "VI. The Future",
        prompt:
          "Write a vision of the future for {user_name} and {partner_name}. Where are they in 10 years? Call back to the journey described in the previous arc: {previous_arc} and their origin story ('{meeting_story}'). End on a hopeful, timeless note.\n\n[EXCERPT]\nWrite a short 2-sentence teaser of this arc.",
        category: "arc",
        orderIndex: 5,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
    ],
  },
};

export const APP_SCENARIOS = GUEST_DASHBOARD_TEMPLATES;

export function getGuestTemplate(templateId: string): GuestTemplate {
  return (
    GUEST_DASHBOARD_TEMPLATES[templateId] ?? GUEST_DASHBOARD_TEMPLATES.template_1
  );
}

