import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  MapPin,
  PenLine,
  Wallet,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth";
import { data as fmtData, moeda, osNumero } from "@/lib/format";
import { StatusOrdem, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "Painel do Montador" };
export const dynamic = "force-dynamic";

export default async function PaginaMontador() {
  const sessao = await exigirSessao();
  const ehAdmin = sessao.papel === "ADMIN";

  // O admin acompanha todas as OS; o montador vê apenas as suas.
  const escopo = ehAdmin ? {} : { montadorId: sessao.id };

  const [abertas, concluidas, comissaoMes, totalConcluidas] = await Promise.all([
    prisma.ordemServico.findMany({
      where: {
        ...escopo,
        status: { in: ["AGENDADA", "EM_ANDAMENTO", "AGUARDANDO_ASSINATURA"] },
      },
      orderBy: [{ dataAgendada: "asc" }],
      include: {
        cliente: { select: { nome: true } },
        assinaturas: { select: { tipo: true } },
        checklist: { select: { concluido: true } },
      },
    }),
    prisma.ordemServico.findMany({
      where: { ...escopo, status: "CONCLUIDA" },
      orderBy: { dataConclusao: "desc" },
      take: 5,
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.lancamento.aggregate({
      _sum: { valor: true },
      where: {
        categoria: "COMISSAO",
        status: { not: "CANCELADO" },
        ...(ehAdmin ? {} : { montadorId: sessao.id }),
        data: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.ordemServico.count({ where: { ...escopo, status: "CONCLUIDA" } }),
  ]);

  const hoje = new Date().toDateString();
  const deHoje = abertas.filter(
    (os) => os.dataAgendada && os.dataAgendada.toDateString() === hoje
  );
  const proximas = abertas.filter((os) => !deHoje.includes(os));

  return (
    <>
      {/* Resumo do montador */}
      <section className="grid grid-cols-3 gap-2.5">
        <Indicador
          rotulo="Em aberto"
          valor={String(abertas.length)}
          icone={<Wrench size={15} />}
        />
        <Indicador
          rotulo="Concluídas"
          valor={String(totalConcluidas)}
          icone={<CheckCircle2 size={15} />}
        />
        <Indicador
          rotulo="Comissão no mês"
          valor={moeda(comissaoMes._sum.valor ?? 0)}
          icone={<Wallet size={15} />}
          compacto
        />
      </section>

      {/* Serviços de hoje */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-texto">
          <CalendarClock size={16} className="text-marca-500" />
          Serviços de hoje
          {deHoje.length > 0 && (
            <span className="rounded-full bg-marca-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {deHoje.length}
            </span>
          )}
        </h2>

        {deHoje.length === 0 ? (
          <div className="cartao">
            <Vazio
              icone={<CalendarClock size={20} />}
              titulo="Nenhum serviço agendado para hoje"
              descricao="Aproveite para conferir os próximos atendimentos abaixo."
            />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {deHoje.map((os) => (
              <CartaoOS key={os.id} os={os} destaque />
            ))}
          </ul>
        )}
      </section>

      {/* Próximos */}
      {proximas.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-texto">
            Próximos atendimentos
          </h2>
          <ul className="space-y-2.5">
            {proximas.map((os) => (
              <CartaoOS key={os.id} os={os} />
            ))}
          </ul>
        </section>
      )}

      {/* Histórico */}
      {concluidas.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-texto">
            Últimos serviços concluídos
          </h2>
          <ul className="cartao divide-y divide-[#f1f4f3]">
            {concluidas.map((os) => (
              <li key={os.id}>
                <Link
                  href={`/montador/${os.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#fafbfa]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca-50 text-marca-600">
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-texto">
                      {os.titulo}
                    </span>
                    <span className="block truncate text-[11px] text-suave">
                      {os.cliente.nome} · {fmtData(os.dataConclusao)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-texto">
                      {moeda(os.comissaoValor)}
                    </span>
                    <span className="block text-[10px] text-suave">sua comissão</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Indicador({
  rotulo,
  valor,
  icone,
  compacto,
}: {
  rotulo: string;
  valor: string;
  icone: React.ReactNode;
  compacto?: boolean;
}) {
  return (
    <div className="cartao p-3">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-marca-50 text-marca-600">
        {icone}
      </span>
      <p className={`mt-2 font-bold text-texto ${compacto ? "text-sm" : "text-xl"}`}>
        {valor}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase leading-tight tracking-wide text-suave">
        {rotulo}
      </p>
    </div>
  );
}

type OSCartao = {
  id: string;
  numero: number;
  titulo: string;
  status: string;
  dataAgendada: Date | null;
  endereco: string | null;
  cidade: string | null;
  comissaoValor: number;
  cliente: { nome: string };
  assinaturas: { tipo: string }[];
  checklist: { concluido: boolean }[];
};

function CartaoOS({ os, destaque }: { os: OSCartao; destaque?: boolean }) {
  const feitos = os.checklist.filter((c) => c.concluido).length;
  const progresso = os.checklist.length > 0 ? (feitos / os.checklist.length) * 100 : 0;
  const faltaCliente =
    os.assinaturas.some((a) => a.tipo === "MONTADOR") &&
    !os.assinaturas.some((a) => a.tipo === "CLIENTE");

  return (
    <li>
      <Link
        href={`/montador/${os.id}`}
        className={`cartao block p-4 transition-colors hover:border-marca-200 ${
          destaque ? "ring-1 ring-marca-200" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-suave">
                {osNumero(os.numero)}
              </span>
              <StatusOrdem status={os.status} />
            </div>
            <p className="mt-1.5 text-sm font-bold leading-snug text-texto">
              {os.titulo}
            </p>
            <p className="mt-0.5 text-xs text-suave">{os.cliente.nome}</p>
          </div>
          <ChevronRight size={18} className="mt-1 shrink-0 text-borda" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-suave">
          {os.dataAgendada && (
            <span className="flex items-center gap-1">
              <CalendarClock size={12} /> {fmtData(os.dataAgendada)}
            </span>
          )}
          {(os.endereco || os.cidade) && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">
                {[os.endereco, os.cidade].filter(Boolean).join(" — ")}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1 font-semibold text-marca-600">
            <Wallet size={12} /> {moeda(os.comissaoValor)}
          </span>
        </div>

        {os.checklist.length > 0 && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eef2f0]">
              <span
                className="block h-full rounded-full bg-marca-500 transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-suave">
              {feitos} de {os.checklist.length} etapas concluídas
            </p>
          </div>
        )}

        {faltaCliente && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700">
            <PenLine size={12} /> Falta o cliente assinar
          </p>
        )}
      </Link>
    </li>
  );
}
