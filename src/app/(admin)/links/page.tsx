import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  Eye,
  ExternalLink,
  Inbox,
  Link2,
  MessageCircle,
  Power,
  Trash2,
} from "lucide-react";
import { dbLinks, dbUsuarios, dbOrcamentos } from "@/lib/firestore";
import { urlBase } from "@/lib/negocio";
import { data as fmtData, dataHora } from "@/lib/format";
import { Etiqueta, Painel, Vazio } from "@/components/ui";
import { BotaoCopiar, FormConfirmar } from "@/components/form";
import { alternarLink, excluirLink } from "@/app/actions/links";
import { GerarLink } from "./gerar-link";
import { ConfigurarAgenda } from "./configurar-agenda";
import { obterAgendaConfig, DIAS_SEMANA_NOMES } from "@/lib/agenda";

export const metadata: Metadata = { title: "Link para Cliente" };
export const dynamic = "force-dynamic";

export default async function PaginaLinks() {
  const base = urlBase();

  const [links, usuarios, orcamentos, agendaConfig] = await Promise.all([
    dbLinks.listar(),
    dbUsuarios.listar(),
    dbOrcamentos.listar(),
    obterAgendaConfig(),
  ]);

  const usuariosMap = new Map(usuarios.map((u) => [u.id, u]));
  const orcamentosCountMap = new Map<string, number>();
  orcamentos.forEach((o) => {
    if (o.linkId) {
      orcamentosCountMap.set(
        o.linkId,
        (orcamentosCountMap.get(o.linkId) || 0) + 1
      );
    }
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm leading-relaxed text-suave">
          Gere links personalizados ou compartilhe o link direto com os clientes. Eles
          agendam a data e o horário pelo celular e a solicitação chega direto em{" "}
          <Link href="/orcamentos" className="font-semibold text-marca-600 hover:underline">
            Orçamentos Recebidos
          </Link>
          .
        </p>
        <GerarLink />
      </div>

      {/* Card de Configuração da Agenda */}
      <div className="rounded-2xl border-2 border-black bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                <CalendarClock size={13} /> Agenda de Atendimentos
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-white">
              Datas & Horários Disponíveis para o Cliente Agendar
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              O cliente verá estes dias e horários no calendário do link de orçamento:
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="font-bold text-emerald-400">Dias de atendimento:</span>{" "}
                {agendaConfig.diasSemana
                  .map((id) => DIAS_SEMANA_NOMES.find((s) => s.id === id)?.sigla)
                  .filter(Boolean)
                  .join(", ")}
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="font-bold text-emerald-400">Horários:</span>{" "}
                <span className="font-mono font-bold text-emerald-200">
                  {agendaConfig.horarios.join(" · ")}
                </span>
              </div>
            </div>
          </div>

          <ConfigurarAgenda config={agendaConfig} />
        </div>
      </div>


      {links.length === 0 ? (
        <Painel semPadding>
          <Vazio
            icone={<Link2 size={20} />}
            titulo="Nenhum link gerado ainda"
            descricao="Crie o primeiro link público de orçamento para começar a receber solicitações."
          />
        </Painel>
      ) : (
        <div className="space-y-4">
          {links.map((l) => {
            const url = `${base}/orcamento/${l.token}`;
            const expirado = !!l.expiraEm && new Date(l.expiraEm).getTime() < Date.now();
            const ativo = l.ativo && !expirado;
            const criadoPor = l.criadoPorId ? usuariosMap.get(l.criadoPorId) : null;
            const orcamentosCount = orcamentosCountMap.get(l.id) || 0;

            const mensagem = encodeURIComponent(
              `Olá! Aqui é da *EC Montagens de Móveis*. 🛠️\n\n` +
                `Para prepararmos seu orçamento, é só preencher este formulário rápido:\n${url}\n\n` +
                `Qualquer dúvida, estamos à disposição!`
            );

            return (
              <article key={l.id} className="cartao p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-texto">{l.titulo}</h3>
                      {ativo ? (
                        <Etiqueta cor="bg-marca-50 text-marca-700 ring-marca-200">
                          Ativo
                        </Etiqueta>
                      ) : (
                        <Etiqueta cor="bg-slate-100 text-slate-600 ring-slate-200">
                          {expirado ? "Expirado" : "Desativado"}
                        </Etiqueta>
                      )}
                    </div>

                    {l.mensagem && (
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-suave">
                        {l.mensagem}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-suave">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {l.acessos} acesso(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <Inbox size={12} /> {orcamentosCount} orçamento(s) recebido(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock size={12} /> criado em {dataHora(l.criadoEm)}
                      </span>
                      {l.expiraEm && (
                        <span className="flex items-center gap-1">
                          expira em {fmtData(l.expiraEm)}
                        </span>
                      )}
                      {criadoPor && <span>por {criadoPor.nome}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <form action={alternarLink}>
                      <input type="hidden" name="id" value={l.id} />
                      <button
                        type="submit"
                        title={l.ativo ? "Desativar link" : "Reativar link"}
                        className="btn btn-fantasma !p-1.5"
                      >
                        <Power size={15} className={l.ativo ? "" : "text-rose-500"} />
                      </button>
                    </form>

                    <FormConfirmar
                      action={excluirLink}
                      mensagem={`Excluir o link "${l.titulo}"? Os orçamentos já recebidos são mantidos.`}
                    >
                      <input type="hidden" name="id" value={l.id} />
                      <button
                        type="submit"
                        title="Excluir link"
                        className="btn btn-fantasma !p-1.5 hover:!text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </FormConfirmar>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-[#f7f9f8] p-2.5">
                  <code className="block break-all text-[11px] text-texto">{url}</code>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <BotaoCopiar texto={url} rotulo="Copiar link" />
                  <a
                    href={`https://wa.me/?text=${mensagem}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-principal"
                  >
                    <MessageCircle size={15} /> Enviar por WhatsApp
                  </a>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-fantasma"
                  >
                    <ExternalLink size={15} /> Abrir formulário
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Painel titulo="Como funciona">
        <ol className="space-y-3 text-sm text-suave">
          {[
            "Você gera o link e envia ao cliente pelo WhatsApp, e-mail ou redes sociais.",
            "O cliente abre no celular e descreve o móvel, a quantidade de itens e o endereço.",
            "A solicitação chega em Orçamentos Recebidos com aviso no painel.",
            "Você define o valor, responde pelo WhatsApp e converte em ordem de serviço com um clique.",
          ].map((texto, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-marca-50 text-xs font-bold text-marca-700">
                {i + 1}
              </span>
              <span className="leading-relaxed">{texto}</span>
            </li>
          ))}
        </ol>
      </Painel>
    </>
  );
}
