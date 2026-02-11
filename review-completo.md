## Review Completo — Código, Arquitetura e Boas Práticas

### Escopo e Fontes

- Base em Next.js (app router), TypeScript. Referências: `ARCHITECTURE_REVIEW.md`, `CODE_QUALITY_REPORT.md`, `GEMINI.md`, `FLOW.md`, `melhorias-cache.md`, pastas `src/app/api`, `src/app/admin`, `src/app/page.tsx`, `src/app/layout.tsx`.

### Arquitetura Geral

- **Front (pages/admin/home):** App Router com `HomeContainer` (guest lead → `/api/generate`) e admin em `src/app/admin/page.tsx` rendendo `AdminContainer`.
- **APIs:** Rotas em `src/app/api/**` (generate, workspace/\*, stripe, usage, migrate-guest-data, webhooks). Runtime node para usar Mongo/FS.
- **Dual-mode:** Guest (localStorage) vs Member (Mongo). Clerk em `getAuth` diferencia fluxos; cuidado para propagar `workspaceId` em operações de member.
- **Estado:** Trifecta: Zustand (UI/local workspace cache), TanStack Query (server state), XState (fluxos longos como onboarding). Context providers em `src/lib/providers`.

### Padrões de Código e TS

- **TypeScript:** Tipar payloads em vez de `any`. Evitar optional chaining em cascata sem defaults; preferir normalização antes de chamadas.
- **Zod:** Usar schemas nos endpoints (ex.: `/api/generate`). Para formularios, reusar schemas no front via shared module quando fizer sentido.
- **Normalização:** Centralizar helpers (ex.: `normalizeUrl`) para inputs críticos; manter trim/URL/protocol antes de validar.
- **Naming:** Consistente entre guest/member: `workspaceId`, `dashboardId`, etc. Evitar duplicar nomes diferentes para mesmo conceito.

### Segurança

- **Validação de entrada:** Todas rotas com Zod; garantir coerência com o front (protocolos, arrays limitados). Adicionar sanitização de URLs/HTML se aceitar rich text.
- **AuthZ:** `authorize`/`getAuth` já usados; reforçar RBAC em admin e evitar confiar só no client. Em rotas workspace/\*, checar `userId` + ownership.
- **Rate limiting:** Middleware aplicado em `/api/generate`; replicar em rotas de alto custo (chat/regenerate/stripe triggers).
- **Segredos:** OpenAI key obrigatória; logar erros sem expor payload sensível. Para webhooks, validar assinatura Stripe.
- **Uploads/attachments:** Usar `file-validator` para checar tipo/tamanho; definir limites explícitos.

### Estado e Fluxos

- **Zustand:** `workspaceStore` é fonte de verdade no client; garantir persist somente para guests. Evitar mutações diretas fora do store.
- **TanStack Query:** Usar para server state e refetch; configurar `staleTime` coerente. Evitar fetches manuais quando hook existir.
- **XState:** Manter máquinas coesas (onboarding, tileGeneration). Documentar eventos/guards, e testar transições críticas.
- **Sincronização guest → member:** `/api/migrate-guest-data` cobre migração; garantir idempotência e logs de auditoria.

### Cache (Redis / Vercel KV)

- Wrapper em `lib/cache/redis.ts` já detecta KV/Upstash. Expanda caching para listas (ex.: `/api/workspace/list`) e invalide em mutações. Definir TTLs no `CACHE_TTL`.
- Em queries, considerar cache key por `userId/workspaceId` para evitar vazamento cross-user.

### Serviços e Dados

- **Mongo Models:** Em `lib/db/models/*`. Garantir índices (scripts em `scripts/create-indexes.ts` e api/db/create-indexes). Campos obrigatórios: `workspaceId`, `dashboardId`.
- **Service layer:** `lib/services/*` deve sempre propagar `workspaceId` no corpo para member. Auditar contacts/tiles/notes (bug histórico apontado no CODE_QUALITY_REPORT).
- **Storage local:** `dashboards-store` para guests; manter compatibilidade de shape com Mongo para facilitar migração.

### APIs específicas

- `/api/generate`: Zod schema estrito; normalizar URLs/protocol; rate limit; grava snapshot em cookie/local e Mongo se membro.
- `/api/workspace/*`: CRUD; checar auth e ownership; usar cache invalidation e logs (`audit`).
- `/api/stripe/*` e webhooks: validar assinatura, tratar idempotência.
- `/api/usage`: limites para guests/members; manter coerência com `authStore`.

### Front (Home/Admin/Pages)

- `page.tsx` e `layout.tsx` simples; layout define `<Providers>` e lang pt-BR.
- **Home:** Form de geração; já normaliza URL (corrigido). Manter mensagens claras e limites convidados.
- **Admin:** Usa `AdminContainer`; garantir rotas protegidas e carregamento de workspace atual; considerar hook de auto-refresh em foco/online.

### Observabilidade e Logs

- `lib/audit/logger` para eventos sensíveis (create workspace, notes, etc.). Completar cobertura para mutações restantes. Evitar logar dados pessoais sem necessidade.

### Checklist de Melhorias

- [ ] Eliminar `any` e variáveis não usadas (ver lint.md).
- [ ] Unificar validação (Zod) entre front/back para forms chave.
- [ ] Garantir `workspaceId` propagado em services (notes, contacts, tiles) e APIs.
- [ ] Aplicar rate limiting nas rotas críticas além de `/api/generate`.
- [ ] Expandir cache Redis/KV para `/api/workspace/list` com invalidação em mutações.
- [ ] Adicionar auto-refetch no admin em focus/online (TanStack Query ou hook leve).
- [ ] Cobrir XState com testes de transição; adicionar testes de integração guest/member CRUD.
- [ ] Auditar uploads/attachments e validar MIME/tamanho.

### Riscos Residuais

- Divergência de schema front/back se normalização não for centralizada.
- Vazamento de dados se cache Redis não for segregado por usuário.
- Falhas para members se `workspaceId` faltar em requests (padrão já observado).
