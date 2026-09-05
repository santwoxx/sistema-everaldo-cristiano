"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { SlotDiaDisponivel } from "@/lib/agenda";

export function AgendaCliente({
  diasDisponiveis,
}: {
  diasDisponiveis: SlotDiaDisponivel[];
}) {
  // Mapa de datas disponíveis para consulta rápida O(1)
  const mapaDias = useMemo(() => {
    const mapa = new Map<string, SlotDiaDisponivel>();
    diasDisponiveis.forEach((d) => mapa.set(d.dataIso, d));
    return mapa;
  }, [diasDisponiveis]);

  // Primeiro dia disponível como sugestão inicial
  const primeiroDisponivel = diasDisponiveis[0];

  const [dataSelecionada, setDataSelecionada] = useState<string | null>(
    primeiroDisponivel?.dataIso ?? null
  );
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(
    primeiroDisponivel?.horarios[0] ?? null
  );

  // Mês e ano em exibição no calendário
  const [anoMes, setAnoMes] = useState<{ ano: number; mes: number }>(() => {
    if (primeiroDisponivel) {
      return { ano: primeiroDisponivel.ano, mes: primeiroDisponivel.mes };
    }
    const d = new Date();
    return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
  });

  // Dia atualmente selecionado
  const slotAtual = dataSelecionada ? mapaDias.get(dataSelecionada) : null;

  // Dias do mês em exibição
  const diasDoMes = useMemo(() => {
    const { ano, mes } = anoMes;
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);

    const diaSemanaInicio = primeiroDia.getDay(); // 0=Dom ... 6=Sáb
    const totalDias = ultimoDia.getDate();

    const dias: {
      dia: number;
      dataIso: string;
      disponivel: boolean;
      foraDoMes?: boolean;
    }[] = [];

    // Espaços vazios do início da semana
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ dia: 0, dataIso: `vazio-${i}`, disponivel: false, foraDoMes: true });
    }

    // Dias reais do mês
    for (let d = 1; d <= totalDias; d++) {
      const dataIso = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const disp = mapaDias.has(dataIso);
      dias.push({ dia: d, dataIso, disponivel: disp });
    }

    return dias;
  }, [anoMes, mapaDias]);

  const nomeMesAno = useMemo(() => {
    const d = new Date(anoMes.ano, anoMes.mes - 1, 1);
    const m = d.toLocaleDateString("pt-BR", { month: "long" });
    return `${m.charAt(0).toUpperCase() + m.slice(1)} de ${anoMes.ano}`;
  }, [anoMes]);

  function mudarMes(delta: number) {
    setAnoMes((atual) => {
      let novoMes = atual.mes + delta;
      let novoAno = atual.ano;
      if (novoMes > 12) {
        novoMes = 1;
        novoAno++;
      } else if (novoMes < 1) {
        novoMes = 12;
        novoAno--;
      }
      return { ano: novoAno, mes: novoMes };
    });
  }

  function handleSelecionarDia(dataIso: string) {
    setDataSelecionada(dataIso);
    const slot = mapaDias.get(dataIso);
    if (slot && slot.horarios.length > 0) {
      // Mantém o mesmo horário se existir no dia, senão escolhe o primeiro
      if (!horarioSelecionado || !slot.horarios.includes(horarioSelecionado)) {
        setHorarioSelecionado(slot.horarios[0]);
      }
    } else {
      setHorarioSelecionado(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs para envio no formulário */}
      <input type="hidden" name="prazoDesejado" value={dataSelecionada ?? ""} required />
      <input type="hidden" name="horarioDesejado" value={horarioSelecionado ?? ""} required />

      {/* Caixa da Agenda / Calendário */}
      <div className="overflow-hidden rounded-2xl border-2 border-black bg-white shadow-sm">
        {/* Topo do Calendário */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-900 px-4 py-3 text-white">
          <span className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <CalendarIcon size={16} className="text-emerald-400" />
            {nomeMesAno}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => mudarMes(-1)}
              className="rounded-lg p-1 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => mudarMes(1)}
              className="rounded-lg p-1 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Grade do Calendário */}
        <div className="p-3.5 sm:p-4">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {diasDoMes.map((item, idx) => {
              if (item.foraDoMes) {
                return <div key={idx} className="h-10 sm:h-11" />;
              }

              const selecionado = item.dataIso === dataSelecionada;
              const disponivel = item.disponivel;

              return (
                <button
                  key={item.dataIso}
                  type="button"
                  disabled={!disponivel}
                  onClick={() => handleSelecionarDia(item.dataIso)}
                  className={`group relative flex h-10 sm:h-11 flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    selecionado
                      ? "border-2 border-black bg-slate-900 text-white shadow-md scale-105 ring-2 ring-emerald-400"
                      : disponivel
                      ? "border border-emerald-300 bg-emerald-50/70 text-slate-900 hover:border-emerald-600 hover:bg-emerald-100/80 active:scale-95"
                      : "cursor-not-allowed text-slate-300"
                  }`}
                >
                  <span>{item.dia}</span>
                  {disponivel && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selecionado ? "bg-emerald-400" : "bg-emerald-600"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="mt-3 flex items-center justify-center gap-4 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Dias disponíveis
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Dia selecionado
            </span>
          </div>
        </div>

        {/* Seletor de Horários */}
        {slotAtual && (
          <div className="border-t-2 border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Clock size={14} className="text-emerald-700" />
                Horários disponíveis para:{" "}
                <span className="text-emerald-800 underline underline-offset-2">
                  {slotAtual.formatadoCurto}
                </span>
              </span>
              <span className="text-[11px] text-slate-500">
                Selecione um horário
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slotAtual.horarios.map((h) => {
                const ativo = h === horarioSelecionado;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorarioSelecionado(h)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 px-3 font-mono text-xs font-bold transition-all ${
                      ativo
                        ? "border-black bg-emerald-600 text-white shadow-sm ring-1 ring-black"
                        : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-100 active:scale-95"
                    }`}
                  >
                    {ativo && <Check size={13} className="stroke-[3]" />}
                    <span>{h}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cartão de Confirmação do Horário */}
      {slotAtual && horarioSelecionado ? (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-600 bg-emerald-50/90 p-3.5 shadow-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Check size={20} className="stroke-[3]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Horário selecionado para seu atendimento
            </p>
            <p className="text-sm font-bold text-slate-900">
              {slotAtual.formatadoLongo} às{" "}
              <span className="font-mono text-emerald-800 font-extrabold">
                {horarioSelecionado}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/80 p-3 text-center text-xs font-semibold text-amber-900">
          👉 Selecione um dia e horário disponíveis acima para a montagem.
        </div>
      )}
    </div>
  );
}
