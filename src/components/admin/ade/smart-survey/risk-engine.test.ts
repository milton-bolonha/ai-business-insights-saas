import { describe, it, expect } from "vitest";
import {
  effectiveTopicWeight,
  calculateCompanyDispersion,
  calculateOrganizationalEntropy,
  getRiskLevel,
  getDispersionLevel,
  calculateSamplingStats,
  calculateIroTrend,
  appendIroSnapshot,
} from "./risk-engine";

describe("risk-engine (Motor SST do Smart Survey)", () => {
  it("deve calcular o peso efetivo do tópico", () => {
    expect(effectiveTopicWeight(2.0, 1.5)).toBe(3.0);
    expect(effectiveTopicWeight(2.0, 0.0)).toBe(0.2); // Multiplicador mínimo de criticidade é 0.1
  });

  it("deve classificar os níveis de risco corretamente", () => {
    expect(getRiskLevel(null).label).toBe("Sem Dados");
    expect(getRiskLevel(2.5).label).toBe("Risco Baixo");
    expect(getRiskLevel(5.5).label).toBe("Alerta Moderado");
    expect(getRiskLevel(8.5).label).toBe("Risco Crítico");
  });

  it("deve calcular a dispersão da empresa (desvio padrão)", () => {
    const scores = [2, 4, 4, 4, 5, 5, 7, 9];
    const { stdDev, count } = calculateCompanyDispersion(scores);
    
    expect(count).toBe(8);
    expect(stdDev).toBeCloseTo(2.0, 1); // Desvio padrão amostral/populacional de variância ≈ 2.0
  });

  it("deve classificar o nível de dispersão corretamente", () => {
    expect(getDispersionLevel(null).label).toBe("Sem dados");
    expect(getDispersionLevel(1.2).label).toBe("Consenso");
    expect(getDispersionLevel(2.4).label).toBe("Variabilidade");
    expect(getDispersionLevel(4.0).label).toBe("Polarização organizacional");
  });

  it("deve calcular a entropia organizacional com Shannon", () => {
    const highlyHomogeneous = [5, 5, 5, 5, 5];
    const homogeneousResult = calculateOrganizationalEntropy(highlyHomogeneous);
    expect(homogeneousResult?.entropy).toBe(0);
    expect(homogeneousResult?.normalized).toBe(0);
    expect(homogeneousResult?.label).toBe("Baixa entropia (homogeneidade)");

    const dispersed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const dispersedResult = calculateOrganizationalEntropy(dispersed);
    expect(dispersedResult?.entropy).toBeGreaterThan(2);
    expect(dispersedResult?.normalized).toBeGreaterThan(80);
    expect(dispersedResult?.label).toBe("Alta entropia (múltiplas realidades)");
  });

  it("deve calcular estatísticas amostrais corretas", () => {
    // Caso de Censo (todas as pessoas responderam)
    const census = calculateSamplingStats(10, 10);
    expect(census.isCensus).toBe(true);
    expect(census.coveragePercent).toBe(100);
    expect(census.marginOfErrorPercent).toBe(0);

    // Caso de Amostra Parcial
    const sample = calculateSamplingStats(30, 100);
    expect(sample.isCensus).toBe(false);
    expect(sample.coveragePercent).toBe(30);
    expect(sample.marginOfErrorPercent).toBeGreaterThan(0);
  });

  it("deve calcular a tendência de IRO", () => {
    const history = [
      { date: "2026-05-01", iro: 5.0, n: 10, sigmaGlobal: null },
      { date: "2026-05-15", iro: 5.5, n: 10, sigmaGlobal: null },
    ];
    const trend = calculateIroTrend(history, 6.2);
    expect(trend.delta).toBeCloseTo(0.7, 1);
    expect(trend.acceleration).toBeCloseTo(0.2, 1);
    expect(trend.label).toBe("Deterioração");
  });

  it("deve anexar novos snapshots de IRO apenas quando houver mudanças relevantes", () => {
    const survey = { id: "s-1", name: "Pesquisa", iroHistory: [] } as any;
    const s1 = appendIroSnapshot(survey, 5.0, 10, 1.2);
    expect(s1.iroHistory?.length).toBe(1);

    // Se o IRO for o mesmo, não anexa
    const s2 = appendIroSnapshot(s1, 5.0, 10, 1.2);
    expect(s2.iroHistory?.length).toBe(1);

    // Se o IRO mudou de forma material, anexa
    const s3 = appendIroSnapshot(s1, 5.6, 10, 1.2);
    expect(s3.iroHistory?.length).toBe(2);
  });
});
