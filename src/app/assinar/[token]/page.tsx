import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { dbOrdens, dbClientes, dbUsuarios } from "@/lib/firestore";
import { moeda, osNumero, data as fmtData, dataHora } from "@/lib/format";
import { Marca } from "@/components/marca";
import { FormularioAssinaturaCliente } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Termo de conclusão de serviço" };

export default async function PaginaAssinar({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [os, todosClientes, todosUsuarios] = await Promise.all([
    dbOrdens.buscarPorTokenAssinatura(token),
    dbClientes.listar(),
    dbUsuarios.listar(),
  ]);

  if (!os) notFound();

  const cliente = todosClientes.find((c) => c.id === os.clienteId);
  const montador = os.montadorId
    ? todosUsuarios.find((u) => u.id === os.montadorId)
    : null;

  const assinaturas = os.assinaturas || [];
  const jaAssinou = assinaturas.find((a) => a.tipo === "CLIENTE");
  const montadorAssinou = assinaturas.find((a) => a.tipo === "MONTADOR");
  const cancelada = os.status === "CANCELADA";
  const checklist = os.checklist || [];
  const concluidos = checklist.filter((c) => c.concluido).length;
  const itens = os.itens || [];

  return (
    <div className="min-h-dvh bg-tela">
      {/* Topo institucional */}
      <header className="bg-gradient-to-br from-marca-900 via-marca-700 to-marca-600 px-5 py-6 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <Marca tamanho={44} claro />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-marca-100/70">
              Termo de conclusão
            </p>
            <p className="font-mono text-sm font-bold">{osNumero(os.numero)}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-5">
        {cancelada ? (
          <div className="cartao p-6 text-center">
            <p className="text-sm font-semibold text-texto">
              Esta ordem de serviço foi cancelada.
            </p>
            <p className="mt-1 text-xs text-suave">
              Entre em contato com a EC Montagens de Móveis para mais informações.
            </p>
          </div>
        ) : jaAssinou ? (
          <div className="cartao overflow-hidden">
            <div className="bg-marca-50 px-5 py-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-marca-500 text-white">
                <CheckCircle2 size={28} />
              </span>
              <h1 className="mt-3 text-lg font-bold text-marca-800">
                Assinatura registrada!
              </h1>
              <p className="mt-1 text-sm text-marca-700">
                Obrigado, {jaAssinou.nome.split(" ")[0]}. Seu aceite foi confirmado em{" "}
                {dataHora(jaAssinou.assinadoEm)}.
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs leading-relaxed text-suave">
                A EC Montagens de Móveis recebeu o termo assinado no painel
                administrativo. Guarde o número{" "}
                <strong className="font-mono text-texto">{osNumero(os.numero)}</strong>{" "}
                para qualquer contato futuro sobre este serviço.
              </p>
              <div className="mt-3 rounded-lg bg-[#f7f9f8] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-suave">
                  Código de autenticidade
                </p>
                <p className="mt-1 break-all font-mono text-[10px] text-texto">
                  {jaAssinou.hash}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Resumo do serviço */}
            <section className="cartao p-5">
              <h1 className="text-lg font-bold tracking-tight text-texto">
                Confirmação de serviço concluído
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-suave">
                Olá, <strong className="text-texto">{cliente?.nome || "Cliente"}</strong>. Confira
                abaixo os dados do serviço e, estando tudo certo, assine para
                registrar o aceite.
              </p>

              <dl className="mt-5 space-y-3 border-t border-borda pt-4 text-sm">
                <Linha rotulo="Serviço">{os.titulo}</Linha>
                {montador && <Linha rotulo="Montador">{montador.nome}</Linha>}
                {(os.endereco || os.cidade) && (
                  <Linha rotulo="Local">
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-suave" />
                      {[os.endereco, os.cidade].filter(Boolean).join(" — ")}
                    </span>
                  </Linha>
                )}
                <Linha rotulo="Data">
                  {fmtData(os.dataConclusao ?? os.dataInicio ?? os.dataAgendada)}
                </Linha>
              </dl>

              {itens.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-borda pt-4">
                  {itens.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-baseline justify-between gap-3 text-xs"
                    >
                      <span className="min-w-0 text-suave">
                        {i.quantidade % 1 === 0 ? i.quantidade : i.quantidade.toFixed(2)}
                        × {i.descricao}
                      </span>
                      <span className="shrink-0 font-semibold text-texto">
                        {moeda(i.quantidade * i.valorUnitario)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex items-center justify-between rounded-xl bg-marca-50 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-marca-700">
                  Valor total
                </span>
                <span className="text-xl font-extrabold text-marca-800">
                  {moeda(os.valorTotal)}
                </span>
              </div>
            </section>

            {/* Checklist */}
            {checklist.length > 0 && (
              <section className="cartao p-5">
                <h2 className="text-sm font-bold text-texto">
                  O que foi executado
                  <span className="ml-1.5 text-xs font-medium text-suave">
                    ({concluidos} de {checklist.length})
                  </span>
                </h2>
                <ul className="mt-3 space-y-2">
                  {checklist.map((c) => (
                    <li key={c.id} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md ${
                          c.concluido
                            ? "bg-marca-500 text-white"
                            : "bg-[#eef2f0] text-transparent"
                        }`}
                        style={{ height: 18, width: 18 }}
                      >
                        <CheckCircle2 size={12} />
                      </span>
                      <span className={c.concluido ? "text-texto" : "text-suave"}>
                        {c.descricao}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Declaração + assinatura */}
            <section className="cartao p-5">
              <p className="rounded-lg bg-[#f7f9f8] p-3.5 text-xs leading-relaxed text-texto">
                Declaro que o serviço acima foi{" "}
                <strong>executado e entregue integralmente</strong>, que o local foi
                limpo e as embalagens retiradas, e que recebi as orientações de uso e
                conservação. Ao assinar, confirmo o aceite do serviço prestado pela
                EC Montagens de Móveis.
              </p>

              {!montadorAssinou && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                  O montador ainda não assinou este termo. Sua assinatura será
                  registrada normalmente e a OS será concluída quando ele assinar.
                </p>
              )}

              <div className="mt-5">
                <FormularioAssinaturaCliente
                  ordemId={os.id}
                  nomeSugerido={cliente?.nome || ""}
                  documentoSugerido={cliente?.documento ?? null}
                />
              </div>
            </section>

            <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-suave">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-marca-500" />
              Registramos data, hora, endereço de rede e um código de integridade
              (hash SHA-256) junto da sua assinatura, garantindo a autenticidade do
              documento para as duas partes.
            </p>
          </>
        )}
      </main>

      <footer className="px-5 pb-8 pt-2 text-center text-[11px] text-suave">
        EC Montagens de Móveis · Qualidade • Detalhes • Confiança
      </footer>
    </div>
  );
}

function Linha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-suave">
        {rotulo}
      </dt>
      <dd className="min-w-0 text-right font-medium text-texto">{children}</dd>
    </div>
  );
}
