---
name: stripe-onboarding-planos
overview: Revisar limites sem hardcode e mapear/ajustar onboarding Stripe→member/planos, garantindo guest preservado.
todos:
  - id: persist-company
    content: Persistir salesRepCompany no snapshot/armazenamento e preenchê-lo na geração
    status: completed
  - id: sidebar-ui
    content: Ajustar heading e lista de workspaces no sidebar
    status: completed
  - id: upgrade-modal
    content: Conectar bloco Guest/Free ao UpgradeModal e renderizá-lo
    status: completed
---

# Plano para limites e onboarding Stripe→member

1) Limites sem hardcode e guest preservado

- Em produção, exigir planos no DB (plans); sem fallback hardcoded. Guest lê plano guest do DB via endpoint/cache (ETag/TTL) e não toca DB direto. Erro claro (429/500) se plano não existe.

2) Auditoria do fluxo Stripe→member

- Checkout: `NEXT_PUBLIC_STRIPE_CHECKOUT_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` (único). Success/cancel em `/admin`.
- Webhook: mapear `STRIPE_PRICE_ID` → `plan = "member"`; business desabilitado (pode ser “entre em contato”).
- Autenticação pós-checkout: usuário retorna logado; `useGuestDataMigration` migra guest→member se necessário.

3) Plano de correção

- Persistir `plan` no webhook usando `STRIPE_PRICE_ID` único; remover PRICE_PLAN_MAP múltiplo. 
- Documentar fluxo end-to-end (checkout → webhook → set plan → migration → admin), variáveis Stripe e fonte de limites (plans no DB).

4) Estado, cache e tipagem (Zustand/TanStack/XState/Zod/TS)

- Zustand: apenas exibição/UX; nunca fonte de verdade para limites/uso de members. Guests podem cachear o endpoint leve.
- TanStack Query: cachear `/api/usage` com revalidação curta e invalidar após checkout/upgrade.
- XState: transições que disparam ações pagas devem checar limite (via `/api/usage`) ou aguardar resposta do backend; estados de erro para 429.
- Zod/TS: schemas compartilhados (Stripe metadata, `/api/usage`) com `infer` para evitar divergência de tipos.
- Redis/KV: seguir para rate limiting; opcional cache de planos se precisar reduzir hits ao Mongo.

5) Boas práticas e segurança (@NextJS @MongoDB @Vercel)

- Código enxuto, funções curtas, handlers com early return e status claros (400/403/404/429/500).
- Segurança: auth obrigatória em rotas sensíveis, validar payload com zod, logs de erro sem vazar segredo; dados sensíveis apenas em server (sem client import). 
- Proteção: rate limiting já aplicado em generate/contacts/chat/regenerate; manter isolado; evitar middlewares legados (migrar warning do Next sobre middleware→proxy se aplicável).
- Mongo: usar planos/usuários no DB como fonte única; evitar fallback local; índices conforme necessário.

## Todos

- audit-fallbacks: Mapear/remover fallbacks de limites e definir erro claro.
- audit-stripe: Auditar checkout/webhook Stripe e como o plano do usuário é setado.
- fix-stripe-plan: Persistir plan no webhook + checagem pós-checkout (STRIPE_PRICE_ID único; business off/contato).
- doc-flow: Documentar fluxo checkout→plan→migration→admin e fonte de limites (plans); incluir observações de estado/cache/tipagem.