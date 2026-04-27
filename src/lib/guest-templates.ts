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
    description: "Generates the structured emotional arcs for a cinematic couple's book.",
    generationMode: "sequential",
    tiles: [
      {
        id: "arc_destiny",
        title: "I. The Before (Destiny)",
        prompt: `Write the opening of a romance story about {user_name} and {partner_name}.
### OUTPUT CONTRACT:
1. Use ONLY plain text.
2. Use EXACTLY \\n\\n for paragraphs.
3. Dialogue MUST start with "— " (em-dash followed by a space).
4. NEVER use quotation marks.
5. NO HTML.
6. Write between 250 and 350 words.

CONTENT:
Focus on their life just BEFORE they met. Show {user_name}'s routine and {partner_name}'s routine separately, or a moment of synchronicity just before the encounter.
Seamless transition: End the arc just before the meeting happens. DO NOT describe the meeting.`,
        category: "arc",
        orderIndex: 0,
        agentId: "publisher",
        preferredLength: "medium",
      },
      {
        id: "arc_meeting",
        title: "II. The Spark (Meeting)",
        prompt: `Continue the story of {user_name} and {partner_name}.
### OUTPUT CONTRACT:
1. Use ONLY plain text.
2. Use EXACTLY \\n\\n for paragraphs.
3. Dialogue MUST start with "— " (em-dash followed by a space).
4. NEVER use quotation marks.
5. NO HTML.
6. Write between 250 and 350 words.

### CRITICAL CONTINUITY:
DO NOT summarize {previous_arc}. Start immediately at the MOMENT of the encounter. Focus entirely on the meeting, the 'spark', and the immediate aftermath of that first conversation.
`,
        category: "arc",
        orderIndex: 1,
        agentId: "publisher",
        preferredLength: "long",
      }, {
        id: "arc_realization",
        title: "III. The Realization",
        prompt: `Continue the story of {user_name} and {partner_name}.
### OUTPUT CONTRACT:
1. Use ONLY plain text.
2. Use EXACTLY \\n\\n for paragraphs.
3. Dialogue MUST start with "— " (em-dash followed by a space).
4. NEVER use quotation marks.
5. NO HTML.
6. Write between 250 and 350 words.

### STERN RULE:
DO NOT REPEAT any part of the meeting story described in: {previous_arc}.
The meeting is OVER. This arc starts AFTER they have parted ways or a day later. Focus on the 'Realization' — {user_name} thinking about {partner_name} and the feeling that something has changed forever.
`,
        category: "arc",
        orderIndex: 2,
        agentId: "publisher",
        preferredLength: "medium",
      },
      {
        id: "arc_journey",
        title: "IV. The Journey",
        prompt:
          "Write a dynamic emotional arc about a significant challenge or shared adventure faced by {user_name} and {partner_name}. This is your Midpoint—the moment of truth that changes everything.\n\nInclude:\n- Clear, specific setup of the challenge (financial pressure, family conflict, career crisis, health scare, relocation, loss, creative project, or physical journey). Make it concrete and high-stakes.\n- Rising tension—external obstacles or internal friction that tests the relationship. Up to this point, they've been somewhat reactive, finding their footing. Now the real conflict emerges.\n- A moment of genuine doubt, vulnerability, or misalignment between them. This is where they see what they're truly up against—both the external challenge and their own internal fears or limitations.\n- At least one pivotal exchange of dialogue or action that reveals their evolving dynamic. If using dialogue: let conflicting goals or perspectives create natural tension. What each person wants in this moment should be clear through what they say and don't say. Conflicting viewpoints don't require shouting—even gentle disagreement adds depth.\n- A turning point where partnership becomes their greatest strength, shown through specific action or dialogue. From this moment forward, they shift from reactive to proactive. They now understand their relationship differently and can actively fight for it.\n- A transformed emotional dynamic by the end—they are fundamentally changed by what they survived together. The second half of their story begins here with new clarity and purpose.\n\nEnsure consistency with their origin story ('{meeting_story}') and the previous arc: {previous_arc}.\n\nDialogue during conflict:\n- Each character's words should be driven by their individual motivation—what they want versus what their partner wants.\n- Maintain distinct voices even under pressure. Stress reveals character.\n- Subtext: anger may mask fear, criticism may hide love. Show what's beneath.\n- Rhythm: do they interrupt? Pause? Escalate? The pattern matters.\n- Avoid 'telling each other what they already know' for the reader's benefit. Keep it real.\n\nThe growth must be shown through concrete choices, dialogue, and behavior—never explained abstractly. This moment should be iconic and memorable—when people think of this relationship, they should think of this challenge and how it forged them into something stronger. Everything before this was setup; everything after flows from this transformation.",
        category: "arc",
        orderIndex: 3,
        agentId: "publisher",
        preferredLength: "long",
      }, {
        id: "arc_vows",
        title: "V. The Promise (Vows)",
        prompt:
          "Write a heartfelt emotional arc that naturally leads into vows or a promise from {user_name} to {partner_name}. This is your Third Plot Point—the false victory followed by the low moment, the dark night of the soul that precedes true commitment.\n\nStructure the arc with:\n- Reflection that digs deep: Anchor in specific shared moments with sensory detail, but don't shy away from the darkness. What nearly broke them? What cost more than they expected? What victory came at a price?\n- A subtle callback to how they met: '{meeting_story}', woven organically to show the distance traveled—from that first moment to this one, earned through struggle.\n- Recognition of how they changed each other, shown through before-and-after contrast. What did they have to sacrifice or surrender? What did they gain that they didn't know they needed? This is the psychological transformation at the heart of the story.\n- A promise rooted in lived experience and specific knowledge of the partner—not generic romantic ideals. This vow should acknowledge both the light and the shadow, the beauty and the cost. It's a choice made with full awareness.\n- An emotional crescendo that feels deeply earned, followed by grounded, intimate closure. The hardest moments made this clarity possible. The low point gave birth to this high point.\n\nCRITICAL - The vow itself (if spoken):\n- Must use {user_name}'s distinct voice. The syntax, rhythm, word choice, and tonality should be unmistakably theirs. If the names were removed, we'd still know who's speaking.\n- Should sound like compressed real speech, not a written declaration. How would THIS person actually say this?\n- What the words sound like matters as much as what they mean. Read it aloud—does it flow naturally?\n- Avoid ALL clichés: 'my better half,' 'complete me,' 'soulmate,' 'my everything,' 'you make me whole,' 'my other half,' 'meant to be,' 'perfect for me.'\n- The vow should serve multiple purposes: express commitment, reveal character, acknowledge the journey, and create emotional resonance.\n- Subtext allowed: what remains beautifully unsaid can be as powerful as what's spoken.\n\nThis vow should sound like this specific person speaking to this specific person, nobody else—someone who has seen them at their worst and their best. Dig deep into the psychological resonance of their transformation. This is where character arc and plot converge.\n\nIf unsure whether the vow sounds authentic, ask: Would a stranger reading this know it's {user_name} speaking? If not, revise until the voice is unmistakable.",
        category: "arc",
        orderIndex: 4,
        agentId: "publisher",
        preferredLength: "long",
      }, {
        id: "arc_future",
        title: "VI. The Future",
        prompt:
          "Write a forward-looking emotional arc imagining {user_name} and {partner_name} ten years ahead. This is your Climax and Resolution—the culmination of their journey and the final image that will stay with the reader.\n\nThe arc must:\n- Open with a concrete future scene—a specific moment in time with rich sensory details (season, location, activity, atmosphere). This is the climactic image we've been building toward.\n- Reflect continuity of their core dynamic and personality traits, evolved but unmistakably them. The essence remains; the depth has grown. If including dialogue, their voices should still be distinct and recognizable—aged, perhaps, but fundamentally the same people.\n- Reference one specific challenge from their past (especially from Arc IV: The Journey) and echo their origin story ('{meeting_story}') to show the full arc of transformation. How far they've come should be visible and moving.\n- Show emotional maturity and deepened understanding without losing their essential chemistry. They've grown separately and together. The resolution of their character arcs should be clear but subtle.\n- End on a cinematic final image or gesture that feels both intimately specific to them and universally timeless. This is your final beat—make it resonate. What image will the reader carry with them?\n\nIf using dialogue in this future scene:\n- Maintain character-specific voices with the same syntax and rhythm, but allow for maturity.\n- Short exchanges work best—compressed, meaningful, lived-in.\n- Subtext: after ten years, they communicate in shorthand, shared glances, inside jokes.\n- What they don't need to say anymore can be as powerful as what they do say.\n\nKeep it hopeful but realistic—avoid excessive idealization. Include small imperfections, quirks, or gentle humor that make it believable. This is a full narrative arc with present-tense immediacy and emotional weight, not a distant projection or summary. This is the payoff for everything that came before—the proof that their journey mattered and their transformation was real.",
        category: "arc",
        orderIndex: 5,
        agentId: "publisher",
        preferredLength: "medium",
      },
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
        prompt: `Analyze the trade opportunity for a {product_condition} {product_category}.
        
### INPUT DATA:
- Product: {product_category}
- Condition: {product_condition}
- Market Val (New): R$ {market_value_new}
- Market Val (Used): R$ {market_value_used_avg}
- Demand Score: {market_demand}
- Trader Mode: {trader_mode}

### ALGORITHM TASKS:
1. Calculate VMR (Valor de Mercado Real) using: VMR = {market_value_used_avg} * (1 + ({market_demand} - 0.5)) * condition_multiplier.
2. Determine PIC (Preço Ideal de Compra) based on {trader_mode}.
3. Provide a Score (A, B, or C) for this opportunity.

### OUTPUT:
Return a technical report with the calculated values, the deal grade, and a concise justification based on the Trader Algorithm.`,
        category: "analysis",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "exit_strategy",
        title: "Exit & Pricing Strategy",
        prompt: `Based on the {product_category} analysis, define the exit strategy for a {trader_mode} trader.
        
### VALUES TO GENERATE:
- Anchor Price (for negotiation)
- Real Market Price (Closing target)
- Turnover Price (Fast sale)

### INSIGHTS:
Provide two types of insights:
1. **Algorithmic Insight**: Formula-based recommendation.
2. **AI Market Insight**: Contextual advice on how to pitch this specific item in the current market.`,
        category: "strategy",
        orderIndex: 1,
        agentId: "ade_sales_coach",
        preferredLength: "medium",
      },
      {
        id: "liquidity_report",
        title: "Liquidity & Risk",
        prompt: `Evaluate the liquidity risk for {product_category} with demand score {market_demand}.
        
Analyze how long the capital remains locked given the {trader_mode} strategy. 
If the mode is 'Margin', emphasize the patience required. If 'Turnover', emphasize the urgency of the price point.`,
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
    description: "Real-time assembly and delivery tracking board (KDS Style).",
    tiles: [
      {
        id: "order_kds_list",
        title: "Lista de Pedidos Ativos",
        prompt: "Generate a list of 5 furniture assembly orders for a retail store. For each, include: Order # (6 digits), Client Name, Product Name, Status (A Montar, Em Montagem, Entregue), Priority (Alta, Média, Baixa), and Payment (Pix, Dinheiro, Maquininha). Return a human-readable summary AND a JSON array under ```json blocks with the fields: {id, orderNumber, clientName, product, status, priority, paymentMethod}.",
        category: "orders",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      },
      {
        id: "assembly_details",
        title: "Protocolos e Manuais de Montagem",
        prompt: "Provide technical assembly requirements for standard {product_category}. Mention tools needed and estimated time. Return a markdown guide AND a JSON object under ```json blocks: {tools: [], estimatedTime: string, difficulty: 1-5}.",
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
    description: "Visual grid mapping for walls, central islands, and product locations.",
    tiles: [
      {
        id: "aisle_configuration",
        title: "Configuração de Expositores",
        prompt: `Define a store layout emphasizing a logistics/stock flow. 
        The layout has:
        - Wall Left (ID: 0)
        - Wall Right (ID: 4)
        - Central Islands (IDs: 1, 2, 3) where people walk between them.
        
        Assign a thematic category (ex: Cozinhas, Dormitórios) to each Wall and Island. 
        Return a summary AND a JSON mapping: {aisles: [{id: 0-4, name: string, category: string}, ...]}.`,
        category: "layout",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "medium",
      },
      {
        id: "product_pins",
        title: "Mapeamento de Pins (Produtos)",
        prompt: `Generate 10 products for the store. For each, assign a physical position (pin).
        
        ### NOMENCLATURE:
        - aisle: 0 (Wall Left), 4 (Wall Right), 1 (Island A), 2 (Island B), 3 (Island C).
        - side: 'Left' or 'Right' (Only for Islands 1, 2, 3).
        - pos: Number 1 to 12.
        
        Return a list AND a JSON array under \`\`\`json blocks with: {id, name, aisle, side, pos, category}.`,
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
    description: "Vitrine ativa para exposição de produtos e captura de leads.",
    tiles: [
      {
        id: "public_catalog",
        title: "Catálogo de Produtos (Estoque)",
        prompt: `Create a luxurious furniture catalog for a store specialized in {product_category}.
        Define 5 flagship products. For each, include:
        - name
        - price (realistic BRL)
        - mainCategory (ex: Quarto, Cozinha, Sala)
        - shortDescription
        - isFeatured (true or false)
        
        Return a beautiful catalog description and a JSON array under \`\`\`json blocks: {products: [{id, name, price, category, description, isFeatured}, ...]}.`,
        category: "products",
        orderIndex: 0,
        agentId: "ade_research_analyst",
        preferredLength: "long",
      },
      {
        id: "orders_database",
        title: "Banco de Dados de Pedidos",
        prompt: "Create an empty order database structure. Just return a JSON skeleton under ```json: {orders: []} blocks to initialize the metadata accurately.",
        category: "orders",
        orderIndex: 1,
        agentId: "ade_research_analyst",
        preferredLength: "short",
      }
    ]
  }
};

export const APP_SCENARIOS = GUEST_DASHBOARD_TEMPLATES;

export function getGuestTemplate(templateId: string): GuestTemplate {
  return (
    GUEST_DASHBOARD_TEMPLATES[templateId] ?? GUEST_DASHBOARD_TEMPLATES.template_1
  );
}

