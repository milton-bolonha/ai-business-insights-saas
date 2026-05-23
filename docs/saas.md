# Arquitetura SaaS - MVP AI Business Insights

Este documento define a arquitetura técnica, fluxos de usuário e lógica de negócios para o MVP do SaaS, detalhando a migração para o sistema de **Créditos** (Wallet), métodos de segurança, workflow de pagamento e confirmação.

> **Foco**: Manter a experiência fluida (Product-Led Growth), segurança robusta no backend, com faturamento justo através da conversão de limites tradicionais para consumo baseado em créditos.

---

## 1. O Novo Modelo de Créditos

No lugar de limitar funcionalidades individualmente (ex: "máximo de 3 workspaces"), o sistema agora adota um modelo de carteira virtual (**Wallet de Créditos**).

*   **Planos concedem Créditos**: A assinatura do plano (ex: Pro) ou a recarga avulsa insere um volume X de créditos na conta do usuário.
*   **Ações consomem Créditos**: Cada interação de IA ou recurso premium possui um custo em créditos dentro da plataforma. O custo é dinâmico e pode ser alterado sem modificar as travas hardcoded do banco.

**Tabela de Custo por Ação (Preços em Créditos):**
| Ação | Custo em Créditos | Notas |
| :--- | :--- | :--- |
| Criar Workspace | 10 Créditos | Custo de setup estrutural. |
| Gerar Tile (IA) | 5 Créditos | Consome tokens de LLM para pesquisa. |
| Chat com Contato | 2 Créditos (por msg) | LLM RAG interact. |
| Exportar PDF | 50 Créditos | Processamento intensivo de ponta. |

**Atribuição em Planos:**
| Plano | Total de Créditos/mês | Equivalência Básica |
| :--- | :--- | :--- |
| **Guest (Shadow)** | 100 Créditos | Suficiente para testar o MVP. |
| **Free (Cadastrado)** | 200 Créditos | Bônus por ter criado a conta. |
| **Pro (Membro)** | 10.000 Créditos | Uso intenso mensal ("Ilimitado" funcional). |

---

## 2. Visão Global: Workflow de Pagamento e Confirmação

Exibidos exclusivamente em Reais Brasileiros (**R$** BRL), os pagamentos seguem um rigido processamento Server-Side Webhook-first.

### Tabela de Pagamentos e Rotas Transacionais

| Entidade / Serviço | Papel Funcional | Destino da Transação | Responsabilidade do DB |
| :--- | :--- | :--- | :--- |
| **Checkout UI** (`/checkout`) | Modal de apresentação com valores em `R$`. | Envia `userId` para gerar Session. | Nenhuma. Client apenas redireciona. |
| **Route Handler** (`/api/stripe/checkout`) | Segurança e criação da sessão de Checkout (Stripe). | Stripe Hosted Checkout. | Nenhuma. Pega o link e repassa ao Webhook. |
| **Stripe Webhook** (`/api/webhooks/stripe`) | Garantir a fonte da verdade da transação. | Recebe evento `checkout.session.completed`. | Define `isMember: true` E Cria a Purchase. |
| **Usage Service** (`usage-service.ts`) | Conceder e validar os créditos. | Escuta Webhook e libera o crédito `+X` para usuário. | Atualiza os Créditos `creditsTotal`. |

### O Fluxo Perfeito de Compra (Happy Path)

1. Usuário tenta gerar um relatório. O middleware nota que `creditsUsed + 50 > creditsTotal`.
2. O App exibe o modal de Upgrade com planos baseados em Créditos (ex: "Compre o Pro por R$ 49,90 e receba 10.000 Créditos").
3. Usuário clica em comprar. O servidor cria a sessão Stripe passando `userId` nos `metadata`.
4. Usuário paga no Stripe e, não importa se ele fechar a aba agora, **o Webhook garante tudo**:
   - Webhook do Stripe aciona o Servidor.
   - Servidor localiza o plano, injeta `+ 10000` em `creditsTotal` do DB do Usuário.
   - Servidor cria um registro no Model de **Purchase** (que antes estava incompleto).
5. Frontend puxa a rota `/api/usage` na reconexão e reativa a UI do usuário, agora com o novo saldo.

---

## 3. Vulnerabilidades e Segurança

Para proteger a carteira de créditos contra ataques ou abusos (já que agora cada crédito vale R$):

### A. Risco: Contas Órfãs e Pagamentos Perdidos
*   **Problema Histórico**: Não puxava todas as compras. O webhook apenas atualizava o status e não anexava o ID da sessão numa collection específica de histórico (`Purchase`).
*   **Correção**: O Webhook passa a criar obrigatoriamente e isoladamente na coleção de `purchases`, contendo o detalhamento financeiro (sessão, moeda como BRL, timestamp e `userId`).

### B. Risco: Abuso Guest (Shadow Token)
*   **Gestão de Visitantes**: Continuação do uso do `guest_token`. Como Visitantes também terão cota de créditos (100), continuaremos validando contra o Redis, atrelando IP e Assinatura Criptográfica.

### C. Risco: Corrida (Race Condition) no Balanço de Créditos
*   **Problema**: Múltiplos requests simultâneos para gerar Chat podem ultrapassar os créditos devido ao delay da base de dados.
*   **Correção**: Toda chamada `checkLimit` e `incrementUsage` sofrerá Atomic Updates no MongoDB (usando `$inc`), o que impossibilita gerar algo se os créditos esgotarem entre transações de ms.

---

## 4. Próximos Passos de Refatoração

1.  **Modelo de DB**: Introduzir `creditsLimit` e `creditsUsed` no MongoDB, além do mapeamento explícito do tipo moeda (`currency: 'BRL'`).
2.  **Webhook Updates**: Mudar a escuta do Stripe para atrelar a `db.insertOne("purchases", {...})` e garantir histórico confiável.
3.  **UI Updates**: Todo o sistema deve usar a notação visual *R$* no frontend, e remover a linguagem de "máximo de X tiles", adotando a cultura de Saldo da Carteira.
