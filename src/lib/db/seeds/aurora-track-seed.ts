/**
 * Seed — Template Global "Aurora x Educandário"
 * Temporada 2026 | 6 sessões | ~1.140 XP base
 *
 * Para inserir: POST /api/mentoring/tracks/seed
 */

import type { MentoringTrack } from "@/lib/types/mentoring-tracks";

export const AURORA_TRACK_SEED: Omit<MentoringTrack, "_id"> = {
  workspaceId: null,
  createdByUserId: null,
  name: "Temporada 2026",
  program: "Aurora x Educandário",
  description:
    "Trilha de orientação vocacional e preparação para vestibulinho, ETEC e IF. Seis sessões que guiam o jovem desde o autoconhecimento até a véspera da prova.",
  isGlobalTemplate: true,
  unlockMode: "automatic",
  totalSessions: 6,
  levels: [
    { id: "reserva",  emoji: "🥉", name: "Reserva",  minXP: 0,   maxXP: 60  },
    { id: "titular",  emoji: "🥈", name: "Titular",  minXP: 61,  maxXP: 130 },
    { id: "destaque", emoji: "🥇", name: "Destaque", minXP: 131, maxXP: 199 },
    { id: "mvp",      emoji: "🏆", name: "MVP",      minXP: 200, maxXP: null },
  ],
  sessions: [
    // ──────────────────────────────────────────────────────────────
    // Sessão 1 — Linha do tempo e sonhos  (165 XP base + 25 bônus)
    // ──────────────────────────────────────────────────────────────
    {
      id: 1,
      title: "Linha do tempo e sonhos",
      label: "Sessão 1 de 6",
      tag: "Sessão 1",
      totalBaseXP: 165,
      tasks: [
        { id: "s1_t1",    title: "Escrever 3 momentos importantes da vida escolar",          xp: 15, category: "reflection", bonus: false },
        { id: "s1_t2",    title: "Responder onde se vê no futuro",                           xp: 20, category: "reflection", bonus: false },
        { id: "s1_t3",    title: "Definir uma área de interesse ou curiosidade profissional", xp: 15, category: "career",     bonus: false },
        { id: "s1_t4",    title: "Montar um plano simples de pesquisa com o mentor",         xp: 15, category: "planning",   bonus: false },
        { id: "s1_t5",    title: "Pesquisar 3 escolas (ETEC, IF ou com bolsa)",              xp: 20, category: "research",   bonus: false },
        { id: "s1_t6",    title: "Preencher a tabela de escolas no caderno",                 xp: 20, category: "execution",  bonus: false },
        { id: "s1_t7",    title: "Conversar com familiar sobre as escolas pesquisadas",      xp: 15, category: "emotional",  bonus: false },
        { id: "s1_t8",    title: "Aparecer na próxima sessão com o caderno",                 xp: 20, category: "execution",  bonus: false },
        { id: "s1_bonus", title: "Missão bônus — combine com seu mentor(a)",                 xp: 25, category: "strategy",   bonus: true  },
      ],
    },
    // ──────────────────────────────────────────────────────────────
    // Sessão 2 — Raio-X das escolhas  (160 XP base + 25 bônus)
    // ──────────────────────────────────────────────────────────────
    {
      id: 2,
      title: "Raio-X das escolhas",
      label: "Sessão 2 de 6",
      tag: "Sessão 2",
      totalBaseXP: 160,
      tasks: [
        { id: "s2_t1",    title: "Escolher 2 escolas favoritas e anotar o que sabe sobre cada",    xp: 20, category: "research",   bonus: false },
        { id: "s2_t2",    title: "Identificar diferenças entre ETEC, IF e itinerários formativos", xp: 20, category: "research",   bonus: false },
        { id: "s2_t3",    title: "Anotar dúvidas que ainda possui sobre as escolas escolhidas",    xp: 15, category: "reflection", bonus: false },
        { id: "s2_t4",    title: "Relacionar a escola escolhida com o Projeto de Vida",            xp: 20, category: "career",     bonus: false },
        { id: "s2_t5",    title: "Descobrir se tem cota ou bolsa nas escolas escolhidas",          xp: 20, category: "research",   bonus: false },
        { id: "s2_t6",    title: "Conversar com familiar sobre a reação às escolas",               xp: 20, category: "emotional",  bonus: false },
        { id: "s2_t7",    title: "Anotar 3 perguntas sobre a rotina do curso de interesse",        xp: 15, category: "career",     bonus: false },
        { id: "s2_t8",    title: "Conversar com mentor sobre rotina da profissão desejada",        xp: 15, category: "career",     bonus: false },
        { id: "s2_bonus", title: "Missão bônus — combine com seu mentor(a)",                       xp: 25, category: "strategy",   bonus: true  },
      ],
    },
    // ──────────────────────────────────────────────────────────────
    // Sessão 3 — Estratégia de estudos  (205 XP base + 25 bônus)
    // ──────────────────────────────────────────────────────────────
    {
      id: 3,
      title: "Estratégia de estudos",
      label: "Sessão 3 de 6",
      tag: "Sessão 3",
      totalBaseXP: 205,
      tasks: [
        { id: "s3_t1",    title: "Listar disciplinas cobradas no edital",                          xp: 20, category: "strategy",   bonus: false },
        { id: "s3_t2",    title: "Separar matérias entre 'domino bem' e 'preciso melhorar'",      xp: 20, category: "reflection", bonus: false },
        { id: "s3_t3",    title: "Definir horas reais de estudo por semana",                       xp: 20, category: "planning",   bonus: false },
        { id: "s3_t4",    title: "Identificar distrações que atrapalham os estudos",               xp: 15, category: "emotional",  bonus: false },
        { id: "s3_t5",    title: "Criar plano para vencer obstáculos da rotina",                   xp: 20, category: "planning",   bonus: false },
        { id: "s3_t6",    title: "Fazer 2 sessões de estudo do tema mais difícil",                 xp: 30, category: "execution",  bonus: false },
        { id: "s3_t7",    title: "Cumprir o cronograma combinado na sessão",                       xp: 30, category: "execution",  bonus: false },
        { id: "s3_t8",    title: "Identificar 1 obstáculo real da semana e explicar como contornou", xp: 20, category: "reflection", bonus: false },
        { id: "s3_t9",    title: "Trazer o caderno preenchido para a próxima sessão",              xp: 20, category: "execution",  bonus: false },
        { id: "s3_t10",   title: "Registrar o que estudou nas sessões de estudo",                  xp: 10, category: "review",     bonus: false },
        { id: "s3_bonus", title: "Missão bônus — combine com seu mentor(a)",                       xp: 25, category: "strategy",   bonus: true  },
      ],
    },
    // ──────────────────────────────────────────────────────────────
    // Sessão 4 — Checkpoint + Edital  (205 XP base + 25 bônus)
    // ──────────────────────────────────────────────────────────────
    {
      id: 4,
      title: "Checkpoint + Edital",
      label: "Sessão 4 de 6",
      tag: "Sessão 4",
      totalBaseXP: 205,
      tasks: [
        { id: "s4_t1",    title: "Registrar uma conquista recente nos estudos",              xp: 15, category: "reflection", bonus: false },
        { id: "s4_t2",    title: "Descrever onde o plano travou",                            xp: 15, category: "emotional",  bonus: false },
        { id: "s4_t3",    title: "Fazer check-in emocional da semana",                       xp: 15, category: "emotional",  bonus: false },
        { id: "s4_t4",    title: "Atualizar plano de estudos após checkpoint",                xp: 20, category: "planning",   bonus: false },
        { id: "s4_t5",    title: "Completar inscrição no vestibulinho ou checklist",         xp: 25, category: "execution",  bonus: false },
        { id: "s4_t6",    title: "Verificar documentos necessários para inscrição",          xp: 15, category: "research",   bonus: false },
        { id: "s4_t7",    title: "Anotar data e horário da prova",                           xp: 15, category: "planning",   bonus: false },
        { id: "s4_t8",    title: "Descobrir o que pode e não pode levar na prova",           xp: 15, category: "strategy",   bonus: false },
        { id: "s4_t9",    title: "Verificar possibilidade de isenção de taxa",               xp: 20, category: "research",   bonus: false },
        { id: "s4_t10",   title: "Verificar possibilidade de cotas ou pontuação acrescida",  xp: 20, category: "research",   bonus: false },
        { id: "s4_t11",   title: "Ajustar cronograma com base nas dificuldades",             xp: 20, category: "planning",   bonus: false },
        { id: "s4_bonus", title: "Missão bônus — combine com seu mentor(a)",                 xp: 25, category: "strategy",   bonus: true  },
      ],
    },
    // ──────────────────────────────────────────────────────────────
    // Sessão 5 — Operação revisão  (215 XP base + 25 bônus)
    // ──────────────────────────────────────────────────────────────
    {
      id: 5,
      title: "Operação revisão",
      label: "Sessão 5 de 6",
      tag: "Sessão 5",
      totalBaseXP: 215,
      tasks: [
        { id: "s5_t1",    title: "Organizar resumos ou mapas mentais",                xp: 20, category: "review",    bonus: false },
        { id: "s5_t2",    title: "Separar exercícios resolvidos",                     xp: 15, category: "review",    bonus: false },
        { id: "s5_t3",    title: "Separar simulados ou provas anteriores",            xp: 20, category: "review",    bonus: false },
        { id: "s5_t4",    title: "Definir 3 prioridades de estudo",                   xp: 25, category: "strategy",  bonus: false },
        { id: "s5_t5",    title: "Planejar revisão versus conteúdo novo",             xp: 20, category: "planning",  bonus: false },
        { id: "s5_t6",    title: "Fazer 1 simulado ou bloco de questões",             xp: 25, category: "execution", bonus: false },
        { id: "s5_t7",    title: "Registrar resultado do simulado",                   xp: 15, category: "review",    bonus: false },
        { id: "s5_t8",    title: "Revisar as 3 prioridades definidas",                xp: 25, category: "review",    bonus: false },
        { id: "s5_t9",    title: "Seguir o cronograma de reta final por 3 dias",     xp: 30, category: "execution", bonus: false },
        { id: "s5_t10",   title: "Organizar materiais dos temas prioritários",        xp: 20, category: "execution", bonus: false },
        { id: "s5_bonus", title: "Missão bônus — combine com seu mentor(a)",         xp: 25, category: "strategy",  bonus: true  },
      ],
    },
    // ──────────────────────────────────────────────────────────────
    // Sessão 6 — Encerramento  (190 XP base + 25 bônus)
    // ──────────────────────────────────────────────────────────────
    {
      id: 6,
      title: "Encerramento",
      label: "Sessão 6 de 6",
      tag: "Sessão 6",
      totalBaseXP: 190,
      tasks: [
        { id: "s6_t1",    title: "Confirmar local, horário e materiais da prova",           xp: 20, category: "planning",   bonus: false },
        { id: "s6_t2",    title: "Fazer última revisão dos temas prioritários",              xp: 25, category: "review",     bonus: false },
        { id: "s6_t3",    title: "Dormir cedo na véspera da prova",                         xp: 15, category: "execution",  bonus: false },
        { id: "s6_t4",    title: "Escrever a maior lição sobre seu jeito de estudar",       xp: 20, category: "reflection", bonus: false },
        { id: "s6_t5",    title: "Registrar a meta de que mais se orgulha",                 xp: 20, category: "reflection", bonus: false },
        { id: "s6_t6",    title: "Descrever algo que descobriu ser capaz de fazer",         xp: 20, category: "emotional",  bonus: false },
        { id: "s6_t7",    title: "Escrever a carta para o 'eu de amanhã'",                 xp: 25, category: "reflection", bonus: false },
        { id: "s6_t8",    title: "Definir o próximo passo independentemente do resultado",  xp: 20, category: "planning",   bonus: false },
        { id: "s6_bonus", title: "Missão bônus — combine com seu mentor(a)",                xp: 25, category: "strategy",   bonus: true  },
      ],
    },
  ],
};
