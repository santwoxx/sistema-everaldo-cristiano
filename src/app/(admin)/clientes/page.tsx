import type { Metadata } from "next";
import Link from "next/link";
import { Contact, MapPin, Phone, Search, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  iniciais,
  moeda,
  telefone as fmtTelefone,
  whatsapp,
  data as fmtData,
} from "@/lib/format";
import { Painel, Vazio } from "@/components/ui";
import { FormularioCliente } from "./formulario-cliente";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const busca = q.trim();

  const clientes = await prisma.cliente.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca } },
            { telefone: { contains: busca } },
            { email: { contains: busca } },
            { cidade: { contains: busca } },
            { documento: { contains: busca } },
          ],
        }
      : {},
    orderBy: { nome: "asc" },
    include: {
      ordens: {
        select: { id: true, valorTotal: true, status: true, dataConclusao: true },
      },
      _count: { select: { orcamentos: true } },
    },
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

      {clientes.length === 0 ? (
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
          {clientes.map((c) => {
            const concluidas = c.ordens.filter((o) => o.status === "CONCLUIDA");
            const faturado = concluidas.reduce((a, o) => a + o.valorTotal, 0);
            const ultima = concluidas
              .map((o) => o.dataConclusao)
              .filter(Boolean)
              .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];

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
                  <FormularioCliente
                    inicial={{
                      id: c.id,
                      nome: c.nome,
                      telefone: c.telefone,
                      email: c.email,
                      documento: c.documento,
                      cep: c.cep,
                      endereco: c.endereco,
                      numero: c.numero,
                      complemento: c.complemento,
                      bairro: c.bairro,
                      cidade: c.cidade,
                      estado: c.estado,
                      observacoes: c.observacoes,
                      temOrdens: c.ordens.length > 0,
                    }}
                  />
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
                    <p className="text-sm font-bold text-texto">{c.ordens.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-suave">OS</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-texto">{c._count.orcamentos}</p>
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

                {c.ordens.length > 0 && (
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
