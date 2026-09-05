/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { dbOrdens, dbClientes, dbUsuarios } from "@/lib/firestore";
import { exigirSessao } from "@/lib/auth";
import { FORMAS_PAGAMENTO, STATUS_OS } from "@/lib/constants";
import {
  data as fmtData,
  dataExtenso,
  dataHora,
  moeda,
  osNumero,
  telefone as fmtTelefone,
} from "@/lib/format";
import { BotaoImprimir } from "./imprimir";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const os = await dbOrdens.buscarPorId(id);
  return {
    title: os ? `Termo de Conclusão ${osNumero(os.numero)}` : "Comprovante",
  };
}

export default async function PaginaComprovante({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirSessao();
  const { id } = await params;

  const [os, todosClientes, todosUsuarios] = await Promise.all([
    dbOrdens.buscarPorId(id),
    dbClientes.listar(),
    dbUsuarios.listar(),
  ]);
  if (!os) notFound();

  const clienteObj = todosClientes.find((c) => c.id === os.clienteId);
  const montadorObj = os.montadorId
    ? todosUsuarios.find((u) => u.id === os.montadorId)
    : null;

  const assinaturas = os.assinaturas || [];
  const montadorAssinatura = assinaturas.find((a) => a.tipo === "MONTADOR");
  const clienteAssinatura = assinaturas.find((a) => a.tipo === "CLIENTE");

  const enderecoCliente = clienteObj
    ? [
        clienteObj.endereco,
        clienteObj.numero,
        clienteObj.complemento,
        clienteObj.bairro,
        clienteObj.cidade,
        clienteObj.estado,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const itens = os.itens || [];
  const checklist = os.checklist || [];

  return (
    <div className="min-h-dvh bg-[#eef1f0] py-6 print:bg-white print:py-0">
      <div className="sem-impressao mx-auto mb-4 flex max-w-[820px] items-center justify-between gap-3 px-4">
        <a
          href={`/ordens/${os.id}`}
          className="text-xs font-semibold text-suave hover:text-marca-600"
        >
          ← Voltar para a ordem de serviço
        </a>
        <BotaoImprimir />
      </div>

      <article className="mx-auto max-w-[820px] bg-white px-8 py-10 shadow-[var(--shadow-card)] print:max-w-none print:px-0 print:py-0 print:shadow-none">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-marca-500 pb-5">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" width={62} height={62} className="rounded-full" />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-marca-800">
                EC MONTAGENS DE MÓVEIS
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ouro-600">
                Qualidade • Detalhes • Confiança
              </p>
              <p className="mt-1 text-[11px] text-suave">
                Montagem · Desmontagem · Planejados · Reparos
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-suave">
              Termo de conclusão
            </p>
            <p className="font-mono text-xl font-bold text-texto">{osNumero(os.numero)}</p>
            <p className="mt-0.5 text-[11px] text-suave">
              {STATUS_OS[os.status as keyof typeof STATUS_OS] ?? os.status}
            </p>
          </div>
        </header>

        {/* Partes */}
        <section className="quebra-pagina mt-6 grid grid-cols-2 gap-6">
          <div>
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-suave">
              Contratante
            </h2>
            <p className="text-sm font-bold text-texto">{clienteObj?.nome || "Cliente"}</p>
            {clienteObj?.documento && (
              <p className="text-xs text-suave">Doc.: {clienteObj.documento}</p>
            )}
            {clienteObj?.telefone && (
              <p className="text-xs text-suave">{fmtTelefone(clienteObj.telefone)}</p>
            )}
            {clienteObj?.email && <p className="text-xs text-suave">{clienteObj.email}</p>}
            {enderecoCliente && (
              <p className="mt-1 text-xs leading-relaxed text-suave">{enderecoCliente}</p>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-suave">
              Execução
            </h2>
            <p className="text-sm font-bold text-texto">
              {montadorObj?.nome ?? "Equipe EC Montagens"}
            </p>
            {montadorObj?.documento && (
              <p className="text-xs text-suave">Doc.: {montadorObj.documento}</p>
            )}
            <dl className="mt-2 space-y-0.5 text-xs text-suave">
              <div className="flex gap-2">
                <dt className="font-semibold text-texto">Agendado:</dt>
                <dd>{fmtData(os.dataAgendada)}</dd>
              </div>
              {os.dataInicio && (
                <div className="flex gap-2">
                  <dt className="font-semibold text-texto">Início:</dt>
                  <dd>{dataHora(os.dataInicio)}</dd>
                </div>
              )}
              {os.dataConclusao && (
                <div className="flex gap-2">
                  <dt className="font-semibold text-texto">Conclusão:</dt>
                  <dd>{dataHora(os.dataConclusao)}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* Serviço */}
        <section className="quebra-pagina mt-6 rounded-lg bg-[#f7f9f8] p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-suave">
            Serviço executado
          </h2>
          <p className="mt-1.5 text-sm font-bold text-texto">{os.titulo}</p>
          {os.descricao && (
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-suave">
              {os.descricao}
            </p>
          )}
          {(os.endereco || os.cidade) && (
            <p className="mt-2 text-xs text-suave">
              <span className="font-semibold text-texto">Local: </span>
              {[os.endereco, os.cidade].filter(Boolean).join(" — ")}
            </p>
          )}
        </section>

        {/* Itens */}
        {itens.length > 0 && (
          <section className="quebra-pagina mt-6">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-suave">
              Discriminação dos itens
            </h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-borda text-left text-[10px] uppercase tracking-wider text-suave">
                  <th className="py-2">Descrição</th>
                  <th className="py-2 text-center">Qtd.</th>
                  <th className="py-2 text-right">Unitário</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => (
                  <tr key={i.id} className="border-b border-[#f1f4f3]">
                    <td className="py-2 text-texto">{i.descricao}</td>
                    <td className="py-2 text-center text-suave">
                      {i.quantidade % 1 === 0 ? i.quantidade : i.quantidade.toFixed(2)}
                    </td>
                    <td className="py-2 text-right text-suave">{moeda(i.valorUnitario)}</td>
                    <td className="py-2 text-right font-semibold text-texto">
                      {moeda(i.quantidade * i.valorUnitario)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Total */}
        <section className="quebra-pagina mt-4 flex items-center justify-between rounded-lg border-2 border-marca-500 bg-marca-50 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-marca-700">
              Valor total do serviço
            </p>
            <p className="text-[11px] text-marca-700/80">
              Pagamento:{" "}
              {FORMAS_PAGAMENTO[os.formaPagamento as keyof typeof FORMAS_PAGAMENTO] ??
                os.formaPagamento}{" "}
              · {os.pago ? "Recebido" : "A receber"}
            </p>
          </div>
          <p className="text-2xl font-extrabold text-marca-800">{moeda(os.valorTotal)}</p>
        </section>

        {/* Checklist */}
        {checklist.length > 0 && (
          <section className="quebra-pagina mt-6">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-suave">
              Checklist de qualidade
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {checklist.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-[3px] grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border text-[9px] font-bold ${
                      c.concluido
                        ? "border-marca-500 bg-marca-500 text-white"
                        : "border-borda text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={c.concluido ? "text-texto" : "text-suave"}>
                    {c.descricao}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Declaração */}
        <section className="quebra-pagina mt-7 rounded-lg border border-borda p-4">
          <p className="text-xs leading-relaxed text-texto">
            Declaro, para os devidos fins, que o serviço descrito neste termo foi
            <strong> executado e entregue integralmente</strong>, que o local foi
            devidamente limpo e as embalagens retiradas, e que recebi as orientações
            de uso e conservação dos móveis. As partes abaixo assinam digitalmente,
            reconhecendo a conclusão do serviço e a exatidão das informações aqui
            registradas.
          </p>
        </section>

        {/* Assinaturas */}
        <section className="quebra-pagina mt-7 grid grid-cols-2 gap-8">
          <AssinaturaImpressa
            papel="Montador responsável"
            assinatura={montadorAssinatura}
            fallback={montadorObj?.nome}
          />
          <AssinaturaImpressa
            papel="Cliente / Contratante"
            assinatura={clienteAssinatura}
            fallback={clienteObj?.nome}
          />
        </section>

        {/* Autenticidade */}
        {(montadorAssinatura || clienteAssinatura) && (
          <section className="quebra-pagina mt-7 rounded-lg bg-[#f7f9f8] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-marca-700">
              <ShieldCheck size={12} /> Registro de autenticidade
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4 text-[10px] leading-relaxed text-suave">
              {[montadorAssinatura, clienteAssinatura].filter(Boolean).map((a) => (
                <div key={a!.id}>
                  <p className="font-semibold text-texto">
                    {a!.tipo === "MONTADOR" ? "Montador" : "Cliente"}: {a!.nome}
                  </p>
                  <p>Assinado em {dataHora(a!.assinadoEm)}</p>
                  {a!.ip && <p>Origem: {a!.ip}</p>}
                  <p className="mt-0.5 break-all font-mono">SHA-256: {a!.hash}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-borda pt-2 text-[9px] leading-relaxed text-suave">
              Documento gerado eletronicamente pelo sistema de gestão da EC Montagens de
              Móveis. As assinaturas foram coletadas em meio digital com registro de
              data, hora, endereço de rede e código de integridade (hash SHA-256),
              conforme o Art. 10, §2º da MP 2.200-2/2001, que admite a validade de
              documentos eletrônicos assinados por forma acordada entre as partes.
            </p>
          </section>
        )}

        <footer className="mt-8 border-t border-borda pt-3 text-center text-[10px] text-suave">
          {os.cidade ? `${os.cidade}, ` : ""}
          {dataExtenso(os.dataConclusao ?? new Date())} · EC Montagens de Móveis ·{" "}
          {osNumero(os.numero)}
        </footer>
      </article>
    </div>
  );
}

function AssinaturaImpressa({
  papel,
  assinatura,
  fallback,
}: {
  papel: string;
  assinatura?: {
    nome: string;
    documento?: string | null;
    imagem: string;
    assinadoEm: string;
  };
  fallback?: string;
}) {
  return (
    <div className="text-center">
      <div className="grid h-24 place-items-end pb-1">
        {assinatura ? (
          <img
            src={assinatura.imagem}
            alt={`Assinatura de ${assinatura.nome}`}
            className="max-h-20 w-auto max-w-full object-contain"
          />
        ) : (
          <span className="pb-2 text-[10px] italic text-suave">
            Aguardando assinatura
          </span>
        )}
      </div>
      <div className="border-t border-texto pt-1.5">
        <p className="text-xs font-bold text-texto">
          {assinatura?.nome ?? fallback ?? "—"}
        </p>
        <p className="text-[10px] text-suave">{papel}</p>
        {assinatura?.documento && (
          <p className="text-[10px] text-suave">Doc.: {assinatura.documento}</p>
        )}
        {assinatura && (
          <p className="mt-0.5 text-[9px] text-suave">
            {dataHora(assinatura.assinadoEm)}
          </p>
        )}
      </div>
    </div>
  );
}
