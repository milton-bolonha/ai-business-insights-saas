# Algoritmo I/O Smart Survey — Metodologia Quantitativa (NR-1 / NR-17)

Documentação técnica auditável. Implementação: `src/components/admin/ade/smart-survey/risk-engine.ts`.

Cada **pesquisa (Survey)** possui `responses`, `iroHistory[]` e indicadores calculados na pesquisa ativa (`selectedSurveyId`).

---

## 1. Topologia organizacional

```
Pergunta (escala 0–10)
    ↓ normalização de polaridade
Risco por pergunta
    ↓ média por módulo
S_{i,t}  (módulo t, pessoa i)
    ↓ Σ w_t · c_t  /  Σ (w_t · c_t)
Sp_i     (score individual)
    ↓ média simples + σ global + entropia
IRO      (organização)
    ↓ por setor
IRO_s , σ_s
```

| Símbolo | Significado |
|---------|-------------|
| **N** | População-alvo declarada (`populationSize`) |
| **n** | Inquéritos concluídos na pesquisa ativa |
| **Sp_i** | Score individual 0–10 |
| **IRO** | Média aritmética dos Sp_i válidos |
| **w_t** | Peso regulatório do módulo |
| **c_t** | Multiplicador de criticidade contextual (default 1) |
| **σ_company** | Desvio padrão global dos Sp_i |
| **σ_s** | Desvio padrão dos Sp_i no setor s |

---

## 2. Normalização semântica (polaridade)

Apenas `scale_0_10` entra no cálculo numérico.

```
risco(v) = v           se polaridade = "negative"
risco(v) = 10 − v      se polaridade = "positive"
```

Perguntas textuais e múltipla escolha: evidência qualitativa / laudo IA (fora da média numérica).

---

## 3. Score por módulo

```
S_{i,t} = (1 / |Q_t|) × Σ risco(v_q)     para q escalares do módulo t
```

---

## 4. Score individual (Sp) — média ponderada intra-pessoa

```
R_t = w_t × c_t

Sp_i = (Σ_t  S_{i,t} · R_t) / (Σ_t  R_t)     onde S_{i,t} ≠ null
```

**IRO** = média **simples** inter-indivíduos (não re-pondera módulos na agregação):

```
IRO = (1 / |{i : Sp_i válido}|) × Σ_i Sp_i
```

Separação intencional: ponderação **dentro** da pessoa; democracia **entre** pessoas.

---

## 5. Dispersão global σ_company

```
σ_company = √( (1/n) × Σ_i (Sp_i − IRO)² )     com n ≥ 2 scores válidos
```

| σ_company | Interpretação |
|-----------|----------------|
| &lt; 1,5 | Consenso |
| 1,5 – 3,0 | Variabilidade |
| &gt; 3,0 | Polarização organizacional |

Detecta cenário: IRO ≈ 5 com metade em 0 e metade em 10.

---

## 6. IRO por setor e polarização local

```
IRO_s = média(Sp_i | setor(i) = s)
σ_s   = desvio padrão dos Sp_i no setor
```

Alerta setorial: `σ_s ≥ 2,0` com ≥ 2 respostas no setor.

---

## 7. Amostragem

### 7.1 Cobertura (≠ confiança nominal)

```
Cobertura (%) = min(100, round(100 × n / N))
```

### 7.2 Margem de erro (95%, p = 0,5, FPC)

```
SE  = 0,5 / √n
FPC = √((N − n) / (N − 1))
MOE = 1,96 × SE × FPC
```

Exibir ±`round(MOE × 100)`% quando `0 < n < N`.

### 7.3 Viés amostral (BiasScore)

Compara distribuição de **cadastros** vs **concluídos** por setor:

```
popPct_s   = cadastros no setor s / total cadastros
respPct_s  = concluídos no setor s / n
BiasScore  = round( min(100, (Σ_s |respPct_s − popPct_s|) / 2) )
```

| BiasScore | Interpretação |
|-----------|----------------|
| &lt; 15 | Amostra equilibrada |
| 15 – 34 | Viés leve |
| ≥ 35 | Viés amostral relevante |

Proxy: cadastro reflete composição esperada quando N por setor não está declarado.

---

## 8. Entropia organizacional (Shannon)

Distribuição de Sp_i em bins inteiros 0–10:

```
p_b = contagem no bin b / n
H   = − Σ_b  p_b · log₂(p_b)
H_norm = H / log₂(bins ativos)    → 0–100%
```

| H_norm | Interpretação |
|--------|----------------|
| baixo | Homogeneidade |
| médio | Entropia moderada |
| alto | Múltiplas realidades internas |

---

## 9. Tendência temporal (Variação do IRO)

No app o card se chama **“Variação do IRO”** (não “ΔIRO”). O símbolo **Δ** (delta) em matemática só significa **diferença entre dois valores** — aqui: quanto o IRO mudou desde o último registro.

Histórico por pesquisa: `survey.iroHistory[]` com `{ date, iro, n, sigmaGlobal }`.

Snapshot gravado quando IRO, n ou dispersão mudam materialmente (≥ 0,05 no IRO).

```
Variação do IRO  = IRO_atual − IRO_anterior
Ritmo de mudança = variação_atual − variação_anterior   (se ≥ 2 registros)
```

| Variação | Label na UI |
|----------|-------------|
| &gt; +0,3 | Deterioração |
| &lt; −0,3 | Melhora |
| |variação| ≤ 0,1 | Estável |

---

## 10. Classificação semafórica

| Faixa | Label |
|-------|--------|
| [0, 4) | Risco Baixo |
| [4, 7) | Alerta Moderado |
| [7, 10] | Risco Crítico |

---

## 11. Pesquisas, formulários e fluxo

- Várias `Survey` por `Company`.
- `forms[]`: módulos NR-1 ou blocos custom.
- `flowMode`: `sequential` | `per_form`.
- `showIf` em perguntas: exclusão condicional no fluxo.

---

## 12. Pipeline de implementação

```
Respostas brutas
  → normalização de polaridade
  → risco por pergunta
  → média modular ponderada (w_t · c_t)
  → Sp_i
  → agregação hierárquica (setor → IRO)
  → estatística (σ, H, viés, MOE)
  → classificação semafórica
  → histórico temporal (iroHistory)
```

---

## 13. Evoluções planejadas (não implementadas)

| Índice | Descrição |
|--------|-----------|
| **EI** | Intensidade emocional derivada de respostas textuais (IA) |
| **TC/TE/CC** | Pressão cognitiva alinhada ao grafo Teias |
| **c_t dinâmico** | Criticidade por recorrência/gravidade observada em runtime |
| **N por setor** | Universo declarado por setor para viés mais preciso |

---

## 14. Referência normativa

Mapeamento psicossocial NR-1 (GRO/PGR) e ergonomia NR-17 — escala 0–10, sem diagnóstico clínico.

UI: `MethodologyModal`, painel analítico em `CompanyDetailView`, PDF: `handlePrintPremiumPDF`.
