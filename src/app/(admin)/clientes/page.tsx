import type { Metadata } from "next";
import Link from "next/link";
import { Contact, MapPin, Phone, Search, Trash2, Wrench } from "lucide-react";
import { dbClientes, dbOrdens, dbOrcamentos } from "@/lib/firestore";
import {
  iniciais,
  moeda,
  telefone as fmtTelefone,
  whatsapp,
  data as fmtData,
} from "@/lib/format";
import { Painel, Vazio } from "@/components/ui";
import { FormularioCliente } from "./formulario-cliente";
import { FormConfirmar } from "@/components/form";
import { excluirCliente } from "@/app/actions/clientes";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const busca = q.trim();

  const [todosClientes, todasOrdens, todosOrcamentos] = await Promise.all([
    dbClientes.listar(busca),
    dbOrdens.listar(),
    dbOrcamentos.listar(),
  ]);

  const ordensPorCliente = new Map<string, typeof todasOrdens>();
  todasOrdens.forEach((o) => {
    const list = ordensPorCliente.get(o.clienteId) || [];
    list.push(o);
    ordensPorCliente.set(o.clienteId, list);
  });

  const orcamentosPorCliente = new Map<string, number>();
  todosOrcamentos.forEach((orc) => {
    if (orc.clienteId) {
      orcamentosPorCliente.set(
        orc.clienteId,
        (orcamentosPorCliente.get(orc.clienteId) || 0) + 1
      );
    }
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative flex-1 sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suave"
          />
          <input
            name="q"
            defaultValue={busca}
            placeholder="Buscar por nome, telefone ou cidade"
            className="campo pl-9"
          />
        </form>

        <FormularioCliente />
      </div>

      {todosClientes.length === 0 ? (
        <Painel semPadding>
          <Vazio
            icone={<Contact size={20} />}
            titulo={busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            descricao={
              busca
                ? "Tente outro termo de busca."
                : "Cadastre um cliente ou converta um orçamento recebido — o cadastro é criado automaticamente."
            }
          />
        </Painel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {todosClientes.map((c) => {
            const ordens = ordensPorCliente.get(c.id) || [];
            const orcamentosCount = orcamentosPorCliente.get(c.id) || 0;

            const concluidas = ordens.filter((o) => o.status === "CONCLUIDA");
            const faturado = concluidas.reduce((a, o) => a + (o.valorTotal || 0), 0);
            const ultima = concluidas
              .map((o) => o.dataConclusao)
              .filter(Boolean)
              .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

            const endereco = [c.endereco, c.numero, c.bairro, c.cidade, c.estado]
              .filter(Boolean)
              .join(", ");

            return (
              <article key={c.id} className="cartao flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-marca-50 text-sm font-bold text-marca-700">
                    {iniciais(c.nome)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-texto">{c.nome}</h3>
                    {c.documento && (
                      <p className="truncate text-[11px] text-suave">{c.documento}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <FormularioCliente
                      inicial={{
                        id: c.id,
                        nome: c.nome,
                        telefone: c.telefone ?? null,
                        email: c.email ?? null,
                        documento: c.documento ?? null,
                        cep: c.cep ?? null,
                        endereco: c.endereco ?? null,
                        numero: c.numero ?? null,
                        complemento: c.complemento ?? null,
                        bairro: c.bairro ?? null,
                        cidade: c.cidade ?? null,
                        estado: c.estado ?? null,
                        observacoes: c.observacoes ?? null,
                        temOrdens: ordens.length > 0,
                      }}
                    />
                    <FormConfirmar
                      action={excluirCliente}
                      mensagem={`Excluir o cliente ${c.nome}?`}
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        aria-label={`Excluir ${c.nome}`}
                        className="btn btn-fantasma !p-1.5 text-suave hover:text-rose-600"
                        title="Excluir cliente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </FormConfirmar>
                  </div>
                </div>

                <dl className="mt-3 space-y-1.5 text-xs">
                  {c.telefone && (
                    <div className="flex items-center gap-1.5 text-suave">
                      <Phone size={12} className="shrink-0" />
                      <a
                        href={`https://wa.me/${whatsapp(c.telefone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-marca-600"
                      >
                        {fmtTelefone(c.telefone)}
                      </a>
                    </div>
                  )}
                  {endereco && (
                    <div className="flex items-start gap-1.5 text-suave">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{endereco}</span>
                    </div>
                  )}
                </dl>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-borda pt-3 text-center">
                  <div>
                    <p className="text-sm font-bold text-texto">{ordens.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-suave">OS</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-texto">{orcamentosCount}</p>
                    <p className="text-[10px] uppercase tracking-wide text-suave">Orç.</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-marca-600">{moeda(faturado)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-suave">
                      Faturado
                    </p>
                  </div>
                </div>

                {ultima && (
                  <p className="mt-2 text-[10px] text-suave">
                    Último serviço em {fmtData(ultima)}
                  </p>
                )}

                {ordens.length > 0 && (
                  <Link
                    href={`/ordens?q=${encodeURIComponent(c.nome)}`}
                    className="btn btn-claro mt-3 w-full !py-2 !text-xs"
                  >
                    <Wrench size={13} /> Ver ordens de serviço
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
