# Próximas Tarefas - 14/03 (Finalização do Layout do Livro)

Este documento resume o estado atual do Editor de Livro (BookEditor) e as pendências críticas que precisam ser resolvidas para atingir a qualidade de impressão KDP (A5).

## 1. Estado Atual
- **Tecnologia**: Tiptap (ProseMirror) com layout simulado A5 via CSS transforms.
- **Estratégia de Layout**: "Fixed Frame" (Moldura Fixa). O viewport tem o padding (margens), e o editor rola por baixo dele.
- **Engenharia de Pixels**: Foi implementado um grid de **24px** (line-height). Cada página deve ter exatas **27 linhas** de escrita (648px).

## 2. Blocos de Erro Atuais (O que falhou)

### A. Corte de Páginas e Margens Desalinhadas
- **Sintoma**: O texto continua sendo cortado horizontalmente no rodapé e o desalinhamento aumenta a partir da página 2.
- **Causa Provável**: O Tiptap insere parágrafos e elementos com espaçamentos padrão do navegador ou do `StarterKit` que não são múltiplos exatos de 24px. Além disso, o cálculo de `translateY` pode estar sofrendo de erros de sub-pixel ou não considerando o padding estático do viewport corretamente.

### B. Falha nos Títulos ([TITLE] Markers)
- **Sintoma**: Os marcadores `[TITLE]...[END_TITLE]` estão aparecendo no texto final em vez de serem convertidos em `<h2>`.
- **Causa Provável**: A lógica de `streamBuffer` no `BookWriterView.tsx` limpa o buffer muito cedo ou não consegue capturar títulos que vêm fragmentados em múltiplos chunks do stream da OpenAI.
- **Estilo**: O estilo Oswald Bold não está sendo aplicado ou está sendo sobrescrito por classes `prose` do Tailwind.

## 3. Tarefas Técnicas Pendentes
1.  **Robustez do Stream**: Refatorar o detector de títulos para ser uma máquina de estados que espera o `[END_TITLE]` sem engolir outros textos ou deixar fragmentos.
2.  **Sincronização Vertical Total**:
    *   Remover o `StarterKit` ou resetar TODOS os estilos pro Tiptap (`p`, `h1`, `h2`, `br`) para terem margem 0 e line-height travado em 24px.
    *   Verificar o `box-sizing` e se o `translateY` deve considerar ou não o padding do viewport.
3.  **Estilo Oswald**: Garantir que o `h2` use `font-family: 'Oswald Variable'` e seja `bold`.

---

## 4. Prompt para o Futuro (Copie e Cole)

> **Contexto**: Estamos construindo um editor de livros A5 (148mm x 210mm) usando Tiptap.
> 
> **O Problema**: O sistema de paginação via `translateY` está com "drift" (desvio). O texto é cortado no rodapé e as margens superiores/inferiores não se alinham a partir da página 2. Além disso, os marcadores de título `[TITLE]...[END_TITLE]` enviados pela IA estão aparecendo no texto bruto e sem estilo.
> 
> **Sua Missão**:
> 1. No `BookEditor.tsx`, trave o line-height de TODOS os elementos em **24px**. Garanta que margens de `p` e `h2` sejam múltiplos exatos de 24px (ex: `margin-bottom: 24px`).
> 2. No `BookEditor.tsx`, revise o cálculo de `translateAmount`. Se a margem (73px) está no `viewport` (padding), o `translateY` deve mover o conteúdo interno exatamente em blocos de `648px` (27 linhas).
> 3. No `BookWriterView.tsx`, conserte o handler de stream. Ele deve detectar e remover os marcadores `[TITLE]` e `[END_TITLE]`, transformando o que está entre eles em uma tag `<h2>` real do Tiptap.
> 4. Estilize o `h2` com Oswald Variable, Bold, `21px` (~16pt), centralizado, com espaçamento total de 7 linhas (48px topo, 48px base, 48px o texto do título = 144px total).
> 5. Garanta que a página 2 comece exatamente com o topo alinhado à margem de 73px do viewport.
