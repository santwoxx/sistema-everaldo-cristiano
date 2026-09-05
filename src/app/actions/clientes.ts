"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbClientes, dbOrdens } from "@/lib/firestore";
import { exigirAdmin } from "@/lib/auth";

export type EstadoForm = { erro?: string; sucesso?: string };

const esquema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do cliente"),
  telefone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  documento: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  numero: z.string().trim().optional(),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  estado: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

function limpar(formData: FormData) {
  const obj = Object.fromEntries(formData.entries()) as Record<string, string>;
  const dados = esquema.safeParse(obj);
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos" };

  const d = dados.data;
  const vazioParaNulo = (v?: string) => (v && v.length > 0 ? v : null);

  return {
    dados: {
      nome: d.nome,
      telefone: vazioParaNulo(d.telefone),
      email: vazioParaNulo(d.email),
      documento: vazioParaNulo(d.documento),
      cep: vazioParaNulo(d.cep),
      endereco: vazioParaNulo(d.endereco),
      numero: vazioParaNulo(d.numero),
      complemento: vazioParaNulo(d.complemento),
      bairro: vazioParaNulo(d.bairro),
      cidade: vazioParaNulo(d.cidade),
      estado: vazioParaNulo(d.estado),
      observacoes: vazioParaNulo(d.observacoes),
    },
  };
}

export async function salvarCliente(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const resultado = limpar(formData);
  if ("erro" in resultado) return { erro: resultado.erro };

  if (id) {
    await dbClientes.atualizar(id, resultado.dados);
  } else {
    await dbClientes.criar(resultado.dados);
  }

  revalidatePath("/clientes");
  revalidatePath("/ordens");
  return { sucesso: id ? "Cliente atualizado." : "Cliente cadastrado." };
}

export async function excluirCliente(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await dbClientes.excluir(id);
  revalidatePath("/clientes");
  revalidatePath("/ordens");
  revalidatePath("/painel");
}
