## Feito hoje (08-12)

- Ajustamos Add Prompt/Contacts/Notes para card de criação estilo tile (borda tracejada + ícone).
- TileDetailModal agora renderiza conteúdo/prompt/histórico como HTML (Markdown -> HTML).
- Botões de regenerate removidos de tiles/contacts; UpgradeModal sem “Maybe Later”.
- Stripe checkout passou a usar `STRIPE_SUCCESS_URL` e `STRIPE_CANCEL_URL` (fallback para `NEXT_PUBLIC_APP_URL/admin`).

## Pendências novas (08-12)

- Investigar lentidão no fluxo de geração (POST /api/generate ~21s) e origem no stack (compile/proxy/render).
- Corrigir /api/usage retornando 404.
- Reativar modal de perfil/upgrade e mover contagens (tiles/contacts/notes) para o modal; tirar contagem do sidebar.
- Substituir o botão de Add Note pelo card de criação já aberto (inline).
- Ajustar bordas/estilo dos cards de notes e contacts para ficarem bem arredondados e consistentes com o tile principal.
- Melhorar cards de contacts: fundo branco, título + insights/texto logo após, gerar insights/mensagens prontas, e validar chat do contato (OpenAI) está respondendo.
- Corrigir heading do sidebar para mostrar a empresa do usuário (sales rep), não a empresa pesquisada.
- Definir e preencher as envs de Stripe (`STRIPE_SUCCESS_URL` e `STRIPE_CANCEL_URL`) com as URLs finais (produção/staging conforme ambiente).
