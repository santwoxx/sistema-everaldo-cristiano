import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, PenLine, Search, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { STATUS_OS } from "@/lib/constants";
import { data as fmtData, iniciais, moeda, osNumero } from "@/lib/format";
import { Etiqueta, Painel, StatusOrdem, Vazio } from "@/components/ui";
import { FormularioOrdem } from "./formulario-ordem";

export const metadata: Metadata = { title: "Ordens de Serviço" };
export const dynamic = "force-dynamic";

export default async function PaginaOrdens({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "todas", q = "" } = await searchParams;
  const busca = q.trim();

  const where = {
    ...(status !== "todas" ? { status } : {}),
    ...(busca
      ? {
          OR: [
            { titulo: { contains: busca } },
            { cliente: { is: { nome: { contains: busca } } } },
            { endereco: { contains: busca } },
            { cidade: { contains: busca } },
          ],
        }
      : {}),
  };

  const [ordens, clientes, montadores, contagens] = await Promise.all([
    prisma.ordemServico.findMany({
      where,
      orderBy: [{ dataAgendada: "desc" }, { criadoEm: "desc" }],
      include: {
        cliente: { select: { id: true, nome: true } },
        montador: { select: { nome: true, corAvatar: true } },
        assinaturas: { select: { tipo: true } },
        _count: { select: { itens: true } },
      },
      take: 100,
    }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, endereco: true, numero: true, cidade: true },
    }),
    prisma.usuario.findMany({
      where: { papel: "MONTADOR", ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, comissaoPadrao: true },
    }),
    prisma.ordemServico.groupBy({ by: ["status"], _count: true }),
  ]);

  const total = contagens.reduce((a, c) => a + c._count, 0);
  const contarStatus = (s: string) =>
    contagens.find((c) => c.status === s)?._count ?? 0;

  const abas = [
    { chave: "todas", rotulo: "Todas", n: total },
    ...Object.entries(STATUS_OS).map(([chave, rotulo]) => ({
      chave,
      rotulo,
      n: contarStatus(chave),
    })),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative flex-1 sm:max-w-xs">
          {status !== "todas" && <input type="hidden" name="status" value={status} />}
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suave"
          />
          <input
            name="q"
            defaultValue={busca}
            placeholder="Buscar por serviço, cliente ou endereço"
            className="campo pl-9"
          />
        </form>

        <FormularioOrdem clientes={clientes} montadores={montadores} />
      </div>

      {/* Filtros por status */}
      <div className="rolagem-fina -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {abas.map((aba) => (
          <Link
            key={aba.chave}
            href={`/ordens?status=${aba.chave}${busca ? `&q=${encodeURIComponent(busca)}` : ""}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === aba.chave
                ? "bg-marca-500 text-white"
                : "bg-white text-suave ring-1 ring-borda hover:text-texto"
            }`}
          >
            {aba.rotulo} ({aba.n})
          </Link>
        ))}
      </div>

      <Painel semPadding>
        {ordens.length === 0 ? (
          <Vazio
            icone={<Wrench size={20} />}
            titulo={busca ? "Nenhuma OS encontrada" : "Nenhuma ordem de serviço"}
            descricao={
              busca
                ? "Tente outro termo de busca ou limpe o filtro de status."
                : "Crie a primeira OS ou converta um orçamento recebido do cliente."
            }
            acao={
              !busca ? (
                <Link href="/orcamentos" className="btn btn-claro">
                  Ver orçamentos recebidos
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-[#f1f4f3]">
            {ordens.map((os) => {
              const assinouMontador = os.assinaturas.some((a) => a.tipo === "MONTADOR");
              const assinouCliente = os.assinaturas.some((a) => a.tipo === "CLIENTE");

              return (
                <li key={os.id}>
                  <Link
                    href={`/ordens/${os.id}`}
                    className="flex flex-wrap items-start gap-4 px-4 py-4 transition-colors hover:bg-[#fafbfa] sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-suave">
                          {osNumero(os.numero)}
                        </span>
                        <StatusOrdem status={os.status} />
                        {os.pago && (
                          <Etiqueta cor="bg-marca-50 text-marca-700 ring-marca-200">
                            Pago
                          </Etiqueta>
                        )}
                      </div>

                      <p className="mt-1.5 truncate text-sm font-semibold text-texto">
                        {os.titulo}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-suave">
                        {os.cliente.nome}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-suave">
                        {os.dataAgendada && (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} /> {fmtData(os.dataAgendada)}
                          </span>
                        )}
                        {(os.cidade || os.endereco) && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {[os.endereco, os.cidade].filter(Boolean).join(" — ")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <PenLine size={12} />
                          {assinouMontador && assinouCliente
                            ? "Assinada por ambos"
                            : assinouMontador
                              ? "Falta o cliente assinar"
                              : assinouCliente
                                ? "Falta o montador assinar"
                                : "Sem assinaturas"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {os.montador && (
                        <span
                          className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white sm:grid"
                          style={{ background: os.montador.corAvatar }}
                          title={os.montador.nome}
                        >
                          {iniciais(os.montador.nome)}
                        </span>
                      )}
                      <div className="text-right">
                        <p className="text-base font-bold text-texto">
                          {moeda(os.valorTotal)}
                        </p>
                        <p className="text-[11px] text-suave">
                          comissão {moeda(os.comissaoValor)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>
    </>
  );
}
