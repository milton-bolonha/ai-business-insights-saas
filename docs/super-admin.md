# Super Admin – visão geral e implementação recomendada

## Por que ter um super admin?
- **Governança de planos/limites**: editar limites de uso sem redeploy nem hardcode.
- **Segurança e isolamento**: apenas um papel elevado pode alterar políticas sensíveis (planos, quotas).
- **Operação segura**: responder rápido a abusos ou ajustes comerciais sem tocar no código.

## O que o super admin faz
- CRUD de planos (guest/member/business ou variações).
- Ajusta limites de uso (workspaces, contatos, chats, regenerations, assets, tokens).
- Opcional: aciona invalidação de cache (plan cache em memória, CDN/ETag).

## Modelagem recomendada
- Campo `plan` no documento de usuário (`users.plan`), já consumido por `usage-service`.
- Papel de autorização (ex.: `role: "super_admin"`) no usuário ou em uma tabela de roles/permissions.
- Coleção `plans` (já usada): `{ planId, limits, createdAt, updatedAt }`.

## Fluxo de autorização
- Endpoints/admin UI protegidos: somente `role === "super_admin"` (ou verificação similar).
- Middleware de auth antes do handler; sem fallback em cliente.

## Endpoints sugeridos (server-side only)
- `GET /api/admin/plans`: listar planos.
- `PUT /api/admin/plans/:planId`: atualizar limites de um plano.
- `POST /api/admin/plans`: criar novo plano (se precisar).
- `POST /api/admin/plans/:planId/invalidate`: invalidar cache (cache interno do `usage-service`).

## Ganhos
- **Operação ágil**: ajustar quotas sem redeploy.
- **Confiabilidade**: evita hardcodes; sempre fonte única no DB.
- **Segurança**: operações sensíveis ficam atrás de um papel forte.

## Integração com o que já existe
- `usage-service` já lê planos da coleção `plans` e cacheia (TTL 60s). Com super admin, basta atualizar a coleção via endpoints/UI.
- `/api/usage` já retorna `{ usage, limits, plan, isMember }` lendo do DB.
- Seed inicial: `npm run seed:plans`.

## Boas práticas
- Não expor endpoints de admin a clientes públicos; usar rota server-only e auth robusta.
- Validar payloads com zod; retornar 400/403/429/500 conforme o caso.
- Incluir auditoria (quem mudou qual plano e quando).
- Invalidate cache após update de plano (limpar cache em memória do `usage-service`; opcionalmente, cabeçalhos ETag para `/api/usage`).

## Próximos passos (se/quando implementar)
- Criar endpoints admin protegidos (ou UI interna) para gerenciar `plans`.
- Adicionar log/audit trail das alterações de planos.
- Opcional: tela de super admin no frontend com form controlado + confirmação.

