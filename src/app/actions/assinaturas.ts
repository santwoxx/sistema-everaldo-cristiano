"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbOrdens, dbClientes, gerarId, AssinaturaDoc } from "@/lib/firestore";
import { dadosAuditoria } from "@/lib/auth";
import { avaliarConclusao, hashAssinatura, notificar } from "@/lib/negocio";
import { osNumero } from "@/lib/format";
import { dadosDoForm } from "@/lib/formulario";

export type EstadoAssinatura = { erro?: string; sucesso?: string };

const esquema = z.object({
  ordemId: z.string().min(1),
  tipo: z.enum(["MONTADOR", "CLIENTE"]),
  nome: z.string().trim().min(3, "Informe o nome completo de quem assina"),
  documento: z.string().trim().optional(),
  imagem: z
    .string()
    .min(50, "Faça a assinatura no quadro antes de confirmar")
    .refine((v) => v.startsWith("data:image/png"), "Assinatura inválida"),
});

/**
 * Registra a assinatura digital de uma das partes.
 */
export async function assinar(
  _estado: EstadoAssinatura,
  formData: FormData
): Promise<EstadoAssinatura> {
  const dados = esquema.safeParse(dadosDoForm(formData));

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Não foi possível registrar a assinatura." };
  }
  const d = dados.data;

  const ordem = await dbOrdens.buscarPorId(d.ordemId);
  if (!ordem) return { erro: "Ordem de serviço não encontrada." };
  if (ordem.status === "CANCELADA") {
    return { erro: "Esta ordem de serviço está cancelada." };
  }
  if ((ordem.assinaturas || []).some((a) => a.tipo === d.tipo)) {
    return { erro: "Esta parte já assinou o documento." };
  }

  const assinadoEm = new Date().toISOString();
  const { ip, userAgent } = await dadosAuditoria();

  const novaAssinatura: AssinaturaDoc = {
    id: gerarId(),
    tipo: d.tipo,
    nome: d.nome,
    documento: d.documento || null,
    imagem: d.imagem,
    assinadoEm,
    ip,
    userAgent,
    hash: hashAssinatura({
      ordemId: ordem.id,
      numero: ordem.numero,
      tipo: d.tipo,
      nome: d.nome,
      valorTotal: ordem.valorTotal,
      imagem: d.imagem,
      assinadoEm,
    }),
  };

  const assinaturas = [...(ordem.assinaturas || []), novaAssinatura];
  const atualizacoes: Partial<typeof ordem> = { assinaturas };

  // Avaliação opcional deixada pelo cliente no mesmo envio.
  const nota = Number(formData.get("nota") ?? 0);
  if (d.tipo === "CLIENTE" && nota >= 1 && nota <= 5) {
    atualizacoes.avaliacaoNota = nota;
    atualizacoes.avaliacaoComentario = String(formData.get("comentario") ?? "").trim() || null;
  }

  await dbOrdens.atualizar(ordem.id, atualizacoes);

  await notificar({
    tipo: "ASSINATURA",
    titulo: `Assinatura registrada · ${osNumero(ordem.numero)}`,
    mensagem: `${d.tipo === "MONTADOR" ? "O montador" : "O cliente"} ${d.nome} assinou o termo de conclusão de "${ordem.titulo}".`,
    link: `/ordens/${ordem.id}`,
  });

  // Duas assinaturas fecham a OS e disparam o lançamento financeiro.
  await avaliarConclusao(ordem.id);

  revalidatePath("/painel");
  revalidatePath("/ordens");
  revalidatePath(`/ordens/${ordem.id}`);
  revalidatePath("/montador");
  revalidatePath(`/montador/${ordem.id}`);
  revalidatePath(`/assinar/${ordem.tokenAssinatura}`);

  return { sucesso: "Assinatura registrada com sucesso." };
}

/** Avaliação opcional deixada pelo cliente logo após assinar. */
export async function avaliarServico(formData: FormData) {
  const ordemId = String(formData.get("ordemId") ?? "");
  const nota = Number(formData.get("nota") ?? 0);
  if (!ordemId || nota < 1 || nota > 5) return;

  await dbOrdens.atualizar(ordemId, {
    avaliacaoNota: nota,
    avaliacaoComentario: String(formData.get("comentario") ?? "").trim() || null,
  });

  revalidatePath(`/ordens/${ordemId}`);
}

/**
 * Anula uma assinatura (apenas o admin, para corrigir um registro equivocado).
 */
export async function anularAssinatura(formData: FormData) {
  const { exigirAdmin } = await import("@/lib/auth");
  await exigirAdmin();

  const id = String(formData.get("id") ?? "");
  const ordemId = String(formData.get("ordemId") ?? "");
  if (!id || !ordemId) return;

  const ordem = await dbOrdens.buscarPorId(ordemId);
  if (!ordem) return;

  const assinaturas = (ordem.assinaturas || []).filter((a) => a.id !== id);
  await dbOrdens.atualizar(ordemId, {
    assinaturas,
    status: "AGARDANDO_ASSINATURA" as any,
    dataConclusao: null,
  });

  await avaliarConclusao(ordemId);

  revalidatePath("/painel");
  revalidatePath("/ordens");
  revalidatePath(`/ordens/${ordemId}`);
}
