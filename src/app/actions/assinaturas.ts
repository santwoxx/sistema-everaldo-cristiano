"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
 *
 * Cada assinatura guarda: nome, documento, traço (PNG), data/hora, IP,
 * navegador e um hash SHA-256 do conteúdo — a trilha que comprova
 * o aceite caso o serviço seja questionado depois.
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

  const ordem = await prisma.ordemServico.findUnique({
    where: { id: d.ordemId },
    include: { cliente: true, assinaturas: true },
  });
  if (!ordem) return { erro: "Ordem de serviço não encontrada." };
  if (ordem.status === "CANCELADA") {
    return { erro: "Esta ordem de serviço está cancelada." };
  }
  if (ordem.assinaturas.some((a) => a.tipo === d.tipo)) {
    return { erro: "Esta parte já assinou o documento." };
  }

  const assinadoEm = new Date();
  const { ip, userAgent } = await dadosAuditoria();

  await prisma.assinatura.create({
    data: {
      ordemId: ordem.id,
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
    },
  });

  // Avaliação opcional deixada pelo cliente no mesmo envio.
  const nota = Number(formData.get("nota") ?? 0);
  if (d.tipo === "CLIENTE" && nota >= 1 && nota <= 5) {
    await prisma.ordemServico.update({
      where: { id: ordem.id },
      data: {
        avaliacaoNota: nota,
        avaliacaoComentario: String(formData.get("comentario") ?? "").trim() || null,
      },
    });
  }

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

  await prisma.ordemServico.update({
    where: { id: ordemId },
    data: {
      avaliacaoNota: nota,
      avaliacaoComentario: String(formData.get("comentario") ?? "").trim() || null,
    },
  });

  revalidatePath(`/ordens/${ordemId}`);
}

/**
 * Anula uma assinatura (apenas o admin, para corrigir um registro equivocado).
 * A OS volta para AGUARDANDO_ASSINATURA e o financeiro é recalculado.
 */
export async function anularAssinatura(formData: FormData) {
  const { exigirAdmin } = await import("@/lib/auth");
  await exigirAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const assinatura = await prisma.assinatura.delete({ where: { id } });
  await prisma.ordemServico.update({
    where: { id: assinatura.ordemId },
    data: { status: "AGUARDANDO_ASSINATURA", dataConclusao: null },
  });
  await avaliarConclusao(assinatura.ordemId);

  revalidatePath("/painel");
  revalidatePath("/ordens");
  revalidatePath(`/ordens/${assinatura.ordemId}`);
}
