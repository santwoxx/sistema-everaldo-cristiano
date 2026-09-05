import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { osNumero } from "@/lib/format";

/** Token opaco para links públicos e páginas de assinatura. */
export function gerarToken(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}

/** Impressão digital do documento assinado — garante integridade da prova. */
export function hashAssinatura(payload: {
  ordemId: string;
  numero: number;
  tipo: string;
  nome: string;
  valorTotal: number;
  imagem: string;
  assinadoEm: Date;
}): string {
  return createHash("sha256")
    .update(
      [
        payload.ordemId,
        payload.numero,
        payload.tipo,
        payload.nome.trim().toLowerCase(),
        payload.valorTotal.toFixed(2),
        payload.assinadoEm.toISOString(),
        createHash("sha256").update(payload.imagem).digest("hex"),
      ].join("|")
    )
    .digest("hex");
}

/**
 * Próximo número sequencial de OS / orçamento.
 *
 * A numeração é calculada na aplicação (e não com autoincrement) porque o
 * SQLite só aceita autoincrement na chave primária — assim o mesmo schema
 * roda em SQLite e PostgreSQL sem alteração.
 */
export async function proximoNumero(
  entidade: "ordemServico" | "orcamento"
): Promise<number> {
  const agregado =
    entidade === "ordemServico"
      ? await prisma.ordemServico.aggregate({ _max: { numero: true } })
      : await prisma.orcamento.aggregate({ _max: { numero: true } });

  return (agregado._max.numero ?? 0) + 1;
}

/**
 * Cria um registro numerado com segurança: se dois cadastros simultâneos
 * pegarem o mesmo número, o índice único rejeita o segundo e nós tentamos
 * de novo com o número seguinte.
 */
export async function comNumeroSequencial<T>(
  entidade: "ordemServico" | "orcamento",
  criar: (numero: number) => Promise<T>
): Promise<T> {
  const TENTATIVAS = 6;
  for (let i = 0; i < TENTATIVAS; i++) {
    const numero = (await proximoNumero(entidade)) + i;
    try {
      return await criar(numero);
    } catch (erro: unknown) {
      const codigo = (erro as { code?: string })?.code;
      if (codigo === "P2002" && i < TENTATIVAS - 1) continue;
      throw erro;
    }
  }
  throw new Error("Não foi possível gerar a numeração. Tente novamente.");
}

export async function notificar(dados: {
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
}) {
  await prisma.notificacao.create({ data: dados });
}

/**
 * Recalcula o valor da OS a partir dos itens e aplica o percentual de comissão.
 * Quando a OS não tem itens, o valorTotal informado manualmente é preservado.
 */
export async function recalcularOrdem(ordemId: string) {
  const ordem = await prisma.ordemServico.findUnique({
    where: { id: ordemId },
    include: { itens: true },
  });
  if (!ordem) return null;

  const somaItens = ordem.itens.reduce(
    (acc, i) => acc + i.quantidade * i.valorUnitario,
    0
  );
  const valorTotal = ordem.itens.length > 0 ? somaItens : ordem.valorTotal;
  const comissaoValor = Number(
    ((valorTotal * ordem.comissaoPercent) / 100).toFixed(2)
  );

  return prisma.ordemServico.update({
    where: { id: ordemId },
    data: { valorTotal, comissaoValor },
  });
}

/**
 * Espelha a OS no financeiro: uma RECEITA (serviço) e, havendo montador,
 * uma DESPESA de COMISSÃO. Os lançamentos automáticos são reescritos a cada
 * chamada, então a função é idempotente — pode rodar quantas vezes precisar.
 *
 * Regra de caixa:
 *   • OS concluída e paga   → receita CONFIRMADO
 *   • OS concluída não paga → receita PENDENTE (entra em "A receber")
 *   • OS cancelada          → tudo CANCELADO
 */
export async function sincronizarFinanceiro(ordemId: string) {
  const ordem = await prisma.ordemServico.findUnique({
    where: { id: ordemId },
    include: { cliente: true, montador: true },
  });
  if (!ordem) return;

  // Antes da conclusão não existe fato gerador: limpa o que houver.
  if (ordem.status !== "CONCLUIDA" && ordem.status !== "CANCELADA") {
    await prisma.lancamento.deleteMany({ where: { ordemId, automatico: true } });
    return;
  }

  const cancelada = ordem.status === "CANCELADA";
  const statusReceita = cancelada
    ? "CANCELADO"
    : ordem.pago
      ? "CONFIRMADO"
      : "PENDENTE";
  const statusComissao = cancelada ? "CANCELADO" : "CONFIRMADO";
  const dataRef = ordem.dataConclusao ?? new Date();
  const referencia = `${osNumero(ordem.numero)} · ${ordem.cliente.nome}`;

  await prisma.$transaction(async (tx) => {
    await tx.lancamento.deleteMany({ where: { ordemId, automatico: true } });

    if (ordem.valorTotal > 0) {
      await tx.lancamento.create({
        data: {
          tipo: "RECEITA",
          categoria: "SERVICO",
          descricao: `${ordem.titulo} — ${referencia}`,
          valor: ordem.valorTotal,
          data: dataRef,
          status: statusReceita,
          formaPagamento: ordem.formaPagamento,
          automatico: true,
          ordemId: ordem.id,
        },
      });
    }

    if (ordem.montadorId && ordem.comissaoValor > 0) {
      await tx.lancamento.create({
        data: {
          tipo: "DESPESA",
          categoria: "COMISSAO",
          descricao: `Comissão ${ordem.montador?.nome ?? "montador"} (${ordem.comissaoPercent}%) — ${referencia}`,
          valor: ordem.comissaoValor,
          data: dataRef,
          status: statusComissao,
          formaPagamento: ordem.formaPagamento,
          automatico: true,
          ordemId: ordem.id,
          montadorId: ordem.montadorId,
        },
      });
    }
  });
}

/**
 * Uma OS só pode ser concluída depois das duas assinaturas digitais.
 * Enquanto faltar alguma, ela fica em AGUARDANDO_ASSINATURA.
 */
export async function avaliarConclusao(ordemId: string) {
  const ordem = await prisma.ordemServico.findUnique({
    where: { id: ordemId },
    include: { assinaturas: true, cliente: true },
  });
  if (!ordem || ordem.status === "CANCELADA") return null;

  const temMontador = ordem.assinaturas.some((a) => a.tipo === "MONTADOR");
  const temCliente = ordem.assinaturas.some((a) => a.tipo === "CLIENTE");

  if (temMontador && temCliente) {
    if (ordem.status !== "CONCLUIDA") {
      await prisma.ordemServico.update({
        where: { id: ordemId },
        data: { status: "CONCLUIDA", dataConclusao: ordem.dataConclusao ?? new Date() },
      });
      await notificar({
        tipo: "OS_CONCLUIDA",
        titulo: `${osNumero(ordem.numero)} concluída e assinada`,
        mensagem: `${ordem.titulo} — ${ordem.cliente.nome}. Montador e cliente assinaram digitalmente.`,
        link: `/ordens/${ordem.id}`,
      });
    }
  } else if (
    (temMontador || temCliente) &&
    ordem.status !== "AGUARDANDO_ASSINATURA"
  ) {
    await prisma.ordemServico.update({
      where: { id: ordemId },
      data: { status: "AGUARDANDO_ASSINATURA" },
    });
  }

  await sincronizarFinanceiro(ordemId);
  return prisma.ordemServico.findUnique({ where: { id: ordemId } });
}

/** URL absoluta do sistema, usada nos links enviados ao cliente. */
export function urlBase(): string {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configurada) return configurada;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
