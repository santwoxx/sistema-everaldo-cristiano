/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  PlayCircle,
  Wallet,
} from "lucide-react";
import { dbOrdens, dbClientes, dbUsuarios } from "@/lib/firestore";
import { exigirSessao } from "@/lib/auth";
import {
  data as fmtData,
  dataHora,
  moeda,
  osNumero,
  telefone as fmtTelefone,
  whatsapp,
} from "@/lib/format";
import { StatusOrdem } from "@/components/ui";
import { iniciarExecucao } from "@/app/actions/ordens";
import { ChecklistMontador } from "./checklist-montador";
import { FluxoAssinaturas } from "./fluxo-assinaturas";
import { EnvioFotos } from "./envio-fotos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const os = await dbOrdens.buscarPorId(id);
  return { title: os ? osNumero(os.numero) : "Ordem de serviço" };
}

export default async function PaginaExecucao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await exigirSessao();
  const { id } = await params;

  const [os, todosClientes, todosUsuarios] = await Promise.all([
    dbOrdens.buscarPorId(id),
    dbClientes.listar(),
    dbUsuarios.listar(),
  ]);

  if (!os) notFound();

  // Montador só acessa as próprias OS; o admin acompanha todas.
  if (sessao.papel !== "ADMIN" && os.montadorId !== sessao.id) notFound();

  const cliente = todosClientes.find((c) => c.id === os.clienteId);
  const montador = os.montadorId
    ? todosUsuarios.find((u) => u.id === os.montadorId)
    : null;

  const checklist = os.checklist || [];
  const feitos = checklist.filter((c) => c.concluido).length;
  const tudoFeito = checklist.length > 0 && feitos === checklist.length;
  const enderecoCompleto = [os.endereco, os.cidade].filter(Boolean).join(", ");
  const itens = os.itens || [];
  const fotos = os.fotos || [];
  const assinaturas = os.assinaturas || [];

  return (
    <>
      <Link
        href="/montador"
        className="inline-flex items-center gap-1 text-xs font-semibold text-suave hover:text-marca-600"
      >
        <ArrowLeft size={14} /> Meus serviços
      </Link>

      {/* Cabeçalho da OS */}
      <section className="cartao p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-suave">
            {osNumero(os.numero)}
          </span>
          <StatusOrdem status={os.status} />
        </div>

        <h1 className="mt-2 text-lg font-bold leading-snug tracking-tight text-texto">
          {os.titulo}
        </h1>

        {os.descricao && (
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-suave">
            {os.descricao}
          </p>
        )}

        <dl className="mt-4 space-y-2.5 border-t border-borda pt-4 text-sm">
          <div className="flex items-start gap-2.5">
            <CalendarClock size={15} className="mt-0.5 shrink-0 text-suave" />
            <span className="text-texto">{fmtData(os.dataAgendada)}</span>
          </div>

          {enderecoCompleto && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2.5 text-texto hover:text-marca-600"
            >
              <MapPin size={15} className="mt-0.5 shrink-0 text-suave" />
              <span className="flex-1">{enderecoCompleto}</span>
              <Navigation size={14} className="mt-0.5 shrink-0 text-marca-500" />
            </a>
          )}

          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-suave">
              <CheckCircle2 size={15} />
            </span>
            <span className="text-texto">{cliente?.nome || "Cliente"}</span>
          </div>

          {cliente?.telefone && (
            <a
              href={`https://wa.me/${whatsapp(cliente.telefone)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2.5 text-texto hover:text-marca-600"
            >
              <Phone size={15} className="mt-0.5 shrink-0 text-suave" />
              <span>{fmtTelefone(cliente.telefone)}</span>
            </a>
          )}

          <div className="flex items-start gap-2.5">
            <Wallet size={15} className="mt-0.5 shrink-0 text-suave" />
            <span>
              <span className="font-semibold text-texto">{moeda(os.valorTotal)}</span>
              <span className="text-suave">
                {" "}
                · sua comissão{" "}
                <strong className="text-marca-600">{moeda(os.comissaoValor)}</strong>
              </span>
            </span>
          </div>
        </dl>

        {os.status === "AGENDADA" && (
          <form action={iniciarExecucao} className="mt-4">
            <input type="hidden" name="id" value={os.id} />
            <button type="submit" className="btn btn-principal w-full !py-3">
              <PlayCircle size={17} /> Iniciar serviço
            </button>
          </form>
        )}

        {os.dataInicio && (
          <p className="mt-3 text-[11px] text-suave">
            Iniciado em {dataHora(os.dataInicio)}
          </p>
        )}
      </section>

      {/* Itens */}
      {itens.length > 0 && (
        <section className="cartao p-4">
          <h2 className="text-sm font-bold text-texto">Itens do serviço</h2>
          <ul className="mt-3 space-y-2">
            {itens.map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 text-suave">
                  <strong className="text-texto">
                    {i.quantidade % 1 === 0 ? i.quantidade : i.quantidade.toFixed(2)}×
                  </strong>{" "}
                  {i.descricao}
                </span>
                <span className="shrink-0 font-semibold text-texto">
                  {moeda(i.quantidade * i.valorUnitario)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ChecklistMontador
        ordemId={os.id}
        itens={checklist.map((c) => ({
          id: c.id,
          descricao: c.descricao,
          concluido: c.concluido,
        }))}
        feitos={feitos}
      />

      <EnvioFotos
        ordemId={os.id}
        fotos={fotos.map((f) => ({
          id: f.id,
          dataUrl: f.dataUrl,
          legenda: f.legenda ?? null,
          etapa: f.etapa,
        }))}
      />

      <FluxoAssinaturas
        ordemId={os.id}
        tudoFeito={tudoFeito}
        totalEtapas={checklist.length}
        etapasFeitas={feitos}
        nomeMontador={montador?.nome ?? sessao.nome}
        documentoMontador={montador?.documento ?? null}
        nomeCliente={cliente?.nome || "Cliente"}
        documentoCliente={cliente?.documento || null}
        cancelada={os.status === "CANCELADA"}
        assinaturas={assinaturas.map((a) => ({
          id: a.id,
          tipo: a.tipo,
          nome: a.nome,
          imagem: a.imagem,
          assinadoEm: a.assinadoEm,
        }))}
      />
    </>
  );
}
