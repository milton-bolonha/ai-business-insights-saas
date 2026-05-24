"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, ShieldAlert, Target, ChevronDown, ChevronUp, Zap, Percent, Download } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface TradeRankingMeterProps {
  nota: "A" | "B" | "C" | "D" | "E";
  valorNovo?: number;
  valorMercado: number;
  compraIdeal: number;
  precoReal: number;
  liquidezScore: number;
  estrategia: string;
  roiPct?: number;
  roiMensal?: number;
  negotiation?: {
    lance_primario: number;
    concessao_max: number;
    preco_abandono: number;
  };
  marketAnalysis?: {
    ml_median: number;
    ml_confidence: number;
    ml_sample_size: number;
    ml_range: [number, number];
  };
  sazonalidade?: number[];
}

export function TradeRankingMeter({
  nota,
  valorNovo,
  valorMercado,
  compraIdeal,
  precoReal,
  liquidezScore,
  estrategia,
  roiPct,
  roiMensal,
  negotiation,
  marketAnalysis,
  sazonalidade,
}: TradeRankingMeterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, locale } = useTranslation();

  const gradeAngles: Record<string, number> = {
    A: 90,
    B: 45,
    C: 0,
    D: -45,
    E: -90,
  };

  const gradeColors: Record<string, string> = {
    A: "#10b981", // Emerald-500
    B: "#34d399", // Emerald-400
    C: "#fbbf24", // Amber-400
    D: "#f87171", // Red-400
    E: "#ef4444", // Red-500
  };

  const activeColor = gradeColors[nota] || "#fbbf24";
  const activeAngle = gradeAngles[nota] || 0;

  // Market Deviation = How far below market value the purchase is
  const marketDeviationPct = valorMercado > 0 ? ((valorMercado - compraIdeal) / valorMercado) * 100 : 0;

  const fmt = (n: number) => {
    const rounded = Math.round(n);
    return locale === "pt"
      ? `R$ ${rounded.toLocaleString("pt-BR")}`
      : `$ ${rounded.toLocaleString("en-US")}`;
  };

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const getLiquidityLabel = (score: number) => {
    if (score > 1) return t("admin.tradeMeter.extreme");
    if (score > 0.5) return t("admin.tradeMeter.high");
    return t("admin.tradeMeter.low");
  };

  const handleDownloadSummary = () => {
    const summary = `
=== ${t("admin.tradeMeter.downloadReport").toUpperCase()} ===
Algorithm: Trader Engine V2
Strategy: ${estrategia}
Grade: ${nota}

METRICS:
${valorNovo ? `- ${t("admin.tradeMeter.priceNew")}: ${fmt(valorNovo)}` : ""}
- ${t("admin.tradeMeter.priceUsed")}: ${fmt(valorMercado)}
- ${t("admin.tradeMeter.idealBuy")}: ${fmt(compraIdeal)}
- ${t("admin.tradeMeter.targetSale")}: ${fmt(precoReal)}
- ${t("admin.tradeMeter.liquidity")}: ${getLiquidityLabel(liquidezScore)}
- ${t("admin.tradeMeter.deviation")}: ${Math.round(marketDeviationPct)}%

NEGOTIATION BRACKETS:
- ${t("admin.tradeMeter.anchorPrice")}: ${fmt(valorMercado * 1.2)}
- ${t("admin.tradeMeter.firstOffer")}: ${fmt(negotiation?.lance_primario || 0)}
- ${t("admin.tradeMeter.maxConcession")}: ${fmt(negotiation?.concessao_max || 0)}
- ${t("admin.tradeMeter.walkAway")}: ${fmt(negotiation?.preco_abandono || 0)}

ROI ANALYSIS:
- Total ROI: ${roiPct ? pct(roiPct) : "N/A"}
- Monthly ROI: ${roiMensal ? pct(roiMensal) : "N/A"}

Generated on: ${new Date().toLocaleString(locale === "pt" ? "pt-BR" : "en-US")}
    `.trim();

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trade-report-${nota}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentMonthIdx = new Date().getMonth();
  const mesesAbrev = locale === "pt"
    ? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[3rem] border border-gray-100 p-8 md:p-12 shadow-sm overflow-hidden transition-all duration-500">
      {/* Download Action */}
      <button
        onClick={handleDownloadSummary}
        className="absolute top-10 right-10 p-3.5 rounded-full bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all cursor-pointer z-20 group active:scale-95"
        title={t("admin.tradeMeter.downloadReport")}
      >
        <Download className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-10 w-full pr-12">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 ml-12">
            {t("admin.tradeMeter.title")}
          </h2>
          <div className="flex items-center justify-center gap-6 ml-12">
            <div
              className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-5xl font-black text-white shadow-2xl rotate-[-2deg] ring-8 ring-gray-50"
              style={{ backgroundColor: activeColor }}
            >
              {nota}
            </div>
            <div className="text-left">
              <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">{estrategia}</div>
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest mt-1 opacity-60">
                {t("admin.tradeMeter.systemName")}
              </div>
            </div>
          </div>
        </div>

        {/* Gauge SVG */}
        <div className="relative w-72 h-36 mb-16 scale-110">
          <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
            <path
              d="M 10 45 A 35 35 0 0 1 90 45"
              fill="none"
              stroke="#f8f9fa"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 10 45 A 35 35 0 0 1 90 45"
              fill="none"
              stroke="url(#gauge-gradient)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="125"
              strokeDashoffset={125 - (125 * (angleToPercent(activeAngle) / 100))}
              style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />

            <defs>
              <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            <motion.g
              initial={{ rotate: -90 }}
              animate={{ rotate: activeAngle }}
              transition={{ type: "spring", stiffness: 35, damping: 10 }}
              style={{ originX: "50px", originY: "45px" }}
            >
              <line
                x1="50"
                y1="45"
                x2="50"
                y2="12"
                stroke={activeColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="50" cy="45" r="5" fill="#111827" stroke="white" strokeWidth="1.5" />
            </motion.g>
          </svg>

          <div className="absolute inset-[-14px] flex items-end justify-center pointer-events-none">
            <span className="text-[10px] font-black text-black tracking-[0.2em] uppercase">
              {t("admin.tradeMeter.deviation")}
            </span>
          </div>
          <div className="absolute inset-[-42px] flex items-end justify-center pointer-events-none">
            <span className="text-2xl font-black text-black tracking-tighter">{Math.round(marketDeviationPct)}%</span>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full mb-8">
          <ValueCard
            label={t("admin.tradeMeter.priceNew")}
            value={fmt(valorNovo || 0)}
            icon={<ShieldAlert className="h-5 w-5 text-gray-400" />}
          />
          <ValueCard
            label={t("admin.tradeMeter.priceUsed")}
            value={fmt(valorMercado)}
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          />
          <ValueCard
            label={t("admin.tradeMeter.idealBuy")}
            value={fmt(compraIdeal)}
            icon={<Target className="h-5 w-5 text-emerald-500" />}
            highlight
          />
          <ValueCard
            label={t("admin.tradeMeter.targetSale")}
            value={fmt(precoReal)}
            icon={<Activity className="h-5 w-5 text-orange-500" />}
          />
          <ValueCard
            label={t("admin.tradeMeter.liquidity")}
            value={getLiquidityLabel(liquidezScore)}
            icon={<Zap className="h-5 w-5 text-purple-500" />}
          />
        </div>

        {/* Advanced Section Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-5 bg-gray-50 hover:bg-gray-100 rounded-[2rem] flex items-center justify-center gap-3 transition-all border border-gray-100 group active:scale-[0.99]"
        >
          <span className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
            {t("admin.tradeMeter.advancedInsights")}
          </span>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />}
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="pt-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Negotiation Script */}
                  {negotiation && (
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl lg:col-span-1">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                        <Zap size={14} className="text-amber-400" /> {t("admin.tradeMeter.negotiationBrackets")}
                      </h3>
                      <div className="space-y-4 font-mono">
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-gray-500">{t("admin.tradeMeter.anchorPrice")}</span>
                          <span className="font-bold text-gray-300">{fmt(valorMercado * 1.2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-emerald-400">{t("admin.tradeMeter.firstOffer")}</span>
                          <span className="font-bold">{fmt(negotiation.lance_primario)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                          <span className="text-amber-400">{t("admin.tradeMeter.maxConcession")}</span>
                          <span className="font-bold">{fmt(negotiation.concessao_max)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2">
                          <span className="text-red-400 font-bold uppercase text-[10px]">{t("admin.tradeMeter.walkAway")}</span>
                          <span className="font-bold text-red-400 text-lg decoration-double">{fmt(negotiation.preco_abandono)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ROI Analysis */}
                  {roiPct !== undefined && (
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-emerald-500 rounded-xl">
                              <Percent size={18} className="text-white" />
                            </div>
                            <span className="text-[11px] font-black uppercase text-emerald-700 tracking-widest">
                              {t("admin.tradeMeter.totalRoi")}
                            </span>
                          </div>
                          <div className="text-4xl font-black text-emerald-900">{pct(roiPct)}</div>
                        </div>
                        <div className="bg-blue-50 rounded-[2.5rem] p-8 border border-blue-100 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-500 rounded-xl">
                              <Activity size={18} className="text-white" />
                            </div>
                            <span className="text-[11px] font-black uppercase text-blue-700 tracking-widest">
                              {t("admin.tradeMeter.monthlyYield")}
                            </span>
                          </div>
                          <div className="text-4xl font-black text-blue-900">{pct(roiMensal || 0)}</div>
                        </div>
                      </div>

                      {/* Mercado Livre Market Data Enrichment */}
                      {marketAnalysis && (
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                              {t("admin.tradeMeter.marketSource")}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400">{t("admin.tradeMeter.confidence")}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${marketAnalysis.ml_confidence > 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {Math.round(marketAnalysis.ml_confidence * 100)}%
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                  <TrendingUp className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-black uppercase text-gray-400 leading-none">
                                    {t("admin.tradeMeter.mlMedian")}
                                  </div>
                                  <div className="text-sm font-bold text-gray-900">{fmt(marketAnalysis.ml_median)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-black uppercase text-gray-400 leading-none">
                                  {t("admin.tradeMeter.mlRange")}
                                </div>
                                <div className="text-[11px] font-bold text-gray-600">{fmt(marketAnalysis.ml_range[0])} — {fmt(marketAnalysis.ml_range[1])}</div>
                              </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl text-[10px] text-gray-500 font-medium leading-relaxed">
                              {t("admin.tradeMeter.mlDescription", { sampleSize: marketAnalysis.ml_sample_size })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Seasonal Trend Visualization */}
                      {sazonalidade && (
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 relative overflow-hidden">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
                            {t("admin.tradeMeter.historicalTrend")}
                          </h3>
                          <div className="flex items-end justify-between h-20 gap-1.5 md:gap-3">
                            {sazonalidade.map((val, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center group relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                  Factor: {val}x
                                </div>
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${val * 40}%` }}
                                  className={`w-full rounded-t-lg transition-all duration-300 ${i === currentMonthIdx ? 'bg-orange-500 shadow-lg shadow-orange-200' : 'bg-gray-100 group-hover:bg-gray-200'}`}
                                />
                                <span className={`text-[9px] mt-2 font-bold ${i === currentMonthIdx ? 'text-orange-600' : 'text-gray-400'}`}>
                                  {mesesAbrev[i]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ValueCard({ label, value, icon, highlight = false }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean
}) {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all hover:translate-y-[-4px] active:scale-95 duration-300 ${highlight ? 'bg-black border-black text-white shadow-2xl scale-105 z-10' : 'bg-white border-gray-100 text-gray-900 hover:shadow-xl hover:border-gray-200'} flex flex-col justify-between min-w-0`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${highlight ? 'bg-white/10' : 'bg-gray-50'}`}>
          {icon}
        </div>
        <span className={`text-[10px] uppercase font-black tracking-widest leading-none ${highlight ? 'text-gray-400' : 'text-gray-400'}`}>{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-black leading-none tracking-tighter break-words whitespace-normal">{value}</div>
    </div>
  );
}

function angleToPercent(angle: number) {
  return ((angle + 90) / 180) * 100;
}
