# App Builder Module (Dashboard & Sandbox AI Editor)

Este módulo é responsável pela interface e infraestrutura do "App Builder", onde o usuário interage com uma Inteligência Artificial (Agente) para gerar, editar e testar projetos em tempo real usando a Vercel Sandbox (E2B), com a possibilidade de edição manual de código num ambiente nativo robusto.

## Arquitetura e Features Atuais

A arquitetura foi profundamente evoluída para suportar persistência de ponta a ponta, estabilidade de HMR (Hot Module Replacement), prevenção de falhas silenciosas e uma experiência de edição manual de nível profissional (IDE-like).

### 1. Interface de "Dupla Visão" (Builder Mode vs Editor Mode)
A interface principal (`AppBuilderBoard`) opera em dois modos distintos que são alternados instantaneamente:
- **Builder Mode:** Apresenta o Chat do Agente (Esquerda) e o Iframe de Visualização em Tempo Real (Direita). Ideal para comandos de alto nível e testes visuais.
- **Editor Mode:** O Chat é substituído pelo **Explorador de Arquivos** (Sidebar) e o Iframe é substituído pelo **Editor de Código** (Pane). Ideal para ajustes manuais e code review.
- **Prevenção de Morte de Ambiente (Keep-Alive):** Ao invés de destruir componentes na troca de modos, o sistema utiliza CSS (`display: none`) para escondê-los. Isso garante que o *Ping* constante do Iframe (que evita a hibernação da Vercel Sandbox) continue ativo no background, impedindo que a máquina desligue se o usuário ficar mais de 5 minutos apenas editando código.

### 2. Editor de Código Robusto (Monaco Editor)
- Substituímos modais básicos pelo **Monaco Editor** (`@monaco-editor/react`), o mesmo motor por trás do VSCode.
- Oferece Syntax Highlighting nativo, indentação, e formatação inteligente para TypeScript, React (TSX), HTML e CSS.
- **Tratamento de CSP (Content Security Policy):** O CSS nativo do Monaco (`editor.main.css`) carregado via CDN é explicitamente permitido no `next.config.ts` (`style-src https://cdn.jsdelivr.net`) para garantir o funcionamento da rolagem e quebra de linhas.

### 3. Vercel Sandbox (E2B) & Next.js 15
- **Sandboxes Efêmeras:** Cada projeto roda em uma Sandbox isolada baseada na infraestrutura E2B (`node24`).
- **Scaffold Inicial:** Ao iniciar um projeto novo, o servidor usa `npx create-next-app@latest` com as flags `--app` e `--tailwind` ativadas.
- **Turbopack Ativado:** O servidor de desenvolvimento interno (Next.js) é iniciado com a flag `--turbo` (`npx next dev --turbo`). Isso resolve conflitos clássicos de websockets (`wss://`) do Webpack tradicional atrás do SNI Proxy da Sandbox, eliminando Erros 500 de handshake de WebSocket e consertando a quebra do HMR (Hot Reload).

### 4. Camada de Persistência Híbrida (MongoDB + Cloud)
A arquitetura adota a separação ideal de responsabilidades para armazenamento:
- **Código-Fonte (MongoDB):** Arquivos de texto (`.ts`, `.tsx`, `.css`, etc.) são salvos na coleção `appBuilderFiles`. O Banco de Dados é rápido, barato para textos curtos e possui baixíssima latência. 
  - Toda vez que a IA chama a ferramenta `writeFile` ou o usuário clica em "Salvar" no Editor, o conteúdo vai para o MongoDB via `files.repository.ts`.
  - Quando a Sandbox reinicia, o método `scaffoldNextProject` busca todos os arquivos daquele `projectId` no banco e faz a injeção instantânea na máquina virtual (`sandbox.writeFiles`).
- **Arquivos Binários (Cloudinary/S3):** Imagens, vídeos e áudios nunca devem ser salvos em banco de dados para evitar gargalos e custos altos. O sistema é programado para direcionar uploads de assets diretamente para o provedor de CDN (Cloudinary).

### 5. Resiliência de API e Prevenção de Perdas Silenciosas
- **Erros 401 Formatados:** A validação de segurança `requireOwnedProject` (que verifica tokens do Clerk) foi ajustada para lançar Exceções tratáveis, de modo que a API retorne um JSON `{"error": "Unauthorized"}` com status `HTTP 401`. Anteriormente, erros de texto puro causavam crashs silenciosos no parse de JSON do frontend.
- **Feedback de Salvamento:** O editor possui tratamento que intercepta e avisa na tela via `alert()` caso o token do usuário tenha expirado ou haja erro na API, evitando que o usuário ache que salvou o arquivo e feche a página, perdendo o trabalho manual.

### 6. A Inteligência do Agente (LLM) & Tools
- O Agente agora roda na engine `gpt-5`.
- **Prevenção de Alucinações:** Originalmente, o agente sofria de "imitação de logs", digitando marcações como `📝 Modificando arquivo...` no chat em vez de chamar ferramentas. O System Prompt barra isso.
- **Tools Disponíveis:** O agente possui acesso nativo às chamadas:
  - `writeFile`: Cria ou edita um arquivo.
  - `readFile`: Lê o contexto.
  - `listFiles`: Para se localizar na pasta.
  - `installPackages`: Instala pacotes via pnpm.
  - `runCommand`: Usado para rodar `npx tsc` e afins para auto-correção.
- **Foco no App Router:** A IA é forçada a usar `app/page.tsx`. Criar diretórios legacy `pages/` foi bloqueado.

---

## Configuração e Requisitos Básicos

- Variáveis de ambiente obrigatórias (`.env.local`):
  - `VERCEL_SANDBOX_TOKEN`: Token da API (geralmente integrado ao E2B).
  - `VERCEL_TEAM_ID`: ID da equipe (necessário para Sandboxes pagas/team).
  - `VERCEL_PROJECT_ID`: ID do projeto raiz na Vercel (se aplicável).
  - `OPENAI_API_KEY`: Necessária para o LLM.

## Troubleshooting (Solução de Problemas Comuns)

### 1. Iframe do App exibindo "404" ou "502/504 Bad Gateway"
**Causa:** A Sandbox parou ou o compilador travou.
**Solução:**
- O sistema possui um ping automático de 15 segundos que força o *start* (`ensureSandboxDevServer`) caso perceba que a porta 3000 caiu. Basta aguardar alguns segundos e ele substituirá o Erro 502 por uma tela de "Construindo App".
- Se persistir, abra a visualização do Terminal (`dev.log`) ou peça ao agente para corrigir problemas de TypeScript.

### 2. Sandbox morrendo enquanto o usuário edita código manualmente
**Causa:** Resolvido na arquitetura atual (`display: none` no PreviewFrame). Caso o bug volte, verifique se nenhum hook condicional (ex: `{viewMode === 'builder' && <PreviewFrame />}`) foi reimplementado sem querer, matando a rotina de Ping em background da Sandbox.

### 3. Falha ao salvar arquivos (Error "Unauthorized is not valid JSON")
**Causa:** O token do Clerk (sessão local do usuário) perdeu a sincronia, sofreu refresh, ou inspirou, resultando num 401 formatado incorretamente.
**Solução:** Resolvido no Backend (o erro volta como JSON agora). Se acontecer (ver o alert do navegador), apenas recarregue a página (F5) para que o Clerk renove o cookie da sessão antes de tentar salvar de novo.

### 4. Hot Reload não funciona
**Causa:** Conflito de WebSocket HMR no Proxy E2B, erro 500.
**Solução:** Resolvido usando a flag `--turbo`. Se você ver esse erro console, feche a sessão e crie um App do Zero ou espere o contêiner morrer para reiniciar com o Turbopack nativamente. Certifique-se de não remover `--turbo` do `sandbox.service.ts`.

### 5. Agente responde que fez a tarefa, mas nada mudou
**Causa:** A IA não utilizou o JSON Tools, ela apenas respondeu em Markdown. 
**Solução:** Quebre prompts imensos em duas ou três interações. Prompts muito gigantes tiram o "foco" (Attention Mechanism) do modelo e ele esquece das ferramentas disponíveis.
