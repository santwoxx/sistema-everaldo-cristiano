"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirAdmin, exigirSessao } from "@/lib/auth";
import {
  avaliarConclusao,
  comNumeroSequencial,
  gerarToken,
  notificar,
  recalcularOrdem,
  sincronizarFinanceiro,
} from "@/lib/negocio";
import { paraNumero, osNumero, orcNumero } from "@/lib/format";
import { CHECKLIST_PADRAO, TIPOS_SERVICO } from "@/lib/constants";
import { dadosDoForm } from "@/lib/formulario";
import type { EstadoForm } from "@/app/actions/clientes";

const esquema = z.object({
  titulo: z.string().trim().min(2, "Descreva o serviço"),
  clienteId: z.string().trim().min(1, "Selecione o cliente"),
  montadorId: z.string().trim().optional(),
  descricao: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  dataAgendada: z.string().trim().optional(),
  formaPagamento: z.string().trim().default("PIX"),
  observacoes: z.string().trim().optional(),
});

function revalidarTudo(id?: string) {
  revalidatePath("/painel");
  revalidatePath("/ordens");
  revalidatePath("/montador");
  revalidatePath("/clientes");
  if (id) {
    revalidatePath(`/ordens/${id}`);
    revalidatePath(`/montador/${id}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Criar / editar                                                             */
/* -------------------------------------------------------------------------- */

export async function salvarOrdem(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");

  const bruto = dadosDoForm(formData);
  const dados = esquema.safeParse({
    ...bruto,
    formaPagamento: bruto.formaPagamento || "PIX",
  });
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos" };
  const d = dados.data;

  const valorTotal = paraNumero(formData.get("valorTotal"));
  const comissaoPercent = Math.min(100, Math.max(0, paraNumero(formData.get("comissaoPercent"))));
  const comissaoValor = Number(((valorTotal * comissaoPercent) / 100).toFixed(2));

  const base = {
    titulo: d.titulo,
    clienteId: d.clienteId,
    montadorId: d.montadorId || null,
    descricao: d.descricao || null,
    endereco: d.endereco || null,
    cidade: d.cidade || null,
    dataAgendada: d.dataAgendada ? new Date(`${d.dataAgendada}T12:00:00`) : null,
    formaPagamento: d.formaPagamento,
    observacoes: d.observacoes || null,
    valorTotal,
    comissaoPercent,
    comissaoValor,
  };

  let ordemId = id;

  if (id) {
    await prisma.ordemServico.update({ where: { id }, data: base });
  } else {
    const criada = await comNumeroSequencial("ordemServico", (numero) =>
      prisma.ordemServico.create({
        data: {
          ...base,
          numero,
          tokenAssinatura: gerarToken(),
          status: "AGENDADA",
          checklist: {
            create: CHECKLIST_PADRAO.map((descricao, ordemIndex) => ({
              descricao,
              ordemIndex,
            })),
          },
        },
      })
    );
    ordemId = criada.id;
  }

  await sincronizarFinanceiro(ordemId);
  revalidarTudo(ordemId);
  return { sucesso: id ? "Ordem de serviço atualizada." : "Ordem de serviço criada." };
}

/* -------------------------------------------------------------------------- */
/* Itens                                                                      */
/* -------------------------------------------------------------------------- */

export async function adicionarItem(formData: FormData) {
  await exigirAdmin();
  const ordemId = String(formData.get("ordemId") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!ordemId || !descricao) return;

  await prisma.itemOrdem.create({
    data: {
      ordemId,
      descricao,
      quantidade: Math.max(1, paraNumero(formData.get("quantidade")) || 1),
      valorUnitario: paraNumero(formData.get("valorUnitario")),
    },
  });

  await recalcularOrdem(ordemId);
  await sincronizarFinanceiro(ordemId);
  revalidarTudo(ordemId);
}

export async function removerItem(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const item = await prisma.itemOrdem.delete({ where: { id } });
  await recalcularOrdem(item.ordemId);
  await sincronizarFinanceiro(item.ordemId);
  revalidarTudo(item.ordemId);
}

/* -------------------------------------------------------------------------- */
/* Checklist (usado pelo montador em campo)                                   */
/* -------------------------------------------------------------------------- */

export async function alternarChecklist(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const item = await prisma.checklistItem.findUnique({ where: { id } });
  if (!item) return;

  await prisma.checklistItem.update({
    where: { id },
    data: { concluido: !item.concluido },
  });
  revalidarTudo(item.ordemId);
}

export async function adicionarChecklist(formData: FormData) {
  await exigirSessao();
  const ordemId = String(formData.get("ordemId") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!ordemId || !descricao) return;

  const total = await prisma.checklistItem.count({ where: { ordemId } });
  await prisma.checklistItem.create({
    data: { ordemId, descricao, ordemIndex: total },
  });
  revalidarTudo(ordemId);
}

export async function removerChecklist(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const item = await prisma.checklistItem.delete({ where: { id } });
  revalidarTudo(item.ordemId);
}

/* -------------------------------------------------------------------------- */
/* Ciclo de vida                                                              */
/* -------------------------------------------------------------------------- */

export async function iniciarExecucao(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.ordemServico.update({
    where: { id },
    data: { status: "EM_ANDAMENTO", dataInicio: new Date() },
  });
  revalidarTudo(id);
}

export async function alterarStatus(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  const extras: Record<string, unknown> = {};
  if (status === "EM_ANDAMENTO") extras.dataInicio = new Date();
  if (status === "CONCLUIDA") extras.dataConclusao = new Date();
  if (status === "AGENDADA") {
    extras.dataInicio = null;
    extras.dataConclusao = null;
  }

  await prisma.ordemServico.update({ where: { id }, data: { status, ...extras } });
  await sincronizarFinanceiro(id);
  revalidarTudo(id);
}

export async function alternarPagamento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const ordem = await prisma.ordemServico.findUnique({ where: { id } });
  if (!ordem) return;

  await prisma.ordemServico.update({ where: { id }, data: { pago: !ordem.pago } });
  await sincronizarFinanceiro(id);
  revalidarTudo(id);
}

export async function excluirOrdem(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const assinaturas = await prisma.assinatura.count({ where: { ordemId: id } });
  if (assinaturas > 0) {
    throw new Error(
      "Esta OS já possui assinatura digital e não pode ser excluída. Use o status 'Cancelada'."
    );
  }

  await prisma.lancamento.deleteMany({ where: { ordemId: id } });
  await prisma.ordemServico.delete({ where: { id } });
  revalidarTudo();
  redirect("/ordens");
}

/* -------------------------------------------------------------------------- */
/* Fotos do serviço                                                           */
/* -------------------------------------------------------------------------- */

export async function adicionarFoto(formData: FormData) {
  await exigirSessao();
  const ordemId = String(formData.get("ordemId") ?? "");
  const dataUrl = String(formData.get("dataUrl") ?? "");
  if (!ordemId || !dataUrl.startsWith("data:image/")) return;

  await prisma.fotoOrdem.create({
    data: {
      ordemId,
      dataUrl,
      etapa: String(formData.get("etapa") ?? "DEPOIS"),
      legenda: String(formData.get("legenda") ?? "").trim() || null,
    },
  });
  revalidarTudo(ordemId);
}

export async function removerFoto(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const foto = await prisma.fotoOrdem.delete({ where: { id } });
  revalidarTudo(foto.ordemId);
}

/* -------------------------------------------------------------------------- */
/* Conversão de orçamento aprovado em ordem de serviço                        */
/* -------------------------------------------------------------------------- */

export async function converterOrcamento(formData: FormData) {
  await exigirAdmin();
  const orcamentoId = String(formData.get("orcamentoId") ?? "");
  if (!orcamentoId) return;

  const orcamento = await prisma.orcamento.findUnique({
    where: { id: orcamentoId },
    include: { ordem: true },
  });
  if (!orcamento) return;
  if (orcamento.ordem) redirect(`/ordens/${orcamento.ordem.id}`);

  // Reaproveita o cadastro do cliente quando o telefone já existe na base.
  let clienteId = orcamento.clienteId;
  if (!clienteId) {
    const existente = orcamento.telefone
      ? await prisma.cliente.findFirst({ where: { telefone: orcamento.telefone } })
      : null;

    clienteId =
      existente?.id ??
      (
        await prisma.cliente.create({
          data: {
            nome: orcamento.nomeContato,
            telefone: orcamento.telefone,
            email: orcamento.email,
            documento: orcamento.documento,
            cep: orcamento.cep,
            endereco: orcamento.endereco,
            cidade: orcamento.cidade,
            estado: orcamento.estado,
          },
        })
      ).id;
  }

  const montadorPadrao = await prisma.usuario.findFirst({
    where: { papel: "MONTADOR", ativo: true },
    orderBy: { criadoEm: "asc" },
  });

  const valor = orcamento.valorProposto ?? 0;
  const comissaoPercent = montadorPadrao?.comissaoPadrao ?? 30;

  const ordem = await comNumeroSequencial("ordemServico", (numero) =>
    prisma.ordemServico.create({
      data: {
        numero,
        titulo: `${TIPOS_SERVICO[orcamento.tipoServico as keyof typeof TIPOS_SERVICO] ?? "Serviço"} — ${orcNumero(orcamento.numero)}`,
        descricao: orcamento.descricao,
        clienteId,
        orcamentoId: orcamento.id,
        endereco: orcamento.endereco,
        cidade: orcamento.cidade,
        dataAgendada: orcamento.prazoDesejado,
        valorTotal: valor,
        comissaoPercent,
        comissaoValor: Number(((valor * comissaoPercent) / 100).toFixed(2)),
        tokenAssinatura: gerarToken(),
        status: "AGENDADA",
        checklist: {
          create: CHECKLIST_PADRAO.map((descricao, ordemIndex) => ({
            descricao,
            ordemIndex,
          })),
        },
      },
    })
  );

  await prisma.orcamento.update({
    where: { id: orcamentoId },
    data: { status: "CONVERTIDO", clienteId, respondidoEm: new Date() },
  });

  await notificar({
    tipo: "OS_CONCLUIDA",
    titulo: `${osNumero(ordem.numero)} criada a partir de orçamento`,
    mensagem: `O orçamento de ${orcamento.nomeContato} virou ordem de serviço.`,
    link: `/ordens/${ordem.id}`,
  });

  revalidarTudo(ordem.id);
  revalidatePath("/orcamentos");
  redirect(`/ordens/${ordem.id}`);
}

/** Reavalia assinaturas + financeiro (usado após operações do app do montador). */
export async function revisarOrdem(ordemId: string) {
  await avaliarConclusao(ordemId);
  revalidarTudo(ordemId);
}
