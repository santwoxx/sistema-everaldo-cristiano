"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbUsuarios } from "@/lib/firestore";
import { exigirAdmin, hashSenha } from "@/lib/auth";
import { dadosDoForm, marcado } from "@/lib/formulario";
import type { EstadoForm } from "@/app/actions/clientes";

const PALETA = [
  "#16a34a", "#0891b2", "#7c3aed", "#db2777", "#ea580c",
  "#ca8a04", "#0f766e", "#4f46e5",
];

const esquema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo"),
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  papel: z.enum(["ADMIN", "MONTADOR"]),
  telefone: z.string().trim().optional(),
  documento: z.string().trim().optional(),
  comissaoPadrao: z.coerce.number().min(0, "Mínimo 0%").max(100, "Máximo 100%"),
  ativo: z.coerce.boolean().optional(),
});

export async function salvarUsuario(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  await exigirAdmin();

  const id = String(formData.get("id") ?? "");
  const senha = String(formData.get("senha") ?? "").trim();

  const bruto = dadosDoForm(formData);
  const dados = esquema.safeParse({
    ...bruto,
    comissaoPadrao: bruto.comissaoPadrao || 0,
    ativo: marcado(formData, "ativo"),
  });

  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos" };
  const d = dados.data;
  const email = d.email.toLowerCase();

  if (!id && senha.length < 6) {
    return { erro: "Defina uma senha com pelo menos 6 caracteres." };
  }
  if (id && senha && senha.length < 6) {
    return { erro: "A nova senha precisa ter pelo menos 6 caracteres." };
  }

  const usuarioExistente = await dbUsuarios.buscarPorEmail(email);
  if (usuarioExistente && usuarioExistente.id !== id) {
    return { erro: "Já existe um usuário com esse e-mail." };
  }

  const base = {
    nome: d.nome,
    email,
    papel: d.papel,
    telefone: d.telefone || null,
    documento: d.documento || null,
    comissaoPadrao: d.comissaoPadrao,
    ativo: d.ativo ?? true,
  };

  if (id) {
    await dbUsuarios.atualizar(id, {
      ...base,
      ...(senha ? { senhaHash: await hashSenha(senha) } : {}),
    });
  } else {
    const todos = await dbUsuarios.listar();
    await dbUsuarios.criar({
      ...base,
      senhaHash: await hashSenha(senha),
      corAvatar: PALETA[todos.length % PALETA.length],
    });
  }

  revalidatePath("/equipe");
  revalidatePath("/ordens");
  return { sucesso: id ? "Dados atualizados." : "Acesso criado com sucesso." };
}

export async function alternarAtivo(formData: FormData) {
  const sessao = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || id === sessao.id) return;

  const usuario = await dbUsuarios.buscarPorId(id);
  if (!usuario) return;

  await dbUsuarios.atualizar(id, { ativo: !usuario.ativo });
  revalidatePath("/equipe");
}

export async function excluirUsuario(formData: FormData) {
  const sessao = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  if (id === sessao.id) {
    throw new Error("Você não pode excluir o próprio acesso.");
  }

  const todos = await dbUsuarios.listar();
  const admins = todos.filter((u) => u.papel === "ADMIN" && u.ativo).length;
  const alvo = await dbUsuarios.buscarPorId(id);
  if (alvo?.papel === "ADMIN" && admins <= 1) {
    throw new Error("O sistema precisa de pelo menos um administrador ativo.");
  }

  await dbUsuarios.excluir(id);
  revalidatePath("/equipe");
}
