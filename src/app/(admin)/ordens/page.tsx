import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, PenLine, Search, Wrench } from "lucide-react";
import { dbOrdens, dbClientes, dbUsuarios } from "@/lib/firestore";
import { STATUS_OS, StatusOS } from "@/lib/constants";
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
  const busca = q.trim().toLowerCase();

  const [todasOrdens, todosClientes, todosMontadores] = await Promise.all([
    dbOrdens.listar(status !== "todas" ? { status: status as StatusOS } : undefined),
    dbClientes.listar(),
    dbUsuarios.listar({ papel: "MONTADOR", ativo: true }),
  ]);

  const clientesMap = new Map(todosClientes.map((c) => [c.id, c]));
  const montadoresMap = new Map(todosMontadores.map((m) => [m.id, m]));

  let ordens = todasOrdens;
  if (busca) {
    ordens = ordens.filter((os) => {
      const clienteNome = (clientesMap.get(os.clienteId)?.nome || "").toLowerCase();
      return (
        os.titulo.toLowerCase().includes(busca) ||
        clienteNome.includes(busca) ||
        (os.endereco || "").toLowerCase().includes(busca) ||
        (os.cidade || "").toLowerCase().includes(busca)
      );
    });
  }

  const todasParaContagem = await dbOrdens.listar();
  const contarStatus = (s: string) => todasParaContagem.filter((o) => o.status === s).length;

  const abas = [
    { chave: "todas", rotulo: "Todas", n: todasParaContagem.length },
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
            defaultValue={q}
            placeholder="Buscar por serviço, cliente ou endereço"
            className="campo pl-9"
          />
        </form>

        <FormularioOrdem
          clientes={todosClientes.map((c) => ({
            id: c.id,
            nome: c.nome,
            endereco: c.endereco ?? null,
            numero: c.numero ?? null,
            cidade: c.cidade ?? null,
          }))}
          montadores={todosMontadores.map((m) => ({
            id: m.id,
            nome: m.nome,
            comissaoPadrao: m.comissaoPadrao,
          }))}
        />
      </div>

      {/* Filtros por status */}
      <div className="rolagem-fina -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {abas.map((aba) => (
          <Link
            key={aba.chave}
            href={`/ordens?status=${aba.chave}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
              const cliente = clientesMap.get(os.clienteId);
              const montador = os.montadorId ? montadoresMap.get(os.montadorId) : null;
              const assinaturas = os.assinaturas || [];
              const assinouMontador = assinaturas.some((a) => a.tipo === "MONTADOR");
              const assinouCliente = assinaturas.some((a) => a.tipo === "CLIENTE");

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
                        {cliente?.nome || "Cliente"}
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
                      {montador && (
                        <span
                          className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white sm:grid"
                          style={{ background: montador.corAvatar }}
                          title={montador.nome}
                        >
                          {iniciais(montador.nome)}
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
