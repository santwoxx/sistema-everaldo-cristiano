"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

export async function marcarTodasLidas() {
  await exigirAdmin();
  await prisma.notificacao.updateMany({
    where: { lida: false },
    data: { lida: true },
  });
  revalidatePath("/", "layout");
}

export async function marcarLida(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.notificacao.update({ where: { id }, data: { lida: true } });
  revalidatePath("/", "layout");
}
