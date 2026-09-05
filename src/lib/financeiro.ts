import "server-only";

import { dbLancamentos, dbOrdens, dbUsuarios, LancamentoDoc } from "@/lib/firestore";

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

/**
 * Consolida o caixa: receitas confirmadas, pendentes, despesas e comissoes.
 * Lancamentos CANCELADOS ficam de fora de qualquer soma.
 */
export async function resumoFinanceiro(periodo?: Periodo): Promise<ResumoFinanceiro> {
  const todos = await dbLancamentos.listar();

  const filtrados = todos.filter((l) => {
    if (periodo?.de && new Date(l.data).getTime() < periodo.de.getTime()) return false;
    if (periodo?.ate && new Date(l.data).getTime() > periodo.ate.getTime()) return false;
    return true;
  });

  let faturamentoConfirmado = 0;
  let aReceber = 0;
  let despesasOperacionais = 0;
  let comissoes = 0;

  for (const l of filtrados) {
    if (l.status === "CANCELADO") continue;

    if (l.tipo === "RECEITA") {
      if (l.status === "CONFIRMADO") {
        faturamentoConfirmado += l.valor || 0;
      } else if (l.status === "PENDENTE") {
        aReceber += l.valor || 0;
      }
    } else if (l.tipo === "DESPESA") {
      despesasOperacionais += l.valor || 0;
      if (l.categoria === "COMISSAO") {
        comissoes += l.valor || 0;
      }
    }
  }

  const lucroLiquido = faturamentoConfirmado - despesasOperacionais;
  const margem = faturamentoConfirmado > 0 ? (lucroLiquido / faturamentoConfirmado) * 100 : 0;

  return {
    faturamentoConfirmado,
    aReceber,
    despesasOperacionais,
    comissoes,
    despesasSemComissao: despesasOperacionais - comissoes,
    lucroLiquido,
    margem,
    totalMovimentacoes: filtrados.length,
  };
}

/** Serie mensal dos ultimos N meses para o grafico de evolucao. */
export async function evolucaoMensal(meses = 6) {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);

  const todos = await dbLancamentos.listar();
  const lancamentos = todos.filter(
    (l) => new Date(l.data).getTime() >= inicio.getTime() && l.status !== "CANCELADO"
  );

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
    const dataDoc = new Date(l.data);
    const chave = `${dataDoc.getFullYear()}-${dataDoc.getMonth()}`;
    const alvo = buckets.find((b) => b.chave === chave);
    if (!alvo) continue;

    if (l.tipo === "RECEITA") {
      if (l.status === "CONFIRMADO") alvo.receita += l.valor || 0;
    } else {
      alvo.despesa += l.valor || 0;
    }
  }

  return buckets;
}

/** Ranking de producao e comissao por montador. */
export async function desempenhoMontadores() {
  const montadores = await dbUsuarios.listar({ papel: "MONTADOR" });
  const todasOrdens = await dbOrdens.listar();
  const todosLancamentos = await dbLancamentos.listar();

  const resultado = montadores.map((m) => {
    const ordensDoMontador = todasOrdens.filter((o) => o.montadorId === m.id);
    const concluidas = ordensDoMontador.filter((o) => o.status === "CONCLUIDA").length;
    const andamento = ordensDoMontador.filter((o) =>
      ["AGENDADA", "EM_ANDAMENTO", "AGUARDANDO_ASSINATURA"].includes(o.status)
    ).length;

    const faturado = ordensDoMontador
      .filter((o) => o.status === "CONCLUIDA")
      .reduce((acc, o) => acc + (o.valorTotal || 0), 0);

    const comissao = todosLancamentos
      .filter((l) => l.montadorId === m.id && l.categoria === "COMISSAO" && l.status !== "CANCELADO")
      .reduce((acc, l) => acc + (l.valor || 0), 0);

    return {
      id: m.id,
      nome: m.nome,
      corAvatar: m.corAvatar || "#0891b2",
      ativo: m.ativo,
      comissaoPadrao: m.comissaoPadrao,
      concluidas,
      andamento,
      comissao,
      faturado,
    };
  });

  return resultado.sort((a, b) => b.faturado - a.faturado);
}
