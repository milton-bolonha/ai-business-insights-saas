/**
 * Trade Ranking Algorithm - Service Layer
 * 
 * Provides local calculation for VMR, PIC, and strategies.
 */

export type ProductCondition = "novo" | "semi_novo" | "usado" | "ruim";
export type TraderMode = "giro" | "margem" | "agressivo";
export type DeprecCategory = "smartphone" | "notebook" | "console" | "eletro" | "generico";

export interface TradeRankingInput {
  produto: {
    categoria: string;
    estado: ProductCondition;
    catDeprec: DeprecCategory;
    idade_anos: number;
    funcionamento: number; // 0-1
    custo_reparo: number;
  };
  mercado: {
    valor_novo: number;
    media_usado: number;
    demanda: number; // 0-1
    oferta: number; // 0-1
    tempo_medio_venda_dias: number;
    mes: number; // 0-11
    marketStats?: {
      used: { median: number; p10: number; p90: number; count: number };
      new: { median: number; p10: number; p90: number; count: number };
      confidence: number;
    };
  };
  trader: {
    modo: TraderMode;
    tolerancia_risco: number; // 0-1
    pressao_caixa: number; // 0-1
    taxaAltern?: number; // %/mês
  };
  dominancia: {
    market_share: number; // 0-1
    poder_preco: number; // 0-1
    concorrencia: number; // 0-1
  };
}

export interface TradeRankingOutput {
  valor_novo: number;
  valor_mercado: number;
  compra_ideal: number;
  preco_ancora: number;
  preco_real: number;
  preco_giro: number;
  nota: "A" | "B" | "C" | "D" | "E";
  ratio: number;
  liquidez_score: number;
  estrategia: string;
  roi_pct: number;
  roi_mensal: number;
  negotiation: {
    lance_primario: number;
    concessao_max: number;
    preco_abandono: number;
  };
  insights: {
    algorithmic: string;
    risk_level: "low" | "medium" | "high";
  };
  market_analysis?: {
    ml_median: number;
    ml_confidence: number;
    ml_sample_size: number;
    ml_range: [number, number];
  };
  sazonalidade: number[];
}

const DEPREC: Record<DeprecCategory, number> = {
  smartphone: 0.15,
  notebook: 0.25,
  console: 0.20,
  eletro: 0.30,
  generico: 0.35,
};

const SAZONALIDADE: Record<DeprecCategory, number[]> = {
  smartphone: [0.9, 0.85, 0.9, 0.95, 1.0, 1.0, 1.0, 1.1, 1.3, 1.1, 1.3, 1.4],
  notebook: [1.1, 1.2, 1.0, 0.9, 0.9, 0.9, 0.9, 1.3, 1.0, 0.95, 0.9, 1.0],
  console: [0.9, 0.85, 0.9, 0.95, 1.0, 1.0, 0.95, 1.0, 1.1, 1.1, 1.4, 1.5],
  eletro: [0.95, 1.0, 1.0, 1.0, 0.95, 0.9, 0.9, 0.9, 0.9, 1.0, 1.2, 1.3],
  generico: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.1],
};

const CONDITION_FACTORS: Record<ProductCondition, number> = {
  novo: 1.0,
  semi_novo: 0.85,
  usado: 0.7,
  ruim: 0.5,
};

export function calculateTradeRanking(input: TradeRankingInput): TradeRankingOutput {
  const { produto, mercado, trader, dominancia } = input;

  const taxaDeprec = DEPREC[produto.catDeprec] || DEPREC.generico;
  const seasMult = SAZONALIDADE[produto.catDeprec]?.[mercado.mes] || 1.0;

  // Determination of Valuation Regime
  // Tech = Exponential Depreciation | White Goods/Furniture = Anchored Replacement
  const regime: "DEPREC" | "ANCHOR" = 
    (produto.catDeprec === "eletro" || produto.catDeprec === "generico") ? "ANCHOR" : "DEPREC";

  let vmr_base_novo = 0;
  let market_pressure_mult = 0.5;

  if (regime === "ANCHOR") {
    // ANCHOR Model: Linear decay based on replacement cost (65% base)
    const linearDeprec = Math.max(0.5, 1 - (produto.idade_anos * 0.05));
    vmr_base_novo = mercado.valor_novo * 0.65 * linearDeprec;
    market_pressure_mult = 0.3; // Less volatility for appliances
  } else {
    // DEPREC Model: Exponential decay (Classic Tech)
    const deprecAcumulada = Math.pow(1 - taxaDeprec, produto.idade_anos);
    vmr_base_novo = mercado.valor_novo * deprecAcumulada;
    market_pressure_mult = 0.5;
  }

  // Média ponderada (40% teórico do novo, 60% reportado do mercado usado)
  // Se houver dados do ML, fazemos um blend: 40% User Input, 60% ML Median
  let mediaReferencia = mercado.media_usado;
  if (mercado.marketStats && mercado.marketStats.used.count > 0) {
    const mlUsed = mercado.marketStats.used.median;
    if (mediaReferencia > 0) {
        mediaReferencia = (mediaReferencia * 0.4) + (mlUsed * 0.6);
    } else {
        mediaReferencia = mlUsed;
    }
  }

  const vmr_referencia = mediaReferencia > 0
    ? (vmr_base_novo * 0.4) + (mediaReferencia * 0.6)
    : vmr_base_novo;

  const market_pressure = (mercado.demanda - mercado.oferta) * market_pressure_mult;
  const vmr =
    vmr_referencia *
    (1 + market_pressure) *
    CONDITION_FACTORS[produto.estado] *
    seasMult;

  // 2. Fator de Liquidez (FL)
  const fl_raw = 1 / (mercado.tempo_medio_venda_dias / 7);
  const fl = Math.min(fl_raw, 1.5); // Reality Clamp: Prevent "infinite" liquidity modifiers

  // 3. Fator de Dominância (FD)
  const fd = 1 + (dominancia.poder_preco * dominancia.market_share * 0.7); // 70% damping on dominance impact

  // 4. Fator de Perfil (FP)
  let fp = 0.35; // Default (margin)
  if (trader.modo === "giro") {
    fp = 0.6;
  } else if (trader.modo === "agressivo") {
    fp = 0.35 * (1 - trader.tolerancia_risco * 0.3);
  }

  // Ajuste por pressão de caixa e barreira mínima (Floor)
  fp = Math.max(fp + trader.pressao_caixa * 0.2, 0.12);

  // 5. Preço Ideal de Compra (PIC) com Reality Barrier
  const pic_raw = vmr * fp * fl - produto.custo_reparo;
  const pic = Math.max(pic_raw, vmr * 0.12); // Prevent purchase suggestions that are too divorced from market reality

  // 6. Estratégia de Venda
  const pa = vmr * fd * 1.2;
  const pr = vmr * fd;
  const pg = vmr * (0.8 + (fl - 1) * 0.1); // Scalable giro price based on market velocity

  // 7. Negociação (Baseada em Liquidez)
  const agressividade = Math.max(0, 1.5 - fl); // Less aggressive in fast markets
  const lance_primario = pic * (0.5 + agressividade * 0.2);
  const concessao_max = pic * (0.8 + agressividade * 0.1);
  const preco_abandono = pic;

  // 8. ROI (Margin-based for stability)
  const roi_pct = (pr - pic) / pr;
  const roi_mensal = roi_pct / (Math.max(1, mercado.tempo_medio_venda_dias) / 30);

  // 9. Classificação
  const ratio = pic / vmr;
  let nota: "A" | "B" | "C" | "D" | "E" = "E";
  if (ratio <= 0.2) nota = "A";
  else if (ratio <= 0.4) nota = "B";
  else if (ratio <= 0.6) nota = "C";
  else if (ratio <= 0.8) nota = "D";

  // 10. Liquidez Score (Capped)
  const liquidez_score = Math.min(
    mercado.demanda / (Math.max(1, mercado.tempo_medio_venda_dias) / 30),
    5
  );

  // 11. Estratégia Texto
  const estrategia =
    trader.modo === "giro" ? "Giro Rápido (Focus: Velocity)" :
      trader.modo === "margem" ? "Margem Máxima (Focus: Profit)" :
        "Trade Agressivo (Focus: Risk/Reward)";

  // 12. Insights
  const risk_level = ratio > 0.6 || produto.custo_reparo > (vmr * 0.3) ? "high" : (ratio > 0.4 ? "medium" : "low");
  const algorithmic = `VMR calculado em R$ ${Math.round(vmr)} (Sazonalidade: ${seasMult}x). O PIC sugerido de R$ ${Math.round(pic)} reflete uma margem de segurança de ${Math.round((1 - ratio) * 100)}%. ${fl > 1 ? "Mercado aquecido, favorece compra." : "Baixa liquidez, exija mais desconto."}`;

  return {
    valor_novo: mercado.valor_novo,
    valor_mercado: Math.round(vmr),
    compra_ideal: Math.round(pic),
    preco_ancora: Math.round(pa),
    preco_real: Math.round(pr),
    preco_giro: Math.round(pg),
    nota,
    ratio,
    liquidez_score,
    roi_pct,
    roi_mensal,
    negotiation: {
      lance_primario: Math.round(lance_primario),
      concessao_max: Math.round(concessao_max),
      preco_abandono: Math.round(preco_abandono),
    },
    estrategia,
    insights: {
      algorithmic,
      risk_level,
    },
    market_analysis: mercado.marketStats ? {
      ml_median: mercado.marketStats.used.median,
      ml_confidence: mercado.marketStats.confidence,
      ml_sample_size: mercado.marketStats.used.count,
      ml_range: [mercado.marketStats.used.p10, mercado.marketStats.used.p90],
    } : undefined,
    sazonalidade: SAZONALIDADE[produto.catDeprec] || SAZONALIDADE.generico,
  };
}
