# Plano de Implementação: I/O - Smart Survey e Adaptação ao Estilo do Projeto

Este plano técnico descreve a integração completa do novo App Tag **I/O - Smart Survey** (focado no mapeamento de riscos ergonômicos e psicossociais em conformidade com as diretrizes das normas brasileiras NR-1/NR-17), a adequação de todos os labels para o prefixo **`I/O - `** e a perfeita conformidade com a identidade visual e de engenharia atual do sistema.

---

## 🎨 Integração Estética e Respeito ao Estilo do Projeto

> [!IMPORTANT]
> **Adesão Total à Identidade Visual Própria (Sem Sobrescritas McKinsey externas)**
> 1. **Tipografia Nativa**: Em vez de carregar fontes serifadas externas (como Lora), manteremos a elegância moderna do projeto usando **Poppins** (para cabeçalhos, títulos e elementos de interface) e **Inter / Geologica** (para textos e corpo operacional).
> 2. **Comportamento Grayscale-to-Green**: Adotaremos o padrão clássico do *Form Survey Maker* onde os cartões de indicadores começam em escala de cinza pura (`grayscale(100%)` / opacidade suave). Ao finalizar as respostas de um módulo, o cartão "se ilumina" e recebe um filtro esmeralda brilhante (`bg-emerald-50/10` com bordas e ícones `#10b981`), indicando a conclusão com status visual refinado.
> 3. **FormView Ultra-Clean (Foco Cognitivo)**: A tela de resposta de perguntas adotará uma interface centralizada com fundo suave (`bg-neutral-50/30`), removendo distrações e exibindo controles arredondados elegantes (bordas de 1.5px em cinza ardósia para estados inativos e esmeralda sólido para estados ativos).

---

## ⚙️ Integração com Sistemas Nativos da Plataforma

> [!TIP]
> **Conformidade de Engenharia com Fluxos Atuais**
> - **Autenticação Clerk**: Sincronização direta via componente `AuthSync.tsx`. Usuários logados herdam a claim de `"member"` e sua sincronização de créditos a partir do MongoDB.
> - **Credit Limits (Zustand authStore)**: As operações críticas (como criação de novo workspace de vistoria e emissão de laudo executivo) passarão pelo validador do `useAuthStore` usando as ações `canPerformAction` e `consumeUsage`, impedindo o bypass das limitações do SaaS.
> - **Persistência Dupla (Local + DB)**: Workspaces de visitantes anônimos ("guest") são persistidos em localStorage. Assim que o usuário faz login via Clerk, o sistema aciona a migração nativa para o MongoDB.
> - **Orquestração por Comandos de Voz**: O componente `VoiceAssistantOverlay.tsx` capturará comandos contextuais como *"iniciar vistoria"*, *"concluir módulo"* ou *"gerar relatório"* e executará a ação correspondente no painel do Smart Survey.

---

## 📊 Especificações e Regras de Negócio (NR-1 / NR-17)

A plataforma operacionalizará em tempo real a inteligência técnica de riscos psicossociais com 13 módulos fundamentais:

### 1. Lista de 13 Módulos de Riscos
1. **Assédio e Discriminação** (Peso: 3)
2. **Má Gestão de Mudanças** (Peso: 2)
3. **Clareza de Papel** (Peso: 1)
4. **Recompensas e Reconhecimento** (Peso: 2)
5. **Suporte Social e Liderança** (Peso: 2)
6. **Autonomia e Controle** (Peso: 2)
7. **Justiça Organizacional** (Peso: 3)
8. **Eventos Violentos/Traumáticos** (Peso: 3)
9. **Subcarga de Trabalho** (Peso: 1)
10. **Sobrecarga de Trabalho** (Peso: 3)
11. **Relacionamentos Interpessoais** (Peso: 2)
12. **Comunicação de Riscos** (Peso: 2)
13. **Isolamento / Trabalho Remoto** (Peso: 1)

### 2. Algoritmo de Cálculo de Risco
O cálculo do Índice de Risco Ponderado ($S_p$) é executado para cada módulo/setor conforme a fórmula matemática:

$$S_p = \frac{\sum_{i=1}^{M} (x_i \cdot w_i)}{\sum_{i=1}^{M} w_i}$$

Onde:
- $x_i \in [0, 10]$ é o valor da resposta (escala analógica de 0 a 10).
- $w_i \in [1, 3]$ é o peso legal de severidade regulatória de cada pergunta.

### 3. Classificação dos Riscos (Semáforo NR-1)
- **Risco Baixo (OK)**: $S_p < 4.0$ (Indicadores verdes, conformidade técnica)
- **Alerta Moderado**: $4.0 \le S_p < 7.0$ (Indicadores laranja, requer atenção ergonômica preliminar)
- **Risco Crítico**: $S_p \ge 7.0$ (Indicadores vermelhos, requer plano de ação GRO/PGR imediato)

### 4. Alerta de Polarização Setorial (Consensus Rupture)
Para detectar quebra de alinhamento e divisão crítica de opiniões em uma mesma equipe ou setor, calcularemos o desvio padrão das avaliações:

$$\sigma = \sqrt{\frac{\sum_{j=1}^{N} (S_{p, j} - \mu)^2}{N}}$$

Se o desvio padrão de um setor for **$\sigma \ge 2.0$**, o painel apresentará o badge visual **"Opiniões Divididas"** (estilo indigo soft), alertando o auditor sobre possíveis focos de conflito ou disparidades agudas de percepção.

---

## 🛠️ Detalhamento dos Componentes a Alterar

### 1. app-tags.ts e Configuração de Domínio

#### [MODIFY] [app-tags.ts](file:///C:/Users/milto/Documents/ai-saas/src/lib/app-tags.ts)
- Inserir a nova ID `"smart_survey"` no tipo `AppTagId`.
- Adicionar a definição em `APP_TAGS`:
  ```typescript
  {
    id: "smart_survey",
    label: "I/O - Smart Survey",
    color: "#10b981", // Emerald-500
  }
  ```
- Renomear todos os labels existentes para conter o prefixo `"I/O - "`:
  - `business_insights` $\rightarrow$ `"I/O - Business Insights"`
  - `love_writers` $\rightarrow$ `"I/O - Love Writers"`
  - `trade_ranking` $\rightarrow$ `"I/O - Ranking Product"`
  - `furniture_logistics` $\dots$
- Adicionar os atributos de cadastro inicial em `APP_ATTRIBUTES` para `smart_survey`:
  - `survey_company` ("Razão Social", placeholder: "Qual a razão social da empresa?")
  - `survey_sector` ("Setor Auditado", placeholder: "Ex: Operações, Logística, Administrativo")
  - `surveyor_name` ("Nome do Auditor", placeholder: "Quem é o auditor/responsável?")

#### [MODIFY] [templates.ts](file:///C:/Users/milto/Documents/ai-saas/src/lib/templates.ts)
- Adicionar `"template_smart_survey"` em `DASHBOARD_TEMPLATES` contendo os cards padrão para geração das análises sintéticas por Inteligência Artificial (adequando o formato estruturado que alimenta o painel).

---

### 2. Onboarding e Integração com Página Inicial

#### [MODIFY] [HomeContainer.tsx](file:///C:/Users/milto/Documents/ai-saas/src/containers/home/HomeContainer.tsx)
- Ajustar os textos de visualização para prepender o prefixo `"I/O - "` em todo o fluxo de onboarding do chat.
- Adicionar o suporte a `smart_survey` mapeando as perguntas inteligentes baseadas nos 3 atributos definidos.

#### [MODIFY] [AdminOnboardingHandler.tsx](file:///C:/Users/milto/Documents/ai-saas/src/components/admin/AdminOnboardingHandler.tsx)
- Estender a detecção de duplicação de workspace e adicionar a função `handleSurveyCreation` que instancia o template de vistoria com persistência baseada nas Zustand stores.

---

### 3. Painel Administrativo e Redirecionamento de Tabs

#### [MODIFY] [AdminNavigation.tsx](file:///C:/Users/milto/Documents/ai-saas/src/components/admin/ade/AdminNavigation.tsx)
- Habilitar detecção `isSurvey = templateId === "template_smart_survey"`.
- Aplicar o tema esmeralda de alta fidelidade do projeto para estados ativos do Smart Survey.
- Inserir a tab de `"survey"` com ícone correspondente.

#### [MODIFY] [AdminContainer.tsx](file:///C:/Users/milto/Documents/ai-saas/src/containers/admin/AdminContainer.tsx)
- Capturar a visualização do `template_smart_survey` para iniciar automaticamente na tab `"survey"`.
- Renderizar o componente `<SmartSurveyBoard>` no fluxo central de renderização.

---

### 4. Smart Survey Dashboard Component

#### [NEW] [SmartSurveyBoard.tsx](file:///C:/Users/milto/Documents/ai-saas/src/components/admin/ade/SmartSurveyBoard.tsx)
Criar uma plataforma integrada de gestão de conformidade:
- **Painel Corporativo (Multi-empresa / Setores)**: Permite o cadastro e chaveamento dinâmico de frentes auditadas e a visualização consolidada do painel.
- **Visualização de Cartões (Grayscale-to-Green)**: Módulos de risco com status visual de preenchimento inteligente e interativo.
- **Interface FormView**: Tela de inquérito focada, com navegação suave, barras de progresso e escalas de 0-10 personalizadas.
- **Simulador de Respostas**: Botão "Simular Respostas" integrado para fins de demonstração (preenche automaticamente as respostas de 12 funcionários divididos entre 3 setores: Operações, Logística e RH, gerando variância estatística realista com alertas de polarização ativos).
- **Emissor de Laudo Executivo em PDF**: Geração de documento de impressão estruturado, contendo tabelas de diagnóstico legal, notas de controle GRO/PGR e parecer analítico de risco.

---

## 🧪 Plano de Verificação

### 1. Testes de Fluxo Cadastral
- Entrar na Home e escolher a App Tag `I/O - Smart Survey`.
- Completar o fluxo de onboarding informando Razão Social, Setor e Nome do Auditor.
- Confirmar redirecionamento automático para o painel administrativo na tab correta.

### 2. Validação Matemática e Simulação
- Clicar em "Simular Respostas" no painel.
- Verificar o cálculo correto de $S_p$ e o enquadramento no semáforo regulatório.
- Garantir que setores com desvios padrão discrepantes apresentem o alerta de "Opiniões Divididas".
- Testar a interface de impressão (PDF) e garantir que a formatação e os espaçamentos respeitem a grade visual da aplicação.
