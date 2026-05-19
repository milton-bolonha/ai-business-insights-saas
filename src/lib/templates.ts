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

export interface TemplateTile {
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

export interface DashboardTemplate {
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
  template: DashboardTemplate,
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

// Rename for compatibility with generate/route.ts until refactored
export type GuestTemplate = DashboardTemplate;

// Centralized templates
export const DASHBOARD_TEMPLATES: Record<string, DashboardTemplate> = {
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
        category: "financial",
        orderIndex: 2,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      }
    ],
  },
  template_love_writers: {
    id: "template_love_writers",
    name: "Love Writers",
    description: "Narrativa romântica personalizada.",
    generationMode: "sequential",
    tiles: [
      {
        id: "chapter_1",
        title: "Capítulo 1: O Encontro",
        prompt: "Escreva o primeiro capítulo sobre como {user_name} e {partner_name} se conheceram. Use a história: {meeting_story}.",
        category: "story",
        orderIndex: 0,
        agentId: "publisher",
        preferredLength: "long",
      }
    ],
  },
  template_trade_ranking: {
    id: "template_trade_ranking",
    name: "Trade Ranking",
    description: "Parametric algorithm for high-margin trade and barter opportunities.",
    tiles: [
      {
        id: "trade_valuation",
        title: "Investment Analysis",
        prompt: "Analyze the trade opportunity for a {product_condition} {product_category}...",
        category: "analysis",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "exit_strategy",
        title: "Exit & Pricing Strategy",
        prompt: "Based on the {product_category} analysis, define the exit strategy...",
        category: "strategy",
        orderIndex: 1,
        agentId: "ade_sales_coach",
        preferredLength: "medium",
      },
      {
        id: "liquidity_report",
        title: "Liquidity & Risk",
        prompt: "Evaluate the liquidity risk for {product_category}...",
        category: "insights",
        orderIndex: 2,
        agentId: "ade_research_analyst",
        preferredLength: "short",
      },
    ],
  },
  template_furniture_logistics: {
    id: "template_furniture_logistics",
    name: "Furniture Logistics",
    description: "Real-time assembly and delivery tracking board.",
    tiles: [
      {
        id: "order_kds_list",
        title: "Lista de Pedidos Ativos",
        prompt: "Generate a list of 5 furniture assembly orders...",
        category: "orders",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      },
      {
        id: "assembly_details",
        title: "Protocolos e Manuais de Montagem",
        prompt: "Provide technical assembly requirements for standard {product_category}...",
        category: "technical",
        orderIndex: 1,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      }
    ]
  },
  template_furniture_layout: {
    id: "template_furniture_layout",
    name: "Mapeamento de Layout de Loja",
    description: "Visual grid mapping for walls and islands.",
    tiles: [
      {
        id: "aisle_configuration",
        title: "Configuração de Expositores",
        prompt: "Define a store layout emphasizing a logistics/stock flow...",
        category: "layout",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "product_pins",
        title: "Mapeamento de Pins (Produtos)",
        prompt: "Generate 10 products for the store...",
        category: "pins",
        orderIndex: 1,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      }
    ]
  },
  template_furniture_store: {
    id: "template_furniture_store",
    name: "Loja Virtual Mobiliário",
    description: "Vitrine ativa para exposição de produtos lead capture.",
    tiles: [
      {
        id: "public_catalog",
        title: "Catálogo de Produtos (Estoque)",
        prompt: "Create a luxurious furniture catalog for {product_category}...",
        category: "products",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      },
      {
        id: "orders_database",
        title: "Banco de Dados de Pedidos",
        prompt: "Create an empty order database structure...",
        category: "orders",
        orderIndex: 1,
        agentId: "ade_research_analyst",
        preferredLength: "short",
      }
    ]
  },
  template_io_mentoring: {
    id: "template_io_mentoring",
    name: "I/O Mentoring",
    description: "Hub central para mentores e alunos com Kanban e Agenda.",
    tiles: [
      {
        id: "student_assessment",
        title: "Avaliação de Perfil Aluno",
        prompt: "Com base no objetivo {mentoring_goal}, faça uma análise do perfil do aluno {student_name} e sugira os 3 primeiros passos práticos.",
        category: "insights",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "mentoring_roadmap",
        title: "Roadmap de Aprendizado",
        prompt: "Crie um cronograma de 4 semanas para a mentoria de {student_name} focada em {mentoring_goal}.",
        category: "strategy",
        orderIndex: 1,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      }
    ]
  }
};

export function getTemplate(templateId: string): DashboardTemplate {
  return (
    DASHBOARD_TEMPLATES[templateId] ?? DASHBOARD_TEMPLATES.template_1
  );
}

// For legacy compatibility during migration
export const getGuestTemplate = getTemplate;
