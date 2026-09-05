"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { autenticar, criarSessao, encerrarSessao } from "@/lib/auth";
import type { Papel } from "@/lib/constants";

const esquema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export type EstadoLogin = { erro?: string };

export async function entrar(
  _estado: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const dados = esquema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const usuario = await autenticar(dados.data.email, dados.data.senha);
  if (!usuario) {
    return { erro: "E-mail ou senha incorretos. Verifique e tente novamente." };
  }

  await criarSessao({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel as Papel,
    corAvatar: usuario.corAvatar,
    foto: usuario.foto ?? null,
  });

  redirect(usuario.papel === "ADMIN" ? "/painel" : "/montador");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
