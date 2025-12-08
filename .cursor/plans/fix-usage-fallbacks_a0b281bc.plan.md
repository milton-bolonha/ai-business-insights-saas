---
name: fix-usage-fallbacks
overview: "Corrigir falhas de getPlanForUser: proteger caminho guest e substituir fallback zero por limites razoáveis/cache."
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

# Plano para corrigir getPlanForUser

1) Proteger caminho guest

- Envolver `fetchPlanLimits("guest")` em try/catch no ramo `!userId`; se falhar, usar cache em memória (se houver) ou retornar limites razoáveis para guest, evitando 500 no `/api/usage`.

2) Ajustar fallback de erro (members)

- Em erro no ramo member, usar último cache de plano ou um fallback não-zero (ex.: valores seed de member) para não bloquear totalmente; registrar log claro.

3) Reuso de cache

- Expor helper para obter limites do cache em memória (se carregado) antes de cair em fallback estático; evitar zerar limites.

4) Testar fluxos

- `/api/usage` com userId null (guest) não deve 500 mesmo sem plano guest no DB.
- `/api/usage` com member deve devolver limites (cache ou fallback razoável) mesmo se DB falhar temporariamente.

5) Documentar decisão

- Registrar em docs (ou comentário) que fallback é apenas para indisponibilidade temporária e que planos no DB são a fonte oficial.