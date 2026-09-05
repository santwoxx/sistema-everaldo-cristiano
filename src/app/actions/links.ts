"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";
import { gerarToken } from "@/lib/negocio";
import type { EstadoForm } from "@/app/actions/clientes";

export async function criarLink(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const sessao = await exigirAdmin();

  const titulo = String(formData.get("titulo") ?? "").trim() || "Solicitação de Orçamento";
  const mensagem = String(formData.get("mensagem") ?? "").trim() || null;
  const validade = String(formData.get("validadeDias") ?? "").trim();

  const expiraEm =
    validade && Number(validade) > 0
      ? new Date(Date.now() + Number(validade) * 86_400_000)
      : null;

  await prisma.linkPublico.create({
    data: {
      token: gerarToken(12),
      titulo,
      mensagem,
      expiraEm,
      criadoPorId: sessao.id,
    },
  });

  revalidatePath("/links");
  return { sucesso: "Link gerado. Copie e envie ao cliente." };
}

export async function alternarLink(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const link = await prisma.linkPublico.findUnique({ where: { id } });
  if (!link) return;

  await prisma.linkPublico.update({ where: { id }, data: { ativo: !link.ativo } });
  revalidatePath("/links");
}

export async function excluirLink(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.linkPublico.delete({ where: { id } });
  revalidatePath("/links");
}
