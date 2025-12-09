# Tarefas (07-12)

## Pendências do produto

- Refazer visual do main tile card.
- Refazer visual de notes.
- Refazer visual de contacts.
- Refazer header do main (admin).
- Adicionar CRUD de templates de prompts para criar cards além dos dois existentes.

## Limites/Planos/Stripe

- Preencher `PRICE_PLAN_MAP` no webhook Stripe com os price_ids reais (member/business) e validar checkout de teste.
- Garantir `plans` populados (guest/member/business) com `npm run seed:plans` em todos os ambientes.
- Opcional: remover função síncrona `getPlanLimits` se não for mais usada e manter somente `getPlanForUser`/`checkLimit`.

## UX/Client

- Validar `useGuestDataMigration` após upgrade (checkout) para mover dados de guest → member e reidratar admin.
- Confirmar mensagens e UpgradeModal usando `/api/usage` em todos os fluxos.

## Segurança/operacional

- Se quiser super_admin no futuro: criar endpoints/UI protegidos para CRUD de planos e invalidar cache.

## Atualizações 08-12

- Add Prompt/contacts/notes agora usam card de add em estilo tile (borda tracejada, ícone +) em dashboard vazio e com itens.
- Notes em cards com cabeçalho laranja; adicionar/editar ocorre direto no card recém-criado.
- Contacts em cards lado a lado com contagem agregada no perfil lateral (Tiles/Contacts/Notes) sem abrir upgrade.
- TileDetailModal renderiza conteúdo/prompt/histórico em HTML a partir de Markdown.
- UpgradeModal sem botão "Maybe Later"; perfil não abre upgrade automático.
- Botões de regenerate removidos de tiles/contacts.
- Stripe checkout usa `STRIPE_SUCCESS_URL` (e opcional `STRIPE_CANCEL_URL`) com fallback para `NEXT_PUBLIC_APP_URL`/admin.
