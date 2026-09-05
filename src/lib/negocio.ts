import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  dbOrdens,
  dbOrcamentos,
  dbLancamentos,
  dbClientes,
  dbUsuarios,
  dbNotificacoes,
  OrdemServicoDoc,
} from "@/lib/firestore";
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
  assinadoEm: Date | string;
}): string {
  const assinadoEmStr =
    payload.assinadoEm instanceof Date
      ? payload.assinadoEm.toISOString()
      : payload.assinadoEm;

  return createHash("sha256")
    .update(
      [
        payload.ordemId,
        payload.numero,
        payload.tipo,
        payload.nome.trim().toLowerCase(),
        payload.valorTotal.toFixed(2),
        assinadoEmStr,
        createHash("sha256").update(payload.imagem).digest("hex"),
      ].join("|")
    )
    .digest("hex");
}

/** Próximo número sequencial de OS / orçamento. */
export async function proximoNumero(
  entidade: "ordemServico" | "orcamento"
): Promise<number> {
  return entidade === "ordemServico"
    ? dbOrdens.proximoNumero()
    : dbOrcamentos.proximoNumero();
}

/** Cria um registro numerado sequencialmente. */
export async function comNumeroSequencial<T>(
  entidade: "ordemServico" | "orcamento",
  criar: (numero: number) => Promise<T>
): Promise<T> {
  const numero = await proximoNumero(entidade);
  return criar(numero);
}

export async function notificar(dados: {
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
}) {
  await dbNotificacoes.criar({
    tipo: dados.tipo,
    titulo: dados.titulo,
    mensagem: dados.mensagem,
    link: dados.link || null,
    lida: false,
  });
}

/**
 * Recalcula o valor da OS a partir dos itens e aplica o percentual de comissão.
 * Quando a OS não tem itens, o valorTotal informado manualmente é preservado.
 */
export async function recalcularOrdem(ordemId: string): Promise<OrdemServicoDoc | null> {
  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return null;

  const itens = ordem.itens || [];
  const somaItens = itens.reduce(
    (acc, i) => acc + i.quantidade * i.valorUnitario,
    0
  );
  const valorTotal = itens.length > 0 ? somaItens : ordem.valorTotal;
  const comissaoValor = Number(
    ((valorTotal * (ordem.comissaoPercent || 30)) / 100).toFixed(2)
  );

  return dbOrdens.atualizar(ordemId, { valorTotal, comissaoValor });
}

/**
 * Espelha a OS no financeiro: uma RECEITA (serviço) e, havendo montador,
 * uma DESPESA de COMISSÃO. Os lançamentos automáticos são idempotentes.
 */
export async function sincronizarFinanceiro(ordemId: string): Promise<void> {
  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const cliente = await dbClientes.buscarPorId(ordem.clienteId);
  const montador = ordem.montadorId
    ? await dbUsuarios.buscarPorId(ordem.montadorId)
    : null;

  // Antes da conclusão não existe fato gerador: limpa lançamentos automáticos anteriores.
  if (ordem.status !== "CONCLUIDA" && ordem.status !== "CANCELADA") {
    await dbLancamentos.excluirAutomaticosDaOrdem(ordemId);
    return;
  }

  const cancelada = ordem.status === "CANCELADA";
  const statusReceita = cancelada
    ? "CANCELADO"
    : ordem.pago
      ? "CONFIRMADO"
      : "PENDENTE";
  const statusComissao = cancelada ? "CANCELADO" : "CONFIRMADO";
  const dataRef = ordem.dataConclusao || new Date().toISOString();
  const clienteNome = cliente?.nome || "Cliente";
  const referencia = `${osNumero(ordem.numero)} · ${clienteNome}`;

  // Limpa anteriores
  await dbLancamentos.excluirAutomaticosDaOrdem(ordemId);

  if (ordem.valorTotal > 0) {
    await dbLancamentos.criar({
      tipo: "RECEITA",
      categoria: "SERVICO",
      descricao: `${ordem.titulo} — ${referencia}`,
      valor: ordem.valorTotal,
      data: dataRef,
      status: statusReceita,
      formaPagamento: ordem.formaPagamento || "PIX",
      automatico: true,
      ordemId: ordem.id,
      observacoes: null,
      montadorId: null,
    });
  }

  if (ordem.montadorId && (ordem.comissaoValor || 0) > 0) {
    await dbLancamentos.criar({
      tipo: "DESPESA",
      categoria: "COMISSAO",
      descricao: `Comissão ${montador?.nome ?? "montador"} (${ordem.comissaoPercent}%) — ${referencia}`,
      valor: ordem.comissaoValor,
      data: dataRef,
      status: statusComissao,
      formaPagamento: ordem.formaPagamento || "PIX",
      automatico: true,
      ordemId: ordem.id,
      montadorId: ordem.montadorId,
      observacoes: null,
    });
  }
}

/**
 * Uma OS só pode ser concluída depois das duas assinaturas digitais.
 * Enquanto faltar alguma, ela fica em AGUARDANDO_ASSINATURA.
 */
export async function avaliarConclusao(ordemId: string): Promise<OrdemServicoDoc | null> {
  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem || ordem.status === "CANCELADA") return null;

  const assinaturas = ordem.assinaturas || [];
  const temMontador = assinaturas.some((a) => a.tipo === "MONTADOR");
  const temCliente = assinaturas.some((a) => a.tipo === "CLIENTE");

  const cliente = await dbClientes.buscarPorId(ordem.clienteId);

  if (temMontador && temCliente) {
    if (ordem.status !== "CONCLUIDA") {
      await dbOrdens.atualizar(ordemId, {
        status: "CONCLUIDA",
        dataConclusao: ordem.dataConclusao || new Date().toISOString(),
      });
      await notificar({
        tipo: "OS_CONCLUIDA",
        titulo: `${osNumero(ordem.numero)} concluída e assinada`,
        mensagem: `${ordem.titulo} — ${cliente?.nome || "Cliente"}. Montador e cliente assinaram digitalmente.`,
        link: `/ordens/${ordem.id}`,
      });
    }
  } else if (
    (temMontador || temCliente) &&
    ordem.status !== "AGUARDANDO_ASSINATURA"
  ) {
    await dbOrdens.atualizar(ordemId, { status: "AGUARDANDO_ASSINATURA" });
  }

  await sincronizarFinanceiro(ordemId);
  return dbOrdens.buscarPorId(ordemId);
}

/** URL absoluta do sistema, usada nos links enviados ao cliente. */
export function urlBase(): string {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configurada) return configurada;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
