/** Vocabulario do dominio: rotulos, cores e listas usadas em todo o sistema. */

export const PAPEIS = {
  ADMIN: "Administrador",
  MONTADOR: "Montador",
} as const;
export type Papel = keyof typeof PAPEIS;

// --- Ordem de servico -------------------------------------------------------
export const STATUS_OS = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_ASSINATURA: "Aguardando assinatura",
  CONCLUIDA: "Concluida",
  CANCELADA: "Cancelada",
} as const;
export type StatusOS = keyof typeof STATUS_OS;

export const STATUS_OS_COR: Record<StatusOS, string> = {
  AGENDADA: "bg-sky-50 text-sky-700 ring-sky-200",
  EM_ANDAMENTO: "bg-amber-50 text-amber-700 ring-amber-200",
  AGUARDANDO_ASSINATURA: "bg-violet-50 text-violet-700 ring-violet-200",
  CONCLUIDA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELADA: "bg-rose-50 text-rose-700 ring-rose-200",
};

// --- Orcamento --------------------------------------------------------------
export const STATUS_ORCAMENTO = {
  NOVO: "Novo",
  EM_ANALISE: "Em analise",
  PROPOSTA_ENVIADA: "Proposta enviada",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  CONVERTIDO: "Convertido em OS",
} as const;
export type StatusOrcamento = keyof typeof STATUS_ORCAMENTO;

export const STATUS_ORCAMENTO_COR: Record<StatusOrcamento, string> = {
  NOVO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EM_ANALISE: "bg-amber-50 text-amber-700 ring-amber-200",
  PROPOSTA_ENVIADA: "bg-sky-50 text-sky-700 ring-sky-200",
  APROVADO: "bg-teal-50 text-teal-700 ring-teal-200",
  RECUSADO: "bg-rose-50 text-rose-700 ring-rose-200",
  CONVERTIDO: "bg-slate-100 text-slate-700 ring-slate-200",
};

export const TIPOS_SERVICO = {
  MONTAGEM: "Montagem de moveis",
  DESMONTAGEM: "Desmontagem / mudanca",
  PLANEJADOS: "Moveis planejados",
  MODULADOS: "Moveis modulados",
  REPARO: "Reparo / manutencao",
  OUTRO: "Outro servico",
} as const;
export type TipoServico = keyof typeof TIPOS_SERVICO;

// --- Financeiro -------------------------------------------------------------
export const CATEGORIAS_RECEITA = {
  SERVICO: "Servico prestado",
  OUTRO: "Outra receita",
} as const;

export const CATEGORIAS_DESPESA = {
  COMISSAO: "Comissao de montador",
  MATERIAL: "Material e insumos",
  TRANSPORTE: "Transporte e combustivel",
  FERRAMENTA: "Ferramentas",
  ADMINISTRATIVO: "Administrativo",
  IMPOSTO: "Impostos e taxas",
  OUTRO: "Outras despesas",
} as const;

export const CATEGORIAS: Record<string, string> = {
  ...CATEGORIAS_RECEITA,
  ...CATEGORIAS_DESPESA,
};

export const STATUS_LANCAMENTO = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
} as const;

export const FORMAS_PAGAMENTO = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartao",
  TRANSFERENCIA: "Transferencia",
  BOLETO: "Boleto",
} as const;

export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

/** Checklist sugerido para toda ordem de servico nova. */
export const CHECKLIST_PADRAO = [
  "Conferencia das pecas e ferragens recebidas",
  "Montagem executada conforme o projeto",
  "Nivelamento e fixacao na parede",
  "Portas, gavetas e corredicas ajustadas",
  "Limpeza do local e retirada das embalagens",
  "Cliente orientado sobre uso e conservacao",
];
