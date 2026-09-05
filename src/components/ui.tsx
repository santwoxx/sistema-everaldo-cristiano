import type { ReactNode } from "react";
import {
  STATUS_OS,
  STATUS_OS_COR,
  STATUS_ORCAMENTO,
  STATUS_ORCAMENTO_COR,
  type StatusOS,
  type StatusOrcamento,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* Selos de status                                                            */
/* -------------------------------------------------------------------------- */

export function Etiqueta({
  children,
  cor = "bg-slate-100 text-slate-700 ring-slate-200",
}: {
  children: ReactNode;
  cor?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${cor}`}
    >
      {children}
    </span>
  );
}

export function StatusOrdem({ status }: { status: string }) {
  const s = status as StatusOS;
  return (
    <Etiqueta cor={STATUS_OS_COR[s] ?? "bg-slate-100 text-slate-700 ring-slate-200"}>
      {STATUS_OS[s] ?? status}
    </Etiqueta>
  );
}

export function StatusOrc({ status }: { status: string }) {
  const s = status as StatusOrcamento;
  return (
    <Etiqueta cor={STATUS_ORCAMENTO_COR[s] ?? "bg-slate-100 text-slate-700 ring-slate-200"}>
      {STATUS_ORCAMENTO[s] ?? status}
    </Etiqueta>
  );
}

/* -------------------------------------------------------------------------- */
/* Cabecalho de pagina                                                        */
/* -------------------------------------------------------------------------- */

export function TituloPagina({
  titulo,
  subtitulo,
  acoes,
}: {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-texto sm:text-2xl">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-0.5 text-sm text-suave">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Faixa verde de destaque (topo dos paineis)                                 */
/* -------------------------------------------------------------------------- */

export function FaixaDestaque({
  chip,
  contexto,
  titulo,
  descricao,
  acao,
}: {
  chip: string;
  contexto?: string;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-marca-900 via-marca-700 to-marca-500 p-5 text-white shadow-[var(--shadow-flutuante)] sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-ouro-400/15 blur-3xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
              {chip}
            </span>
            {contexto && (
              <span className="text-[11px] font-medium text-marca-100/90">
                • {contexto}
              </span>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-[28px]">
            {titulo}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-marca-50/85">{descricao}</p>
        </div>
        {acao}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Cartao indicador (KPI)                                                     */
/* -------------------------------------------------------------------------- */

export function CartaoIndicador({
  rotulo,
  valor,
  nota,
  icone,
  acento,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  icone: ReactNode;
  acento: "verde" | "ambar" | "vermelho" | "esmeralda";
}) {
  const barras = {
    verde: "bg-marca-500",
    ambar: "bg-amber-400",
    vermelho: "bg-rose-500",
    esmeralda: "bg-emerald-500",
  } as const;

  const chips = {
    verde: "bg-marca-50 text-marca-600",
    ambar: "bg-amber-50 text-amber-600",
    vermelho: "bg-rose-50 text-rose-500",
    esmeralda: "bg-emerald-50 text-emerald-600",
  } as const;

  return (
    <div className="cartao relative overflow-hidden p-4 sm:p-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${barras[acento]}`} aria-hidden />
      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="min-w-0">
          <p className="rotulo">{rotulo}</p>
          <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-texto sm:text-[26px]">
            {valor}
          </p>
          {nota && <p className="mt-1.5 text-xs text-suave">{nota}</p>}
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${chips[acento]}`}
        >
          {icone}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Painel branco com cabecalho                                                */
/* -------------------------------------------------------------------------- */

export function Painel({
  titulo,
  descricao,
  acoes,
  children,
  semPadding = false,
}: {
  titulo?: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  semPadding?: boolean;
}) {
  return (
    <section className="cartao overflow-hidden">
      {(titulo || acoes) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            {titulo && (
              <h3 className="text-base font-bold tracking-tight text-texto">{titulo}</h3>
            )}
            {descricao && <p className="mt-0.5 text-xs text-suave">{descricao}</p>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      )}
      <div className={semPadding ? "" : "px-4 pb-5 sm:px-5"}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Estado vazio                                                               */
/* -------------------------------------------------------------------------- */

export function Vazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icone && (
        <span className="mb-1 grid h-12 w-12 place-items-center rounded-full bg-marca-50 text-marca-500">
          {icone}
        </span>
      )}
      <p className="text-sm font-semibold text-texto">{titulo}</p>
      {descricao && <p className="max-w-sm text-xs text-suave">{descricao}</p>}
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Linha rotulo/valor                                                         */
/* -------------------------------------------------------------------------- */

export function Info({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="rotulo">{rotulo}</dt>
      <dd className="mt-1 text-sm font-medium text-texto break-words">{children}</dd>
    </div>
  );
}
