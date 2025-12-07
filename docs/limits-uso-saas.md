# Limites de uso (SaaS) — visão rápida

## Planos e limites
- Fonte de verdade no backend (`plans` no Mongo ou fallback hardcoded em `usage-service`). Planos sugeridos: guest, member, business (ilimitado/alto).
- Métricas suportadas: `companiesCount`, `contactsCount`, `notesCount`, `tilesCount`, `tileChatsCount`, `contactChatsCount`, `regenerationsCount`, `assetsCount`, `tokensUsed`.

## Pontos de verificação (enforcement)
- **Workspaces (guest)**: `authStore` + reconciliação em `workspaceStore.refreshWorkspaces` (ajusta uso de createWorkspace para não ficar abaixo do total real).
- **Workspaces (member)**: `/api/generate` já consulta `checkLimit("companiesCount")`.
- **Contatos**: `/api/workspace/contacts` consulta `checkLimit("contactsCount")` (members) e incrementa uso.
- **Chat de tile**: `/api/workspace/tiles/[tileId]/chat` checa `tileChatsCount` (members) e incrementa.
- **Regenerate de tile**: `/api/workspace/tiles/[tileId]/regenerate` checa `regenerationsCount` (members) e incrementa.
- **Chat de contato**: `/api/workspace/contacts/[contactId]/chat` checa `contactChatsCount` (members) e incrementa.
- **Assets**: helper `enforceAssetLimit` disponível para ser usado em rotas de upload (block guests; members checam `assetsCount` e incrementam).
- **Modal de upgrade**: `usePaymentFlow` busca `/api/usage` para members e mapeia limites/uso reais; para guests usa limites/uso locais.

## Fluxo de leitura/exibição
- Endpoint `/api/usage`: retorna `{ usage, limits, plan, isMember }` lendo plano/limites do backend (com cache/ETag quando implementado).
- `usePaymentFlow`: faz fetch (members), cacheia em memória (Zustand) e fornece para o `UpgradeModal`; guests podem usar limites locais ou endpoint leve.

## Boas práticas aplicadas
- Checagem server-side para members em ações críticas (contacts, tile chat, regenerate, contact chat); client-side apenas para UX.
- Respostas de limite: HTTP 429 com mensagem clara.
- Reconciliação de uso para guests para evitar inconsistência de contagem de workspaces.
- Estruturas tipadas e zod para validação de payload nos endpoints de chat/regenerate.

## Próximos passos sugeridos
- Consolidar planos no DB (guest/member/business) e leitura com ETag/TTL curto.
- Usar `enforceAssetLimit` nos fluxos de upload (Cloudinary) quando implementados.
- Auditar rotas restantes (notas, outros uploads) para cobertura consistente de limites.

