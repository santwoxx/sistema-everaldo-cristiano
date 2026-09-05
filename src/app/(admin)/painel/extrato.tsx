"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import { CATEGORIAS, FORMAS_PAGAMENTO } from "@/lib/constants";
import { data as fmtData, moeda } from "@/lib/format";
import { Etiqueta, Painel, Vazio } from "@/components/ui";
import { FormConfirmar } from "@/components/form";
import {
  alternarStatusLancamento,
  excluirLancamento,
} from "@/app/actions/financeiro";
import { FormularioLancamento } from "./novo-lancamento";

export type LinhaExtrato = {
  id: string;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
  formaPagamento: string;
  automatico: boolean;
  montador: string | null;
  ordemId: string | null;
  ordemNumero: number | null;
};

export function Extrato({
  lancamentos,
  filtro,
  pagina,
  totalPaginas,
  contagens,
  montadores,
}: {
  lancamentos: LinhaExtrato[];
  filtro: string;
  pagina: number;
  totalPaginas: number;
  contagens: { todos: number; receitas: number; despesas: number };
  montadores: { id: string; nome: string }[];
}) {
  const [editando, setEditando] = useState<LinhaExtrato | null>(null);

  const abas = [
    { chave: "todos", rotulo: `Todos (${contagens.todos})` },
    { chave: "receitas", rotulo: `Receitas (${contagens.receitas})` },
    { chave: "despesas", rotulo: `Despesas (${contagens.despesas})` },
  ];

  return (
    <>
      <Painel
        titulo="Extrato de Movimentações"
        descricao="Histórico financeiro detalhado de entradas e saídas"
        semPadding
        acoes={
          <div className="flex items-center gap-1.5">
            <Filter size={15} className="text-suave" aria-hidden />
            <div className="flex gap-1 rounded-lg bg-[#f1f4f3] p-1">
              {abas.map((aba) => (
                <Link
                  key={aba.chave}
                  href={`/painel?filtro=${aba.chave}`}
                  scroll={false}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    filtro === aba.chave
                      ? "bg-marca-500 text-white"
                      : "text-suave hover:text-texto"
                  }`}
                >
                  {aba.rotulo}
                </Link>
              ))}
            </div>
          </div>
        }
      >
        {lancamentos.length === 0 ? (
          <Vazio
            icone={<Wallet size={20} />}
            titulo="Nenhuma movimentação neste filtro"
            descricao="As receitas são geradas automaticamente ao concluir uma ordem de serviço assinada. Você também pode registrar lançamentos manuais."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="tabela min-w-[860px]">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Pagamento</th>
                    <th className="!text-right">Valor</th>
                    <th>Status</th>
                    <th className="!text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((l) => {
                    const receita = l.tipo === "RECEITA";
                    return (
                      <tr key={l.id}>
                        <td className="whitespace-nowrap text-suave">
                          {fmtData(l.data)}
                        </td>

                        <td className="max-w-[280px]">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                                receita
                                  ? "bg-marca-50 text-marca-600"
                                  : "bg-rose-50 text-rose-500"
                              }`}
                            >
                              {receita ? (
                                <ArrowUpRight size={13} />
                              ) : (
                                <ArrowDownRight size={13} />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-texto">
                                {l.descricao}
                              </span>
                              {(l.montador || l.ordemNumero) && (
                                <span className="mt-0.5 block text-[11px] text-suave">
                                  {l.ordemNumero && (
                                    <Link
                                      href={`/ordens/${l.ordemId}`}
                                      className="font-medium text-marca-600 hover:underline"
                                    >
                                      OS-{String(l.ordemNumero).padStart(4, "0")}
                                    </Link>
                                  )}
                                  {l.ordemNumero && l.montador && " · "}
                                  {l.montador}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap text-suave">
                          {CATEGORIAS[l.categoria] ?? l.categoria}
                        </td>

                        <td className="whitespace-nowrap text-suave">
                          {FORMAS_PAGAMENTO[
                            l.formaPagamento as keyof typeof FORMAS_PAGAMENTO
                          ] ?? l.formaPagamento}
                        </td>

                        <td
                          className={`whitespace-nowrap text-right font-bold ${
                            receita ? "text-marca-600" : "text-rose-600"
                          }`}
                        >
                          {receita ? "+" : "−"} {moeda(l.valor)}
                        </td>

                        <td>
                          <form action={alternarStatusLancamento}>
                            <input type="hidden" name="id" value={l.id} />
                            <button
                              type="submit"
                              title="Alternar entre confirmado e pendente"
                              className="cursor-pointer"
                            >
                              <Etiqueta
                                cor={
                                  l.status === "CONFIRMADO"
                                    ? "bg-marca-50 text-marca-700 ring-marca-200"
                                    : l.status === "PENDENTE"
                                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                                      : "bg-slate-100 text-slate-600 ring-slate-200"
                                }
                              >
                                {l.status === "CONFIRMADO"
                                  ? "Confirmado"
                                  : l.status === "PENDENTE"
                                    ? "Pendente"
                                    : "Cancelado"}
                              </Etiqueta>
                            </button>
                          </form>
                        </td>

                        <td>
                          <div className="flex items-center justify-end gap-1">
                            {l.automatico ? (
                              <span
                                className="flex items-center gap-1 rounded-md bg-[#f1f4f3] px-2 py-1 text-[10px] font-semibold text-suave"
                                title="Gerado automaticamente pela ordem de serviço"
                              >
                                <Lock size={11} /> Automático
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditando(l)}
                                  aria-label="Editar lançamento"
                                  className="btn btn-fantasma !p-1.5"
                                >
                                  <Pencil size={14} />
                                </button>
                                <FormConfirmar
                                  action={excluirLancamento}
                                  mensagem={`Excluir o lançamento "${l.descricao}"?`}
                                >
                                  <input type="hidden" name="id" value={l.id} />
                                  <button
                                    type="submit"
                                    aria-label="Excluir lançamento"
                                    className="btn btn-fantasma !p-1.5 hover:!text-rose-600"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </FormConfirmar>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-borda px-4 py-3 sm:px-5">
                <p className="text-xs text-suave">
                  Página {pagina} de {totalPaginas}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/painel?filtro=${filtro}&pagina=${pagina - 1}`}
                    scroll={false}
                    aria-disabled={pagina <= 1}
                    className={`btn btn-claro !px-2.5 !py-1.5 ${
                      pagina <= 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <ChevronLeft size={14} /> Anterior
                  </Link>
                  <Link
                    href={`/painel?filtro=${filtro}&pagina=${pagina + 1}`}
                    scroll={false}
                    aria-disabled={pagina >= totalPaginas}
                    className={`btn btn-claro !px-2.5 !py-1.5 ${
                      pagina >= totalPaginas ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    Próxima <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </Painel>

      <FormularioLancamento
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        montadores={montadores}
        inicial={editando ?? undefined}
      />
    </>
  );
}
