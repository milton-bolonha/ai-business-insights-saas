# Mentee XP — Documentação Completa do Sistema de Gamificação

> `io_mentoring` · App Tag do I/O AI SaaS Hub · Última revisão: 2026-05-28

---

## 1. Visão Geral

O módulo **io_mentoring** usa um sistema de gamificação estilo RPG para mensurar e motivar a evolução dos mentorados. A pontuação (XP) é acumulada no campo `xp` do documento `mentoring_profiles` no MongoDB, e exibida publicamente na página `/mentorado/[userId]` e no ranking `/ranking`.

---

## 2. Fórmula de Nível (Level)

```ts
// src/components/admin/ade/MentoringProfileBoard.tsx  (L261)
// src/app/mentorado/[userId]/page.tsx  (L97)

const level = Math.floor(Math.sqrt(xp / 50)) + 1;
```

### Tabela de XP por Nível

| Nível | XP mínimo acumulado | XP até próximo nível |
|-------|---------------------|----------------------|
| 1     | 0                   | 50                   |
| 2     | 50                  | 150 (100 delta)      |
| 3     | 200                 | 250 (200 delta)      |
| 4     | 450                 | 350 (300 delta)      |
| 5     | 800                 | 450 (400 delta)      |
| N     | 50 × (N-1)²         | 50 × (2N-1) delta    |

> A fórmula base:
> - `currentLevelBaseXp = (level - 1)² × 50`
> - `nextLevelBaseXp = level² × 50`
> - `xpInCurrentLevel = xp - currentLevelBaseXp`
> - `xpNeededForNextLevel = nextLevelBaseXp - currentLevelBaseXp`

---

## 3. Barra de Corações (HP / Rendimento)

```ts
const totalHearts = 6 + level;           // cresce com o nível: nível 1 = 7 ♥, nível 5 = 11 ♥
const activeHearts = round((engagement / 100) * totalHearts);
```

- `engagement` = `(tarefas concluídas / tarefas totais) × 100`
- Os corações ativos pulsam em `rose-500`
- Os inativos ficam em `#d1ccc0` (tom creme)
- Tooltip mostra o % exato de rendimento

---

## 4. Fontes de XP (Estado Atual)

### 4.1 Tarefas Kanban

**Trigger:** Tarefa muda de qualquer status → `"done"`

```ts
// src/app/api/mentoring/tasks/route.ts (L110–L120)
if (nextStatus === "done" && prevStatus !== "done") {
  const xpAward = finalImportance * 10;
  await db.updateOne("mentoring_profiles", { userId: finalAssigneeId }, { $inc: { xp: xpAward } });
}
```

**Reversão:** Se tarefa sai de `"done"` para outro status:
```ts
// L115–L120
await db.updateOne("mentoring_profiles", { userId: finalAssigneeId }, { $inc: { xp: -xpAward } });
```

#### Escala de Importância × XP
| Importância | Tipo       | XP ganho |
|-------------|------------|----------|
| 0           | Side-quest | 0 XP     |
| 1           | Baixa      | 10 XP    |
| 2           |            | 20 XP    |
| 3           |            | 30 XP    |
| 5           | Média      | 50 XP    |
| 8           | Alta       | 80 XP    |
| 10          | Máxima     | 100 XP   |

> **Side-quests (importance = 0):** O mentorado pode completar sozinho. Tarefas com importância > 0 exigem aprovação do mentor para ir a `"done"`.

### 4.2 Diário de Bordo

Cada entrada no `diaryLogs[]` do perfil ganha XP configurável pelo mentor:

```ts
// MentoringProfileBoard.tsx (L146–L148, L1379)
const [diaryXpWeight, setDiaryXpWeight] = useState(200);  // default: 200 XP
// Exibido no histórico como: "+200 XP" por entrada de diário
```

> Configurável no painel Admin Controls. Default: **200 XP por entrada**.

### 4.3 Sessões (Potencial — não implementado como XP automático)

O campo `sessionXpWeight` existe no estado (default 300), mas atualmente as sessões não disparam XP automaticamente. O XP de sessões aparece apenas no **histórico visual** (não é gravado).

---

## 5. Histórico / Audit Log de XP

Exibido no painel de perfil (`viewMode !== "public"`), construído dinamicamente no frontend:

```
1. Cadastro/Acesso Inicial         → 0 XP  (baseline)
2. Diário de Bordo Registrado #N   → +200 XP (por entrada)
3. Tarefa Concluída: [titulo]      → +XP (importance × 10)
```

O histórico é ordenado por data (mais recente primeiro). Não é uma coleção separada no DB — é computado na renderização a partir de `diaryLogs[]` e `workspaceTasks`.

---

## 6. Classe Dominante (RPG Class)

Derivada automaticamente dos campos de texto do perfil:

```ts
// MentoringProfileBoard.tsx (L346–L361)
const keywords = `${careerGoal} ${personalGoal} ${tagline}`.toLowerCase();

"tech" | "dev" | "software" | "tecnolog"  → "Arquiteto Tecnológico"
"start" | "ceo" | "empreend" | "negoci"   → "Estrategista de Negócios"
"foco" | "prod" | "fazer" | "execut"      → "Executor de Alta Performance"
skills.length > 5                         → "Analista Multidisciplinar"
(default)                                 → "Operador em Evolução"
```

---

## 7. Inventário de Equipamentos (Cosmético RPG)

Itens equipáveis em 7 categorias, sem efeito funcional no XP:

| Categoria    | Raridades disponíveis             |
|--------------|-----------------------------------|
| Jaqueta      | Common, Uncommon, Rare, Epic, Legendary, Mythic |
| Tênis        | Common, Uncommon, Rare, Epic      |
| Mochila      | Common, Rare, Epic                |
| Headset      | Common, Rare, Epic                |
| Smartwatch   | Common, Rare, Epic                |
| Óculos       | Common, Rare                      |
| Aura         | Common, Rare, Epic, Legendary, Mythic |

Armazenados em `mentoring_profiles.equippedGear` (objeto com uma chave por categoria).

---

## 8. Colunas do Kanban

```
todo → doing → approval → done
```

- **Mentee** pode mover side-quests direto para `done`
- **Tarefas importantes** (importance > 0) ficam travadas em `approval` até o mentor aprovar
- O mentor (`isOwner: true`) move livremente qualquer coluna

---

## 9. Ranking Público

**Endpoint:** `GET /api/mentoring/public-ranking`

Retorna todos os perfis ordenados por `xp` decrescente. Para cada mentorado, inclui:
- `completedSessionsCount` — sessões passadas em seus workspaces
- `completedProjectsCount` — length de `projects[]`
- `skillsCount`, `careerGoal`, `personalGoal`

Página: `/ranking` com abas `mentores` | `mentorados` | `projetos`

---

## 10. Estrutura de Dados MongoDB

### Coleção: `mentoring_profiles`
```ts
{
  userId: string,
  role: "mentor" | "mentee",
  name, photoUrl, tagline, miniBio,
  skills: string[],
  // XP e gamificação
  xp: number,                    // ← Campo principal de pontuação
  equippedGear: Record<string, string>,
  diaryLogs: DiaryLog[],         // ← Fonte de XP de diário
  cognitiveState: string,
  // Metas e perfil
  personalGoal, careerGoal, futureVision,
  attributes: string[3],
  achievements: string[3],
  // Projetos
  projects: Project[],
  sessionTemplates: SessionTemplate[],
  // Metadados
  createdAt, updatedAt
}
```

### Coleção: `mentoring_tasks`
```ts
{
  workspaceId: string,
  title: string,
  description?: string,
  status: "todo" | "doing" | "approval" | "done",
  importance: number,   // 0–10, determina XP (importance × 10)
  assigneeId?: string,
  assigneeName?: string,
  dueDate?: Date,
  createdAt, updatedAt
}
```

### Coleção: `mentoring_sessions`
```ts
{
  workspaceId: string,
  title: string,
  description?: string,
  startAt: Date,
  endAt: Date,
  meetingUrl?: string,
  status: "scheduled" | "completed" | "cancelled",
  createdAt, updatedAt
}
```

---

## 11. Controles do Mentor (Admin Controls)

No painel de perfil, sub-aba `admin_controls` (visível apenas para role=mentor + viewMode=owner):

| Controle | Default | Descrição |
|----------|---------|-----------|
| `taskXpWeight` | 150 | Peso de XP base para tarefas (não implementado — usa importance × 10) |
| `diaryXpWeight` | 200 | XP por entrada de diário |
| `sessionXpWeight` | 300 | XP por sessão (exibição apenas) |
| `burnoutThreshold` | 1.3 | Limiar de alerta de burnout cognitivo |

---

## 12. Problemas / Gaps do Sistema Atual

1. **XP de sessão não automatizado** — O `sessionXpWeight` existe mas não dispara `$inc: { xp }` na coleção.
2. **Sem categorias de tarefa** — Tarefas têm apenas `importance` (0–10), sem categoria (reflection, research, etc.).
3. **Sem levels nomeados** — Não há sistema de faixas como "Reserva", "Titular", "MVP".
4. **Sem trilhas (tracks)** — Não existe conceito de grupo de tarefas sequenciais por sessão de mentoria.
5. **XP não gravado separado** — O histórico é construído no frontend, sem coleção de auditoria persistente.
6. **Sem tarefas bônus** — Não há distinção entre tarefas regulares e missões bônus opcionais.

---

## 13. Proposta: Sistema de Trilhas (Tracks)

### Conceito

Uma **Trilha** é um programa estruturado de mentoria composto por **Sessões**, cada sessão contendo um conjunto fixo de **Tarefas com XP pré-definido e categorias**. O mentor atribui uma trilha ao mentorado, e o progresso avança sessão a sessão.

### Modelo de Dados Proposto

#### Nova Coleção: `mentoring_tracks`
```ts
{
  _id: ObjectId,
  workspaceId: string,         // workspace do mentor que criou
  name: string,                // "Temporada 2026 — Aurora x Educandário"
  description: string,
  program: string,             // nome do programa
  isPublic: boolean,           // disponível como template para outros mentores
  
  // Configuração de níveis da trilha
  levels: TrackLevel[],
  
  // Sessões da trilha (ordenadas por index)
  sessions: TrackSession[],
  
  // Categorias usadas nessa trilha
  categories: string[],
  
  createdAt, updatedAt
}
```

#### Tipo `TrackLevel`
```ts
{
  id: string,          // "reserva"
  emoji: string,       // "🥉"
  name: string,        // "Reserva"
  minXP: number,       // 0
  maxXP: number | null // 60
}
```

#### Tipo `TrackSession`
```ts
{
  id: number,          // 1
  title: string,       // "Linha do tempo e sonhos"
  label: string,       // "Sessão 1 de 6"
  tag: string,         // "Sessão 1"
  totalBaseXP: number, // 165 (soma base sem bônus)
  tasks: TrackTask[]
}
```

#### Tipo `TrackTask`
```ts
{
  id: string,           // "s1_t1"
  title: string,
  xp: number,           // XP fixo da tarefa
  category: TaskCategory,
  bonus: boolean,       // true = missão bônus opcional
}

type TaskCategory = 
  "reflection" | "research" | "planning" | 
  "execution" | "emotional" | "strategy" | 
  "review" | "career"
```

#### Nova Coleção: `mentoring_track_enrollments`
```ts
{
  _id: ObjectId,
  trackId: string,         // ref a mentoring_tracks
  workspaceId: string,
  menteeUserId: string,
  mentorUserId: string,
  
  enrolledAt: Date,
  
  // Progresso por sessão
  sessionProgress: SessionProgress[],
  
  // XP total ganho nessa trilha
  earnedXP: number,
  
  // Nível atual na trilha
  currentLevelId: string,
  
  status: "active" | "completed" | "paused",
  
  createdAt, updatedAt
}
```

#### Tipo `SessionProgress`
```ts
{
  sessionId: number,
  unlockedAt: Date | null,       // null = ainda bloqueada
  completedAt: Date | null,
  
  taskProgress: TaskProgress[]
}
```

#### Tipo `TaskProgress`
```ts
{
  taskId: string,
  completedAt: Date | null,
  earnedXP: number,              // 0 ou o XP da tarefa
  approvedBy: string | null,     // userId do mentor que aprovou
}
```

### Regras de Negócio

1. **Desbloqueio de Sessão:** A sessão N+1 só é desbloqueada quando o mentor marcar a sessão N como "revista".
2. **Tarefas Bônus:** `bonus: true` são opcionais. O mentor define combinado; não bloqueiam progresso.
3. **XP de Trilha vai para o perfil:** `earnedXP` do enrollment é somado ao `mentoring_profiles.xp`.
4. **Nível de Trilha vs Nível Global:** Os níveis da trilha (Reserva/Titular/MVP) são independentes do level RPG global (baseado em `√(xp/50)`).
5. **Aprovação de Tarefas:** Tarefas da trilha seguem o mesmo flow do Kanban — mentorado conclui, mentor aprova se não for side-quest/bônus.

### Rotas de API Necessárias

```
GET  /api/mentoring/tracks                  — listar trilhas do workspace
POST /api/mentoring/tracks                  — criar trilha
GET  /api/mentoring/tracks/[trackId]        — detalhes da trilha

GET  /api/mentoring/enrollments             — listar matrículas do mentorado
POST /api/mentoring/enrollments             — matricular mentorado em trilha
GET  /api/mentoring/enrollments/[id]        — progresso de uma matrícula
PATCH /api/mentoring/enrollments/[id]/task  — completar/aprovar tarefa
PATCH /api/mentoring/enrollments/[id]/session — revisar sessão (mentor)
```

### Exemplo de Trilha "Aurora x Educandário" no Schema Proposto

```json
{
  "name": "Temporada 2026",
  "program": "Aurora x Educandário",
  "levels": [
    { "id": "reserva",  "emoji": "🥉", "name": "Reserva",  "minXP": 0,   "maxXP": 60  },
    { "id": "titular",  "emoji": "🥈", "name": "Titular",  "minXP": 61,  "maxXP": 130 },
    { "id": "destaque", "emoji": "🥇", "name": "Destaque", "minXP": 131, "maxXP": 199 },
    { "id": "mvp",      "emoji": "🏆", "name": "MVP",      "minXP": 200, "maxXP": null }
  ],
  "sessions": [
    {
      "id": 1,
      "title": "Linha do tempo e sonhos",
      "totalBaseXP": 165,
      "tasks": [
        { "id": "s1_t1", "title": "Escrever 3 momentos importantes da vida escolar", "xp": 15, "category": "reflection", "bonus": false },
        { "id": "s1_t2", "title": "Responder onde se vê no futuro",                  "xp": 20, "category": "reflection", "bonus": false },
        { "id": "s1_bonus", "title": "Missão bônus — combine com seu mentor(a)",     "xp": 25, "category": "strategy",   "bonus": true  }
      ]
    }
  ]
}
```

---

## 14. Próximos Passos Recomendados

- [ ] Criar as coleções `mentoring_tracks` e `mentoring_track_enrollments` no MongoDB
- [ ] Implementar as rotas de API (`/api/mentoring/tracks`, `/api/mentoring/enrollments`)
- [ ] Criar `TrackBuilderBoard` no admin (mentor cria/edita trilhas)
- [ ] Criar aba "Minha Trilha" no `MentoringProfileBoard` (mentorado vê progresso)
- [ ] Integrar XP ganho em trilha com `mentoring_profiles.xp` (via `$inc`)
- [ ] Adicionar nível da trilha (Reserva/Titular/MVP) na página pública `/mentorado/[userId]`
- [ ] Criar endpoint para checar desbloqueio de sessão e disparar XP por tarefa aprovada
- [ ] (Opcional) Criar tela de Trilhas Públicas — templates de outros mentores
