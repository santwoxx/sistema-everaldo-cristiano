import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Trash2,
} from "lucide-react";
import { dbOrcamentos, dbOrdens, dbLinks, dbClientes } from "@/lib/firestore";
import { TIPOS_SERVICO } from "@/lib/constants";
import {
  data as fmtData,
  dataHora,
  moeda,
  orcNumero,
  telefone as fmtTelefone,
  whatsapp,
} from "@/lib/format";
import { Info, Painel, StatusOrc } from "@/components/ui";
import { FormConfirmar } from "@/components/form";
import { excluirOrcamento } from "@/app/actions/orcamentos";
import { converterOrcamento } from "@/app/actions/ordens";
import { FormularioResposta } from "./resposta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const o = await dbOrcamentos.buscarPorId(id);
  return { title: o ? `${orcNumero(o.numero)} · ${o.nomeContato}` : "Orçamento" };
}

export default async function PaginaOrcamento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [orcamento, todasOrdens, todosLinks] = await Promise.all([
    dbOrcamentos.buscarPorId(id),
    dbOrdens.listar(),
    dbLinks.listar(),
  ]);

  if (!orcamento) notFound();

  const ordem = todasOrdens.find((o) => o.orcamentoId === id);
  const link = orcamento.linkId
    ? todosLinks.find((l) => l.id === orcamento.linkId)
    : null;

  const enderecoCompleto = [
    orcamento.endereco,
    orcamento.cidade,
    orcamento.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const mensagemWhats = encodeURIComponent(
    `Olá, ${orcamento.nomeContato}! Aqui é da EC Montagens de Móveis. Recebemos sua solicitação de orçamento (${orcNumero(orcamento.numero)})` +
      (orcamento.valorProposto
        ? ` e o valor do serviço ficou em ${moeda(orcamento.valorProposto)}.`
        : " e já estamos preparando a proposta.")
  );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/orcamentos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-suave hover:text-marca-600"
          >
            <ArrowLeft size={14} /> Orçamentos recebidos
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-suave">
              {orcNumero(orcamento.numero)}
            </span>
            <StatusOrc status={orcamento.status} />
          </div>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-texto sm:text-2xl">
            {orcamento.nomeContato}
          </h2>
          <p className="mt-0.5 text-xs text-suave">
            Recebido em {dataHora(orcamento.criadoEm)}
            {link ? ` · via ${link.titulo}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://wa.me/${whatsapp(orcamento.telefone)}?text=${mensagemWhats}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-claro"
          >
            <MessageCircle size={15} /> Responder no WhatsApp
          </a>

          {ordem ? (
            <Link href={`/ordens/${ordem.id}`} className="btn btn-principal">
              Ver OS-{String(ordem.numero).padStart(4, "0")}
              <ArrowRight size={15} />
            </Link>
          ) : (
            <form action={converterOrcamento}>
              <input type="hidden" name="orcamentoId" value={orcamento.id} />
              <button type="submit" className="btn btn-principal">
                Converter em ordem de serviço <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Painel titulo="Solicitação do cliente">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info rotulo="Tipo de serviço">
                <span className="inline-flex items-center gap-1.5">
                  <Package size={13} className="text-suave" />
                  {TIPOS_SERVICO[
                    orcamento.tipoServico as keyof typeof TIPOS_SERVICO
                  ] ?? orcamento.tipoServico}
                </span>
              </Info>

              <Info rotulo="Quantidade de itens">
                {orcamento.quantidadeItens} item(ns)
              </Info>

              <Info rotulo="Telefone">
                <a
                  href={`https://wa.me/${whatsapp(orcamento.telefone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-marca-600"
                >
                  <Phone size={13} /> {fmtTelefone(orcamento.telefone)}
                </a>
              </Info>

              <Info rotulo="E-mail">
                {orcamento.email ? (
                  <a
                    href={`mailto:${orcamento.email}`}
                    className="inline-flex items-center gap-1.5 break-all hover:text-marca-600"
                  >
                    <Mail size={13} className="shrink-0" /> {orcamento.email}
                  </a>
                ) : (
                  <span className="text-suave">Não informado</span>
                )}
              </Info>

              {orcamento.documento && (
                <Info rotulo="CPF / CNPJ">{orcamento.documento}</Info>
              )}

              {orcamento.prazoDesejado && (
                <Info rotulo="Agendamento desejado">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                    <CalendarDays size={14} className="text-emerald-700" />
                    {fmtData(orcamento.prazoDesejado)}
                    {orcamento.horarioDesejado && (
                      <span className="rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 font-mono text-xs font-extrabold text-emerald-800">
                        às {orcamento.horarioDesejado}
                      </span>
                    )}
                  </span>
                </Info>
              )}


              {enderecoCompleto && (
                <div className="sm:col-span-2">
                  <Info rotulo="Endereço do serviço">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-start gap-1.5 hover:text-marca-600"
                    >
                      <MapPin size={13} className="mt-0.5 shrink-0 text-suave" />
                      {enderecoCompleto}
                      {orcamento.cep ? ` · CEP ${orcamento.cep}` : ""}
                    </a>
                  </Info>
                </div>
              )}

              <div className="sm:col-span-2">
                <Info rotulo="Descrição enviada pelo cliente">
                  <span className="mt-1 block whitespace-pre-line rounded-lg bg-[#f7f9f8] p-3 text-sm font-normal leading-relaxed text-texto">
                    {orcamento.descricao}
                  </span>
                </Info>
              </div>
            </dl>
          </Painel>

          {!ordem && (
            <FormConfirmar
              action={excluirOrcamento}
              mensagem={`Excluir o orçamento de ${orcamento.nomeContato}?`}
            >
              <input type="hidden" name="id" value={orcamento.id} />
              <button type="submit" className="btn btn-perigo">
                <Trash2 size={15} /> Excluir orçamento
              </button>
            </FormConfirmar>
          )}
        </div>

        <FormularioResposta
          id={orcamento.id}
          status={orcamento.status}
          valorProposto={orcamento.valorProposto ?? null}
          observacoesInternas={orcamento.observacoesInternas ?? null}
          respondidoEm={orcamento.respondidoEm ?? null}
          convertido={!!ordem}
        />
      </div>
    </>
  );
}
