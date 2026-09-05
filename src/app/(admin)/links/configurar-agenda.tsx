"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Plus, Save, Sparkles, X } from "lucide-react";
import { Aviso, BotaoEnviar, Modal } from "@/components/form";
import { salvarAgendaAction } from "@/app/actions/agenda";
import { DIAS_SEMANA_NOMES, type AgendaConfig } from "@/lib/agenda";
import type { EstadoForm } from "@/app/actions/clientes";

export function ConfigurarAgenda({ config }: { config: AgendaConfig }) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const [diasSemana, setDiasSemana] = useState<number[]>(config.diasSemana);
  const [horarios, setHorarios] = useState<string[]>(config.horarios);
  const [novoHorario, setNovoHorario] = useState("09:00");
  const [diasAdiantados, setDiasAdiantados] = useState(config.diasAdiantados || 30);
  const [diasAntecedencia, setDiasAntecedencia] = useState(config.diasAntecedenciaMinima ?? 1);

  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarAgendaAction, {});

  useEffect(() => {
    if (estado.sucesso) {
      const t = setTimeout(() => {
        setAberto(false);
        router.refresh();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [estado.sucesso, router]);

  function alternarDia(id: number) {
    setDiasSemana((atuais) =>
      atuais.includes(id) ? atuais.filter((d) => d !== id) : [...atuais, id].sort()
    );
  }

  function adicionarHorario() {
    if (!novoHorario) return;
    if (!horarios.includes(novoHorario)) {
      setHorarios([...horarios, novoHorario].sort());
    }
  }

  function removerHorario(h: string) {
    setHorarios(horarios.filter((item) => item !== h));
  }

  function aplicarPreset(lista: string[]) {
    setHorarios(lista);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn btn-principal border-2 border-black shadow-sm"
      >
        <Calendar size={16} /> Configurar Agenda & Horários
      </button>

      <Modal
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Agenda de Atendimentos Disponíveis"
        descricao="Defina os dias da semana e horários em que os clientes podem agendar serviços pelo link de orçamento."
        largura="max-w-xl"
        icone={<Calendar size={20} />}
      >
        <form action={acao} className="space-y-5">
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

          {/* Hidden inputs para sincronização */}
          {diasSemana.map((d) => (
            <input key={d} type="hidden" name="diasSemana" value={d} />
          ))}
          <input type="hidden" name="horarios" value={horarios.join(",")} />
          <input type="hidden" name="diasAdiantados" value={diasAdiantados} />
          <input type="hidden" name="diasAntecedenciaMinima" value={diasAntecedencia} />

          {/* 1. Dias de Atendimento */}
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50/70 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
              1. Dias de atendimento da semana
            </label>
            <p className="mt-0.5 text-xs text-slate-600">
              Selecione os dias em que a sua equipe faz montagens.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIAS_SEMANA_NOMES.map((d) => {
                const ativo = diasSemana.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => alternarDia(d.id)}
                    className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                      ativo
                        ? "border-black bg-slate-900 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <span>{d.nome}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        ativo ? "bg-emerald-400" : "bg-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Horários de Atendimento */}
          <div className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
              2. Horários disponíveis para escolha do cliente
            </label>
            <p className="mt-0.5 text-xs text-slate-600">
              O cliente verá estes horários para clicar e escolher ao preencher o link.
            </p>

            {/* Presets Rápidos */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Sparkles size={13} className="text-amber-500" /> Sugestões rápidas:
              </span>
              <button
                type="button"
                onClick={() =>
                  aplicarPreset(["08:30", "10:30", "13:30", "15:30", "17:00"])
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                Comercial (5 horários)
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset(["08:00", "13:30"])}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                Manhã & Tarde (2 turnos)
              </button>
              <button
                type="button"
                onClick={() =>
                  aplicarPreset(["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"])
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                De 2 em 2 horas
              </button>
            </div>

            {/* Lista Atual de Horários */}
            <div className="mt-3.5 flex flex-wrap gap-2">
              {horarios.length === 0 ? (
                <p className="text-xs text-amber-700 font-medium">
                  Nenhum horário cadastrado. Adicione pelo menos um horário abaixo.
                </p>
              ) : (
                horarios.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-emerald-50 px-3 py-1.5 font-mono text-xs font-bold text-slate-900 shadow-sm"
                  >
                    <Clock size={13} className="text-emerald-700" />
                    {h}
                    <button
                      type="button"
                      onClick={() => removerHorario(h)}
                      className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-700"
                      title={`Remover ${h}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Adicionar Novo Horário */}
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-200">
              <input
                type="time"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                className="rounded-xl border-2 border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-900 focus:border-black focus:outline-none"
              />
              <button
                type="button"
                onClick={adicionarHorario}
                className="btn btn-claro !py-1.5 !px-3 font-semibold text-xs border-2 border-slate-300"
              >
                <Plus size={14} /> Adicionar este horário
              </button>
            </div>
          </div>

          {/* 3. Regras de Antecedência */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="block text-xs font-bold text-slate-900">
                Antecedência mínima
              </label>
              <select
                value={diasAntecedencia}
                onChange={(e) => setDiasAntecedencia(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value={0}>Permitir agendar para o mesmo dia (hoje)</option>
                <option value={1}>Mínimo 1 dia antes (a partir de amanhã)</option>
                <option value={2}>Mínimo 2 dias de antecedência</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="block text-xs font-bold text-slate-900">
                Período visível no calendário
              </label>
              <select
                value={diasAdiantados}
                onChange={(e) => setDiasAdiantados(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value={15}>Próximos 15 dias</option>
                <option value={30}>Próximos 30 dias (1 mês)</option>
                <option value={60}>Próximos 60 dias (2 meses)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="btn btn-fantasma"
            >
              Cancelar
            </button>
            <BotaoEnviar className="btn btn-principal border-2 border-black" icone={<Save size={15} />}>
              Salvar Agenda de Atendimentos
            </BotaoEnviar>
          </div>
        </form>
      </Modal>
    </>
  );
}
