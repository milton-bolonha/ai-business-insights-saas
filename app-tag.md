# Catálogo de App Tags (Módulos do Sistema)

Este documento mapeia todas as **App Tags** atualmente presentes no ecossistema I/O AI SaaS Hub. Cada App Tag representa um produto ou módulo isolado, com suas próprias lógicas de negócio, painéis administrativos e portais públicos.

---

## 1. 🎯 I/O Mentoring (`io_mentoring`)
**Foco:** Gamificação, Mentorias de Alta Performance e Gestão de Tarefas.
- **Admin Panels (Mentores):**
  - **Mentoring Profile Board:** Gestão de níveis (RPG), skills, métricas e "Side-quests" dos mentorados.
  - **Mentoring Kanban Board:** Gestão visual de tarefas e trilhas de aprendizado.
  - **Mentoring Schedule Board:** Agenda integrada para encontros.
  - **Insights & Evolution:** Relatórios gerados por IA baseados na tensão cognitiva do mentorado.
- **Public Panels (Mentorados):**
  - **Hub do Mentorado (`/mentorado/[id]`):** Visão gamificada do perfil (XP, Level, Inventário), Diário de Bordo para reflexões contínuas e envio de tarefas.

## 2. 📊 Smart Survey (`smart_survey`)
**Foco:** Pesquisas de Clima Organizacional, Diagnóstico de Risco (NR-1) e Coleta Contínua de Logs (Vendas).
- **Admin Panels (Avaliadores/RH):**
  - **Smart Survey Board / Directory:** Visão geral das empresas cadastradas e seus colaboradores.
  - **Company Detail View:** Gráficos polarizados, dispersão térmica de respostas, e laudos técnicos gerados por IA.
  - **Survey Builder:** Construtor de questionários com pesos variados e lógicas de salto.
- **Public Panels (Colaboradores):**
  - **Portal de Coleta (`/survey/...`):** Interface otimizada (mobile-first) para responder pesquisas complexas com fricção zero.

## 3. 🛋️ Furniture Store & Logistics (`furniture_store`, `furniture_logistics`, `furniture_layout`)
**Foco:** Varejo Moveleiro, desde a planta da loja até a entrega final.
- **Admin Panels (Lojistas/Gerentes):**
  - **Furniture Analytics Board:** Heatmaps da loja e análise de layout.
  - **Furniture Store Board:** Gestão do catálogo virtual, precificação dinâmica.
  - **Logistics Board:** Mapa de entregas, roteirização e painel de montadores.
- **Public Panels (Clientes Finais):**
  - **Furniture Public Store:** Loja virtual de ponta, interativa e renderização de produtos, com suporte da IA de vendas ("vendedor digital").

## 4. 📈 Trade Ranking (`trade_ranking`)
**Foco:** Avaliação, Trade-in, e Precificação agressiva de produtos de segunda mão.
- **Admin Panels (Traders/Avaliadores):**
  - **Trade Ranking Meter:** "Velocímetro" de precificação, calculando depreciação, custos de reparo e apetite de mercado ao vivo.
- **Public Panels (Vendedores B2C):**
  - Painel de submissão de aparelhos (ex: "Avalie seu smartphone usado em 1 minuto").

## 5. 💡 Business Insights & Love Writers (`business_insights`, `love_writers`)
**Foco:** Casos de uso de nicho para prospecção B2B (Insights) e geração criativa B2C (Livros de romance estruturados).
- **Admin Panels:**
  - Formulários dinâmicos de captura e geração de roteiros textuais assistidos por IA.

---

### 🔑 Funcionalidades Compartilhadas Transversais
- **Voice UI & Chatbot:** Independente da tag, a "Secretária IA" adapta seu prompt. (ex: Se `smart_survey` estiver ativo, ela responde sobre os laudos gerados).
- **Painéis Nativos:** Todos os módulos herdam painéis nativos como *Contacts*, *Notes* e *Usage Limits* (limites do SaaS vinculados ao Stripe).
