import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Link2,
  MapPin,
  Package,
  Phone,
  Trash2,
} from "lucide-react";
import { dbOrcamentos, dbOrdens, dbClientes } from "@/lib/firestore";
import { STATUS_ORCAMENTO, TIPOS_SERVICO, StatusOrcamento } from "@/lib/constants";
import {
  data as fmtData,
  dataHora,
  moeda,
  orcNumero,
  telefone as fmtTelefone,
} from "@/lib/format";
import { Painel, StatusOrc, Vazio } from "@/components/ui";
import { FormConfirmar } from "@/components/form";
import { excluirOrcamento } from "@/app/actions/orcamentos";
import { FormularioOrcamentoManual } from "./formulario-orcamento-manual";

export const metadata: Metadata = { title: "Orçamentos Recebidos" };
export const dynamic = "force-dynamic";

export default async function PaginaOrcamentos({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "todos" } = await searchParams;

  const [todosOrcamentos, todasOrdens, todosClientes] = await Promise.all([
    dbOrcamentos.listar(status !== "todos" ? { status: status as StatusOrcamento } : undefined),
    dbOrdens.listar(),
    dbClientes.listar(),
  ]);

  const ordensPorOrcamento = new Map(todasOrdens.filter((o) => o.orcamentoId).map((o) => [o.orcamentoId!, o]));

  const todos = await dbOrcamentos.listar();
  const contar = (s: string) => todos.filter((o) => o.status === s).length;

  const abas = [
    { chave: "todos", rotulo: "Todos", n: todos.length },
    ...Object.entries(STATUS_ORCAMENTO).map(([chave, rotulo]) => ({
      chave,
      rotulo,
      n: contar(chave),
    })),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-suave">
          Gerencie solicitações públicas de clientes e cadastre novos orçamentos manuais.
        </p>
        <div className="flex items-center gap-2">
          <Link href="/links" className="btn btn-claro">
            <Link2 size={16} /> Link p/ cliente
          </Link>
          <FormularioOrcamentoManual
            clientes={todosClientes.map((c) => ({
              id: c.id,
              nome: c.nome,
              telefone: c.telefone ?? null,
              cidade: c.cidade ?? null,
            }))}
          />
        </div>
      </div>

      <div className="rolagem-fina -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {abas.map((aba) => (
          <Link
            key={aba.chave}
            href={`/orcamentos?status=${aba.chave}`}
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
        {todosOrcamentos.length === 0 ? (
          <Vazio
            icone={<FileText size={20} />}
            titulo="Nenhum orçamento neste filtro"
            descricao="Gere um link e envie ao cliente pelo WhatsApp. As solicitações chegam aqui automaticamente."
            acao={
              <Link href="/links" className="btn btn-principal">
                <Link2 size={15} /> Gerar link para o cliente
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[#f1f4f3]">
            {todosOrcamentos.map((o) => {
              const ordem = ordensPorOrcamento.get(o.id);
              return (
                <li key={o.id}>
                  <Link
                    href={`/orcamentos/${o.id}`}
                    className="flex flex-wrap items-start gap-4 px-4 py-4 transition-colors hover:bg-[#fafbfa] sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-suave">
                          {orcNumero(o.numero)}
                        </span>
                        <StatusOrc status={o.status} />
                        {ordem && (
                          <span className="text-[11px] font-medium text-marca-600">
                            → OS-{String(ordem.numero).padStart(4, "0")}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-sm font-semibold text-texto">
                        {o.nomeContato}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-suave">
                        {o.descricao}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-suave">
                        <span className="flex items-center gap-1">
                          <Package size={12} />
                          {TIPOS_SERVICO[o.tipoServico as keyof typeof TIPOS_SERVICO] ??
                            o.tipoServico}{" "}
                          · {o.quantidadeItens} item(ns)
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {fmtTelefone(o.telefone)}
                        </span>
                        {o.cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {o.cidade}
                            {o.estado ? `/${o.estado}` : ""}
                          </span>
                        )}
                        {o.prazoDesejado && (
                          <span className="flex items-center gap-1 font-semibold text-emerald-800">
                            <CalendarDays size={12} className="text-emerald-600" />
                            {fmtData(o.prazoDesejado)}
                            {o.horarioDesejado && ` às ${o.horarioDesejado}`}
                          </span>
                        )}
                      </div>
                    </div>


                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {o.valorProposto ? (
                          <p className="text-base font-bold text-texto">
                            {moeda(o.valorProposto)}
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-suave">Sem proposta</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-suave">
                          {dataHora(o.criadoEm)}
                        </p>
                      </div>

                      <FormConfirmar
                        action={excluirOrcamento}
                        mensagem={`Excluir o orçamento de ${o.nomeContato}?`}
                        className="self-center"
                      >
                        <input type="hidden" name="id" value={o.id} />
                        <button
                          type="submit"
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-fantasma !p-2 text-suave hover:text-rose-600"
                          title="Excluir orçamento"
                          aria-label={`Excluir orçamento ${orcNumero(o.numero)}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </FormConfirmar>
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
