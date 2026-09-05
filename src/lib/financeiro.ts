import "server-only";

import { prisma } from "@/lib/prisma";

export type ResumoFinanceiro = {
  faturamentoConfirmado: number;
  aReceber: number;
  despesasOperacionais: number;
  comissoes: number;
  despesasSemComissao: number;
  lucroLiquido: number;
  margem: number;
  totalMovimentacoes: number;
};

export type Periodo = { de?: Date; ate?: Date };

function filtroData(periodo?: Periodo) {
  if (!periodo?.de && !periodo?.ate) return {};
  return {
    data: {
      ...(periodo?.de ? { gte: periodo.de } : {}),
      ...(periodo?.ate ? { lte: periodo.ate } : {}),
    },
  };
}

/**
 * Consolida o caixa: receitas confirmadas, pendentes, despesas e comissoes.
 * Lancamentos CANCELADOS ficam de fora de qualquer soma.
 */
export async function resumoFinanceiro(periodo?: Periodo): Promise<ResumoFinanceiro> {
  const base = filtroData(periodo);

  const [receitaOk, receitaPendente, despesaTotal, comissaoTotal, total] =
    await Promise.all([
      prisma.lancamento.aggregate({
        _sum: { valor: true },
        where: { ...base, tipo: "RECEITA", status: "CONFIRMADO" },
      }),
      prisma.lancamento.aggregate({
        _sum: { valor: true },
        where: { ...base, tipo: "RECEITA", status: "PENDENTE" },
      }),
      prisma.lancamento.aggregate({
        _sum: { valor: true },
        where: { ...base, tipo: "DESPESA", status: { not: "CANCELADO" } },
      }),
      prisma.lancamento.aggregate({
        _sum: { valor: true },
        where: {
          ...base,
          tipo: "DESPESA",
          categoria: "COMISSAO",
          status: { not: "CANCELADO" },
        },
      }),
      prisma.lancamento.count({ where: base }),
    ]);

  const faturamentoConfirmado = receitaOk._sum.valor ?? 0;
  const aReceber = receitaPendente._sum.valor ?? 0;
  const despesasOperacionais = despesaTotal._sum.valor ?? 0;
  const comissoes = comissaoTotal._sum.valor ?? 0;
  const lucroLiquido = faturamentoConfirmado - despesasOperacionais;

  return {
    faturamentoConfirmado,
    aReceber,
    despesasOperacionais,
    comissoes,
    despesasSemComissao: despesasOperacionais - comissoes,
    lucroLiquido,
    margem: faturamentoConfirmado > 0 ? (lucroLiquido / faturamentoConfirmado) * 100 : 0,
    totalMovimentacoes: total,
  };
}

/** Serie mensal dos ultimos N meses para o grafico de evolucao. */
export async function evolucaoMensal(meses = 6) {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);

  const lancamentos = await prisma.lancamento.findMany({
    where: { data: { gte: inicio }, status: { not: "CANCELADO" } },
    select: { tipo: true, valor: true, data: true, status: true },
  });

  const buckets = Array.from({ length: meses }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1) + i, 1);
    return {
      chave: `${d.getFullYear()}-${d.getMonth()}`,
      rotulo: new Intl.DateTimeFormat("pt-BR", { month: "short" })
        .format(d)
        .replace(".", "")
        .toUpperCase(),
      receita: 0,
      despesa: 0,
    };
  });

  for (const l of lancamentos) {
    const chave = `${l.data.getFullYear()}-${l.data.getMonth()}`;
    const alvo = buckets.find((b) => b.chave === chave);
    if (!alvo) continue;
    if (l.tipo === "RECEITA") {
      if (l.status === "CONFIRMADO") alvo.receita += l.valor;
    } else {
      alvo.despesa += l.valor;
    }
  }

  return buckets;
}

/** Ranking de producao e comissao por montador. */
export async function desempenhoMontadores() {
  const montadores = await prisma.usuario.findMany({
    where: { papel: "MONTADOR" },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, corAvatar: true, ativo: true, comissaoPadrao: true },
  });

  const resultado = await Promise.all(
    montadores.map(async (m) => {
      const [concluidas, andamento, comissao, faturado] = await Promise.all([
        prisma.ordemServico.count({ where: { montadorId: m.id, status: "CONCLUIDA" } }),
        prisma.ordemServico.count({
          where: { montadorId: m.id, status: { in: ["AGENDADA", "EM_ANDAMENTO", "AGUARDANDO_ASSINATURA"] } },
        }),
        prisma.lancamento.aggregate({
          _sum: { valor: true },
          where: { montadorId: m.id, categoria: "COMISSAO", status: { not: "CANCELADO" } },
        }),
        prisma.ordemServico.aggregate({
          _sum: { valorTotal: true },
          where: { montadorId: m.id, status: "CONCLUIDA" },
        }),
      ]);
      return {
        ...m,
        concluidas,
        andamento,
        comissao: comissao._sum.valor ?? 0,
        faturado: faturado._sum.valorTotal ?? 0,
      };
    })
  );

  return resultado.sort((a, b) => b.faturado - a.faturado);
}
