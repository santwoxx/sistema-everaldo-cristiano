"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import { salvarAgendaConfig, type AgendaConfig } from "@/lib/agenda";
import type { EstadoForm } from "@/app/actions/clientes";

export async function salvarAgendaAction(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  await exigirAdmin();

  const diasSemanaRaw = formData.getAll("diasSemana");
  const diasSemana = diasSemanaRaw.map((v) => Number(v)).filter((v) => !isNaN(v) && v >= 0 && v <= 6);

  if (diasSemana.length === 0) {
    return { erro: "Selecione pelo menos um dia da semana para atendimento." };
  }

  const horariosRaw = String(formData.get("horarios") ?? "").trim();
  const horarios = horariosRaw
    .split(",")
    .map((h) => h.trim())
    .filter((h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h))
    .sort();

  if (horarios.length === 0) {
    return { erro: "Informe pelo menos um horário disponível (ex.: 08:30)." };
  }

  const diasAdiantados = Math.max(7, Math.min(90, Number(formData.get("diasAdiantados")) || 30));
  const diasAntecedenciaMinima = Math.max(0, Math.min(7, Number(formData.get("diasAntecedenciaMinima")) || 1));

  const config: AgendaConfig = {
    diasSemana,
    horarios,
    diasAdiantados,
    diasAntecedenciaMinima,
    datasBloqueadas: [],
  };

  await salvarAgendaConfig(config);

  revalidatePath("/links");
  revalidatePath("/orcamento", "layout");
  return { sucesso: "Agenda de atendimento atualizada com sucesso!" };
}
