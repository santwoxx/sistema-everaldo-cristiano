"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";
import { comNumeroSequencial, notificar } from "@/lib/negocio";
import { dadosDoForm, texto, textoOuNulo } from "@/lib/formulario";
import { paraNumero, orcNumero } from "@/lib/format";
import { TIPOS_SERVICO } from "@/lib/constants";
import type { EstadoForm } from "@/app/actions/clientes";

/* -------------------------------------------------------------------------- */
/* Envio público (cliente, sem login)                                         */
/* -------------------------------------------------------------------------- */

const esquemaPublico = z.object({
  nomeContato: z.string().trim().min(3, "Informe seu nome completo"),
  telefone: z
    .string()
    .trim()
    .min(10, "Informe um telefone com DDD")
    .max(20, "Telefone inválido"),
  email: z.string().trim().optional(),
  documento: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  estado: z.string().trim().optional(),
  tipoServico: z.string().trim().min(1, "Escolha o tipo de serviço"),
  descricao: z
    .string()
    .trim()
    .min(10, "Descreva o serviço com pelo menos 10 caracteres"),
  quantidadeItens: z.coerce.number().min(1).max(999).default(1),
  prazoDesejado: z.string().trim().optional(),
});

export type EstadoOrcamento = { erro?: string; protocolo?: string };

export async function enviarOrcamentoPublico(
  _estado: EstadoOrcamento,
  formData: FormData
): Promise<EstadoOrcamento> {
  const token = String(formData.get("token") ?? "");

  const link = await prisma.linkPublico.findUnique({ where: { token } });
  if (!link || !link.ativo) {
    return { erro: "Este link não está mais disponível. Solicite um novo à EC Montagens." };
  }
  if (link.expiraEm && link.expiraEm < new Date()) {
    return { erro: "Este link expirou. Solicite um novo à EC Montagens." };
  }

  // dadosDoForm() omite os campos que o formulário não enviou — campos
  // opcionais ausentes chegam como `undefined`, e não como `null`.
  const bruto = dadosDoForm(formData);
  const dados = esquemaPublico.safeParse({
    ...bruto,
    quantidadeItens: bruto.quantidadeItens || 1,
  });

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Revise os dados do formulário." };
  }
  const d = dados.data;

  const orcamento = await comNumeroSequencial("orcamento", (numero) =>
    prisma.orcamento.create({
    data: {
      numero,
      nomeContato: d.nomeContato,
      telefone: d.telefone,
      email: d.email || null,
      documento: d.documento || null,
      cep: d.cep || null,
      endereco: d.endereco || null,
      cidade: d.cidade || null,
      estado: d.estado || null,
      tipoServico: d.tipoServico,
      descricao: d.descricao,
      quantidadeItens: d.quantidadeItens,
      prazoDesejado: d.prazoDesejado ? new Date(`${d.prazoDesejado}T12:00:00`) : null,
      linkId: link.id,
      status: "NOVO",
    },
    })
  );

  await prisma.linkPublico.update({
    where: { id: link.id },
    data: { envios: { increment: 1 } },
  });

  await notificar({
    tipo: "ORCAMENTO",
    titulo: `Novo orçamento de ${d.nomeContato}`,
    mensagem: `${TIPOS_SERVICO[d.tipoServico as keyof typeof TIPOS_SERVICO] ?? d.tipoServico} · ${d.quantidadeItens} item(ns) · ${d.telefone}`,
    link: `/orcamentos/${orcamento.id}`,
  });

  revalidatePath("/orcamentos");
  revalidatePath("/painel");

  return { protocolo: orcNumero(orcamento.numero) };
}

/* -------------------------------------------------------------------------- */
/* Gestão no painel administrativo                                            */
/* -------------------------------------------------------------------------- */

export async function atualizarOrcamento(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Orçamento não encontrado." };

  const status = texto(formData, "status") || "NOVO";
  const valorBruto = texto(formData, "valorProposto");

  await prisma.orcamento.update({
    where: { id },
    data: {
      status,
      valorProposto: valorBruto ? paraNumero(valorBruto) : null,
      observacoesInternas: textoOuNulo(formData, "observacoesInternas"),
      respondidoEm: status === "NOVO" ? null : new Date(),
    },
  });

  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/painel");
  return { sucesso: "Orçamento atualizado." };
}

export async function marcarEmAnalise(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.orcamento.update({
    where: { id },
    data: { status: "EM_ANALISE", respondidoEm: new Date() },
  });
  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
}

export async function excluirOrcamento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const orcamento = await prisma.orcamento.findUnique({
    where: { id },
    include: { ordem: true },
  });
  if (orcamento?.ordem) {
    throw new Error("Este orçamento já virou ordem de serviço e não pode ser excluído.");
  }

  await prisma.orcamento.delete({ where: { id } });
  revalidatePath("/orcamentos");
  revalidatePath("/painel");
}
