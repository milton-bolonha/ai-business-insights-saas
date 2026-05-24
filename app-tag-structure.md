# Estrutura e Engenharia de uma App Tag

Este guia técnico descreve como as **App Tags** funcionam debaixo do capô, como são estruturadas no repositório, e como um desenvolvedor pode criar e integrar uma nova.

---

## 1. Arquitetura Básica

Uma App Tag não é uma pasta estanque; é uma **dimensão de contexto** que atravessa todo o código (Full-Stack).
- **Core (Registro):** Definido em `src/lib/app-tags.ts`.
- **Frontend (Roteamento Visual):** O `WorkspaceContext` armazena as `activeTags`. O sistema de navegação mapeia as tags ativas para injetar os painéis (`<PanelComponent />`) corretos no Dashboard.
- **Backend (Dados):** As rotas de API analisam o contexto da tag para aplicar prompts específicos de IA (ex: `system_prompt = getPromptForTag(req.appTag)`).

## 2. Padrão de Pastas e Nomenclatura

Ao criar componentes para uma nova tag (ex: `medical_records`), siga o padrão arquitetural **Ade**:

```text
src/
 ├── components/
 │    └── admin/
 │         └── ade/
 │              ├── medical-records/              # Nova pasta da Tag
 │              │    ├── MedicalRecordsBoard.tsx  # O Painel Principal
 │              │    └── components/              # Sub-componentes específicos
 │              └── ...
 ├── lib/
 │    └── app-tags.ts                             # Registro da Tag
 └── messages/
      ├── pt.json                                 # Chaves: "admin.medicalRecords..."
      └── en.json
```

## 3. Passo a Passo: Criando uma Nova App Tag

1. **Registre a Tag em `app-tags.ts`:**
   Adicione o ID e a cor em `APP_TAGS`.
   ```typescript
   export type AppTagId = ... | "medical_records";
   
   export const APP_TAGS: AppTag[] = [
     // ...
     {
       id: "medical_records",
       label: "I/O - Medical",
       labelKey: "appTags.medical_records.label",
       color: "#ef4444", // Cor do tema
     }
   ];
   ```

2. **Registre Atributos (Contexto de Formulário):**
   No mesmo arquivo, em `APP_ATTRIBUTES`, adicione os inputs que a IA precisa saber.
   ```typescript
   {
     id: "clinic_name",
     labelKey: "attributes.clinic_name.label",
     appTagId: "medical_records"
   }
   ```

3. **Crie os Componentes de UI:**
   Construa seus painéis administrativos usando Tailwind e `framer-motion` para micro-interações.

4. **Injete no Admin Header / Sidebar:**
   Vincule a renderização condicional do seu novo componente quando a `activeTag` for selecionada pelo usuário.

5. **Localização (i18n):**
   NUNCA use strings hardcoded (ex: "Painel Médico"). Sempre use `useTranslation()`:
   ```typescript
   const { t } = useTranslation();
   <h1>{t("admin.medicalRecords.title")}</h1>
   ```

## 4. Tratamento de Erros e Troubleshooting

### Hydration Errors (Mismatch Server/Client)
- **Causa:** Uso de `window` ou dados aleatórios (`Date.now()`) em SSR.
- **Solução:** Isole o componente usando o hook customizado `useIsHydrated()` ou o useEffect.

### Erros de Regex no JSX
- **Causa:** Fechamento de tags HTML sem abertura correspondente, muitas vezes causados por concatenações erradas ou ternários complexos (ex: `<div/>` sem pai).
- **Solução:** Mantenha ternários simples. Se precisar de lógica densa de UI, extraia para mini-componentes dentro do mesmo arquivo.

### Faltando Traduções
- Sempre sincronize `pt.json` e `en.json`. O TypeScript (se configurado rigidamente) ou o console vão acusar *missing fallback keys*.

## 5. Convenções de Código
- **Estilo:** *Glassmorphism* limpo, bordas arrendondadas (`rounded-2xl`, `rounded-[2.5rem]`), cores pasteis no fundo com alto contraste no texto.
- **Tipagem:** TypeScript rigoroso para as props do componente.
- **Segurança:** Valide se o `sessionRole` (admin vs user) está correto antes de renderizar botões destrutivos (ex: `Trash2`).
