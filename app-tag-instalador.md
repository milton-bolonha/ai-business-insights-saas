# O Blueprint do Instalador (Marketplace de App Tags)

Este documento detalha o funcionamento do **Instalador de App Tags**, uma solução desenhada para criar uma experiência de "Plugin WordPress" perfeitamente segura e compatível com infraestruturas modernas Serverless (Vercel, AWS Lambda) e pipelines de CI/CD baseados no GitHub.

---

## 🚨 O Problema: Por que não usar o modelo tradicional?

No modelo WordPress (servidores tradicionais/VPS), ao instalar um plugin, o sistema faz o download de arquivos PHP/JS em um diretório (`/wp-content/plugins`). 
Em arquiteturas **Serverless** (como Vercel) com **GitOps**:
1. O sistema de arquivos é **efêmero** (somente leitura ou apagado após a execução).
2. O deploy é **imutável**. Alterar o código significa gerar um novo "Build" pelo GitHub Actions/Vercel.

**Como ter um Instalador Dinâmico sem poder enviar arquivos em produção?**

## 💡 A Solução: Arquitetura de Feature Flags (Marketplace Integrado)

Nós usamos o modelo *Monolith Marketplace*. Todo o código de todas as App Tags já existe no repositório GitHub e é compilado junto no build do Next.js. O "Instalador" é, na verdade, um **Gerenciador de Ativação** protegido pelo banco de dados.

### 1. A Interface do Instalador (A Loja de Ativos)
Dentro do Admin, o usuário acessa `/admin/marketplace`.
Ele vê uma vitrine bonita de "Ativos" disponíveis (Logística, Mentoria, Pesquisa Inteligente). Cada ativo exibe ícones, screenshots e preços (integração Stripe).

### 2. O Processo de Instalação ("One-Click Activation")
Quando o usuário clica em **"Instalar Módulo"**:
1. **Transação Stripe (Opcional):** Se o módulo for premium, o fluxo de pagamento é disparado.
2. **Atualização do Database (A Mágica):** O servidor adiciona o ID da Tag à array `installedTags` do documento do `Workspace` do usuário.
3. **Injeção de Dummy Content:** O servidor roda um script migratório assíncrono que insere dados falsos/de demonstração no banco (ex: cria um *Mentorado* falso de nome "John Doe" para o usuário já ver o painel populado).
4. **Provisionamento de Assets:** Ícones, capas e logos padrão da App Tag são clonados para a pasta virtual do usuário no Cloudinary.
5. **Unlock de UI:** Instantaneamente, sem reload, a Sidebar esquerda ganha o ícone do novo módulo e as rotas passam a ficar acessíveis para aquele Workspace.

### 3. O Processo de Desinstalação
Se o usuário desativa/desinstala um app:
1. Um alerta de segurança ("Hard Delete" vs "Soft Archive") é exibido.
2. O sistema remove a flag `installedTags` do banco.
3. Se escolhido "Limpar Dados", uma fila no backend varre as tabelas de `Tiles`, `Contacts` e `Forms` vinculadas àquela App Tag específica e as destrói automaticamente.

## Benefícios Desta Abordagem
- **Segurança Máxima:** Como o código não é injetado dinamicamente via arquivo, não há risco de RCE (Remote Code Execution) ou vírus.
- **CI/CD Respeitado:** A estabilidade da plataforma é garantida. O build do Vercel continua sendo a fonte de verdade do código.
- **Rollbacks Limpos:** Se um app apresentar bug, você corrige via Git. Ao dar "push", todos os clientes que têm o app "instalado" recebem o patch instantaneamente.
- **Velocidade:** A "Instalação" leva milissegundos, pois é apenas um `UPDATE` no MongoDB e injeção de JSONs.
