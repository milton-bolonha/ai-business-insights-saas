# Trade Ranking - Technical Documentation

O **Trade Ranking** é um algoritmo paramétrico de trade projetado para identificar oportunidades de arbitragem e permuta com alta precisão, considerando variáveis de mercado, estado do produto e perfil do trader.

## 1. Variáveis de Entrada (Inputs)

### 1.1 Produto
- **categoria**: Descrição textual.
- **estado**: `novo` (1.0), `semi_novo` (0.85), `usado` (0.7), `ruim` (0.5).
- **catDeprec**: Categoria de depreciação (Smartphone: 0.15, Notebook: 0.25, Console: 0.20, Eletro: 0.30, Generico: 0.35).
- **idade_anos**: Anos de uso.
- **custo_reparo**: Valor estimado para restauração.

### 1.2 Mercado
- **valor_novo**: Preço de varejo atual.
- **media_usado**: Preço médio em marketplaces (OLX/Mercado Livre).
- **demanda**: Score de 0 a 1.
- **oferta**: Score de 0 a 1.
- **mes**: Mês atual (0-11) para cálculo de sazonalidade.

### 1.3 Trader
- **modo**: `giro`, `margem`, `agressivo`.
- **tolerancia_risco**: 0-1.
- **pressao_caixa**: 0-1.

---

## 2. O Algoritmo

### 2.1 Valor de Mercado Real (VMR)
Calcula o valor justo de venda imediata ajustado por sazonalidade.
```js
VMR = media_usado * (1 + (demanda - oferta)) * fator_estado * multiplicador_sazonal
```

### 2.2 Fator de Perfil (FP)
```js
if (modo == "giro") FP = 0.6
if (modo == "margem") FP = 0.35
if (modo == "agressivo") FP = 0.35 * (1 - risco * 0.3)
FP += pressao_caixa * 0.2
```

### 2.3 Preço Ideal de Compra (PIC)
O valor máximo a ser pago para garantir a margem de segurança.
```js
FL = 1 / (tempo_venda_dias / 7)
PIC = (VMR * FP * FL) - custo_reparo
```

---

## 3. Métricas de Performance

### 3.1 ROI (Retorno sobre Investimento)
- **Total ROI**: `(Preço Real - PIC) / PIC`
- **ROI Mensal**: `Total ROI / (Tempo Venda / 30)`

### 3.2 Script de Negociação
- **Preço Âncora**: `VMR * FD * 1.2`
- **Lance Primário**: `PIC * 0.65`
- **Concessão Máxima**: `PIC * 0.85`
- **Preço Abandono**: `PIC`

---

## 4. Classificação (Grades)
O sistema atribui uma nota baseada na razão `PIC / VMR`:
- **A**: Excellent Opportunity (ratio ≤ 0.2)
- **B**: Good Opportunity (ratio ≤ 0.4)
- **C**: Fair/Reasonable (ratio ≤ 0.6)
- **D**: High Risk (ratio ≤ 0.8)
- **E**: Avoid (ratio > 0.8)
