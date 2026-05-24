# 🚀 I/O AI SaaS Hub

O **I/O AI SaaS Hub** é um sistema completo de Software as a Service (SaaS) multiproduto, focado em entregar dezenas de ferramentas geradas e aprimoradas por Inteligência Artificial a partir de uma única infraestrutura base.

Combinando flexibilidade de ponta com um design estelar, o sistema atende desde varejo moveleiro até metodologias de mentoria e pesquisas organizacionais profundas.

---

## 🌟 Visão Geral e Arquitetura "App Tags"

O coração tecnológico do sistema é a arquitetura de **App Tags**. Em vez de criarmos "vários sites", nós desenvolvemos um ecossistema. Uma **App Tag** (ex: `io_mentoring`, `smart_survey`, `furniture_store`) atua como uma chave mestre de contexto. 

Ao alterar a App Tag ativa, o sistema se transmuta instantaneamente:
- **A Interface Pública (Home)** muda seus formulários, copys e chamadas para ação.
- **O Admin (Workspace)** altera toda a navegação lateral e carrega painéis exclusivos para aquela ferramenta.
- **A Inteligência Artificial (Chat/Voice)** muda sua "persona" e seu prompt de sistema para atuar como especialista daquela área específica.

---

## 🏛️ Estrutura do Sistema

### 1. Home & Portais Públicos (`/src/containers/home/`)
A porta de entrada do sistema. A `HomeContainer` é uma interface conversacional e dinâmica.
- **ClassicHeroForm:** Formulários adaptativos que capturam atributos específicos dependendo da App Tag (ex: Nome da Loja, Categoria do Produto, Nome do Mentorado).
- **Chat Integrado:** Um portal de pré-vendas e experimentação guiado por IA onde o usuário, seja convidado (Guest) ou membro (Member), já interage com o core da ferramenta.

### 2. Admin & Workspaces (`/src/containers/admin/`)
O ambiente logado. Baseado no refinado layout **Ade**, o admin oferece isolamento total de dados via Workspaces (`workspaceStore`).
- **Navegação Modular:** O `AdminSidebar` carrega ícones e menus baseados estritamente na `activeAppTag`.
- **Painéis (Boards):** Cada módulo possui seus componentes altamente interativos (`SmartSurveyBoard`, `MentoringProfileBoard`, `TradeRankingMeter`).
- **Widgets Universais:** Todos os módulos se beneficiam da infraestrutura base: Contacts, Notes e gestão de Assets.

### 3. A Central de Inteligência (`/src/components/chat/`)
Mais do que apenas um SaaS de clique, o sistema é um SaaS de *conversa*.
- **ChatInterface:** Presente na Home e no Admin, o chat é contextualizado (Sabe qual página você está e qual App Tag está ativa).
- **Voice UI (Comandos de Voz):** Suporte nativo e fluido para interações por voz, tornando a coleta de dados (como em pesquisas contínuas) "frictionless".

---

## 🧩 Os Módulos (Catálogo de App Tags Ativas)

1. **🎓 I/O Mentoring (`io_mentoring`)**
   - Painéis RPG de Perfil de Mentorado, Kanban de Tarefas, Diário de Bordo e evolução guiada por Tensão Cognitiva.
2. **📊 Smart Survey (`smart_survey`)**
   - Motor de formulários inteligentes e diagnósticos contínuos (Log de Vendas), com laudos de compliance (NR-1) gerados automaticamente por IA.
3. **🛋️ Varejo & Logística (`furniture_store`, `furniture_logistics`, `furniture_layout`)**
   - Loja virtual B2C com IA integrada, painéis de gestão logística de frota/montagem e Heatmaps de layout físico de loja.
4. **📈 Trade Ranking (`trade_ranking`)**
   - Máquina de precificação em tempo real. Avalia depreciação e liquidez para operações de trade-in de mercadorias.
5. **💡 Business Insights & Love Writers**
   - Pesquisa de mercado e geração de estruturada de literatura, mostrando a versatilidade absoluta da plataforma.

---

## 💳 Gestão de Usuários, Créditos e Limites

O sistema suporta a transição contínua de "Visitante curioso" para "Assinante Premium".
- **Gestão de Estado:** Usamos Zustand (`authStore`, `workspaceStore`) para alta performance e reatividade.
- **Guest Limits:** Visitantes recebem "créditos" armazenados temporariamente para testar a IA, gerenciados de forma rigorosa no backend.
- **Stripe & Members:** Ao realizar o Upgrade (`UpgradeModal`, `SaaSLimitsModal`), o perfil vira `Member`. Os dados são migrados do cache local para o MongoDB de forma transparente e as quotas de uso são estendidas e verificadas Server-Side pelo backend (`usage-service`).

---

## ⚙️ Stack & Ferramentas Usadas

- **Core:** Next.js 16 (App Router), React 19.
- **Styling:** Tailwind CSS, Framer Motion (para transições micro-interativas em Modais e Chats).
- **State & i18n:** Zustand (State), Contexts de UI menores e hooks customizados de tradução fluída (PT/EN).
- **Database & Auth:** MongoDB Atlas (Mongoose), Clerk (Autenticação JWT).
- **IA Engine:** Integração nativa com modelos OpenAI, manipulando JSON Schemas rígidos para garantir integridade nas respostas estruturadas.

---

### Internacionalização (i18n)
O SaaS é construído com pensamento global. Todas as strings estão modularizadas (`messages/pt.json`, `messages/en.json`), permitindo que a transição de idioma ocorra no cliente sem recarregamento (via `useTranslation`), trocando moedas e lógicas instantaneamente.

> *O I/O SaaS Hub é o núcleo definitivo de software modular. Um único deploy que abriga possibilidades ilimitadas de micro-SaaS.*
