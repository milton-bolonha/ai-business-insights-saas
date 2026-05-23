import type { Question, SurveyTopic } from "./types";

export const NR1_TOPICS: SurveyTopic[] = [
  {
    id: "assedio",
    title: "Assédio de qualquer natureza no trabalho",
    possibleConsequences: ["Transtorno mental"],
    weight: 3,
    questions: [
      { id: "q_cipat", type: "scale_0_10",
        label: "Com que frequência você presencia ou sofre situações de assédio, humilhação ou desrespeito no trabalho?",
        minLabel: "Nunca acontece",
        maxLabel: "Acontece com muita frequência",
        polarity: "negative"
      },
      { id: "q_66lex", type: "multiple_choice_multiple",
        label: "Que tipo de situação de assédio você já vivenciou ou presenciou no seu ambiente de trabalho?",
        options: [
          "Gritos ou agressões verbais",
          "Humilhação na frente de colegas",
          "Brincadeiras ofensivas ou constrangedoras",
          "Ameaças ou intimidações",
          "Pressão psicológica exagerada",
          "Exclusão ou isolamento proposital",
          "Assédio sexual",
          "Nunca vivenciei nem presenciei"
        ]
      },
      { id: "q_cudzi", type: "multiple_choice_single",
        label: "Quando situações de assédio ou desrespeito acontecem, a empresa toma alguma providência?",
        options: [
          "Sempre resolve",
          "Na maioria das vezes resolve",
          "Às vezes resolve",
          "Raramente resolve",
          "Nunca resolve",
          "Nunca houve situação assim"
        ]
      },
      { id: "q_tah6v", type: "scale_0_10",
        label: "Você se sente seguro(a) para denunciar situações de assédio sem medo de represálias?",
        minLabel: "Não me sinto seguro(a)",
        maxLabel: "Me sinto totalmente seguro(a)",
        polarity: "positive"
      },
      { id: "q_o8gux", type: "scale_0_10",
        label: "O quanto as situações de assédio no trabalho afetam seu bem-estar ou saúde mental?",
        minLabel: "Não afetam",
        maxLabel: "Afetam muito",
        polarity: "negative"
      },
      { id: "q_z5qsa", type: "text",
        label: "Se quiser, descreva alguma situação de assédio ou desrespeito que você vivenciou ou presenciou no trabalho.",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "gestao_mudancas",
    title: "Má gestão de mudanças organizacionais",
    possibleConsequences: ["Transtorno mental", "DORT"],
    weight: 2,
    questions: [
      { id: "q_rl4ls", type: "scale_0_10",
        label: "As mudanças no trabalho costumam ser comunicadas e organizadas de forma adequada?",
        minLabel: "Nada adequadas",
        maxLabel: "Muito bem organizadas",
        polarity: "positive"
      },
      { id: "q_v95kn", type: "multiple_choice_multiple",
        label: "O que mais atrapalha quando a empresa realiza mudanças?",
        options: [
          "Falta de aviso prévio",
          "Mudanças repentinas sem explicação",
          "Treinamento insuficiente",
          "Aumento de cobranças sem suporte",
          "Confusão nas responsabilidades",
          "Falta de apoio da liderança",
          "Medo de perder o emprego"
        ]
      },
      { id: "q_xu7xh", type: "multiple_choice_single",
        label: "Você recebe orientação e treinamento suficientes quando processos ou tarefas mudam?",
        options: [
          "Sempre",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca"
        ]
      },
      { id: "q_jjgdd", type: "scale_0_10",
        label: "As mudanças mal planejadas aumentam seu estresse ou cansaço no trabalho?",
        minLabel: "Não aumentam",
        maxLabel: "Aumentam muito",
        polarity: "negative"
      },
      { id: "q_lf5ll", type: "multiple_choice_multiple",
        label: "Após mudanças no trabalho, você costuma perceber:",
        options: [
          "Mais dores no corpo",
          "Mais tensão ou irritabilidade",
          "Mais correria e sobrecarga",
          "Mais erros e retrabalho",
          "Mais cansaço mental",
          "Nenhuma mudança negativa"
        ]
      }
    ]
  },
  {
    id: "clareza_funcao",
    title: "Baixa clareza de papel/função",
    possibleConsequences: ["Transtorno mental"],
    weight: 2,
    questions: [
      { id: "q_jpaib", type: "scale_0_10",
        label: "Você tem clareza sobre quais são suas responsabilidades e o que se espera de você no trabalho?",
        minLabel: "Nenhuma clareza",
        maxLabel: "Total clareza",
        polarity: "positive"
      },
      { id: "q_kix8l", type: "multiple_choice_single",
        label: "Com que frequência você recebe instruções claras sobre suas tarefas e prioridades?",
        options: [
          "Sempre",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca"
        ]
      },
      { id: "q_idfsk", type: "multiple_choice_multiple",
        label: "O que mais gera confusão ou dúvida no seu trabalho?",
        options: [
          "Falta de orientação da liderança",
          "Mudanças frequentes nas tarefas",
          "Pedidos contraditórios de diferentes pessoas",
          "Falta de treinamento",
          "Comunicação interna ruim",
          "Acúmulo de funções diferentes",
          "Objetivos pouco definidos"
        ]
      },
      { id: "q_9n2x7", type: "scale_0_10",
        label: "A falta de clareza sobre suas funções prejudica a qualidade e o resultado do seu trabalho?",
        minLabel: "Não prejudica",
        maxLabel: "Prejudica muito",
        polarity: "negative"
      },
      { id: "q_szxtd", type: "text",
        label: "O que poderia ser feito para você entender melhor seu papel e suas responsabilidades no trabalho?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "reconhecimento",
    title: "Baixas recompensas e reconhecimento",
    possibleConsequences: ["Transtorno mental"],
    weight: 1,
    questions: [
      { id: "q_mvric", type: "scale_0_10",
        label: "Você sente que seu esforço e trabalho são reconhecidos e valorizados?",
        minLabel: "Nada valorizados",
        maxLabel: "Muito valorizados",
        polarity: "positive"
      },
      { id: "q_ba2v8", type: "multiple_choice_single",
        label: "Quando você realiza um bom trabalho, isso é reconhecido pela liderança ou empresa?",
        options: [
          "Sempre",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca"
        ]
      },
      { id: "q_duwad", type: "multiple_choice_multiple",
        label: "O que mais contribui para você se sentir desmotivado(a) no trabalho?",
        options: [
          "Falta de elogio ou feedback positivo",
          "Salário incompatível com o esforço",
          "Falta de oportunidades de crescimento",
          "Cobrança excessiva sem reconhecimento",
          "Falta de respeito pela sua experiência",
          "Promoções injustas ou sem critério claro"
        ]
      },
      { id: "q_3hta4", type: "scale_0_10",
        label: "A falta de reconhecimento afeta sua motivação e vontade de trabalhar?",
        minLabel: "Não afeta",
        maxLabel: "Afeta muito",
        polarity: "negative"
      },
      { id: "q_ikhtr", type: "text",
        label: "O que faria você se sentir mais reconhecido(a) e valorizado(a) no trabalho?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "suporte",
    title: "Falta de suporte/apoio no trabalho",
    possibleConsequences: ["Transtorno mental"],
    weight: 2,
    questions: [
      { id: "q_ja9eu", type: "scale_0_10",
        label: "Quando você enfrenta dificuldades no trabalho, consegue obter ajuda de colegas ou da liderança?",
        minLabel: "Nunca consigo",
        maxLabel: "Sempre consigo",
        polarity: "positive"
      },
      { id: "q_cmw06", type: "multiple_choice_single",
        label: "Seu líder ou responsável costuma oferecer suporte quando surgem problemas no trabalho?",
        options: [
          "Sempre",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca"
        ]
      },
      { id: "q_8qssq", type: "multiple_choice_multiple",
        label: "Que tipo de apoio você sente que falta no seu trabalho?",
        options: [
          "Orientação técnica",
          "Treinamento adequado",
          "Apoio emocional da liderança",
          "Colaboração da equipe",
          "Comunicação clara",
          "Tempo suficiente para executar as tarefas",
          "Recursos e ferramentas adequados"
        ]
      },
      { id: "q_8yx1o", type: "scale_0_10",
        label: "A falta de apoio no trabalho aumenta seu estresse ou sensação de sobrecarga?",
        minLabel: "Não aumenta",
        maxLabel: "Aumenta muito",
        polarity: "negative"
      },
      { id: "q_zhgm3", type: "text",
        label: "O que poderia melhorar o apoio que você recebe no trabalho?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "autonomia",
    title: "Baixo controle no trabalho / Falta de autonomia",
    possibleConsequences: ["Transtorno mental", "DORT"],
    weight: 2,
    questions: [
      { id: "q_gukb6", type: "scale_0_10",
        label: "Você tem liberdade para organizar e decidir como realizar suas tarefas no trabalho?",
        minLabel: "Nenhuma liberdade",
        maxLabel: "Total liberdade",
        polarity: "positive"
      },
      { id: "q_i1a1h", type: "multiple_choice_multiple",
        label: "O que mais limita sua autonomia no trabalho?",
        options: [
          "Controle excessivo da liderança",
          "Muitos níveis de aprovação",
          "Falta de confiança da empresa",
          "Cobranças excessivas",
          "Falta de treinamento para decidir",
          "Processos muito rígidos"
        ]
      },
      { id: "q_v9h0k", type: "multiple_choice_single",
        label: "Você consegue fazer pausas quando está cansado(a) ou sob pressão?",
        options: [
          "Sempre",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca"
        ]
      },
      { id: "q_zsczc", type: "scale_0_10",
        label: "A falta de autonomia prejudica sua motivação e a qualidade do seu trabalho?",
        minLabel: "Não prejudica",
        maxLabel: "Prejudica muito",
        polarity: "negative"
      },
      { id: "q_lif5x", type: "multiple_choice_multiple",
        label: "Por conta da falta de controle sobre seu trabalho, você costuma sentir:",
        options: [
          "Dores no corpo",
          "Cansaço excessivo",
          "Tensão muscular",
          "Movimentos repetitivos sem pausa",
          "Dores nas mãos, braços ou ombros",
          "Nenhum desses sintomas"
        ]
      }
    ]
  },
  {
    id: "justica_organizacional",
    title: "Baixa justiça organizacional",
    possibleConsequences: ["Transtorno mental"],
    weight: 2,
    questions: [
      { id: "q_zx6a6", type: "scale_0_10",
        label: "Você considera que as decisões da empresa são tomadas de forma justa e transparente?",
        minLabel: "Totalmente injustas",
        maxLabel: "Totalmente justas",
        polarity: "positive"
      },
      { id: "q_g336v", type: "multiple_choice_multiple",
        label: "Quais situações de injustiça você percebe no seu trabalho?",
        options: [
          "Favorecimento de alguns funcionários",
          "Punições desproporcionais",
          "Critérios de promoção pouco claros",
          "Diferença de tratamento entre equipes",
          "Regras diferentes para pessoas diferentes",
          "Falta de transparência nas decisões",
          "Não percebo injustiças"
        ]
      },
      { id: "q_rynq4", type: "multiple_choice_single",
        label: "Quando você discorda de uma decisão, existe um canal para se manifestar com segurança?",
        options: [
          "Sim, sempre posso me manifestar",
          "Às vezes é possível",
          "Raramente é possível",
          "Não existe esse canal",
          "Existe, mas não funciona"
        ]
      },
      { id: "q_pbrkr", type: "scale_0_10",
        label: "A percepção de injustiça no trabalho afeta seu bem-estar e motivação?",
        minLabel: "Não afeta",
        maxLabel: "Afeta muito",
        polarity: "negative"
      },
      { id: "q_nn4dh", type: "text",
        label: "O que poderia ser feito para tornar o ambiente de trabalho mais justo?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "eventos_violentos",
    title: "Eventos violentos ou traumáticos no trabalho",
    possibleConsequences: ["Transtorno mental"],
    weight: 3,
    questions: [
      { id: "q_v86hz", type: "multiple_choice_single",
        label: "Você já vivenciou ou testemunhou algum evento violento ou traumático no seu trabalho?",
        options: [
          "Sim, mais de uma vez",
          "Sim, uma vez",
          "Não, mas conheço colegas que passaram por isso",
          "Não, nunca aconteceu"
        ]
      },
      { id: "q_7h049", type: "multiple_choice_multiple",
        label: "Que tipo de situação violenta ou traumática já ocorreu no seu ambiente de trabalho?",
        options: [
          "Agressão física",
          "Ameaça com arma ou objeto",
          "Assalto ou tentativa de assalto",
          "Acidente grave com colega",
          "Situação de risco de vida",
          "Presenciar morte ou lesão grave",
          "Nenhuma dessas situações"
        ]
      },
      { id: "q_qpzn1", type: "scale_0_10",
        label: "O quanto esses eventos afetaram ou ainda afetam seu estado emocional ou mental?",
        minLabel: "Não afetaram",
        maxLabel: "Afetaram muito",
        polarity: "negative"
      },
      { id: "q_kzv73", type: "multiple_choice_single",
        label: "Após um evento traumático no trabalho, a empresa ofereceu algum tipo de suporte?",
        options: [
          "Sim, ofereceu suporte adequado",
          "Sim, mas foi insuficiente",
          "Não ofereceu nenhum suporte",
          "Não houve evento traumático"
        ]
      },
      { id: "q_rg0is", type: "text",
        label: "Se quiser, descreva como foi esse evento e de que forma ele impactou você.",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "subcarga",
    title: "Baixa demanda no trabalho (subcarga)",
    possibleConsequences: ["Transtorno mental"],
    weight: 1,
    questions: [
      { id: "q_e5v3x", type: "scale_0_10",
        label: "Você sente que as tarefas do seu trabalho são suficientes para ocupar seu tempo e habilidades?",
        minLabel: "Muito abaixo do meu potencial",
        maxLabel: "Totalmente adequadas",
        polarity: "positive"
      },
      { id: "q_x3xbj", type: "multiple_choice_multiple",
        label: "Como você se sente quando as demandas de trabalho são muito baixas?",
        options: [
          "Entediado(a) ou desmotivado(a)",
          "Com sensação de inutilidade",
          "Ansioso(a) ou inseguro(a) quanto ao emprego",
          "Com dificuldade de manter o foco",
          "Sem desafios ou crescimento",
          "Me sinto bem com esse ritmo"
        ]
      },
      { id: "q_9cftc", type: "multiple_choice_single",
        label: "Com que frequência você fica sem ter o que fazer durante a jornada de trabalho?",
        options: [
          "Nunca",
          "Raramente",
          "Às vezes",
          "Com frequência",
          "Quase sempre"
        ]
      },
      { id: "q_84lzt", type: "scale_0_10",
        label: "A falta de tarefas ou desafios suficientes afeta negativamente sua saúde mental ou motivação?",
        minLabel: "Não afeta",
        maxLabel: "Afeta muito",
        polarity: "negative"
      },
      { id: "q_blscx", type: "text",
        label: "O que poderia ser feito para tornar seu trabalho mais desafiador e significativo?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "sobrecarga",
    title: "Excesso de demandas no trabalho (sobrecarga)",
    possibleConsequences: ["Transtorno mental", "DORT"],
    weight: 3,
    questions: [
      { id: "q_vrzgp", type: "scale_0_10",
        label: "Com que frequência você sente que tem mais trabalho do que consegue realizar no tempo disponível?",
        minLabel: "Nunca",
        maxLabel: "Sempre",
        polarity: "negative"
      },
      { id: "q_h0unk", type: "multiple_choice_multiple",
        label: "Quais situações de sobrecarga você enfrenta no trabalho?",
        options: [
          "Horas extras frequentes",
          "Acúmulo de funções",
          "Prazos impossíveis de cumprir",
          "Trabalhar durante pausas ou refeições",
          "Levar trabalho para casa",
          "Trabalhar mesmo doente",
          "Não enfrento sobrecarga"
        ]
      },
      { id: "q_wsb16", type: "multiple_choice_single",
        label: "Você consegue cumprir suas tarefas sem precisar abrir mão das pausas e do intervalo de refeição?",
        options: [
          "Sempre consigo",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca consigo"
        ]
      },
      { id: "q_flm0i", type: "scale_0_10",
        label: "A sobrecarga de trabalho afeta sua saúde física ou mental?",
        minLabel: "Não afeta",
        maxLabel: "Afeta muito",
        polarity: "negative"
      },
      { id: "q_jzpe0", type: "multiple_choice_multiple",
        label: "Por causa do excesso de trabalho, você sente ou percebe:",
        options: [
          "Dores no corpo",
          "Esgotamento ou burnout",
          "Problemas de sono",
          "Irritabilidade ou ansiedade",
          "Dificuldade de concentração",
          "Dores nas mãos, braços ou ombros",
          "Nenhum desses"
        ]
      },
      { id: "q_0tnh4", type: "text",
        label: "O que poderia ser feito para reduzir a sobrecarga no seu trabalho?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "relacionamentos",
    title: "Más relacionamentos no local de trabalho",
    possibleConsequences: ["Transtorno mental"],
    weight: 2,
    questions: [
      { id: "q_xysmw", type: "scale_0_10",
        label: "Como você avalia a qualidade dos relacionamentos entre colegas no seu trabalho?",
        minLabel: "Muito ruins",
        maxLabel: "Muito bons",
        polarity: "positive"
      },
      { id: "q_baone", type: "multiple_choice_multiple",
        label: "Quais problemas de relacionamento você observa no seu ambiente de trabalho?",
        options: [
          "Conflitos frequentes entre colegas",
          "Fofoca ou intrigas",
          "Falta de cooperação",
          "Competição desleal",
          "Grupos ou panelinhas excludentes",
          "Falta de respeito entre as pessoas",
          "Não observo esses problemas"
        ]
      },
      { id: "q_nbdsc", type: "multiple_choice_single",
        label: "A liderança age para resolver conflitos e melhorar o relacionamento na equipe?",
        options: [
          "Sempre",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca"
        ]
      },
      { id: "q_g71q5", type: "scale_0_10",
        label: "Os problemas de relacionamento no trabalho afetam seu bem-estar ou desempenho?",
        minLabel: "Não afeta",
        maxLabel: "Afeta muito",
        polarity: "negative"
      },
      { id: "q_g1zv7", type: "text",
        label: "O que poderia ser feito para melhorar o relacionamento entre as pessoas no seu trabalho?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "comunicacao",
    title: "Trabalho em condições de difícil comunicação",
    possibleConsequences: ["Transtorno mental"],
    weight: 1,
    questions: [
      { id: "q_5x7do", type: "scale_0_10",
        label: "A comunicação no seu ambiente de trabalho é clara e eficiente?",
        minLabel: "Nada clara",
        maxLabel: "Muito clara e eficiente",
        polarity: "positive"
      },
      { id: "q_zxbot", type: "multiple_choice_multiple",
        label: "Quais barreiras de comunicação você enfrenta no trabalho?",
        options: [
          "Informações incompletas ou confusas",
          "Falta de comunicação da liderança",
          "Ruído ou barulho excessivo no ambiente",
          "Distância física entre equipes ou setores",
          "Uso de ferramentas inadequadas",
          "Idioma ou jargão técnico difícil",
          "Não enfrento barreiras de comunicação"
        ]
      },
      { id: "q_qdf3a", type: "multiple_choice_single",
        label: "As informações importantes sobre o trabalho chegam até você de forma adequada e no tempo certo?",
        options: [
          "Sempre",
          "Quase sempre",
          "Às vezes",
          "Quase nunca",
          "Nunca"
        ]
      },
      { id: "q_kao9t", type: "scale_0_10",
        label: "As dificuldades de comunicação no trabalho aumentam seu estresse ou a chance de erros?",
        minLabel: "Não aumentam",
        maxLabel: "Aumentam muito",
        polarity: "negative"
      },
      { id: "q_ir7n4", type: "text",
        label: "O que poderia ser feito para melhorar a comunicação no seu trabalho?",
        placeholder: "Resposta opcional"
      }
    ]
  },
  {
    id: "trabalho_remoto",
    title: "Trabalho remoto e isolado",
    possibleConsequences: ["Transtorno mental", "Fadiga"],
    weight: 1,
    questions: [
      { id: "q_0ze3y", type: "multiple_choice_single",
        label: "Qual é o seu regime de trabalho atual?",
        options: [
          "100% presencial",
          "Híbrido (parte presencial, parte remoto)",
          "100% remoto",
          "Trabalho isolado (campo, área remota, sozinho no local)"
        ]
      },
      { id: "q_jf5c6", type: "scale_0_10",
        label: "Você se sente isolado(a) ou desconectado(a) dos seus colegas e da empresa no seu trabalho?",
        minLabel: "Nunca me sinto isolado(a)",
        maxLabel: "Me sinto muito isolado(a)",
        polarity: "negative"
      },
      { id: "q_tfhbk", type: "multiple_choice_multiple",
        label: "Quais dificuldades você enfrenta por trabalhar de forma remota ou isolada?",
        options: [
          "Falta de contato social com colegas",
          "Dificuldade de separar trabalho e vida pessoal",
          "Falta de suporte técnico adequado",
          "Comunicação mais difícil com a equipe",
          "Sensação de invisibilidade para a liderança",
          "Dificuldade de manter a motivação",
          "Não enfrento dificuldades"
        ]
      },
      { id: "q_y6rn2", type: "scale_0_10",
        label: "O trabalho remoto ou isolado afeta negativamente sua saúde mental ou bem-estar?",
        minLabel: "Não afeta",
        maxLabel: "Afeta muito",
        polarity: "negative"
      },
      { id: "q_gestao_2",
        type: "multiple_choice_single",
        label: "A empresa oferece suporte e mantém contato regular com quem trabalha de forma remota ou isolada?",
        options: [
          "Sim, sempre",
          "Às vezes",
          "Raramente",
          "Não oferece suporte",
          "Não se aplica ao meu caso"
        ]
      },
      { id: "q_gestao_3",
        type: "text",
        label: "O que poderia ser feito para melhorar sua experiência no trabalho remoto ou isolado?",
        placeholder: "Resposta opcional"
      }
    ]
  }
];
