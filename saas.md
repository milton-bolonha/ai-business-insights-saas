# Arquitetura SaaS - MVP AI Business Insights

Este documento define a arquitetura técnica, fluxos de usuário e lógica de negócios para o MVP do SaaS, focando em autenticação, billing (Stripe) e controle de acesso seguro.

> **Foco**: Manter a experiência rica do Guest (Product-Led Growth) mas com segurança robusta no Backend.

## 1. Estratégia de Acesso e Limites (Real)

Baseado na configuração atual (`usage-service.ts`), os limites para Guests são generosos para permitir testes reais do produto:

| Recurso | Limite Guest (Visitante) | Limite Free (Cadastrado) | Limite Pro (Membro) |
| :--- | :--- | :--- | :--- |
| **Workspaces** | 3 (Locais) | 3 (Cloud) | 100+ |
| **Tiles (Insights)** | 30 | 30 | 2000 |
| **Contatos** | 5 | 5 | 1000 |
| **Notas** | 20 | 20 | 2000 |
| **Geração IA** | 5 tentativas (Regenerate/Chats) | 10 tentativas | 2000+ |
| **Persistência** | `localStorage` | MongoDB | MongoDB |

---

## 2. Multi-App e Funcionalidades Pagas (App Tags)

O sistema suporta múltiplas aplicações ("App Tags") rodando na mesma infraestrutura, cada uma com modelos de IA e regras de monetização específicas.

### A. Estrutura de App Tags
*   **Business Insights**: Focado em B2B. Modelo padrão: `gpt-4o` ou `claude-3-5-sonnet` (custo maior).
*   **Love Writers**: Focado em B2C/Criativo. Modelo padrão: `gpt-5-writer` (ajustado para criatividade).
*   **Expansibilidade**: Novos App Tags podem ser adicionados em `app-tags.ts`.

### B. Feature Gating por App
Além dos limites quantitativos (Tokens/Gerações), existem funcionalidades "Premium" específicas por App que exigem pagamento (ou compra avulsa):

| App Tag | Feature Premium | Modelo de Cobrança |
| :--- | :--- | :--- |
| **Love Writers** | **Publish (Publicar Livro)** | Pagamento Único (One-time) ou Incluso no Pro. |
| **Business Insights** | **Export PDF / Relatório Deep** | Incluso no Pro. |
| **Futuros Apps** | **Funcionalidade X** | Definido em `saas-config.ts`. |

> **Implementação Técnica**: O middleware de verificação de limites (`checkLimit`) deve suportar não apenas contadores, mas também booleanos de features (`canPublish`, `canExport`).

---

## 3. Vulnerabilidades Identificadas e Correções

Para proteger este modelo "rico" de acesso Guest contra hackers e abuso de API, implementaremos:

### A. Risco: Abuso de API (Custos OpenAI)
*   **Problema**: Um script pode chamar `/api/generate` milhares de vezes, explodindo a conta da OpenAI, pois hoje a validação é apenas client-side (no navegador).
*   **Correção (Shadow ID)**:
    1.  O servidor emitirá um **Cookie Assinado** (`guest_token`) para todo visitante.
    2.  O **Middleware** (e servidor) rastreará o uso desse token no **Redis** (ou memória temporária).
    3.  Se um `guest_token` tentar gerar mais que o permitido (ex: 30 tiles ou 5 chats), o servidor bloqueia (`429 Too Many Requests`).
    4.  **Fingerprint**: Bloqueio também por IP para evitar que o hacker apenas limpe os cookies.

### B. Risco: Contas Órfãs (Pagamento sem Usuário)
*   **Problema**: Se o usuário pagar e fechar a aba antes do redirecionamento, o dinheiro entra mas a conta não é criada/vinculada.
*   **Correção (Webhook First)**:
    1.  Continuar confiando no **Webhook do Stripe** como fonte da verdade.
    2.  Garantir que o `checkout` envie o e-mail do usuário (se coletado antes) ou que o Webhook crie o usuário provisório imediatamente ao receber o evento `checkout.session.completed`.

### C. Risco: Injeção de Dados (Data Poisoning)
*   **Problema**: Usuário malicioso enviar payloads gigantes ou scripts nos campos de input para travar o banco.
*   **Correção**: Manter e reforçar a validação **Zod** em todas as rotas de API (já existente, mas revisar limites de caracteres).

---

## 4. Fluxo Seguro de Transição (Guest -> Pago)

1.  **Uso Guest**: Usuário cria workspaces, gera tiles (limites validados via Shadow ID no Redis).
2.  **Gatilho de Bloqueio**: Atingiu limite (ex: 6º chat) ou tentou Feature Premium ("Publish").
3.  **Sign Up (Opcional, mas recomendado)**:
    *   Sugerir criar conta **Free** primeiro para salvar os dados na nuvem (MongoDB).
    *   Isso garante que temos o e-mail dele antes de qualquer transação financeira.
4.  **Upgrade / Compra Avulsa**:
    *   Usuário logado clica em Upgrade ou "Comprar Publish".
    *   Stripe Checkout recebe `userId` e `email` corretos.
    *   Sem risco de perder a conta.

---

## 5. Fluxo de Pagamento e Billing

*   **Fonte da Verdade**: Webhooks do Stripe.
*   **Status de Assinatura**:
    *   `active`: Acesso total.
    *   `past_due`: Permite acesso temporário (grace period) com aviso.
    *   `canceled`/`unpaid`: Downgrade automático para plano `FREE`.
*   **Prevenção de Inconsistência**:
    *   O `stripeCustomerId` é salvo no usuário no momento da criação da sessão de checkout (ou no webhook inicial).

---

## 6. Estados Técnicos do Usuário

| Estado | Auth | Plano DB | Limite Enforcement |
| :--- | :--- | :--- | :--- |
| **Shadow Guest** | Não (Cookie) | N/A (Redis) | Redis (IP + Cookie). |
| **Free User** | Sim (Clerk) | `FREE` | MongoDB (`checkLimit` no DB). |
| **Pro User** | Sim (Clerk) | `PRO` | MongoDB (Limits altos + Features Premium). |
| **Churned** | Sim (Clerk) | `FREE` | MongoDB (Volta ao limite Free). |

---

## 7. UX e Interface

*   **Usage Badge Inteligente**:
    *   Mostra consumo real baseado no plano atual.
    *   Ex: "2/3 Workspaces (Visitante)" ou "Ilimitado (Pro)".
*   **Gatilhos de Upsell**:
    *   No bloqueio de geração.
    *   Ao tentar usar feature exclusiva (ex: Botão "Publish" com ícone de cadeado/coroa).
*   **Gestão de Conta**:
    *   Página `/settings/billing` com Link para Portal do Cliente Stripe (para cancelamento/faturas).

## 8. Próximos Passos de Implementação (Segurança & Features)

1.  **Backend**: Criar `middleware/guest-limit.ts` para validar Shadow ID e IP no Redis.
2.  **API**: Atualizar `/api/generate` para consultar esse limite server-side.
3.  **App Tags**: Implementar verificação de feature (`canPublish`) no `usage-service.ts`.
4.  **Frontend**: Adicionar indicadores visuais de "Premium" nos botões restritos.
