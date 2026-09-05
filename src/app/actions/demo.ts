"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { encerrarSessao, exigirAdmin } from "@/lib/auth";
import { limparBase, semear } from "@/lib/semear";

/**
 * Reinicia a base com o cenário de demonstração.
 * Apaga TUDO — inclusive as sessões atuais, por isso encerra o login ao final.
 */
export async function restaurarDemonstracao() {
  await exigirAdmin();

  await limparBase();
  await semear({ comDemo: true });

  revalidatePath("/", "layout");
  await encerrarSessao();
  redirect("/login?restaurado=1");
}

/**
 * Zera a base mantendo apenas o administrador — o ponto de partida
 * recomendado quando a empresa for começar a usar o sistema de verdade.
 */
export async function limparParaProducao() {
  await exigirAdmin();

  await limparBase();
  await semear({ comDemo: false });

  revalidatePath("/", "layout");
  await encerrarSessao();
  redirect("/login?limpo=1");
}
