Documentação Técnica da Plataforma SaaS

1. Visão Geral do Sistema
   Um workspace é o ambiente virtual principal de cada usuário. Nele o usuário organiza e acessa todo o
   conteúdo e as funcionalidades do sistema. Cada workspace pode ser personalizado (por exemplo,
   definindo uma cor de fundo, bgColor ) e agrupa as entidades abaixo:

- Dashboards: painéis que contêm coleções de tiles. Cada dashboard é uma página organizada dentro
  do workspace.
- Tiles: unidades de conteúdo (textos, gráficos, imagens) geradas por IA ou pelo usuário. Representam
  itens visualmente distintos no dashboard.
- Notes: anotações ou lembretes livres que o usuário pode criar dentro do workspace.
- Contacts: registros de contatos ou leads, também com conteúdo possível de ser gerado por IA.
- Assets: arquivos de mídia (imagens, documentos, etc.) enviados pelo usuário, armazenados via
  integração com Cloudinary.
- bgColor: propriedade visual do workspace para definir sua cor de fundo.
  Há dois tipos de acesso ao sistema:
- Usuário Convidado (Guest): não exige login. Acesso restrito: o workspace é criado temporariamente
  no navegador (localStorage) e há limites de uso (ex.: cota de tokens gratuitos). O convidado pode gerar
  dashboards, tiles, contatos etc., mas tudo é mantido apenas localmente, sem persistência em base de
  dados.
- Usuário Membro (Member): autenticado via Clerk e com assinatura paga pelo Stripe. Tem acesso
  completo: os dados do workspace são persistidos no banco (MongoDB) e não há limite de tokens (ou
  ele é muito maior, conforme o plano). O upgrade de convidado para membro é automático ao assinar
  um plano; os dados locais do workspace são migrados para o servidor.

2. Estrutura Técnica
   Front-end
   A aplicação de front-end é construída com Next.js 16 (React) e está hospedada no Vercel. Toda a
   interface (landing page, página administrativa do workspace, modais, dashboards) é feita em React e
   Tailwind CSS. A navegação usa as rotas do Next.js. O front-end consome nossa API interna (rotas em /
   pages/api ). Para gerenciar estado global (dados do workspace, usuário autenticado, tokens, modo
   convidado vs membro), utilizamos Context API do React: criamos contextos para autenticação,
   workspace, temas, etc. Assim, qualquer componente pode ler e atualizar o estado sem precisar passar
   props manualmente (padrão de Provider/Consumer do React).
   Back-end
   O back-end é implementado pelas API Routes do Next.js (funções serverless). Cada rota HTTP em /
   pages/api ou /app/api corresponde a um endpoint (ex.: /api/workspace , /api/workspace/
   tiles , /api/generate , /api/stripe , etc.). Essas rotas processam a lógica do servidor, incluindo:

- Autenticação e usuários: feita com Clerk Authentication (biblioteca externa). O usuário faz login e
  Clerk gerencia a sessão. Cada usuário autenticado tem um ou mais workspaces ligados a ele no banco
  1
  de dados.
- OpenAI: integração via API da OpenAI para geração de conteúdo (texto, imagens). Por exemplo, ao
  criar ou regenerar um tile, a API chama endpoints de completions e images do OpenAI. É utilizado
  GPT-4/GPT-4o para texto e DALL·E para imagens.
- Stripe: integração do pagamento via Stripe Checkout. Criamos Checkout Sessions programaticamente
  para assinar planos. Após o pagamento, usamos webhooks do Stripe para atualizar o status do usuário
  (torná-lo membro) e liberar recursos. Conforme o próprio Stripe recomenda: “After creating a Checkout
  Session, redirect your customers to the Session’s URL to complete the purchase” .
- Cloudinary: para cada asset (arquivo de imagem) enviado, fazemos upload ao Cloudinary via API
  RESTful. O asset é salvo no servidor do Cloudinary e a URL retornada é armazenada no workspace.
  Essas integrações estão centralizadas nas rotas da API. Por exemplo, rotas como /api/workspace/
  tiles ou /api/workspace/contacts recebem requisições do front-end, validam permissões e
  chamam funções auxiliares que, por sua vez, chamam OpenAI ou Cloudinary. O Next.js permite assim
  construir a API sem um servidor separado .
  Gerenciamento de estado por Contextos
  Usamos vários contextos React para manter o estado da aplicação: um contexto principal de
  Workspace (que armazena o snapshot atual do workspace do usuário), um contexto de Autenticação
  (usuário Logado/Convidado), contexto de Configurações de UI (tema, cores) e assim por diante. Por
  exemplo, o WorkspaceContext armazena em memória o workspace atual (com dashboards, tiles
  etc.) e provê funções para atualizar ( setWorkspace , addTile , etc.). Esses contextos permitem que
  componentes distintos (modais, botões, telas) acessem os dados sem repassá-los como props.
  Setup Local e Produção
  Local: Para desenvolvimento, clonamos o repositório e rodamos npm install e npm run
  dev . Variáveis de ambiente necessárias são listadas em ENV_SETUP.md (ex.: chaves da Clerk,
  Stripe e OpenAI). Usa-se o arquivo .env.local para configurações específicas de dev. Um
  comando docker-compose ou similar pode setar um MongoDB local. Testes manuais são
  feitos seguindo manual_testing_checklist.md .
  Produção: A aplicação é deployada no Vercel em continous deployment. Variáveis de produção
  (chaves reais da API) são configuradas no painel do Vercel. Webhooks do Stripe apontam para a
  URL pública do Vercel. O MongoDB de produção (por exemplo Atlas) tem credenciais definidas
  nas variáveis de ambiente. O sistema também implementa fallback em caso de falha de rede: se
  a API não responder, o front-end exibe status e tenta novamente.

3. CRUDs Disponíveis
   A seguir listamos as operações CRUD expostas pela API e suas permissões. Cada entidade abaixo
   pertence a um workspace e é acessada por rotas que incluem /api/workspace :
   Workspaces:
   POST /api/workspace – Cria ou atualiza um workspace inteiro (usado principalmente no
   onboarding inicial). Recebe um snapshot do workspace e grava no banco (somente para
   membros). Usuários convidados têm workspace apenas em localStorage (não chamam esse
   endpoint).
   1
   2
   •
   •
   •
   •
   2
   GET /api/workspace – Retorna o workspace do usuário (com todos dashboards, tiles, notes,
   contacts, assets). Para convidados, lê do localStorage ; para membros, busca no MongoDB. É
   usado no carregamento da tela admin.
   DELETE /api/workspace – Reseta/remova o workspace atual (limpa dados locais do convidado
   ou reenvia novo workspace vazio).
   Permissões: Convidados podem criar e ler o workspace inicial (via POST/GET) mas tudo fica local.
   Membros podem criar, ler, atualizar e excluir seus workspaces no servidor.
   Dashboards:
   (GET/POST/PATCH/DELETE) – Cada workspace contém múltiplos dashboards (implementados no
   objeto workspace). Podemos assumir endpoints como /api/workspace/dashboards ou
   similar. Por exemplo, PATCH /api/workspace/dashboards/[id] atualiza o título ou cor de
   fundo de um dashboard.
   Permissões: Semelhante ao workspace – usuários convidados manipulam dashboards no
   localStorage, membros no banco. Normalmente o front-end gerencia criar/editar/excluir
   dashboards atualizando o workspace completo.
   Tiles:
   POST /api/workspace/tiles – Cria um novo tile (chamado Generate Tile). O corpo inclui o
   prompt e as opções (modo, tamanho, etc.). No servidor, chama-se OpenAI para gerar conteúdo
   (e opcionalmente imagem) e, então, armazena-se o tile no workspace. Se for tile de imagem, a
   imagem é enviada ao Cloudinary.
   POST /api/workspace/tiles/[tileId]/regenerate – Recria o conteúdo de um tile existente
   (regenerar via IA).
   POST /api/workspace/tiles/[tileId]/chat – Envia o conteúdo de um tile para chat gerativo (ex.:
   GPT-5) para gerar descrições ou continuação.
   POST /api/workspace/reorder – Reordena os tiles de um dashboard (enviando lista de IDs na
   nova ordem).
   Permissões: Ambos usuários convidados e membros podem criar e regenerar tiles. Convidados
   geram tiles até o limite de tokens gratuitos; membros têm limites maiores (ou ilimitados). Cada
   tile gerado fica no workspace local ou no banco, conforme o tipo de usuário.
   Contacts:
   POST /api/workspace/contacts – Cria um novo contato (estrutura com nome, cargo, empresa,
   etc.). Pode incluir campos auto-gerados.
   POST /api/workspace/contacts/[contactId]/regenerate – Atualiza os dados de um contato
   existente (via IA, por exemplo, refinando as informações).
   POST /api/workspace/contacts/[contactId]/chat – Envia o contato para um chat (ex.: para
   gerar um pitch ou mensagem de outreach).
   Permissões: Mesmas regras dos tiles. Convidados podem criar contactos no localStorage;
   membros persistem no banco.
   Notes:
   POST /api/workspace/notes – Cria uma nova nota textual simples.
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   3
   PATCH /api/workspace/notes/[noteId] – Edita o conteúdo de uma nota existente.
   DELETE /api/workspace/notes/[noteId] – Remove uma nota.
   Permissões: Convidados criam e editam notas localmente; membros no banco.
   Prompt Templates:
   GET /api/workspace/prompt-templates – Lista modelos de prompt salvos (per workspace ou
   global).
   POST /api/workspace/prompt-templates – Cria um novo template (título + texto do prompt).
   PATCH /api/workspace/prompt-templates/[templateId] – Atualiza um template existente.
   DELETE /api/workspace/prompt-templates/[templateId] – Remove um template.
   Esses templates são usados para agilizar a criação de prompts personalizados para tiles,
   contatos e outros.
   Permissões: Disponíveis apenas para membros (mas convidados podem usar alguns templates
   padrão temporariamente).
   Prompts (Simples/Bulk):
   POST /api/workspace/tiles (Single Prompt) – Cada tile criado é gerado por um prompt
   individual. Funciona como acima.
   POST /api/generate (Bulk Prompt) – Gera múltiplos tiles de uma vez (ex.: preencher um
   dashboard inteiro). Essa rota recebe opções de múltiplos prompts e retorna vários tiles.
   Permissões: Single prompt está disponível para todos. Bulk prompt geralmente requer
   membro (por usar muitos tokens). A plataforma processa cada prompt com OpenAI e retorna os
   resultados.
   Assets:
   GET /api/workspace/assets – Lista assets enviados.
   POST /api/workspace/assets – Faz upload de arquivo (imagem ou documento). O arquivo é
   enviado ao Cloudinary e a URL é salva no workspace.
   DELETE /api/workspace/assets/[assetId] – Remove um asset (local ou do Cloudinary).
   Permissões: Convidados podem adicionar assets limitados (ex.: pequena foto de perfil);
   membros podem fazer uploads livres.
   Cada endpoint verifica o tipo de usuário. Os convidados só alteram o estado local (via chamadas
   síncronas no front-end ou API finge escrever no cookie/storage), enquanto membros executam
   operações reais no banco de dados. Em todos os casos, implementamos um isolamento por usuário:
   um membro só vê seus próprios workspaces, e um convidado só afeta seu workspace atual. Use o cookie de
   sessão (ID armazenado no localStorage) para isolar.
4. Fluxos Principais
   Onboarding de Usuário Convidado
   Preenchimento do formulário (Home): Na tela inicial ( / ), o visitante insere nome, email e
   outros dados básicos.
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
   •
5. 4
   Criação do Workspace: Ao submeter, o front-end chama POST /api/workspace (ou rota
   interna) para gerar o workspace inicial com um dashboard padrão e alguns tiles/templates prédefinidos. O backend cria um sessionId .
   Armazenamento local: O workspace retornado (JSON) é armazenado no localStorage e no
   contexto React. Não há cadastro de usuário nem chamada ao banco (a menos que já exista
   login).
   Redirecionamento ao Dashboard: O usuário é redirecionado automaticamente para a interface
   administrativa (ex.: /admin ou /workspace ). Lá ele vê seu dashboard inicial com tiles de
   exemplo. Ele pode então criar/editar/gerar novos tiles.
   Uso no localStorage: Todos os dados criados (dashboards, tiles, notas etc.) ficam no
   localStorage (cache global SWR) e sincronizados com o contexto. Se a sessão expirar ou o
   usuário voltar depois, lê-se do localStorage para restaurar.
   Este fluxo permite ao visitante experimentar o produto rapidamente, sem cadastro. As ações dele
   (gerar tiles, adicionar notas) são rate-limited. Por exemplo, o plano gratuito concede ~3000 tokens por
   mês (~30 ações) e limites de taxa em memória【21†】. Esses limites servem para prevenir uso excessivo
   por usuários não pagantes.
   Geração de Tile via IA
   Quando o usuário (convidado ou membro) deseja gerar conteúdo inteligente, segue-se o fluxo:

- O usuário clica em um botão de “Gerar Tile IA” ou escolhe um modelo. O front-end abre um modal
  para configurar o prompt (editável ou baseado em Prompt Template).
- Após confirmar, o front-end faz uma requisição POST /api/workspace/tiles com o prompt e
  parâmetros.
- No back-end, a rota é acionada. Ela primeiro verifica a cota do usuário e a autorização. Então:

1. Chama a API de chat completions (GPT-4) para gerar o texto do tile.
2. Se o tile incluir imagem, chama a API de image generation (DALL·E). Quando a imagem é gerada,
   faz upload para o Cloudinary, que retorna uma URL.
3. Combina o texto e a imagem (URL) no formato do tile.
4. Salva o tile no workspace (no banco, se membro; no localStorage, se convidado). Atualiza o
   workspace no contexto.

- O front-end recebe o novo tile e renderiza no dashboard. Há feedback visual de carregamento e o
  usuário pode editar ou repetir a geração.
  Esse fluxo detalhado (backend orquestra as chamadas OpenAI e Cloudinary) garante que cada tile
  gerado respeite o conteúdo do prompt fornecido.
  graph LR
  U[Usuário no Dashboard] -->|clica em "Gerar Tile"| A[Front-end abre modal
  de prompt]
  A -->|submete prompt| B(POST /api/workspace/tiles)
  B --> C{Backend}
  C --> D[GPT-4: Gera texto do tile]
  C --> E[DALL·E: Gera imagem do tile]
  E --> F[Cloudinary: faz upload da imagem]
  D --> G[Combina texto + URL da imagem]
  F --> G
  G --> H(Save: armazena Tile no Workspace)
  H --> I[Front-end recebe tile e atualiza UI]

2.
3.
4.
5. 5
   Upgrade via Stripe
   Quando o usuário opta por assinar um plano pago, o fluxo segue:
6. Início do Checkout: O usuário clica em “Upgrade” no aplicativo. O front-end chama uma API (ex.:
   POST /api/stripe/checkout-session ) que cria uma Stripe Checkout Session para o plano
   escolhido.
7. Redirecionamento: A API retorna uma URL do Stripe. O usuário é redirecionado para essa página
   hospedada pelo Stripe. Lá, ele insere os dados de pagamento.
8. Pagamento: O Stripe processa o pagamento. Ao término bem-sucedido, o cliente é redirecionado de
   volta a uma URL de sucesso no nosso app.
9. Webhook Stripe: Em paralelo, o Stripe envia um webhook checkout.session.completed ao
   nosso servidor. Nossa rota de webhook lê esse evento e marca o usuário como “membro” no banco
   (salva stripeCustomerId , dados de assinatura, limitações atualizadas).
10. Confirmação e Acesso Total: Ao retornar ao app, o front-end detecta que o usuário agora é membro
    e libera a funcionalidade completa (ex.: remoção dos limites de geração). O usuário então continua
    logado, com seus dados de workspace migrados para o banco pelo método
    migrateWorkspaceToMongo() .
    No geral, usamos a integração padrão recomendada pelo Stripe: criamos uma sessão de checkout e
    redirecionamos para o pagamento . Após o webhook de sucesso, atualizamos a conta do usuário e
    os efeitos (tokens ilimitados, remoção de banners de upgrade, etc.) são aplicados.
    sequenceDiagram
    participant U as Usuário
    participant FE as Front-end
    participant BE as Back-end
    participant ST as Stripe Checkout
    participant WH as Stripe Webhook
    U->>FE: Clica em "Upgrade"
    FE->>BE: POST /api/stripe/checkout-session
    BE->>ST: Cria Checkout Session
    ST-->>FE: URL do Checkout
    U->>ST: Completa pagamento
    ST-->>U: Redireciona para /success
    ST->>WH: Envia webhook Checkout Session Complete
    WH->>BE: (evento recebido) Atualiza status do usuário para membro
    BE-->>FE: Confirmação (usuário membro)
    FE->>U: Acesso liberado (sem limite de geração)
11. Diagramas Mermaid Corrigidos
    5.1 ERD (Estrutura de Dados)
    erDiagram
    USER ||--o{ WORKSPACE : owns
    WORKSPACE ||--|{ DASHBOARD : contains
    WORKSPACE ||--|{ CONTACT : contains
    1
    6
    WORKSPACE ||--|{ NOTE : contains
    WORKSPACE ||--|{ ASSET : contains
    WORKSPACE ||--|{ PROMPT_TEMPLATE : contains
    DASHBOARD ||--|{ TILE : contains
    Este diagrama mostra as entidades principais e seus relacionamentos: um usuário pode possuir vários
    workspaces. Cada workspace contém dashboards e também itens isolados como contatos, notas,
    assets e templates de prompt. Cada dashboard, por sua vez, agrupa vários tiles.
    5.2 Fluxo de Onboarding
    graph TD
    Start[Usuário Convidado] --> Form[Preenche Formulário (Home)]
    Form --> CreateWS[Backend cria Workspace inicial]
    CreateWS --> SaveLocal[Grava Workspace no localStorage]
    SaveLocal --> Redirect[Redireciona ao Dashboard]
    Redirect --> ShowDash[Exibe Dashboards e Tiles padrão]
    Esse fluxo ilustra o passo a passo desde o visitante chegar na home até ver seu dashboard inicial criado
    dinamicamente.
    5.3 Fluxo de Geração por IA
    graph TD
    U[Usuário no Dashboard] --> ClickGen[Seleciona ou insere um Prompt]
    ClickGen --> ReqAPI[Front-end faz POST /api/workspace/tiles]
    ReqAPI --> GPT4[Backend chama GPT-4 para texto]
    ReqAPI --> DALLE[Backend chama DALL·E para imagem]
    DALLE --> Cloudinary[Envia imagem ao Cloudinary]
    GPT4 --> Merge[Combina texto e URL da imagem]
    Merge --> SaveTile[Salva o novo Tile no Workspace]
    SaveTile --> UpdateUI[Tile aparece no Dashboard]
    Este fluxo detalha como a aplicação interage com as APIs externas para gerar um novo tile: o prompt do
    usuário é enviado ao servidor, que dispara chamadas ao GPT-4 e DALL·E. A imagem gerada vai ao
    Cloudinary, então todos os dados são retornados e salvos como um tile no workspace.
    5.4 Fluxo de Pagamento Stripe
    graph TD
    User[Usuário no App] --> Upgrade[Clica em Upgrade]
    Upgrade --> Checkout[Cria Sessão Stripe Checkout]
    Checkout --> Redirect[stripe.com (página de pagamento hospedada)]
    Redirect --> Payment[Usuário conclui pagamento]
    Payment --> Success[Stripe redireciona a /success]
    Payment --> Webhook[Stripe envia webhook de evento]
    7
    Webhook --> Update[Backend atualiza status para MEMBER]
    Update --> Access[Usuário agora com acesso completo]
    Após o clique em Upgrade, criamos uma sessão de checkout e redirecionamos o usuário à página do
    Stripe. Depois do pagamento bem-sucedido, usamos o webhook para confirmar a assinatura e
    liberamos as funcionalidades pagas.
12. Super Prompt
    Você é responsável por descrever um sistema SaaS de criação de dashboards com
    integração de IA e pagamentos. Explique de forma detalhada todas as
    entidades, comportamentos e fluxos do sistema. As principais entidades são
    **Workspace**, **Dashboard**, **Tile**, **Contact**, **Note**, **Asset** e
    **PromptTemplate**. Descreva como elas se relacionam: um **usuário** pode ter
    vários **workspaces** (cada workspace agrupa dashboards, contatos, notas,
    assets e modelos de prompt). Dentro de cada workspace há vários
    **dashboards**, e cada dashboard contém múltiplos **tiles**. Explique os
    tipos de usuários e permissões: um **usuário convidado** pode usar o sistema
    sem autenticação, criando um workspace temporário no navegador (limites de
    geração de tokens se aplicam), enquanto um **usuário membro** (autenticado
    via Clerk e com assinatura Stripe paga) pode persistir workspaces no banco de
    dados e possui acesso estendido. Detalhe os fluxos principais:

- **Onboarding de convidado**: preenchimento de formulário, criação do
  workspace inicial (com dashboard e tiles de exemplo), armazenamento no
  localStorage e exibição do dashboard.
- **Geração de tile com IA**: ao submeter um prompt, o backend chama as APIs
  da OpenAI (GPT-4 para texto, DALL·E para imagem), faz upload da imagem ao
  Cloudinary, e retorna o tile gerado para salvar no workspace.
- **Fluxo de pagamento (Stripe)**: o usuário inicia uma sessão de Stripe
  Checkout, completa o pagamento na página hospedada pelo Stripe, e um webhook
  confirma a transação. Ao final, o sistema atualiza o status para membro e
  remove restrições (tokens, limites).
  Inclua detalhes técnicos: o front-end é em Next.js (v16) com Context API para
  estado global; o back-end usa API Routes do Next.js para criar endpoints REST
  (por exemplo, `/api/workspace`, `/api/workspace/tiles`, `/api/generate`, `/
api/stripe`, etc.). Mencione integrações: Clerk para autenticação de
  usuários, Stripe para pagamento/subscrição (Checkout Sessions e webhooks),
  OpenAI para geração de conteúdo, e Cloudinary para gerenciamento de arquivos.
  Cite como os dados são salvos: usuários convidados têm workspace em
  `localStorage`, membros salvam em MongoDB com isolamento por usuário.
  Descreva as principais rotas disponíveis para cada CRUD (ex.: criar/
  atualizar/deletar workspace, dashboards, tiles, contacts, notes, prompt
  templates, assets) e quem pode acessá-las (convidado vs membro). Enfatize que
  todo o sistema é baseado na nomenclatura “workspace” (não usar outros termos
  genéricos). Explique o propósito de cada fluxo e entidade e como eles
  interagem, para que este prompt sirva de documento orientado à geração de
  código para implementações futuras.
  8
  docs.stripe.com
  https://docs.stripe.com/payments/checkout/how-checkout-works
  Routing: API Routes | Next.js
  https://nextjs.org/docs/pages/building-your-application/routing/api-routes
  1
  2
  9
