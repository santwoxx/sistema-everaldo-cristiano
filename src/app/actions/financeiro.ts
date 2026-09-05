"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbLancamentos, dbOrdens } from "@/lib/firestore";
import { exigirAdmin } from "@/lib/auth";
import { paraNumero } from "@/lib/format";
import { dadosDoForm } from "@/lib/formulario";
import type { EstadoForm } from "@/app/actions/clientes";

const esquema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoria: z.string().trim().min(1, "Escolha a categoria"),
  descricao: z.string().trim().min(2, "Descreva o lançamento"),
  data: z.string().trim().min(1, "Informe a data"),
  status: z.enum(["PENDENTE", "CONFIRMADO", "CANCELADO"]),
  formaPagamento: z.string().trim().default("PIX"),
  montadorId: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

export async function salvarLancamento(
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

  const valor = paraNumero(formData.get("valor"));
  if (valor <= 0) return { erro: "Informe um valor maior que zero." };

  const d = dados.data;
  const base = {
    tipo: d.tipo,
    categoria: d.categoria,
    descricao: d.descricao,
    valor,
    data: new Date(`${d.data}T12:00:00`).toISOString(),
    status: d.status,
    formaPagamento: d.formaPagamento,
    montadorId: d.montadorId || null,
    observacoes: d.observacoes || null,
    automatico: false,
  };

  if (id) {
    const atual = await dbLancamentos.buscarPorId(id);
    if (atual?.automatico) {
      return {
        erro: "Este lançamento é gerado automaticamente pela OS. Edite a ordem de serviço.",
      };
    }
    await dbLancamentos.atualizar(id, base);
  } else {
    await dbLancamentos.criar(base);
  }

  revalidatePath("/painel");
  return { sucesso: id ? "Lançamento atualizado." : "Lançamento registrado." };
}

export async function alternarStatusLancamento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const atual = await dbLancamentos.buscarPorId(id);
  if (!atual) return;

  const novo = atual.status === "CONFIRMADO" ? "PENDENTE" : "CONFIRMADO";

  // Receita automática espelha o campo "pago" da OS — mantém os dois em sincronia.
  if (atual.automatico && atual.ordemId && atual.tipo === "RECEITA") {
    await dbOrdens.atualizar(atual.ordemId, { pago: novo === "CONFIRMADO" });
    revalidatePath(`/ordens/${atual.ordemId}`);
  }

  await dbLancamentos.atualizar(id, { status: novo });
  revalidatePath("/painel");
  revalidatePath("/ordens");
}

export async function excluirLancamento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const atual = await dbLancamentos.buscarPorId(id);
  if (atual?.automatico) {
    throw new Error(
      "Lançamento gerado pela ordem de serviço. Cancele ou exclua a OS correspondente."
    );
  }

  await dbLancamentos.excluir(id);
  revalidatePath("/painel");
}
