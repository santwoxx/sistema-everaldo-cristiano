"use server";

import { revalidatePath } from "next/cache";
import { dbLinks } from "@/lib/firestore";
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
      ? new Date(Date.now() + Number(validade) * 86_400_000).toISOString()
      : null;

  await dbLinks.criar({
    token: gerarToken(12),
    titulo,
    mensagem,
    expiraEm,
    ativo: true,
    acessos: 0,
    envios: 0,
    criadoPorId: sessao.id,
  });

  revalidatePath("/links");
  return { sucesso: "Link gerado. Copie e envie ao cliente." };
}

export async function alternarLink(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const link = await dbLinks.buscarPorId(id);
  if (!link) return;

  await dbLinks.atualizar(id, { ativo: !link.ativo });
  revalidatePath("/links");
}

export async function excluirLink(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await dbLinks.excluir(id);
  revalidatePath("/links");
}
