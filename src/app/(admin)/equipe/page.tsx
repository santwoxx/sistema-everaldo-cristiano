import type { Metadata } from "next";
import {
  KeyRound,
  Mail,
  Phone,
  Power,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { dbUsuarios } from "@/lib/firestore";
import { desempenhoMontadores } from "@/lib/financeiro";
import {
  dataHora,
  iniciais,
  moeda,
  telefone as fmtTelefone,
} from "@/lib/format";
import { Etiqueta, Painel } from "@/components/ui";
import { FormularioUsuario } from "./formulario-usuario";
import { alternarAtivo } from "@/app/actions/equipe";

export const metadata: Metadata = { title: "Equipe & Logins" };
export const dynamic = "force-dynamic";

export default async function PaginaEquipe() {
  const [usuarios, desempenho] = await Promise.all([
    dbUsuarios.listar(),
    desempenhoMontadores(),
  ]);

  const porId = new Map(desempenho.map((d) => [d.id, d]));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-suave">
          Cada montador recebe um login próprio e acessa o app de campo para
          executar as ordens e coletar as assinaturas.
        </p>
        <FormularioUsuario />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {usuarios.map((u) => {
          const stats = porId.get(u.id);
          const admin = u.papel === "ADMIN";

          return (
            <article key={u.id} className="cartao p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ background: u.corAvatar }}
                >
                  {iniciais(u.nome)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-texto">{u.nome}</h3>
                    <Etiqueta
                      cor={
                        admin
                          ? "bg-marca-50 text-marca-700 ring-marca-200"
                          : "bg-sky-50 text-sky-700 ring-sky-200"
                      }
                    >
                      {admin ? (
                        <>
                          <ShieldCheck size={11} /> Administrador
                        </>
                      ) : (
                        <>
                          <Smartphone size={11} /> Montador
                        </>
                      )}
                    </Etiqueta>
                    {!u.ativo && (
                      <Etiqueta cor="bg-slate-100 text-slate-600 ring-slate-200">
                        Inativo
                      </Etiqueta>
                    )}
                  </div>

                  <dl className="mt-2 space-y-1 text-xs text-suave">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    {u.telefone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="shrink-0" />
                        {fmtTelefone(u.telefone)}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <KeyRound size={12} className="shrink-0" />
                      {u.ultimoAcesso
                        ? `Último acesso em ${dataHora(u.ultimoAcesso)}`
                        : "Ainda não acessou o sistema"}
                    </div>
                  </dl>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <FormularioUsuario
                    inicial={{
                      id: u.id,
                      nome: u.nome,
                      email: u.email,
                      papel: u.papel,
                      telefone: u.telefone ?? null,
                      documento: u.documento ?? null,
                      comissaoPadrao: u.comissaoPadrao,
                      ativo: u.ativo,
                    }}
                  />
                  <form action={alternarAtivo}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      title={u.ativo ? "Desativar acesso" : "Reativar acesso"}
                      className="btn btn-fantasma !p-1.5"
                    >
                      <Power size={14} className={u.ativo ? "" : "text-rose-500"} />
                    </button>
                  </form>
                </div>
              </div>

              {!admin && stats && (
                <div className="mt-4 grid grid-cols-4 gap-2 border-t border-borda pt-3 text-center">
                  <Metric valor={String(stats.concluidas)} rotulo="Concluídas" />
                  <Metric valor={String(stats.andamento)} rotulo="Em aberto" />
                  <Metric valor={`${u.comissaoPadrao}%`} rotulo="Comissão" />
                  <Metric
                    valor={moeda(stats.comissao)}
                    rotulo="Acumulado"
                    destaque
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Painel titulo="Como o montador usa o sistema">
        <ol className="space-y-3 text-sm text-suave">
          {[
            "Entra em /login com o e-mail e a senha cadastrados aqui e cai direto no app de campo.",
            "Vê os serviços do dia, abre a OS, confere o endereço e toca em “Iniciar serviço”.",
            "Marca o checklist e envia fotos do antes e depois direto pelo celular.",
            "Ao terminar, assina na tela e passa o aparelho para o cliente assinar também.",
            "Com as duas assinaturas, a OS fecha sozinha e o financeiro registra receita e comissão.",
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

function Metric({
  valor,
  rotulo,
  destaque,
}: {
  valor: string;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-sm font-bold ${destaque ? "text-marca-600" : "text-texto"}`}
      >
        {valor}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-suave">{rotulo}</p>
    </div>
  );
}
