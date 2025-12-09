## Feito em 09-12

- Ajuste Stripe checkout: modo subscription para price recorrente; checkout público liberado para guests; uso local (authStore) prevalece para guests no modal de upgrade.
- Remoção da exibição de categoria nos tiles e ocultação do filtro/sort no grid.
- Peq. ajustes de notas/contacts (bordas/overflow).

## Pendências 09-12

- Plano & limites: criar entrada no sidebar (footer) com modal dedicado exibindo uso/limites e CTA de upgrade (reutilizar UpgradeModal ou variação).
- Exigir login para membros após pagamento: alinhar fluxo (login antes do checkout ou forçar login após /create-account para amarrar userId real e refletir plano em `/api/usage`).
- Mostrar limites corretos para member (hoje guest continua aparecendo free se não houver login); definir estratégia de associação de pagamento → usuário.
- UI pendente herdada: contagens no modal (tirar do sidebar), Add Note inline refinado, estilos notes/contacts consistentes, heading do sidebar com empresa do usuário, contacts com insights/chat funcionais.
- Performance/generate e `/api/usage`: revalidar se 404/latência persistem; medir gargalos no generate (~21s).
- Tasks anteriores (07-12/08-12): visuais main tile/header, CRUD de templates, PRICE_PLAN_MAP + seed plans, validar useGuestDataMigration/UpgradeModal, segurança/super_admin.
