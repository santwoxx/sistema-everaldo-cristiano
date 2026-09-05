import { dbConfig } from "@/lib/firestore";

export interface AgendaConfig {
  diasSemana: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  horarios: string[]; // ["08:30", "10:30", "13:30", "15:30", "17:00"]
  diasAdiantados: number; // quantos dias à frente mostrar no calendário (padrão 30)
  diasAntecedenciaMinima: number; // antecedência mínima para agendar (padrão 1 dia)
  datasBloqueadas: string[]; // datas em formato YYYY-MM-DD bloqueadas
}

export const AGENDA_PADRAO: AgendaConfig = {
  diasSemana: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  horarios: ["08:30", "10:30", "13:30", "15:30", "17:00"],
  diasAdiantados: 30,
  diasAntecedenciaMinima: 1,
  datasBloqueadas: [],
};

export const DIAS_SEMANA_NOMES = [
  { id: 0, nome: "Domingo", sigla: "Dom" },
  { id: 1, nome: "Segunda-feira", sigla: "Seg" },
  { id: 2, nome: "Terça-feira", sigla: "Ter" },
  { id: 3, nome: "Quarta-feira", sigla: "Qua" },
  { id: 4, nome: "Quinta-feira", sigla: "Qui" },
  { id: 5, nome: "Sexta-feira", sigla: "Sex" },
  { id: 6, nome: "Sábado", sigla: "Sáb" },
];

export async function obterAgendaConfig(): Promise<AgendaConfig> {
  try {
    const raw = await dbConfig.obter("agenda_padrao");
    if (!raw) return AGENDA_PADRAO;
    const parsed = JSON.parse(raw);
    return {
      diasSemana: Array.isArray(parsed.diasSemana) ? parsed.diasSemana : AGENDA_PADRAO.diasSemana,
      horarios:
        Array.isArray(parsed.horarios) && parsed.horarios.length > 0
          ? parsed.horarios
          : AGENDA_PADRAO.horarios,
      diasAdiantados:
        typeof parsed.diasAdiantados === "number"
          ? parsed.diasAdiantados
          : AGENDA_PADRAO.diasAdiantados,
      diasAntecedenciaMinima:
        typeof parsed.diasAntecedenciaMinima === "number"
          ? parsed.diasAntecedenciaMinima
          : AGENDA_PADRAO.diasAntecedenciaMinima,
      datasBloqueadas: Array.isArray(parsed.datasBloqueadas) ? parsed.datasBloqueadas : [],
    };
  } catch {
    return AGENDA_PADRAO;
  }
}

export async function salvarAgendaConfig(config: AgendaConfig): Promise<void> {
  await dbConfig.definir("agenda_padrao", JSON.stringify(config));
}

export type SlotDiaDisponivel = {
  dataIso: string; // "YYYY-MM-DD"
  dia: number;
  mes: number;
  ano: number;
  diaSemana: number;
  diaSemanaNome: string;
  diaSemanaSigla: string;
  formatadoCurto: string; // "Seg, 08/09"
  formatadoLongo: string; // "Segunda-feira, 8 de setembro"
  horarios: string[];
};

export function gerarDiasDisponiveis(config: AgendaConfig): SlotDiaDisponivel[] {
  const lista: SlotDiaDisponivel[] = [];
  const hoje = new Date();

  // Início baseado na antecedência mínima
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() + (config.diasAntecedenciaMinima ?? 1));
  inicio.setHours(0, 0, 0, 0);

  const totalDias = config.diasAdiantados || 30;

  for (let i = 0; i < totalDias; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);

    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const dia = d.getDate();
    const diaSemana = d.getDay();

    const dataIso = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    // Verifica se a data foi bloqueada manualmente
    if (config.datasBloqueadas?.includes(dataIso)) {
      continue;
    }

    // Verifica se o dia da semana está ativo
    if (!config.diasSemana.includes(diaSemana)) {
      continue;
    }

    const infoSemana = DIAS_SEMANA_NOMES.find((s) => s.id === diaSemana) ?? {
      nome: "",
      sigla: "",
    };

    const mesFormatado = d.toLocaleDateString("pt-BR", { month: "long" });

    lista.push({
      dataIso,
      dia,
      mes,
      ano,
      diaSemana,
      diaSemanaNome: infoSemana.nome,
      diaSemanaSigla: infoSemana.sigla,
      formatadoCurto: `${infoSemana.sigla}, ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`,
      formatadoLongo: `${infoSemana.nome}, ${dia} de ${mesFormatado}`,
      horarios: config.horarios || AGENDA_PADRAO.horarios,
    });
  }

  return lista;
}
