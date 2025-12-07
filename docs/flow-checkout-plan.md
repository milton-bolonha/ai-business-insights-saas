# Fluxo Stripe → Plano → Migração → Admin

1) Checkout
- Endpoint: `POST /api/stripe/checkout`
- Auth: requer user autenticado; usa `client_reference_id` e `metadata.userId`.
- Preço único via `STRIPE_PRICE_ID`; metadata inclui `plan: member`.
- success_url/cancel_url: `/admin?success=true|canceled=true`.

2) Webhook Stripe
- Rota: `/api/webhooks/stripe`
- Eventos tratados:
  - `checkout.session.completed`: marca `isMember: true`, grava `stripeCustomerId`, `subscriptionId`, `plan` (usa `STRIPE_PRICE_ID` → member; business desabilitado), `migrationNeeded: true`.
  - `customer.subscription.created/updated`: atualiza `isMember`, status, `subscriptionId`, `plan` pelo price único.
  - `customer.subscription.deleted`: marca `isMember: false`, status canceled.
  - `invoice.payment_succeeded`: reseta usage.
-- Plano: price único `STRIPE_PRICE_ID` → `member`; business desabilitado (ou “entre em contato”).

3) Migração guest → member
- Flag `migrationNeeded: true` setada no webhook.
- No client, `useGuestDataMigration` deve detectar mudança para member e migrar localStorage → Mongo, limpando caches e reidratando.

4) Limites/uso
- Fonte: coleção `plans` no DB. `/api/usage` devolve `{ usage, limits, plan, isMember }`.
- Members: enforcement server-side. Guests: client mostra limites via `/api/usage` (cache/ETag), optional enforcement server-side.

5) Rate limiting
- Aplicado em: `/api/generate`, `/api/workspace/contacts`, `/api/workspace/tiles/[tileId]/chat`, `/api/workspace/tiles/[tileId]/regenerate`, `/api/workspace/contacts/[contactId]/chat`.

6) Estados (UI)
- `usePaymentFlow`: sempre usa `/api/usage` para limites/uso (guest e member).
- Zustands: só exibição; fonte é backend.
- TanStack Query: pode cachear `/api/usage` com revalidação curta.

7) Planos no DB
- Seed: `npm run seed:plans` (guest/member/business).
- `usage-service` falha se plano não existir.

Nota: o fluxo assume que o metadata/price do Stripe indica o plano. Ajuste `resolvePlanFromSession/Subscription` se precisar mapear preços diferentes ou novos planos.

