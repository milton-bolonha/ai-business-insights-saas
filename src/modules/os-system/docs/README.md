# Módulo I/O - OS System

O **OS System** é um módulo completo de Gestão de Ordens de Serviço focado em triagem de hardware, controle de orçamentos, gerenciamento de equipe técnica de laboratório e controle estrito de retirada.

Foi projetado como um **Módulo de Domínio Isolado (Domain-Driven Design)** dentro da arquitetura do aplicativo, desacoplado dos demais (como AI Blog ou Mentorias), o que garante evolução técnica independente, reaproveitamento de código e facilidade de testes.

## 🚀 Principais Funcionalidades

1. **Intake (Triagem & Entrada)**: Captura inicial do aparelho com identificação clara do cliente, senhas, marca, modelo e condição física no momento da recepção, blindando a loja.
2. **Orçamentação (QuoteBuilder)**: Calculadora dinâmica de peças e serviços com apuração de margem de lucro em tempo real para envio ao cliente.
3. **Laboratório Kanban (Production)**: Painel tático para os técnicos gerenciarem tarefas operacionais e checklists passo-a-passo no conserto do aparelho.
4. **Segurança de Entregas (Checkout)**: Controle de retirada exigindo coleta de assinatura digital na tela (Canvas) e submissão de foto/comprovante de entrega pelo balconista.
5. **Gestão de Ativos (Files & Cloudinary)**: Galeria de mídia segregada por fase (ex: foto de como o celular chegou vs. foto do celular saindo), com integração segura de bucket de armazenamento para proteção contra processos jurídicos.

## 📂 Estrutura de Diretórios

O módulo está contido inteiramente na pasta `src/modules/os-system`:

```
os-system/
│
├── components/          # Componentes visuais e formulários (React)
├── docs/                # Documentação técnica e arquitetural
├── types/               # Entidades de Domínio estritas (ex: OSEntity.ts)
└── store/               # (Futuro) Conectores Zustand/DB próprios
```

## 📖 Como Ler a Documentação

Para aprofundar no funcionamento técnico do sistema, consulte:

1. **[Arquitetura e Fluxo de Dados (ARCHITECTURE.md)](./ARCHITECTURE.md)**: Explica o ciclo de vida da OS, o padrão de integração via Módulos e os diagramas de estados.
2. **[Segurança e Arquivos (SECURITY.md)](./SECURITY.md)**: Detalha as políticas adotadas de upload isolado e proteção contra injeção de imagens maliciosas ou vazamento entre lojistas.

---

> **Design Pattern**: Este módulo utiliza fortemente "Domain Entities" e "UI Containers". A tela mestre (`OSSystemBoard.tsx`) rege o estado, enquanto os sub-painéis (`DiagnosisPanel`, `PickupQueue`, etc.) agem como "dumb components", limitando-se apenas a renderizar a UI e emitir eventos de callback.
