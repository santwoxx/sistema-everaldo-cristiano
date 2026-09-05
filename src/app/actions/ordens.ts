"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  dbOrdens,
  dbClientes,
  dbUsuarios,
  dbOrcamentos,
  dbLancamentos,
  gerarId,
} from "@/lib/firestore";
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
    dataAgendada: d.dataAgendada ? new Date(`${d.dataAgendada}T12:00:00`).toISOString() : null,
    formaPagamento: d.formaPagamento,
    observacoes: d.observacoes || null,
    valorTotal,
    comissaoPercent,
    comissaoValor,
  };

  let ordemId = id;

  if (id) {
    await dbOrdens.atualizar(id, base);
  } else {
    const criada = await comNumeroSequencial("ordemServico", (numero) =>
      dbOrdens.criar({
        ...base,
        numero,
        pago: false,
        tokenAssinatura: gerarToken(),
        status: "AGENDADA",
        checklist: CHECKLIST_PADRAO.map((descricao, ordemIndex) => ({
          id: gerarId(),
          descricao,
          ordemIndex,
          concluido: false,
        })),
        itens: [],
        fotos: [],
        assinaturas: [],
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

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const novoItem = {
    id: gerarId(),
    descricao,
    quantidade: Math.max(1, paraNumero(formData.get("quantidade")) || 1),
    valorUnitario: paraNumero(formData.get("valorUnitario")),
  };

  const itens = [...(ordem.itens || []), novoItem];
  await dbOrdens.atualizar(ordemId, { itens });

  await recalcularOrdem(ordemId);
  await sincronizarFinanceiro(ordemId);
  revalidarTudo(ordemId);
}

export async function removerItem(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const ordemId = String(formData.get("ordemId") ?? "");
  if (!id || !ordemId) return;

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const itens = (ordem.itens || []).filter((i) => i.id !== id);
  await dbOrdens.atualizar(ordemId, { itens });

  await recalcularOrdem(ordemId);
  await sincronizarFinanceiro(ordemId);
  revalidarTudo(ordemId);
}

/* -------------------------------------------------------------------------- */
/* Checklist (usado pelo montador em campo)                                   */
/* -------------------------------------------------------------------------- */

export async function alternarChecklist(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  const ordemId = String(formData.get("ordemId") ?? "");
  if (!id || !ordemId) return;

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const checklist = (ordem.checklist || []).map((c) =>
    c.id === id ? { ...c, concluido: !c.concluido } : c
  );

  await dbOrdens.atualizar(ordemId, { checklist });
  revalidarTudo(ordemId);
}

export async function adicionarChecklist(formData: FormData) {
  await exigirSessao();
  const ordemId = String(formData.get("ordemId") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!ordemId || !descricao) return;

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const checklist = [
    ...(ordem.checklist || []),
    {
      id: gerarId(),
      descricao,
      ordemIndex: (ordem.checklist || []).length,
      concluido: false,
    },
  ];

  await dbOrdens.atualizar(ordemId, { checklist });
  revalidarTudo(ordemId);
}

export async function removerChecklist(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  const ordemId = String(formData.get("ordemId") ?? "");
  if (!id || !ordemId) return;

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const checklist = (ordem.checklist || []).filter((c) => c.id !== id);
  await dbOrdens.atualizar(ordemId, { checklist });
  revalidarTudo(ordemId);
}

/* -------------------------------------------------------------------------- */
/* Ciclo de vida                                                              */
/* -------------------------------------------------------------------------- */

export async function iniciarExecucao(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await dbOrdens.atualizar(id, {
    status: "EM_ANDAMENTO",
    dataInicio: new Date().toISOString(),
  });
  revalidarTudo(id);
}

export async function alterarStatus(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as any;
  if (!id || !status) return;

  const extras: Record<string, unknown> = {};
  if (status === "EM_ANDAMENTO") extras.dataInicio = new Date().toISOString();
  if (status === "CONCLUIDA") extras.dataConclusao = new Date().toISOString();
  if (status === "AGENDADA") {
    extras.dataInicio = null;
    extras.dataConclusao = null;
  }

  await dbOrdens.atualizar(id, { status, ...extras });
  await sincronizarFinanceiro(id);
  revalidarTudo(id);
}

export async function alternarPagamento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const ordem = await dbOrdens.buscarPorId(id);
  if (!ordem) return;

  await dbOrdens.atualizar(id, { pago: !ordem.pago });
  await sincronizarFinanceiro(id);
  revalidarTudo(id);
}

export async function excluirOrdem(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const ordem = await dbOrdens.buscarPorId(id);
  if (!ordem) return;

  if (ordem.assinaturas && ordem.assinaturas.length > 0) {
    throw new Error(
      "Esta OS já possui assinatura digital e não pode ser excluída. Use o status 'Cancelada'."
    );
  }

  await dbLancamentos.excluirAutomaticosDaOrdem(id);
  await dbOrdens.excluir(id);
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

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const novaFoto = {
    id: gerarId(),
    dataUrl,
    etapa: (String(formData.get("etapa") ?? "DEPOIS")) as "ANTES" | "DEPOIS",
    legenda: String(formData.get("legenda") ?? "").trim() || null,
    criadoEm: new Date().toISOString(),
  };

  const fotos = [...(ordem.fotos || []), novaFoto];
  await dbOrdens.atualizar(ordemId, { fotos });
  revalidarTudo(ordemId);
}

export async function removerFoto(formData: FormData) {
  await exigirSessao();
  const id = String(formData.get("id") ?? "");
  const ordemId = String(formData.get("ordemId") ?? "");
  if (!id || !ordemId) return;

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const fotos = (ordem.fotos || []).filter((f) => f.id !== id);
  await dbOrdens.atualizar(ordemId, { fotos });
  revalidarTudo(ordemId);
}

/* -------------------------------------------------------------------------- */
/* Conversão de orçamento aprovado em ordem de serviço                        */
/* -------------------------------------------------------------------------- */

export async function converterOrcamento(formData: FormData) {
  await exigirAdmin();
  const orcamentoId = String(formData.get("orcamentoId") ?? "");
  if (!orcamentoId) return;

  const orcamento = await dbOrcamentos.buscarPorId(orcamentoId);
  if (!orcamento) return;

  const todasOrdens = await dbOrdens.listar();
  const jaConvertida = todasOrdens.find((o) => o.orcamentoId === orcamentoId);
  if (jaConvertida) redirect(`/ordens/${jaConvertida.id}`);

  // Reaproveita o cadastro do cliente quando o telefone já existe na base.
  let clienteId = orcamento.clienteId;
  if (!clienteId) {
    const clientes = await dbClientes.listar();
    const existente = orcamento.telefone
      ? clientes.find((c) => c.telefone === orcamento.telefone)
      : null;

    if (existente) {
      clienteId = existente.id;
    } else {
      const novoCliente = await dbClientes.criar({
        nome: orcamento.nomeContato,
        telefone: orcamento.telefone,
        email: orcamento.email,
        documento: orcamento.documento,
        cep: orcamento.cep,
        endereco: orcamento.endereco,
        cidade: orcamento.cidade,
        estado: orcamento.estado,
      });
      clienteId = novoCliente.id;
    }
  }

  const montadores = await dbUsuarios.listar({ papel: "MONTADOR", ativo: true });
  const montadorPadrao = montadores[0] || null;

  const valor = orcamento.valorProposto ?? 0;
  const comissaoPercent = montadorPadrao?.comissaoPadrao ?? 30;

  const ordem = await comNumeroSequencial("ordemServico", (numero) =>
    dbOrdens.criar({
      numero,
      titulo: `${TIPOS_SERVICO[orcamento.tipoServico as keyof typeof TIPOS_SERVICO] ?? "Serviço"} — ${orcNumero(orcamento.numero)}`,
      descricao: orcamento.descricao,
      clienteId: clienteId!,
      orcamentoId: orcamento.id,
      montadorId: montadorPadrao?.id || null,
      endereco: orcamento.endereco,
      cidade: orcamento.cidade,
      dataAgendada:
        orcamento.prazoDesejado && orcamento.horarioDesejado
          ? `${orcamento.prazoDesejado.slice(0, 10)}T${orcamento.horarioDesejado}:00`
          : orcamento.prazoDesejado,
      valorTotal: valor,

      comissaoPercent,
      comissaoValor: Number(((valor * comissaoPercent) / 100).toFixed(2)),
      tokenAssinatura: gerarToken(),
      status: "AGENDADA",
      pago: false,
      formaPagamento: "PIX",
      checklist: CHECKLIST_PADRAO.map((descricao, ordemIndex) => ({
        id: gerarId(),
        descricao,
        ordemIndex,
        concluido: false,
      })),
      itens: [],
      fotos: [],
      assinaturas: [],
    })
  );

  await dbOrcamentos.atualizar(orcamentoId, {
    status: "CONVERTIDO",
    clienteId,
    respondidoEm: new Date().toISOString(),
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
