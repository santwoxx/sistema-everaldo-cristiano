import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileSignature,
  MapPin,
  Phone,
  Printer,
  Star,
  Trash2,
} from "lucide-react";
import {
  dbOrdens,
  dbClientes,
  dbUsuarios,
  dbOrcamentos,
  dbLancamentos,
} from "@/lib/firestore";
import { FORMAS_PAGAMENTO, STATUS_OS } from "@/lib/constants";
import {
  data as fmtData,
  dataHora,
  iniciais,
  moeda,
  osNumero,
  telefone as fmtTelefone,
  whatsapp,
} from "@/lib/format";
import { urlBase } from "@/lib/negocio";
import { Etiqueta, Info, Painel, StatusOrdem } from "@/components/ui";
import { BotaoCopiar, FormConfirmar } from "@/components/form";
import { FormularioOrdem } from "../formulario-ordem";
import { alterarStatus, alternarPagamento, excluirOrdem } from "@/app/actions/ordens";
import { ItensOrdem } from "./itens";
import { ChecklistOrdem } from "./checklist";
import { BlocoAssinaturas } from "./assinaturas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const os = await dbOrdens.buscarPorId(id);
  return { title: os ? `${osNumero(os.numero)} · ${os.titulo}` : "Ordem de serviço" };
}

export default async function PaginaOrdem({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [os, todosClientes, todosMontadores, todosOrcamentos, todosLancamentos] =
    await Promise.all([
      dbOrdens.buscarPorId(id),
      dbClientes.listar(),
      dbUsuarios.listar({ papel: "MONTADOR", ativo: true }),
      dbOrcamentos.listar(),
      dbLancamentos.listar({ ordemId: id }),
    ]);

  if (!os) notFound();

  const cliente = todosClientes.find((c) => c.id === os.clienteId);
  const montador = os.montadorId
    ? todosMontadores.find((m) => m.id === os.montadorId)
    : null;
  const orcamento = os.orcamentoId
    ? todosOrcamentos.find((orc) => orc.id === os.orcamentoId)
    : null;

  const linkAssinatura = `${urlBase()}/assinar/${os.tokenAssinatura}`;
  const checklist = os.checklist || [];
  const concluidos = checklist.filter((c) => c.concluido).length;
  const itens = os.itens || [];
  const assinaturas = os.assinaturas || [];
  const fotos = os.fotos || [];
  const lucro = (os.valorTotal || 0) - (os.comissaoValor || 0);

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/ordens"
            className="inline-flex items-center gap-1 text-xs font-semibold text-suave hover:text-marca-600"
          >
            <ArrowLeft size={14} /> Ordens de serviço
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-suave">
              {osNumero(os.numero)}
            </span>
            <StatusOrdem status={os.status} />
            {os.pago ? (
              <Etiqueta cor="bg-marca-50 text-marca-700 ring-marca-200">
                <CircleDollarSign size={12} /> Pago
              </Etiqueta>
            ) : (
              os.status === "CONCLUIDA" && (
                <Etiqueta cor="bg-amber-50 text-amber-700 ring-amber-200">
                  A receber
                </Etiqueta>
              )
            )}
            {orcamento && (
              <Link href={`/orcamentos/${orcamento.id}`}>
                <Etiqueta cor="bg-sky-50 text-sky-700 ring-sky-200">
                  Vindo do ORC-{String(orcamento.numero).padStart(4, "0")}
                </Etiqueta>
              </Link>
            )}
          </div>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-texto sm:text-2xl">
            {os.titulo}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/comprovante/${os.id}`}
            target="_blank"
            className="btn btn-claro"
          >
            <Printer size={15} /> Comprovante
          </Link>

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
            inicial={{
              id: os.id,
              titulo: os.titulo,
              descricao: os.descricao ?? null,
              clienteId: os.clienteId,
              montadorId: os.montadorId ?? null,
              endereco: os.endereco ?? null,
              cidade: os.cidade ?? null,
              dataAgendada: os.dataAgendada ?? null,
              valorTotal: os.valorTotal,
              comissaoPercent: os.comissaoPercent,
              formaPagamento: os.formaPagamento,
              observacoes: os.observacoes ?? null,
              temItens: itens.length > 0,
            }}
            rotuloBotao="Editar OS"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          {/* Dados gerais */}
          <Painel titulo="Dados do atendimento">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info rotulo="Cliente">
                <Link
                  href={`/clientes?q=${encodeURIComponent(cliente?.nome || "")}`}
                  className="hover:text-marca-600 hover:underline"
                >
                  {cliente?.nome || "Cliente"}
                </Link>
              </Info>

              <Info rotulo="Contato">
                {cliente?.telefone ? (
                  <a
                    href={`https://wa.me/${whatsapp(cliente.telefone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-marca-600"
                  >
                    <Phone size={13} /> {fmtTelefone(cliente.telefone)}
                  </a>
                ) : (
                  <span className="text-suave">Não informado</span>
                )}
              </Info>

              <Info rotulo="Montador">
                {montador ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: montador.corAvatar }}
                    >
                      {iniciais(montador.nome)}
                    </span>
                    {montador.nome}
                  </span>
                ) : (
                  <span className="text-suave">Não atribuído</span>
                )}
              </Info>

              <Info rotulo="Agendamento">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-suave" />
                  {fmtData(os.dataAgendada)}
                </span>
              </Info>

              <Info rotulo="Endereço">
                {os.endereco || os.cidade ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [os.endereco, os.cidade].filter(Boolean).join(", ")
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-1.5 hover:text-marca-600"
                  >
                    <MapPin size={13} className="mt-0.5 shrink-0 text-suave" />
                    {[os.endereco, os.cidade].filter(Boolean).join(" — ")}
                  </a>
                ) : (
                  <span className="text-suave">Não informado</span>
                )}
              </Info>

              <Info rotulo="Forma de pagamento">
                {FORMAS_PAGAMENTO[os.formaPagamento as keyof typeof FORMAS_PAGAMENTO] ??
                  os.formaPagamento}
              </Info>

              {os.descricao && (
                <div className="sm:col-span-2">
                  <Info rotulo="Descrição">
                    <span className="whitespace-pre-line font-normal leading-relaxed">
                      {os.descricao}
                    </span>
                  </Info>
                </div>
              )}

              {os.observacoes && (
                <div className="sm:col-span-2">
                  <Info rotulo="Observações internas">
                    <span className="whitespace-pre-line font-normal leading-relaxed text-suave">
                      {os.observacoes}
                    </span>
                  </Info>
                </div>
              )}
            </dl>
          </Painel>

          <ItensOrdem
            ordemId={os.id}
            itens={itens.map((i) => ({
              id: i.id,
              descricao: i.descricao,
              quantidade: i.quantidade,
              valorUnitario: i.valorUnitario,
            }))}
            valorTotal={os.valorTotal}
            bloqueado={os.status === "CONCLUIDA"}
          />

          <ChecklistOrdem
            ordemId={os.id}
            itens={checklist.map((c) => ({
              id: c.id,
              descricao: c.descricao,
              concluido: c.concluido,
            }))}
            concluidos={concluidos}
          />

          {fotos.length > 0 && (
            <Painel
              titulo="Registro fotográfico"
              descricao={`${fotos.length} foto(s) enviadas pelo montador`}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fotos.map((f) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <figure key={f.id} className="overflow-hidden rounded-xl border border-borda">
                    <img
                      src={f.dataUrl}
                      alt={f.legenda ?? "Registro do serviço"}
                      className="aspect-4/3 w-full object-cover"
                    />
                    <figcaption className="px-2 py-1.5 text-[11px] text-suave">
                      {f.etapa === "ANTES" ? "Antes" : "Depois"}
                      {f.legenda ? ` · ${f.legenda}` : ""}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Painel>
          )}

          <BlocoAssinaturas
            ordemId={os.id}
            linkAssinatura={linkAssinatura}
            clienteNome={cliente?.nome || "Cliente"}
            telefoneCliente={cliente?.telefone ?? null}
            osNum={osNumero(os.numero)}
            assinaturas={assinaturas.map((a) => ({
              id: a.id,
              tipo: a.tipo,
              nome: a.nome,
              documento: a.documento ?? null,
              imagem: a.imagem,
              hash: a.hash,
              ip: a.ip ?? null,
              userAgent: a.userAgent ?? null,
              assinadoEm: a.assinadoEm,
            }))}
          />
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">
          <Painel titulo="Resumo financeiro">
            <dl className="space-y-3">
              <Linha rotulo="Valor do serviço" valor={moeda(os.valorTotal)} destaque />
              <Linha
                rotulo={`Comissão do montador (${os.comissaoPercent}%)`}
                valor={`− ${moeda(os.comissaoValor)}`}
                cor="text-rose-600"
              />
              <div className="border-t border-borda pt-3">
                <Linha
                  rotulo="Lucro da empresa"
                  valor={moeda(lucro)}
                  cor="text-marca-600"
                  destaque
                />
              </div>
            </dl>

            <form action={alternarPagamento} className="mt-4">
              <input type="hidden" name="id" value={os.id} />
              <button
                type="submit"
                className={`btn w-full ${os.pago ? "btn-claro" : "btn-principal"}`}
              >
                <CircleDollarSign size={15} />
                {os.pago ? "Marcar como não recebido" : "Marcar como recebido"}
              </button>
            </form>

            {todosLancamentos.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-borda pt-3">
                {todosLancamentos.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-suave">
                      {l.tipo === "RECEITA" ? "Receita" : "Despesa"} ·{" "}
                      {l.status === "CONFIRMADO" ? "confirmada" : l.status.toLowerCase()}
                    </span>
                    <span
                      className={`shrink-0 font-semibold ${
                        l.tipo === "RECEITA" ? "text-marca-600" : "text-rose-600"
                      }`}
                    >
                      {l.tipo === "RECEITA" ? "+" : "−"} {moeda(l.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Painel>

          <Painel titulo="Situação da OS" descricao="Altere manualmente se necessário">
            <div className="grid gap-2">
              {Object.entries(STATUS_OS).map(([chave, rotulo]) => (
                <form key={chave} action={alterarStatus}>
                  <input type="hidden" name="id" value={os.id} />
                  <input type="hidden" name="status" value={chave} />
                  <button
                    type="submit"
                    disabled={os.status === chave}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      os.status === chave
                        ? "border-marca-200 bg-marca-50 text-marca-700"
                        : "border-borda text-suave hover:bg-[#f7f9f8] hover:text-texto"
                    }`}
                  >
                    {rotulo}
                    {os.status === chave && <CheckCircle2 size={14} />}
                  </button>
                </form>
              ))}
            </div>

            <p className="mt-3 rounded-lg bg-[#f7f9f8] px-3 py-2 text-[11px] leading-relaxed text-suave">
              A OS é concluída automaticamente quando montador e cliente assinam.
              A conclusão dispara a receita e a comissão no financeiro.
            </p>
          </Painel>

          {/* Avaliação do cliente */}
          {os.avaliacaoNota && (
            <Painel titulo="Avaliação do cliente">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < (os.avaliacaoNota ?? 0)
                        ? "fill-ouro-400 text-ouro-400"
                        : "text-borda"
                    }
                  />
                ))}
                <span className="ml-1.5 text-sm font-bold text-texto">
                  {os.avaliacaoNota}/5
                </span>
              </div>
              {os.avaliacaoComentario && (
                <p className="mt-2 text-sm italic leading-relaxed text-suave">
                  “{os.avaliacaoComentario}”
                </p>
              )}
            </Painel>
          )}

          <Painel titulo="Link de assinatura do cliente">
            <p className="text-xs leading-relaxed text-suave">
              Envie este link se o cliente preferir assinar pelo próprio celular,
              sem precisar do aparelho do montador.
            </p>
            <div className="mt-3 rounded-lg bg-[#f7f9f8] p-2.5">
              <code className="block break-all text-[11px] text-texto">
                {linkAssinatura}
              </code>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <BotaoCopiar texto={linkAssinatura} rotulo="Copiar link" />
              {cliente?.telefone && (
                <a
                  href={`https://wa.me/${whatsapp(cliente.telefone)}?text=${encodeURIComponent(
                    `Olá, ${cliente.nome}! Aqui é da EC Montagens de Móveis. Para finalizar a ${osNumero(os.numero)}, assine digitalmente o termo de conclusão: ${linkAssinatura}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-principal"
                >
                  <FileSignature size={15} /> Enviar no WhatsApp
                </a>
              )}
            </div>
          </Painel>

          {/* Histórico */}
          <Painel titulo="Linha do tempo">
            <ol className="space-y-3 text-xs">
              <Evento rotulo="OS criada" quando={dataHora(os.criadoEm)} />
              {os.dataInicio && (
                <Evento rotulo="Execução iniciada" quando={dataHora(os.dataInicio)} />
              )}
              {assinaturas.map((a) => (
                <Evento
                  key={a.id}
                  rotulo={`Assinatura ${a.tipo === "MONTADOR" ? "do montador" : "do cliente"}`}
                  quando={dataHora(a.assinadoEm)}
                />
              ))}
              {os.dataConclusao && (
                <Evento
                  rotulo="Serviço concluído"
                  quando={dataHora(os.dataConclusao)}
                  ultimo
                />
              )}
            </ol>
          </Painel>

          {assinaturas.length === 0 && (
            <FormConfirmar
              action={excluirOrdem}
              mensagem={`Excluir definitivamente a ${osNumero(os.numero)}?`}
            >
              <input type="hidden" name="id" value={os.id} />
              <button type="submit" className="btn btn-perigo w-full">
                <Trash2 size={15} /> Excluir ordem de serviço
              </button>
            </FormConfirmar>
          )}
        </div>
      </div>
    </>
  );
}

function Linha({
  rotulo,
  valor,
  cor = "text-texto",
  destaque,
}: {
  rotulo: string;
  valor: string;
  cor?: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-suave">{rotulo}</dt>
      <dd className={`${destaque ? "text-lg font-bold" : "text-sm font-semibold"} ${cor}`}>
        {valor}
      </dd>
    </div>
  );
}

function Evento({
  rotulo,
  quando,
  ultimo,
}: {
  rotulo: string;
  quando: string;
  ultimo?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span className="relative flex flex-col items-center">
        <span
          className={`mt-1 h-2 w-2 rounded-full ${ultimo ? "bg-marca-500" : "bg-borda"}`}
        />
        <span className="w-px flex-1 bg-borda" aria-hidden />
      </span>
      <span className="pb-1">
        <span className="block font-semibold text-texto">{rotulo}</span>
        <span className="block text-suave">{quando}</span>
      </span>
    </li>
  );
}
