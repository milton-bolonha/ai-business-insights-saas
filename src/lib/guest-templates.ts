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
        prompt:
          "Write a complete emotional arc about the lives of {user_name} and {partner_name} before they met. This is your opening scene—make it count.\n\nStructure the arc with:\n- A hook: Begin with a vivid, immediate moment that captures attention—not exposition, but a snapshot in motion (a specific morning, a recurring ritual, a breaking point, a small victory).\n- Character through values: Reveal each person individually through what they care about, what they prioritize, what they're chasing or avoiding. Show this through choices and routines, not description.\n- Their emotional gap: What was missing, consciously or unconsciously. Demonstrate this through contrast—what they do versus what they need, what they have versus what they're searching for.\n- A symbolic element: Introduce a recurring object, place, song, or ritual for each person that will gain new meaning once they meet. This is their emotional MacGuffin.\n- Invisible momentum: Create a sense that change is coming without naming it. Patterns breaking, routines shifting, small disruptions in their separate worlds.\n- Seamless transition: End with a beat that naturally propels us toward their meeting: '{meeting_story}'. The closing image should make the meeting feel inevitable.\n\nTone and execution:\n- Establish the emotional register for the entire story in these opening moments.\n- Avoid summarizing or explaining destiny—imply it through pattern, repetition, and symbolic detail.\n- Build a coherent dramatic progression: setup, mounting tension, transition.\n- Each person's 'before' should feel complete yet incomplete—whole lives that are somehow waiting.\n\nThis is your most valuable real estate. Hook the reader immediately and lay the foundation for everything that follows.",
        category: "arc",
        orderIndex: 0,
        agentId: "publisher",
        preferredLength: "medium",
      },
      {
        id: "arc_meeting",
        title: "II. The Spark (Meeting)",
        prompt:
          "Using '{meeting_story}', write a cinematic emotional arc of how {user_name} and {partner_name} met. This is your First Plot Point—the threshold of no return.\n\nInternally determine the Meet-Cute dynamic:\n1) Pull/Pull (mutual instant attraction)\n2) Push/Push (mutual resistance/friction)\n3) Push/Pull (one pursues, one resists)\n4) Neutral/Nervous (uncertain, tentative)\n\nStructure the arc with:\n- Rich sensory setting and atmosphere (sounds, light, temperature, spatial details).\n- Emotional tension expressed through physical action, body language, and what remains unspoken.\n- At least one exchange of dialogue (2-4 lines each) that reveals character through distinct voice. Each character should speak with syntax, rhythm, and word choices only they would use. The dialogue must serve multiple purposes: characterization, revealing what they want, and creating subtext—what they say versus what they mean.\n- Conflicting perspectives: Even in attraction, they should see the world differently. Let this contrast create texture and depth in the conversation.\n- A precise turning moment—a look, a gesture, a pause, or a line of dialogue—where something irreversible shifts. After this moment, they cannot return to who they were. Their perspective has fundamentally changed.\n- An ending that shows they are now fully committed to discovering what this is, even if unconsciously.\n\nMaintain continuity with the tone and emotional context from the previous arc: {previous_arc}.\n\nDialogue rules:\n- Each character must have a distinct voice. If names were removed, we should know who's speaking.\n- Dialogue should sound natural, like compressed real conversation—a highlight reel, not transcription.\n- Focus on subtext: what characters avoid saying is as important as what they say.\n- Rhythm matters: are they talking over each other? Long pauses? Quick wit? Let the rhythm reveal the dynamic.\n\nThis is the culmination of Act 1—the climax of everything set up in 'The Before.' From this point forward, they are in motion toward each other. This is a full narrative arc with dramatic progression, not an analysis or summary.",
        category: "arc",
        orderIndex: 1,
        agentId: "publisher",
        preferredLength: "long",
      }, {
        id: "arc_realization",
        title: "III. The Realization",
        prompt:
          "Write a complete emotional arc describing the specific moment {user_name} realized {partner_name} was 'the one.' This is your First Pinch Point—emphasizing what is truly at stake.\n\nThe arc must:\n- Begin in normalcy, routine, or emotional uncertainty as they navigate the early stages of their connection.\n- Present a concrete, observable triggering moment: a specific gesture, phrase, silence, unexpected crisis, or shared moment of joy that reveals what they stand to lose if this doesn't work. This can be a line of dialogue that lands differently than intended, or a meaningful silence that speaks volumes.\n- Contrast the depth of this realization with the initial spark of their first meeting: '{meeting_story}'. What has deepened? What's now at risk?\n- Show emotional maturation compared to the previous arc: {previous_arc}. They're no longer just reacting—they're beginning to understand the true stakes.\n- End with quiet internal certainty, even if unspoken. This realization changes how they move forward.\n\nIf using dialogue:\n- Keep it character-specific and true to their established voices.\n- The words matter less than what they represent—the beat, the shift.\n- Subtext is key: the realization may come from what isn't said, or from hearing familiar words in a new context.\n\nAvoid theatrical epiphanies or abstract declarations. Ground the realization in precise sensory detail and visible emotional shift. This moment should subtly set up the coming challenge they'll face together. The reader should feel the weight of what's now possible—and what could be lost.",
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
};

export const APP_SCENARIOS = GUEST_DASHBOARD_TEMPLATES;

export function getGuestTemplate(templateId: string): GuestTemplate {
  return (
    GUEST_DASHBOARD_TEMPLATES[templateId] ?? GUEST_DASHBOARD_TEMPLATES.template_1
  );
}

