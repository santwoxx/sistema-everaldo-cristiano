"use server";

import { revalidatePath } from "next/cache";
import { dbNotificacoes } from "@/lib/firestore";
import { exigirAdmin } from "@/lib/auth";

export async function marcarTodasLidas() {
  await exigirAdmin();
  await dbNotificacoes.marcarTodasComoLidas();
  revalidatePath("/", "layout");
}

export async function marcarLida(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await dbNotificacoes.marcarComoLida(id);
  revalidatePath("/", "layout");
}
