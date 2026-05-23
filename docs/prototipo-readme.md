Nexus WMS (Warehouse Management System)

Nexus WMS é um sistema moderno de gestão de armazéns focado em UI/UX Operacional Visual-First, desenhado para tablets e operadores de chão de fábrica. Ele abandona as tradicionais "tabelas infinitas" em favor de um Grid top-down altamente interativo com automação orientada por IA.

🚀 Principais Features

Visual Warehouse Map (Grid UI): Visão top-down com semântica de cores (Vazio, Ocupado, Reservado, Bloqueado). Suporta múltiplos SKUs por posição (com badges indicadores).

Navegação em Carrossel & View Modes: Navegue por "Setores/Sub-setores" com swipe ou setas. Alterne entre os modos Full Width (telas grandes) e Compact View (centenas de posições na mesma tela).

Setup Dinâmico: Crie setores complexos (linhas, colunas, orientação horizontal/vertical) de forma manual ou pedindo para a IA.

Auto-Slotting & AI Orchestrator (MCP): * O cérebro do sistema utiliza o modelo Gemini para traduzir linguagem natural, imagens ou áudios em ações programáticas (ex: PUTAWAY, PICKING).

Auto-Slotting: Se o operador não informar a posição desejada para guardar um item, a IA encontra automaticamente a primeira vaga disponível e otimiza a alocação.

Agente Multimodal: Você pode anexar fotos de notas fiscais, gravar mensagens de voz ou digitar comandos simultaneamente. O sistema processa tudo em lote (Batch).

Detailed Product View: A IA extrai inteligentemente preço, condições e detalhes da fala/texto e os salva estruturados. Clicar num slot exibe um card rico do produto, não apenas texto corrido.

Exportação Padrão de Mercado: Exporte toda a volumetria e status posicional com um clique para .JSON ou .CSV.

🧠 Arquitetura de Estados (React)

appStage: Controla o fluxo de Onboarding vs Operação.

grid & sectors: O mapa relacional. O array skus em cada célula guarda os objetos com dados ricos (Nome, Preço, Condição, etc.).

Voice API: Utiliza webkitSpeechRecognition nativo aliado à inferência generativa de JSON via Google Gemini API.