import { useState } from "react";

// Types
export interface SecaoEdital {
  id: string;
  titulo: string;
  prioridade: "obrigatorio" | "importante" | "atencao" | "info";
  itens: string[];
  contexto: string;
}

export interface TimelineItem {
  texto: string;
  data: string;
  status: "ok" | "warn" | "neutral";
}

export interface Edital {
  id: number;
  nome: string;
  orgao: string;
  objeto: string;
  tipo: string;
  disputa: string;
  plataforma: string;
  processo: string;
  sessao: string;
  horario: string;
  prazo: string;
  progresso: number;
  cor: "blue" | "teal" | "amber" | "red" | "green" | "purple";
  vr: string;
  pagamento: string;
  validade: string;
  criterio: string;
  secoes: SecaoEdital[];
  checklist: Record<string, boolean>;
  pontosFora: string[];
  timeline: TimelineItem[];
}

// Mock Data
export const EDITAIS_MOCK: Edital[] = [
  {
    id: 1,
    nome: "Pregão Eletrônico 042/2025",
    orgao: "Prefeitura Municipal de Campinas",
    objeto: "Aquisição de equipamentos de informática (computadores, monitores e periféricos)",
    tipo: "Compra Imediata",
    disputa: "Por Item",
    plataforma: "Comprasnet",
    processo: "0142/2025-SP",
    sessao: "28/01/2025",
    horario: "10h00",
    prazo: "25/01/2025",
    progresso: 72,
    cor: "blue",
    vr: "R$ 380.000,00",
    pagamento: "30 dias",
    validade: "60 dias",
    criterio: "Menor Preço",
    secoes: [
      {
        id: "s1",
        titulo: "Objeto e especificações técnicas",
        prioridade: "obrigatorio",
        itens: [
          "Computadores: processador i5 12ª geração mínimo",
          "Monitor 21,5\" Full HD IPS",
          "Teclado e mouse USB sem fio",
          "Garantia mínima 36 meses on-site",
          "Certificação INMETRO obrigatória",
        ],
        contexto: "Critério eliminatório: produto que não atender QUALQUER especificação técnica é desclassificado automaticamente. Verifique ficha técnica do fabricante antes de propor.",
      },
      {
        id: "s2",
        titulo: "Habilitação — documentação exigida",
        prioridade: "obrigatorio",
        itens: [
          "Contrato social atualizado",
          "Certidão negativa federal, estadual e municipal",
          "Certidão FGTS regular",
          "Certidão trabalhista (CNDT)",
          "Balanço patrimonial último exercício",
          "Atestado de capacidade técnica (mín. 30% do objeto)",
        ],
        contexto: "A falta de qualquer documento resulta em inabilitação imediata. Prepare toda a documentação antes do pregão — não há prazo para complementação em licitações eletrônicas.",
      },
      {
        id: "s3",
        titulo: "Qualificação técnica e atestados",
        prioridade: "importante",
        itens: [
          "Atestado de fornecimento de equipamentos similares",
          "Mínimo de 30% da quantidade total licitada",
          "Emitido por pessoa jurídica de direito público ou privado",
          "Reconhecimento de firma não exigido",
          "Permite somatório de atestados",
        ],
        contexto: "Se não tiver atestado individual suficiente, a soma de múltiplos atestados é aceita. Garanta que os COs/notas fiscais que comprovem as entregas estejam disponíveis para eventual diligência.",
      },
      {
        id: "s4",
        titulo: "Prazo de entrega e local",
        prioridade: "importante",
        itens: [
          "Prazo: 30 dias corridos após emissão da OS",
          "Entrega: Almoxarifado Central — Av. Anchieta, 200, Campinas/SP",
          "Horário de recebimento: 08h00 às 17h00",
          "Frete CIF (por conta da contratada)",
          "Instalação e configuração incluídas",
        ],
        contexto: "Frete CIF até Campinas. Calcule o custo logístico no preço final — este item é frequentemente subestimado e pode comprometer a margem.",
      },
      {
        id: "s5",
        titulo: "Penalidades e garantias",
        prioridade: "atencao",
        itens: [
          "Multa por atraso: 0,5% ao dia sobre o valor não entregue",
          "Multa por inexecução: 10% sobre o valor total",
          "Garantia contratual: 5% do valor do contrato",
          "Prazo para apresentar garantia: 5 dias após assinatura",
          "Seguro-garantia ou fiança bancária aceitos",
        ],
        contexto: "A multa por atraso de 0,5% ao dia é elevada. Só aceite o prazo de 30 dias se tiver estoque ou fornecedor confirmado. O custo da garantia contratual (5%) deve entrar na formação de preço.",
      },
      {
        id: "s6",
        titulo: "Condições de pagamento e preço",
        prioridade: "info",
        itens: [
          "Pagamento em 30 dias após liquidação",
          "Valor estimado (total): R$ 380.000,00",
          "Referência: PNCP e cotações publicadas",
          "Proposta com validade mínima 60 dias",
          "Nota fiscal eletrônica obrigatória",
        ],
        contexto: "O valor estimado de R$ 380k foi pesquisado no PNCP — verifique se condiz com seus custos atuais. Margem apertada indica concorrência acirrada neste órgão.",
      },
    ],
    checklist: {
      objeto: true,
      especTecnica: true,
      tr: true,
      dadosOp: true,
      estrutura: true,
      disputa: true,
      habilitacao: false,
      docsEspecificos: false,
      qualTecnica: true,
      prazos: true,
      amostras: false,
      localEntrega: true,
      viabilidade: false,
      precoRef: true,
      pagamento: true,
      penalidades: false,
    },
    pontosFora: [
      "Exige instalação e configuração sem custo separado — verifique se está no objeto",
      "Garantia on-site 36 meses — confirme cobertura do fabricante antes de precificar",
      "Item 7.4: sem registro no Sicaf a empresa não pode participar desta modalidade",
    ],
    timeline: [
      { texto: "Edital analisado pela IA", data: "Hoje", status: "ok" },
      { texto: "Documentação verificada", data: "Hoje", status: "warn" },
      { texto: "Proposta de preço", data: "24/01", status: "neutral" },
      { texto: "Sessão do pregão", data: "28/01 — 10h", status: "neutral" },
    ],
  },
  {
    id: 2,
    nome: "Pregão Eletrônico 018/2025",
    orgao: "Secretaria Estadual de Saúde — SP",
    objeto: "Fornecimento de material de limpeza e higienização hospitalar",
    tipo: "Ata de Registro de Preços",
    disputa: "Por Lote",
    plataforma: "BEC-SP",
    processo: "0082/2025-SEL",
    sessao: "02/02/2025",
    horario: "14h30",
    prazo: "30/01/2025",
    progresso: 100,
    cor: "teal",
    vr: "R$ 1.200.000,00",
    pagamento: "45 dias",
    validade: "90 dias",
    criterio: "Menor Preço",
    secoes: [],
    checklist: {},
    pontosFora: [],
    timeline: [],
  },
];

export function useLicitaFlow() {
  const [activeTab, setActiveTab] = useState<string>("painel");
  const [editalId, setEditalId] = useState<number>(1);
  const [editais, setEditais] = useState<Edital[]>(EDITAIS_MOCK);

  const edital = editais.find((e) => e.id === editalId) || editais[0];

  const navigate = (tab: string, id?: number) => {
    if (id) setEditalId(id);
    setActiveTab(tab);
  };

  const toggleChecklist = (editalIdToUpdate: number, key: string) => {
    setEditais((prev) =>
      prev.map((e) => {
        if (e.id === editalIdToUpdate) {
          return {
            ...e,
            checklist: {
              ...e.checklist,
              [key]: !e.checklist[key],
            },
          };
        }
        return e;
      })
    );
  };

  return {
    activeTab,
    edital,
    editais,
    navigate,
    toggleChecklist,
  };
}
